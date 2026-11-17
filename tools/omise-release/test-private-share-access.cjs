const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.events={};this.attrs={};this.style={};this.value='';this.hidden=false;this.isConnected=true;this.classList={add(){}};}
 append(...nodes){this.children.push(...nodes)}setAttribute(k,v){this.attrs[k]=v}removeAttribute(k){delete this.attrs[k];if(k==='href')delete this.href}addEventListener(k,fn){this.events[k]=fn}focus(){}select(){}scrollIntoView(){}
}
const flat=n=>[n,...n.children.filter(x=>x instanceof Element).flatMap(flat)],settle=()=>new Promise(setImmediate);
const source=fs.readFileSync(path.join(__dirname,'../../omise-demo/post-share.js'),'utf8');
(async()=>{
 for(const owner of ['SHOP-0002','SHOP-0001'])for(const role of [null,'SHOP-0001','SHOP-0003','SHOP-0002','ADMIN','REJECTED']){
  const storage=new Map(),events={},copies=[],shared=[];
  if(role)storage.set('shiki-merchant-session-v1',JSON.stringify({id:role==='REJECTED'?'SHOP-0002':role,token:'DXS1.'+'a'.repeat(64),expiresAt:Date.now()+60000}));
  const c={URL,Date,JSON,Array,Promise,Error,Infinity,encodeURIComponent,setTimeout:()=>0,clearTimeout(){},setInterval(){},document:{head:new Element('head'),createElement:t=>new Element(t),addEventListener(){}},window:{addEventListener:(k,fn)=>(events[k]??=[]).push(fn),omiseOwnerCall:async()=>{if(role==='REJECTED')throw Error('invalid');return[];}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},navigator:{clipboard:{writeText:async v=>copies.push(v)},share:async v=>shared.push(v)}};
  vm.runInNewContext(source,c);const items=[];
  for(const kind of ['profile','deal','notice']){
   const root=new Element('div');c.window.DXPostShare.mount(root,{shop:owner,name:'試験店',title:'紹介タイトル',body:'確認済みの紹介文',kind,shareURL:'https://example.com/'+kind},{profile:kind==='profile',privateOnly:kind==='profile'});
   const nodes=flat(root),area=nodes.find(n=>n.className?.includes('post-simple-share'));
   items.push({kind,nodes,area,actions:nodes.find(n=>n.className==='post-identity-actions'),editor:nodes.find(n=>n.className==='post-fujiko-editor'),sender:nodes.find(n=>n.tag==='select'),draft:nodes.find(n=>n.attrs['aria-label']==='SNSに載せる紹介文'),copy:nodes.find(n=>n.tag==='button'&&n.textContent==='紹介文とURLをコピー')});
  }
  await settle();const allowed=owner==='SHOP-0002';
  for(const item of items){assert.equal(item.editor.hidden,!allowed,role);assert.equal(item.actions.hidden,!allowed||item.kind==='profile',role);if(item.kind==='profile')assert.equal(item.area.hidden,!allowed,role);assert(item.nodes.find(n=>n.className==='post-share-login').hidden);}
  if(!allowed){
   for(const item of items){item.actions.children[1].events.click();assert(item.editor.hidden);assert.equal(item.draft.value,'');}
   if(role!=='REJECTED')assert.equal(c.window.DXPostShare.profileText('元の文章','店','url',owner),'元の文章');
  }else{
   for(const who of ['heartnet','fujiko']){
    items[1].sender.value=who;items[1].sender.events.change();const prefix=who==='heartnet'?'ハートネット志木から':'ふじこから';
    for(const item of items){
     assert.equal(item.sender.value,who);assert(item.draft.value.startsWith(prefix));
     const copy=item.nodes.find(n=>n.tag==='button'&&n.textContent==='紹介文とURLをコピー');await copy.events.click();assert(copies.at(-1).startsWith(prefix));
     const line=item.nodes.find(n=>n.textContent==='LINEで友だちに教える'),x=item.nodes.find(n=>n.textContent==='Xで共有');
     assert(new URL(line.href).searchParams.get('text').startsWith(prefix));assert(new URL(x.href).searchParams.get('text').startsWith(prefix));
     await line.events.click({preventDefault(){}});assert(shared.at(-1).text.startsWith(prefix));
     await item.nodes.find(n=>n.textContent==='スマホで共有').events.click();assert(shared.at(-1).text.startsWith(prefix));
     const fb=item.nodes.find(n=>n.textContent==='Facebookで共有');assert.equal(new URL(fb.href).searchParams.get('u'),'https://example.com/'+item.kind);
    }
    assert(c.window.DXPostShare.profileText('元の文章','店','url',owner).startsWith(prefix));
   }
   // Explicit two-button selection works and synchronizes every share area.
   items[2].actions.children[0].events.click();for(const item of items)assert(item.draft.value.startsWith('ハートネット志木から'));
   storage.delete('shiki-merchant-session-v1');for(const f of events.storage)f({key:'shiki-merchant-session-v1'});
   for(const item of items){assert(!item.editor.hidden);assert(item.draft.value.startsWith('ハートネット志木から'));}
  }
  console.log('PASS content scope / copy / LINE / X / phone / logout:',owner,role||'anonymous');
 }
 const news=fs.readFileSync(path.join(__dirname,'../../omise-demo/fujiko-news.html'),'utf8');assert(news.includes('DXPostShare?.mount(box'));assert(!news.includes('const sender='));assert(!news.includes('.news-iroha-copy>.post-simple-share'));
 console.log('PASS news uses common identity controls; fixed share URLs preserved');
})().catch(e=>{console.error(e);process.exitCode=1});
