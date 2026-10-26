const fs=require('node:fs');const assert=require('node:assert/strict');const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.SHIKI_BROWSER_EXECUTABLE,args:['--no-sandbox','--single-process','--no-zygote','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const html=fs.readFileSync(process.env.SHIKI_LOGIN_EDITOR||__dirname+'/PostEditor.html','utf8');
  await page.route('https://merchant.test/**',r=>r.fulfill({contentType:'text/html',body:html}));
  await page.addInitScript(()=>{
   window.calls=[];
   let success,failure;const runner=new Proxy({withSuccessHandler(fn){success=fn;return runner;},withFailureHandler(fn){failure=fn;return runner;}},{get(o,key){return key in o?o[key]:(...args)=>{calls.push({name:key,args});const ok=success,fail=failure;queueMicrotask(()=>{if(key==='postLogout'){ok({ok:true});return;}if(key!=='postLogin'){fail({message:'Unexpected RPC'});return;}const [id,code,remember]=args;if(code!=='fixture-code'&&!/^DXS1\./.test(code)){fail({message:'Wrong test code'});return;}ok({shop:{'店名':'テスト店舗'},posts:[],...(remember?{auth:{id,token:'DXS1.'+'a'.repeat(64),expiresAt:Date.now()+86400000}}:{})});});};}});window.google={script:{run:runner}};
  });
  await page.goto('https://merchant.test/editor');await page.locator('#code').fill('fixture-code');await page.getByRole('button',{name:'自分のページを開く'}).click();
  await page.locator('#owner').waitFor({state:'visible'});
  const stored=await page.evaluate(()=>localStorage.getItem('shiki-merchant-session-v1'));assert.ok(stored.includes('DXS1.'));assert.ok(!stored.includes('fixture-code'));assert.equal(await page.locator('#code').inputValue(),'');
  await page.reload();await page.locator('#owner').waitFor({state:'visible'});assert.equal(await page.locator('#login').isVisible(),false);assert.equal((await page.evaluate(()=>calls))[0].args[1],'DXS1.'+'a'.repeat(64));
  await page.getByRole('button',{name:'ログアウト',exact:true}).click();await page.locator('#login').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>localStorage.getItem('shiki-merchant-session-v1')),null);assert.ok((await page.evaluate(()=>calls)).some(c=>c.name==='postLogout'));
  await page.locator('#remember').uncheck();await page.locator('#code').fill('fixture-code');await page.getByRole('button',{name:'自分のページを開く'}).click();await page.locator('#owner').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>localStorage.getItem('shiki-merchant-session-v1')),null);
  await page.reload();assert.equal(await page.locator('#login').isVisible(),true);
  await page.evaluate(()=>localStorage.setItem('shiki-merchant-session-v1',JSON.stringify({id:'SHOP-0002',token:'DXS1.'+'a'.repeat(64),expiresAt:1})));await page.reload();assert.equal(await page.locator('#login').isVisible(),true);assert.equal((await page.evaluate(()=>calls)).length,0);
  assert.deepEqual(errors,[]);console.log('PASS: first login, token-only storage, automatic restore, logout, opt-out and expired-device fallback');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
