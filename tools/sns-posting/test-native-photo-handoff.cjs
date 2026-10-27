const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { File } = require('node:buffer');
const path = require('node:path');
const htmlPath = process.argv[2] || path.resolve(__dirname,'../../omise-demo/photo-direct-test.html');
const source = fs.readFileSync(htmlPath,'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const bytes = new Uint8Array([255,216,255,219,0,255,217]);
const tick = () => new Promise(resolve=>setImmediate(resolve));
async function setup(options={}) {
 const nodes={};const log=[];
 for(const id of ['send','copy','status','fallback']){
  nodes[id]={disabled:id==='send',hidden:id==='copy'||id==='fallback',textContent:'',value:'',handlers:{},
   addEventListener(name,handler){this.handlers[name]=handler;},focus(){},select(){}};
 }
 let payload=null;
 const nav={
  userActivation:{isActive:options.active!==false},
  clipboard:{writeText:async text=>{log.push(['copy',text]);if(options.copy)return options.copy(text);}},
  canShare:()=>options.supported!==false,
  share:async data=>{log.push(['share']);payload=data;if(options.share)return options.share(data);}
 };
 if(options.unsupported)delete nav.share;
 vm.runInNewContext(source,{
  document:{getElementById:id=>nodes[id]},navigator:nav,File,Error,Promise,
  fetch:async()=>{log.push(['fetch']);return {ok:!options.badImage,blob:async()=>new Blob([bytes],{type:'image/jpeg'})};}
 });
 await tick();
 return {nodes,log,nav,get payload(){return payload;},click:id=>nodes[id].handlers.click()};
}
(async()=>{
 let release;
 const slow = setup({copy:()=>new Promise(resolve=>{release=resolve;})});
 const a=await slow;
 assert.equal(a.nodes.send.disabled,false);
 const first=a.click('send');await tick();
 await a.click('send');
 assert.equal(a.log.filter(x=>x[0]==='copy').length,1);
 assert.equal(a.payload,null,'Never open the share sheet before the caption copy finishes');
 release();await first;
 assert.deepEqual(a.log.map(x=>x[0]),['fetch','copy','share']);
 assert.deepEqual(Object.keys(a.payload),['files'],'Share a real photo without a link-card payload');
 assert.equal(a.payload.files[0].type,'image/jpeg');
 assert.deepEqual(new Uint8Array(await a.payload.files[0].arrayBuffer()),bytes);
 assert.match(a.log[1][1],/掲載見本・利用不可/);
 assert.match(a.log[1][1],/https:\/\/ichirohns-jpg.github.io\/ShikiConcierge-18\//);
 assert.equal(a.nodes.send.disabled,false);

 const b=await setup({copy:async()=>{throw Error('denied');}});
 await b.click('send');
 assert.equal(b.payload,null,'A denied copy needs visible manual instructions before sharing');
 assert.equal(b.nodes.fallback.hidden,false);
 assert.match(b.nodes.status.textContent,/コピーしてから/);
 await b.click('send');
 assert.ok(b.payload.files.length===1);

 const c=await setup({active:false});
 await c.click('send');
 assert.equal(c.payload,null,'An expired gesture must wait for a fresh button click');
 assert.match(c.nodes.send.textContent,/写真を渡す/);
 c.nav.userActivation.isActive=true;
 await c.click('send');
 assert.equal(c.log.filter(x=>x[0]==='copy').length,1);
 assert.ok(c.payload);

 const d=await setup({share:async()=>{throw Object.assign(Error('cancel'),{name:'AbortError'});}});
 await d.click('send');
 assert.match(d.nodes.status.textContent,/キャンセル/);
 assert.doesNotMatch(d.nodes.status.textContent,/投稿しました|投稿完了しました/);
 assert.equal(d.nodes.send.disabled,false);

 const e=await setup({unsupported:true});
 assert.equal(e.nodes.send.disabled,true);
 assert.equal(e.log.length,0);
 assert.match(e.nodes.status.textContent,/Safari/);

 const f=await setup({badImage:true});
 assert.equal(f.nodes.send.disabled,true);
 assert.match(f.nodes.status.textContent,/読み込めません/);

 console.log('PASS: copy-before-photo, exact image bytes, duplicate guard, manual-copy fallback, gesture retry, cancellation, unsupported browser, image failure');
 console.log('These are JavaScript checks only; iPhone/Facebook receiving and publishing remain untested.');
})().catch(error=>{console.error(error);process.exitCode=1;});
