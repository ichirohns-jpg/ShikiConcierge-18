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
function harness(html,{shared=new Map(),session=new Map(),navigation='navigate',state={},rpcFail=()=>false,pathname='/editor',search='',shopRole='SHOP-0002'}={}){
 const doc={hidden:false,events:{},createElement:t=>new Element(t,doc),createTextNode:t=>{const n=new Element('span',doc);n.textContent=t;return n;},addEventListener(n,fn){(this.events[n]??=[]).push(fn);},getElementById(id){return this.body.all().find(e=>e.id===id)||null;},querySelector(s){return s==='head'?this.head:s==='body'?this.body:this.body.querySelector(s);},querySelectorAll(s){return this.body.querySelectorAll(s);}};
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
 const auth={id:shopRole,token:'DXS1.'+'a'.repeat(64),expiresAt:Date.now()+30*86400000};
 const shop={'店名':'テスト店舗','紹介文':'共通の紹介','住所':'志木市','電話番号':'12345'};
 const posts=[];
 const runner=new Proxy({withSuccessHandler(fn){this.success=fn;return this;},withFailureHandler(fn){this.failure=fn;return this;}},{get(target,name){if(name in target)return target[name];return (...args)=>{calls.push({name,args});const ok=target.success,fail=target.failure;queueMicrotask(()=>{
  if(rpcFail(name,args)){fail({message:'通信エラー'});return;}
  if(name==='postLoginByCode'||name==='postLogin'){ok({loginId:auth.id,shop,posts,auth});return;}
  if(name==='merchantScenesGet'){ok({shopId:auth.id,name:shop['店名'],revision:'r1',scenes:Array.from({length:4},(_,i)=>({title:'紹介'+i,src:'https://example.invalid/image.jpg',body:'説明'+i,alt:'画像'}))});return;}
  if(name==='postSend'){const p={...args[2],id:'POST-00000001-0000-4000-8000-000000000000',request:'r1',status:'公開'};posts.splice(0,posts.length,p);ok({ok:true,id:p.id,posts});return;}
  if(name==='postOwn'){ok(posts);return;}
  if(name==='postLogout'){ok({ok:true});return;}
  fail({message:'Unexpected RPC '+String(name)});
 });};}});
 const context=vm.createContext({window,document:doc,localStorage:storage(shared),sessionStorage:storage(session),history,location:{pathname,search,hash:''},performance:window.performance,google:{script:{run:runner}},crypto:webcrypto,Date,Math,URL,URLSearchParams,console,MutationObserver:class{observe(){}},IntersectionObserver:Observer,requestAnimationFrame:fn=>{queueMicrotask(fn);},setTimeout:(fn,delay)=>{timers.set(++serial,{fn,delay});return serial;},clearTimeout:id=>timers.delete(id),setInterval:()=>++serial,confirm:()=>true,navigator:{clipboard:{writeText:async()=>{}}}});
 window.sessionStorage=context.sessionStorage;
 const run=code=>vm.runInContext(code,context);
 const event={preventDefault(){}};
 return {doc,window,calls,timers,observers,shared,session,auth,history,context,run,event,boot(){run(html.match(/<script>([\s\S]*)<\/script>/)[1]);},get:id=>doc.getElementById(id),respond(data){const script=doc.head.children.find(e=>e.tagName==='SCRIPT'&&e.src?.includes('action=posts'));assert.ok(script);const q=new URL(script.src).searchParams;window[q.get('callback')](data);return q;},cards(){return doc.querySelectorAll('.post-card');}};
}


function connect(h){const key='shiki-merchant-session-v1';h.window.omiseOwnerSession={read:()=>JSON.parse(h.shared.get(key)||'null'),save:a=>{if(!a)return false;h.shared.set(key,JSON.stringify(a));return true},forget:()=>h.shared.delete(key),authError:()=>false};h.window.omiseOwnerCall=(name,args)=>new Promise((resolve,reject)=>h.context.google.script.run.withSuccessHandler(resolve).withFailureHandler(reject)[name](...args));}
for(const id of ['SHOP-0001','SHOP-0002','SHOP-0003','SHOP-0004','ADMIN']){
 test(id+' receives its own public page and only its allowed management features',async()=>{
  const h=harness(fs.readFileSync(new URL('../../omise-demo/owner.html',import.meta.url),'utf8'),{shopRole:id});connect(h);h.boot();h.get('code').value='fixture-code';await h.get('loginForm').onsubmit(h.event);await flush();
  const special=id==='SHOP-0002'||id==='ADMIN';assert.equal(h.get('ownerMenu').hidden,false);assert.equal(h.get('fujikoShare').hidden,!special);assert.equal(h.get('menuThanks').hidden,!special);assert.equal(h.get('thanksManager').hidden,!special);assert.equal(h.get('menuCompose').hidden,id==='ADMIN');
  const file={'SHOP-0001':'ouchicafe.html','SHOP-0002':'heartnet.html','SHOP-0003':'newtimes.html'}[id];const expected=file|| (id==='ADMIN'?'#shops':'?shop='+id+'#detail');assert(h.get('ownerPublicPage').href.endsWith(expected));
  if(id==='ADMIN')return;
  h.get('body').value='通常店舗の投稿';await h.get('postForm').onsubmit(h.event);assert.equal(h.get('reviewBack').hidden,true);await h.get('send').onclick();await flush();
  let sent=h.calls.filter(c=>c.name==='postSend').at(-1);assert.equal(sent.args[0],id);assert.equal(sent.args[2].body,'通常店舗の投稿');assert.equal(h.get('reviewBack').hidden,false);h.get('reviewBack').onclick();assert.equal(h.get('owner').hidden,false);assert.equal(h.get('review').hidden,true);
  const edit=h.get('ownPosts').querySelectorAll('button').find(b=>b.textContent==='直す');assert(edit);edit.onclick();h.get('body').value='修正した投稿';await h.get('postForm').onsubmit(h.event);await h.get('send').onclick();await flush();sent=h.calls.filter(c=>c.name==='postSend').at(-1);assert.equal(sent.args[0],id);assert.equal(sent.args[2].body,'修正した投稿');assert(sent.args[2].id.startsWith('POST-'));
 });
}
for(const id of ['SHOP-0001','SHOP-0003','SHOP-0004'])test(id+' opens four introduction editors and its own public link',async()=>{
 const h=harness(fs.readFileSync(new URL('../../omise-demo/owner-scenes.html',import.meta.url),'utf8'),{shopRole:id});connect(h);h.boot();h.get('code').value='fixture-code';await h.get('loginForm').onsubmit(h.event);await flush();assert.equal(h.get('admin').hidden,true);assert.equal(h.get('editor').hidden,false);assert.equal(h.get('fields').children.length,4);assert.equal(h.get('publicLink').hidden,false);assert(!h.get('publicLink').href.includes('undefined'));if(id==='SHOP-0004')assert(h.get('publicLink').href.includes('?shop=SHOP-0004&'));
});
