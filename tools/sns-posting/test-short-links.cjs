const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.SHIKI_BROWSER_EXECUTABLE,args:['--no-sandbox','--single-process','--no-zygote','--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage();const root=path.resolve(__dirname,'../../omise-demo');
 await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname==='script.google.com')return route.fulfill({contentType:'application/javascript',body:''});const f=path.join(root,path.basename(u.pathname));return fs.existsSync(f)&&fs.statSync(f).isFile()?route.fulfill({path:f}):route.abort();});
 await page.goto('https://dx.test/ouchicafe.html');await page.waitForFunction(()=>typeof window.omiseApprovedLoaded==='function');
 async function check(){const text=await page.locator('#shareText').inputValue();assert.ok(text.includes('https://is.gd/YoNWCb'));assert.ok(!text.includes('google.com/maps'));assert.equal((text.match(/https:\/\//g)||[]).length,1);const links=await page.locator('#intro a[href*="line.me/R/share"],#share a[href*="line.me/R/share"]').evaluateAll(a=>a.map(n=>new URL(n.href).searchParams.get('text')));links.forEach(v=>assert.ok(!v.includes('google.com/maps')));}
 await check();await page.evaluate(()=>window.omiseApprovedLoaded({ok:true,shop:{'店名':'おうちcafeパン工房','紹介文':'更新された紹介文','住所':'埼玉県志木市本町2-5-46'}}));await check();
 assert.equal(await page.locator('a[href*="google.com/maps"]').count()>0,true);
 console.log('PASS: one short shop URL before and after approved data loads; map stays on the shop page');await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
