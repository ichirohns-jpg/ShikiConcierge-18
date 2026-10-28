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
 reset(){for(const e of this.all()){e.value=e.defaultValue;e.files=[];}}
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
const load=file=>fs.readFileSync(new URL(file,root),'utf8');
const bundled=load('tools/omise-release/LiveCode.gs');
const basic=JSON.parse(bundled.match(/const MERCHANT_HTML=("(?:\\.|[^"\\])*");/)[1]);
const post=load('tools/omise-release/PostEditor.html').replace(/__OMISE_INITIAL_KIND__/g,'deal');
const scene=load('tools/omise-release/Scenes.html');

test('one code persists only a 30-day token and all three editing screens reuse it',async()=>{
 const shared=new Map(),one=harness(post,{shared});one.boot();one.get('code').value='fixture-original-code';await one.get('loginForm').onsubmit(one.event);await flush();
 assert.equal(one.get('login').hidden,true);const stored=JSON.parse(shared.get('shiki-merchant-session-v1'));assert.equal(stored.token,one.auth.token);assert.equal(Object.keys(stored).sort().join(','),'expiresAt,id,token');assert.ok(!JSON.stringify(stored).includes('fixture-original-code'));assert.ok(stored.expiresAt>Date.now()+29*86400000);
 const two=harness(basic,{shared});two.boot();await flush();assert.equal(two.get('login').hidden,true);assert.equal(two.get('editor').hidden,false);assert.equal(two.calls[0].name,'postLogin');assert.equal(two.calls[0].args[1],stored.token);
 const three=harness(scene,{shared});three.boot();await flush();assert.equal(three.get('login').hidden,true);assert.equal(three.get('editor').hidden,false);assert.equal(three.calls[0].name,'merchantScenesGet');assert.equal(three.calls[0].args[1],stored.token);
 const fresh=harness(scene);fresh.boot();fresh.get('code').value='fixture-original-code';await fresh.get('loginForm').onsubmit(fresh.event);await flush();assert.ok(fresh.shared.get('shiki-merchant-session-v1').includes('DXS1.'));assert.equal(fresh.calls[0].args[1],true);
});

test('temporary connection failure does not erase a valid saved login or ask for the code again',async()=>{
 const token={id:'SHOP-0002',token:'DXS1.'+'b'.repeat(64),expiresAt:Date.now()+30*86400000};
 for(const html of [post,basic,scene]){
  const shared=new Map([['shiki-merchant-session-v1',JSON.stringify(token)]]),h=harness(html,{shared,rpcFail:()=>true});h.boot();await flush();
  assert.equal(h.get('login').hidden,true);assert.equal(JSON.parse(shared.get('shiki-merchant-session-v1')).token,token.token);assert.ok(h.get('status').textContent.includes('残っています'));
 }
});

test('deal entry is preselected, expiry is visible, and a failed submission keeps the text and same retry identifier',async()=>{
 let failSend=true;const h=harness(post,{rpcFail:name=>name==='postSend'&&failSend});h.boot();h.get('code').value='fixture-code';await h.get('loginForm').onsubmit(h.event);await flush();
 assert.equal(h.get('kind').value,'deal');assert.equal(h.get('end').required,true);h.get('body').value='残しておきたい文章';
 await h.get('postForm').onsubmit(h.event);assert.ok(h.get('status').textContent.includes('終了日'));assert.equal(h.get('body').value,'残しておきたい文章');
 h.get('end').value=new Date(Date.now()+32400000+86400000).toISOString().slice(0,10);h.run("ogImage=async()=>'';");
 await h.get('postForm').onsubmit(h.event);await h.get('send').onclick();await flush();assert.equal(h.get('body').value,'残しておきたい文章');assert.ok(h.get('status').textContent.includes('内容は残っています'));
 const first=h.calls.find(x=>x.name==='postSend').args[2].clientRequestId;failSend=false;await h.get('send').onclick();await flush();
 const ids=h.calls.filter(x=>x.name==='postSend').map(x=>x.args[2].clientRequestId);assert.equal(ids.length,2);assert.equal(ids[0],first);assert.equal(ids[1],first);assert.equal(h.get('body').value,'');assert.ok(h.get('status').textContent.includes('投稿しました'));
});

test('back navigation restores the loaded feed pages and the article position without changing the URL',async()=>{
 const html=load('omise-demo/deals.html'),src=load('omise-demo/posts.js'),session=new Map(),all=Array.from({length:25},(_,i)=>({id:'POST-'+String(i+1).padStart(8,'0'),shop:'SHOP-000'+(i%3+1),name:'店舗'+(i%3+1),body:'投稿'+i,date:'2026-10-28 10:00:00',kind:'deal',photos:[],end:''}));
 const first=harness(html,{session,pathname:'/ShikiConcierge-18/omise-demo/deals.html'});first.run(src);first.respond({ok:true,total:25,posts:all.slice(0,10)});first.observers.at(-1).fn([{isIntersecting:true}]);first.respond({ok:true,total:25,posts:all.slice(10,20)});await flush();first.window.scrollY=9500;first.window.events.pagehide[0]();
 const returned=harness(html,{session,navigation:'back_forward',state:{...first.history.state},pathname:'/ShikiConcierge-18/omise-demo/deals.html'});returned.run(src);returned.respond({ok:true,total:25,posts:all.slice(0,10)});
 const q=returned.respond({ok:true,total:25,posts:all.slice(10,20)});assert.equal(q.get('offset'),'10');await flush();assert.equal(returned.cards().length,20);assert.equal(returned.window.scrollY,9500);assert.equal(returned.context.location.search,'');
});
