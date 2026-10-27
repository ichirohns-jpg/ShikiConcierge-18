const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {File}=require('node:buffer');
const root=path.resolve(__dirname,'../../omise-demo');
const brandSource=fs.readFileSync(path.join(root,'photo-brand.js'),'utf8');
const shareSource=fs.readFileSync(path.join(root,'post-share.js'),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const original='data:image/jpeg;base64,/9j/2wD/2Q==';
class Element{
 constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.attrs={};this.handlers={};this.style={};this.disabled=false;}
 append(...items){this.children.push(...items);}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(k,v){this.handlers[k]=v;}
 focus(){}select(){}remove(){}
}
async function setup(options={}){
 const log=[],revoked=[],created=[],events={};let copied=null,received=[],inFlight=0,maxInFlight=0;
 const brand={create:async src=>{inFlight++;maxInFlight=Math.max(maxInFlight,inFlight);await tick();inFlight--;
  if(options.badBrand)throw Error('brand');return {blob:new Blob(['FINAL-JPEG'],{type:'image/jpeg'})};}};
 const nav={
 clipboard:{writeText:text=>{log.push('copy');copied=text;return options.copy?options.copy(text):Promise.resolve();}},
 canShare:({files})=>!options.unsupported&&(!options.singleOnly||files.length===1),
 share:data=>{log.push('share');received.push(data);return options.share?options.share(data):Promise.resolve();}
 };
 if(options.noNative)delete nav.share;
 const w={DXPhotoBrand:brand,addEventListener:(name,fn)=>{events[name]=fn;},removeEventListener:(name,fn)=>{if(events[name]===fn)delete events[name];}};
 class FakeURL extends URL{}
 FakeURL.createObjectURL=file=>{created.push(file);return 'blob:test-'+created.length;};
 FakeURL.revokeObjectURL=url=>revoked.push(url);
 vm.runInNewContext(shareSource,{window:w,navigator:nav,document:{currentScript:{src:'https://dx.example/omise-demo/post-share.js'},createElement:tag=>new Element(tag)},location:{href:'https://dx.example/omise-demo/'},URL:FakeURL,File,Promise,Error,
 fetch:async()=>({ok:true,blob:async()=>new Blob(['ORIGINAL-JPEG'],{type:'image/jpeg'})})
 });
 const box=new Element('div');
 w.DXPostShare.mount(box,{id:'POST-123',name:'お店の名前',body:'お店の文章',photos:options.noPhotos?[]:Array(options.count||1).fill(original),poster:options.video?original:undefined});
 for(let i=0;i<12;i++)await tick();
 const area=box.children[0],buttons=area.children.filter(x=>x.tagName==='BUTTON'),message=area.children.find(x=>x.attrs?.role==='status');
 return {box,area,buttons,message,log,revoked,created,events,w,get received(){return received;},get copied(){return copied;},get maxInFlight(){return maxInFlight;}};
}
(async()=>{
 const context={window:{},URL,document:{currentScript:{src:'https://dx.example/photo-brand.js'}},location:{href:'https://dx.example/'}};
 vm.runInNewContext(brandSource,context);
 const layout=context.window.DXPhotoBrand.layout;
 for(const [w,h]of [[1080,1350],[1080,1920],[1080,1080],[1920,1080],[100,10000]]){
  const result=layout({naturalWidth:w,naturalHeight:h});
  assert.equal(result.width,1080);assert.equal(result.height,1920,'Every finished image must be 9:16');
  assert.ok(result.main.x>=0&&result.main.y>=0);
  assert.ok(result.main.x+result.main.width<=result.width&&result.main.y+result.main.height<=result.height);
  assert.ok(Math.abs(result.main.width*h-result.main.height*w)<=Math.max(w,h),'Never stretch or crop the original aspect ratio');
  assert.ok(result.background.x<=0&&result.background.y<=0);
  assert.ok(result.background.x+result.background.width>=result.width&&result.background.y+result.background.height>=result.height);
 }
 assert.throws(()=>layout({naturalWidth:0,naturalHeight:1}));
 const portrait=layout({naturalWidth:1080,naturalHeight:1920});
 assert.equal(JSON.stringify(portrait.main),JSON.stringify({x:0,y:0,width:1080,height:1920}));
 const square=layout({naturalWidth:1080,naturalHeight:1080});
 assert.equal(JSON.stringify(square.main),JSON.stringify({x:0,y:420,width:1080,height:1080}));

 let releaseCopy,releaseShare;
 const a=await setup({copy:()=>new Promise(r=>{releaseCopy=r;}),share:()=>new Promise(r=>{releaseShare=r;})});
 assert.equal(a.buttons[0].textContent,'画像をSNSへ（投稿文もコピー）');assert.equal(a.buttons[0].disabled,false);
 assert.equal(a.buttons[1].textContent,'投稿文とDXリンクをコピー');
 a.buttons[0].handlers.click();
 assert.equal(a.received.length,1,'Open image sharing immediately; never wait for clipboard permissions');
 assert.deepEqual(Object.keys(a.received[0]),['files']);
 assert.equal(a.received[0].files[0].type,'image/jpeg');
 assert.equal(await a.received[0].files[0].text(),'FINAL-JPEG');
 assert.match(a.copied,/お店の文章/);assert.match(a.copied,/https:\/\/is.gd\//);
 assert.match(a.copied,/画像をタップして/);
 a.buttons[0].handlers.click();assert.equal(a.received.length,1,'Prevent duplicate share sheets');
 releaseShare();await tick();
 assert.equal(a.buttons[0].disabled,false,'Image controls recover even when copying is still pending');
 releaseCopy();await tick();
 assert.doesNotMatch(a.message.textContent,/投稿しました|投稿完了しました/);

 const b=await setup({copy:()=>Promise.reject(Error('denied'))});
 b.buttons[0].handlers.click();await tick();
 assert.equal(b.received.length,1,'Clipboard failure must not block the image');
 assert.match(b.message.textContent,/コピーボタン/);

 const c=await setup({share:()=>Promise.reject(Object.assign(Error('cancel'),{name:'AbortError'}))});
 c.buttons[0].handlers.click();await tick();
 assert.match(c.message.textContent,/キャンセル/);assert.equal(c.buttons[0].disabled,false);

 const d=await setup({badBrand:true});
 d.buttons[0].handlers.click();await tick();
 assert.equal(await d.received[0].files[0].text(),'ORIGINAL-JPEG','A failed footer must retain the merchant original');

 const e=await setup({noNative:true});
 assert.equal(e.buttons[0].disabled,true);
 assert.equal(e.created.length,1,'Saving the complete image stays available without native sharing');

 const f=await setup({count:4,singleOnly:true});
 assert.equal(f.created.length,4);assert.equal(f.maxInFlight,1);
 const saves=f.area.children.find(x=>x.className==='post-photo-saves');
 assert.equal(saves.children.filter(x=>x.tagName==='BUTTON').length,4,'Allow individual images when batch sharing is unsupported');

 const g=await setup({noPhotos:true});
 assert.equal(g.buttons.length,1);assert.equal(g.buttons[0].textContent,'投稿文とDXリンクをコピー');
 const before=a.revoked.length;a.events.pagehide({persisted:true});assert.equal(a.revoked.length,before);
 a.events.pagehide({persisted:false});assert.equal(a.revoked.length,before+1);
 console.log('PASS: 9:16 output, full original aspect ratio, photo-first handoff, copy failure, duplicate guard, cancellation, original-photo fallback, batch fallback and back-forward cache.');
 console.log('JavaScript and layout checks only; real iPhone/Facebook receipt and feed display are untested.');
})().catch(e=>{console.error(e);process.exitCode=1;});
