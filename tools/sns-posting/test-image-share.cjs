const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const {createCanvas}=require('@napi-rs/canvas');
const site=path.resolve(__dirname,'../../omise-demo');
const photo=createCanvas(600,600);photo.getContext('2d').fillStyle='#dab266';photo.getContext('2d').fillRect(0,0,600,600);
const photoData=photo.toDataURL('image/jpeg');
const sample={id:'POST-123',shop:'SHOP-0002',name:'ハートネット志木',body:'ふじこです♪',date:'2026-10-26 18:00:00',photos:[photoData]};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.SHIKI_BROWSER_EXECUTABLE||undefined,args:['--no-sandbox','--single-process','--no-zygote','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.received=[];window.fileShareSupported=true;
  Object.defineProperty(navigator,'canShare',{value:()=>window.fileShareSupported});
  Object.defineProperty(navigator,'share',{value:async data=>{window.received.push({keys:Object.keys(data),files:data.files.map(f=>({name:f.name,type:f.type,size:f.size}))});if(window.cancelShare)throw new DOMException('Cancelled','AbortError');}});
  Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copiedText=text;}}});
 });
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.hostname==='script.google.com')return route.fulfill({contentType:'application/javascript',body:url.searchParams.get('callback')+'('+JSON.stringify({ok:true,total:1,posts:[sample]})+')'});
  if(url.pathname==='/article.html')return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/social.css"><script src="/posts.js" defer></script></head><body><main></main></body></html>'});
  if(url.pathname.startsWith('/font/')){
   if(!process.env.SHIKI_TEST_FONTS)return route.abort();const relative=url.pathname.slice(6),file=path.join(process.env.SHIKI_TEST_FONTS,relative);
   if(relative.endsWith('.css'))return route.fulfill({contentType:'text/css',body:fs.readFileSync(file,'utf8').replaceAll('Noto Sans JP','Noto Sans CJK JP')});
   return route.fulfill({contentType:'font/woff2',body:fs.readFileSync(file)});
  }
  const file=path.join(site,url.pathname.slice(1));if(fs.existsSync(file))return route.fulfill({path:file});return route.abort();
 });
 await page.goto('https://dx.test/article.html?id=POST-123');
 if(process.env.SHIKI_TEST_FONTS){await page.addStyleTag({url:'https://dx.test/font/japanese-400.css'});await page.addStyleTag({url:'https://dx.test/font/japanese-700.css'});await page.evaluate(()=>document.fonts.load('700 36px "Noto Sans CJK JP"','パンを買うとミニパン個プレゼント掲載見本利用不可ハートネット志木ふじこです'));}
 for(const network of ['Facebook','Instagram','X','LINE']){
  await page.getByRole('button',{name:network+'用の投稿画像を作る',exact:true}).click();
  await page.getByRole('heading',{name:network+'に載せる画像',exact:true}).waitFor();
  await page.waitForFunction(()=>document.querySelector('.sns-image-gallery img')?.naturalWidth===1080);
  assert.equal(await page.locator('.sns-image-gallery img').evaluate(i=>i.naturalHeight),1350);
  assert.equal(await page.locator('.post-publish a[href*="sharer"]').count(),0);
  await page.getByRole('button',{name:'画像をSNSに渡す',exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('.sns-image-send').disabled);
  const payload=await page.evaluate(()=>window.received.at(-1));assert.deepEqual(payload.keys,['files']);assert.equal(payload.files[0].type,'image/jpeg');assert.ok(payload.files[0].size>5000);
  assert.ok(!(await page.locator('.post-share-message').innerText()).includes('投稿済み'));
  await page.getByRole('button',{name:'閉じる',exact:true}).click();assert.equal(await page.locator('.sns-image-preview').isVisible(),false);
 }
 console.log('PASS: all 4 SNS controls prepare image files; no link-only fallback; no false publication status');
 await page.getByRole('button',{name:'SNS投稿画像を作る',exact:true}).click();
 await page.evaluate(()=>{window.fileShareSupported=false;});const count=await page.evaluate(()=>window.received.length);
 await page.getByRole('button',{name:'画像をSNSに渡す',exact:true}).click();assert.equal(await page.evaluate(()=>window.received.length),count);assert.match(await page.locator('.post-share-message').innerText(),/画像を保存/);
 await page.getByText('投稿文を添えたいとき',{exact:true}).click();await page.getByRole('button',{name:'投稿文をコピー',exact:true}).click();assert.ok(!(await page.evaluate(()=>window.copiedText)).includes('https://'));
 const layout=await page.evaluate(async photo=>{
  const article={name:'試験店舗',body:'大切なお知らせです。'.repeat(150)+'\n掲載条件も最後まで残します。',photos:[photo,photo]};
  const result=await DXPostImage.create(article),ctx=document.createElement('canvas').getContext('2d'),pages=DXPostImage.plan(ctx,article,true);
  const content=pages.flatMap(p=>p.bodyLines).join(''),dimensions=await Promise.all(result.files.map(async f=>{const image=await createImageBitmap(f);return [image.width,image.height];}));
  const textOnly=await DXPostImage.create({name:'文章だけのお店',body:'写真がなくても画像にできます。'});
  return {content,expected:article.body.replace(/\n/g,''),pages:pages.length,dimensions,files:result.files.length,textOnly:textOnly.files.length};
 },photoData);
 assert.equal(layout.content,layout.expected);assert.ok(layout.pages>1);assert.equal(layout.files,layout.pages+1);layout.dimensions.forEach(d=>assert.deepEqual(d,[1080,1350]));assert.equal(layout.textOnly,1);
 console.log('PASS: full long-form article retained across cards; extra photo retained; text-only article supported');
 await page.goto('https://dx.test/cafe-benefit.html?from=friend');
 if(process.env.SHIKI_TEST_FONTS){await page.addStyleTag({url:'https://dx.test/font/japanese-400.css'});await page.addStyleTag({url:'https://dx.test/font/japanese-700.css'});await page.evaluate(()=>document.fonts.load('700 36px "Noto Sans CJK JP"','パンを買うとミニパン個プレゼント掲載見本利用不可'));}
 await page.getByRole('button',{name:'Facebook用の投稿画像を作る',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.sns-image-gallery img')?.naturalHeight===1350);
 assert.equal(await page.locator('a[href*="facebook.com/sharer"]').count(),0);assert.match(await page.locator('article').innerText(),/この特典は利用できません/);
 if(process.env.SHIKI_TEST_OUTPUT){await page.locator('.sns-image-preview').screenshot({path:path.join(process.env.SHIKI_TEST_OUTPUT,'benefit-preview.png')});const bytes=await page.locator('.sns-image-gallery img').evaluate(async i=>Array.from(new Uint8Array(await(await fetch(i.src)).arrayBuffer())));fs.writeFileSync(path.join(process.env.SHIKI_TEST_OUTPUT,'cafe-benefit-card.jpg'),Buffer.from(bytes));}
 assert.deepEqual(errors,[]);console.log('PASS: benefit preview uses the same image flow and preserves sample/unavailable labeling');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
