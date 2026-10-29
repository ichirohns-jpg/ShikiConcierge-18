import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';

const root=new URL('../../',import.meta.url);
const flush=async()=>{for(let i=0;i<5;i++)await new Promise(setImmediate);};
class Element{
 constructor(tag,doc){this.tagName=tag.toUpperCase();this.doc=doc;this.children=[];this.attrs={};this.events={};this.style={setProperty(k,v){this[k]=v;}};this.dataset={};this.value='';this.defaultValue='';this.files=[];this.className='';this._text='';this.classList={add:(...names)=>{this.className+=' '+names.join(' ');},remove:name=>{this.className=this.className.split(' ').filter(x=>x!==name).join(' ');}};}
 append(...nodes){for(const n of nodes){n.remove?.();n.parent=this;this.children.push(n);}}
 appendChild(n){this.append(n);return n;}
 prepend(...nodes){for(const n of nodes)n.parent=this;this.children.unshift(...nodes);}
 replaceChildren(...nodes){for(const n of this.children)n.parent=null;this.children=[];this._text='';this.append(...nodes);}
 remove(){if(this.parent){this.parent.children=this.parent.children.filter(x=>x!==this);this.parent=null;}}
 after(n){n.parent=this.parent;const a=this.parent.children;a.splice(a.indexOf(this)+1,0,n);}
 before(n){n.parent=this.parent;const a=this.parent.children;a.splice(a.indexOf(this),0,n);}
 setAttribute(k,v){this.attrs[k]=String(v);if(k==='id')this.id=v;if(k==='class')this.className=v;}
 getAttribute(k){return this.attrs[k]??(k==='href'?this.href:null)??null;}
 removeAttribute(k){delete this.attrs[k];if(k==='href')delete this.href;}
 get isConnected(){return !!(this.root||this.parent?.isConnected);}
 set textContent(value){this.replaceChildren();this._text=String(value);}
 get textContent(){return this._text+this.children.map(x=>x.textContent).join('');}
 set innerHTML(value){this.replaceChildren();this._text=String(value);}
 get innerHTML(){return this.textContent;}
 addEventListener(name,fn){(this.events[name]??=[]).push(fn);}
 focus(){} select(){} setSelectionRange(){} scrollIntoView(){}
 getBoundingClientRect(){const cards=this.doc.querySelectorAll('.post-card'),i=cards.indexOf(this),top=(i<0?0:400+i*700)-this.doc.window.scrollY;return {top,bottom:top+700,height:700};}
 decode(){return Promise.resolve();}
 reset(){for(const e of this.all()){e.value=e.defaultValue;e.files=[];if(e.type==='checkbox')e.checked=e.getAttribute('checked')!==null;}}
 all(){return this.children.flatMap(x=>[x,...x.all()]);}
 matches(s){if(s==='*')return true;if(s.startsWith('#'))return this.id===s.slice(1);if(s.startsWith('.'))return this.className.split(' ').includes(s.slice(1));const attr=s.match(/^\[([^=]+)(?:="([^"]*)")?\]$/);if(attr)return attr[2]===undefined?this.getAttribute(attr[1])!==null:this.getAttribute(attr[1])===attr[2];return this.tagName===s.toUpperCase();}
 querySelectorAll(s){if(s.includes(':scope >'))return this.children.filter(e=>e.matches(s.split('>').at(-1).trim()));return this.all().filter(e=>s.split(',').some(q=>e.matches(q.trim())));}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}
 closest(s){let e=this;while(e){if(e.matches(s))return e;e=e.parent;}return null;}
}
function storage(map){return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};}
function harness(html,{shared=new Map(),session=new Map(),navigation='navigate',state={},rpcFail=()=>false,pathname='/editor',search=''}={}){
 const doc={hidden:false,events:{},createElement:t=>new Element(t,doc),addEventListener(n,fn){(this.events[n]??=[]).push(fn);},getElementById(id){return this.body.all().find(e=>e.id===id)||null;},querySelector(s){return s==='head'?this.head:s==='body'?this.body:this.body.querySelector(s);},querySelectorAll(s){return this.body.querySelectorAll(s);}};
 doc.body=new Element('body',doc);doc.head=new Element('head',doc);doc.body.root=doc.head.root=true;doc.currentScript={src:'https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/posts.js'};
 let parent=doc.body;const stack=[parent],withoutCode=html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'');
 for(const token of withoutCode.matchAll(/<\/?([a-z][\w-]*)([^>]*)>|([^<]+)/gi)){
  if(token[3]){parent._text+=token[3];continue;}
  const tag=token[1].toLowerCase();if(['html','head','body','meta','link','title','!doctype'].includes(tag))continue;
  if(token[0].startsWith('</')){if(stack.length>1)stack.pop();parent=stack.at(-1);continue;}
  const e=doc.createElement(tag),attrs=token[2];for(const a of attrs.matchAll(/([\w-]+)(?:="([^"]*)")?/g)){const [_,k,v='']=a;e.setAttribute(k,v);if(['type','href'].includes(k))e[k]=v;if(k==='value'){e.value=e.defaultValue=v;}if(k==='hidden')e.hidden=true;if(k==='checked')e.checked=true;}
  parent.append(e);if(!['input','img','br','hr','source'].includes(tag)){parent=e;stack.push(e);}
 }
 for(const e of doc.querySelectorAll('select')){const first=e.children.find(x=>x.tagName==='OPTION');e.value=e.defaultValue=first?.value||'';}
 const events={},calls=[],timers=new Map(),observers=[];let serial=0;
 const history={state,replaceState(next){this.state=next;}};
 const window={scrollY:0,history,performance:{getEntriesByType:()=>[{type:navigation}]},events,addEventListener(n,fn){(events[n]??=[]).push(fn);},scrollTo(arg,y){this.scrollY=typeof arg==='object'?arg.top:y;},DXPostShare:{mount(){}}};doc.window=window;
 class Observer{constructor(fn){this.fn=fn;observers.push(this);}observe(e){this.target=e;}disconnect(){this.target=null;}}
 window.IntersectionObserver=Observer;
 const auth={id:'SHOP-0002',token:'DXS1.'+'a'.repeat(64),expiresAt:Date.now()+30*86400000};
 const shop={'店名':'テスト店舗','紹介文':'共通の紹介','住所':'志木市','電話番号':'12345'};
 const posts=[];
 const runner=new Proxy({withSuccessHandler(fn){this.success=fn;return this;},withFailureHandler(fn){this.failure=fn;return this;}},{get(target,name){if(name in target)return target[name];return (...args)=>{calls.push({name,args});const ok=target.success,fail=target.failure;queueMicrotask(()=>{
  if(rpcFail(name,args)){fail({message:'通信エラー'});return;}
  if(name==='postLoginByCode'||name==='postLogin'){ok({loginId:auth.id,shop,posts,auth});return;}
  if(name==='merchantScenesGet'){ok({shopId:auth.id,name:shop['店名'],revision:'r1',scenes:Array.from({length:4},(_,i)=>({title:'紹介'+i,src:'https://example.invalid/image.jpg',body:'説明'+i,alt:'画像'}))});return;}
  if(name==='postSend'){const p={...args[2],id:'POST-00000001-0000-4000-8000-000000000000',request:'r1',status:'公開'};posts.splice(0,posts.length,p);ok({ok:true,id:p.id,posts});return;}
  if(name==='postLogout'){ok({ok:true});return;}
  fail({message:'Unexpected RPC '+String(name)});
 });};}});
 const context=vm.createContext({window,document:doc,localStorage:storage(shared),sessionStorage:storage(session),history,location:{pathname,search,hash:''},performance:window.performance,google:{script:{run:runner}},crypto:webcrypto,Date,Math,URL,URLSearchParams,console,MutationObserver:class{observe(){}},IntersectionObserver:Observer,requestAnimationFrame:fn=>{queueMicrotask(fn);},setTimeout:(fn,delay)=>{timers.set(++serial,{fn,delay});return serial;},clearTimeout:id=>timers.delete(id),setInterval:()=>++serial,confirm:()=>true,navigator:{clipboard:{writeText:async()=>{}}}});
 window.sessionStorage=context.sessionStorage;
 const run=code=>vm.runInContext(code,context);
 const event={preventDefault(){}};
 return {doc,window,calls,timers,observers,shared,session,auth,history,context,run,event,boot(){run(html.match(/<script>([\s\S]*)<\/script>/)[1]);},get:id=>doc.getElementById(id),respond(data){const script=doc.head.children.find(e=>e.tagName==='SCRIPT'&&e.src?.includes('action=posts'));assert.ok(script);const q=new URL(script.src).searchParams;window[q.get('callback')](data);return q;},cards(){return doc.querySelectorAll('.post-card');}};
}



const load=f=>fs.readFileSync(new URL('omise-demo/'+f,root),'utf8');
const endPoint='https://script.google.com/test/exec';
const rec=i=>({id:'POST-'+i.toString(16),shop:'SHOP-0002',name:'ハートネット志木',body:'ふじこの応援紹介🥒\n\n紹介'+i+'\n\nhttps://example.com/'+i,kind:'notice',date:'2026-10-29 16:00:00',photos:[]});
async function fill(h,all){for(let i=0;i<100;i++){const script=h.doc.head.children.find(e=>e.tagName==='SCRIPT'&&e.src?.includes('action=posts'));if(!script){await flush();if(!h.doc.head.children.some(e=>e.tagName==='SCRIPT'&&e.src?.includes('action=posts')))return;continue;}const offset=Number(new URL(script.src).searchParams.get('offset'));h.respond({ok:true,total:all.length,posts:all.slice(offset,offset+10)});await flush();}throw Error('unexpected loop');}
function feed(search='',archive=false){const html=load(archive?'cheer-archive.html':'fujiko-timeline.html'),h=harness(html,{search,pathname:archive?'/omise-demo/cheer-archive.html':'/omise-demo/fujiko-timeline.html'});h.run(load('sns-recommend.js'));h.run(load('support-feed.js'));h.run(load('posts.js'));return h;}
test('newest feed shows exactly 20 matching posts and archive shows the rest without duplicates',async()=>{
 const all=Array.from({length:45},(_,i)=>rec(i+1));all.splice(4,0,{...rec(99),body:'普通の投稿'});const first=feed();await fill(first,all);assert.equal(first.cards().length,20);assert.ok(first.cards()[0].textContent.includes('紹介1'));const next=first.doc.querySelectorAll('a').find(a=>a.textContent==='過去の応援紹介・アーカイブ →');assert.ok(next);const q=new URL(next.href).search;assert.equal(new URL(next.href).searchParams.get('offset'),'21');const second=feed(q,true);await fill(second,all);assert.equal(second.cards().length,20);assert.ok(second.cards()[0].textContent.includes('紹介21'));const last=second.doc.querySelectorAll('a').find(a=>a.textContent==='次の20件を見る →');const third=feed(new URL(last.href).search,true);await fill(third,all);assert.equal(third.cards().length,5);assert.ok(third.cards()[0].textContent.includes('紹介41'));assert.equal(third.doc.querySelectorAll('a').some(a=>a.textContent==='次の20件を見る →'),false);
});
test('archive opened directly skips the first 20 recommendations; exact 20 has no phantom next page',async()=>{
 const all=Array.from({length:23},(_,i)=>rec(i+1)),archive=feed('',true);await fill(archive,all);assert.equal(archive.cards().length,3);assert.ok(archive.cards()[0].textContent.includes('紹介21'));const exact=feed();await fill(exact,all.slice(0,20));assert.equal(exact.cards().length,20);assert.equal(exact.doc.querySelectorAll('a').some(a=>a.textContent==='過去の応援紹介・アーカイブ →'),false);
});
test('home card links to public timeline and article retains the original text and public share section',async()=>{
 assert.ok(load('index.html').includes('href="./fujiko-timeline.html"'));const h=harness(load('article.html'),{search:'?id=POST-a',pathname:'/omise-demo/article.html'});const mounts=[];h.window.DXPostShare={mount:(box,p,options)=>mounts.push({box,p,options})};h.run(load('sns-recommend.js'));h.run(load('support-feed.js'));h.run(load('posts.js'));h.respond({ok:true,total:1,posts:[rec(10)]});await flush();assert.ok(h.doc.querySelector('.post-body').textContent==='紹介10');assert.equal(h.doc.querySelector('.sns-recommend-open').href,'https://example.com/10');assert.equal(mounts.length,1);assert.equal(mounts[0].options.heading,'この応援紹介をSNSでシェアする');assert.notEqual(mounts[0].options.privateOnly,true);
});

test('profile support feed has its own 20 slots instead of sharing normal post pagination',async()=>{
 const h=harness(load('heartnet.html'),{pathname:'/omise-demo/heartnet.html'});h.run(load('sns-recommend.js'));h.run(load('support-feed.js'));h.run(load('posts.js'));const all=Array.from({length:24},(_,i)=>rec(i+1));await fill(h,all);assert.equal(h.get('cheer-posts').querySelectorAll('.post-card').length,20);assert.equal(h.get('posts-timeline').querySelectorAll('.post-card').length,0);
});

test('anonymous visitors get working Facebook LINE and X buttons, while private identity controls stay hidden',async()=>{
 const h=harness(load('article.html'),{search:'?id=POST-a',pathname:'/omise-demo/article.html'}),post=rec(10),shareURL='https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/post-shares/'+post.id+'/?v=abc';h.context.fetch=async()=>({ok:true,json:async()=>({version:1,posts:{[post.id]:{date:post.date,shareURL}}})});h.run(load('post-share.js'));h.run(load('sns-recommend.js'));h.run(load('support-feed.js'));h.run(load('posts.js'));h.respond({ok:true,total:1,posts:[post]});await flush();const area=h.doc.querySelector('.post-simple-share');assert.equal(area.hidden,false);assert.equal(h.doc.querySelector('.post-fujiko-button').hidden,true);assert.equal(h.doc.querySelector('.post-fujiko-editor').hidden,true);const links=area.querySelectorAll('a');for(const text of ['Facebookで共有','LINEで共有','Xで共有']){const a=links.find(a=>a.textContent===text);assert.ok(a?.href);assert.ok(decodeURIComponent(a.href).includes('/omise-demo/post-shares/'+post.id));}
});
