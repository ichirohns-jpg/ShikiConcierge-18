const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
class El{constructor(tag){this.tag=tag;this.children=[];this.events={};this.attrs={};this.isConnected=true;this.style={};this.hidden=false;}append(...a){this.children.push(...a)}setAttribute(k,v){this.attrs[k]=v}removeAttribute(k){delete this.attrs[k];if(k==='href')delete this.href;}addEventListener(k,v){this.events[k]=v}focus(){}select(){}}
const flat=e=>[e,...e.children.flatMap(flat)],flush=()=>new Promise(setImmediate),base='https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/';
async function run(mode){const id='POST-1234-abcd',short='https://ichirohns-jpg.github.io/ShikiConcierge-18/p/7/',calls=[];let copied='';
 const navigator={clipboard:{writeText:async t=>copied=t}};
 if(mode!=='web')navigator.share=value=>{calls.push(value);return mode==='abort'?Promise.reject(Object.assign(Error('cancel'),{name:'AbortError'})):mode==='blocked'?Promise.reject(Object.assign(Error('blocked'),{name:'NotAllowedError'})):Promise.resolve();};
 const c={URL,Date,Infinity,encodeURIComponent,location:{href:base+'article.html?id='+id},document:{head:new El('head'),createElement:t=>new El(t),addEventListener(){}},window:{addEventListener(){}},localStorage:{getItem:()=>null},navigator,setInterval:()=>0,setTimeout:()=>0,clearTimeout(){},fetch:async()=>({ok:true,json:async()=>({version:1,posts:mode==='pending'?{}:{[id]:{date:'2026-10-31',shareURL:base+'post-shares/'+id+'/?v=abc',shortURL:short}}})})};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../omise-demo/post-share.js'),'utf8'),c);
 const box=new El('div');c.window.DXPostShare.mount(box,{id,name:'お店',shop:'SHOP-0004',date:'2026-10-31',body:'お知らせ🥒',end:mode==='expired'?'2020-01-01':''});await flush();
 const all=flat(box),line=all.find(e=>e.textContent==='LINEで共有'),fb=all.find(e=>e.textContent==='Facebookで共有'),copy=all.find(e=>e.textContent==='LINEに貼り付ける文章とリンクをコピー'),help=all.find(e=>e.tag==='details'&&e.className==='post-line-help');
 let prevented=false;const result=line.events.click({preventDefault(){prevented=true}});
 if(mode==='web'){assert.equal(prevented,false);assert.equal(calls.length,0);assert.equal(new URL(line.href).searchParams.get('url'),short);}
 else if(mode==='expired'){assert(prevented);assert.equal(calls.length,0);assert(copy.disabled);assert(!line.href);}
 else{assert(prevented);assert.equal(calls.length,1,'native share must start in tap handler');assert.equal(Object.keys(calls[0]).join(','),'text');assert(calls[0].text.startsWith('お知らせ🥒'));assert(calls[0].text.endsWith(mode==='pending'?base+'article.html?id='+id:short));await result;if(mode==='blocked'){assert.equal(help.open,true);assert(all.find(e=>e.tag==='textarea'&&!e.hidden&&e.value===calls[0].text));}if(mode==='abort')assert(!help.open);
 await copy.events.click();assert.equal(copied,calls[0].text);if(mode==='pending')assert(!fb.href);else assert(fb.href.startsWith('https://www.facebook.com/sharer/sharer.php?u='));}
 console.log('PASS '+mode);
}
(async()=>{for(const mode of ['ready','pending','web','abort','blocked','expired'])await run(mode)})().catch(e=>{console.error(e);process.exitCode=1});
