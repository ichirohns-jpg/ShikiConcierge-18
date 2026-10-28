const fs=require('fs'),vm=require('vm'),assert=require('assert');
const path=require('path'),source=fs.readFileSync(path.join(__dirname,'../../omise-demo/post-share.js'),'utf8');
class El{constructor(tag){this.tag=tag;this.children=[];this.events={};this.attrs={};this.style={};this.value='';this.hidden=false;this.isConnected=true;this.classList={add(){}};}append(...x){this.children.push(...x)}setAttribute(k,v){this.attrs[k]=v}removeAttribute(k){delete this.attrs[k]}addEventListener(k,f){this.events[k]=f}focus(){}select(){}}
const flat=n=>[n,...n.children.filter(x=>x instanceof El).flatMap(flat)];
const settle=()=>new Promise(r=>setImmediate(r));
async function check(role,accept=true){
 const events={},storage=new Map(),copies=[],native=[];
 if(role)storage.set('shiki-merchant-session-v1',JSON.stringify({id:role,token:'DXS1.'+'a'.repeat(64),expiresAt:Date.now()+100000}));
 const context={document:{head:new El('head'),createElement:t=>new El(t),addEventListener(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},window:{addEventListener:(k,f)=>(events[k]??=[]).push(f),omiseOwnerCall:async()=>{if(!accept)throw Error('invalid');return[];}},navigator:{clipboard:{writeText:async t=>copies.push(t)},share:async data=>native.push(data)},Date,JSON,Array,Promise,Error,encodeURIComponent,setInterval(){},setTimeout,clearTimeout};
 vm.runInNewContext(source,context);const ui=context.window.DXPostShare,items=[];
 for(const kind of ['profile','deal','notice']){const box=new El('div'),old=new El('nav'),previouslyHidden=new El('textarea');previouslyHidden.hidden=true;box.append(old,previouslyHidden);let body='【掲載見本・利用不可】条件つきのお知らせ';
  const dispose=ui.mount(box,{name:'テスト店',kind,body,shareURL:'https://example.com/'+kind},{privateOnly:true,replaceExisting:true,profile:kind==='profile',readPost:()=>({body})});
  const all=flat(box);items.push({old,previouslyHidden,area:box.children[2],all,dispose,changeBody:()=>body='変更後の条件です'});
 }
 await settle();const allowed=['ADMIN','SHOP-0002'].includes(role)&&accept;
 for(const item of items){assert.equal(item.old.hidden,allowed);assert(item.previouslyHidden.hidden);assert.equal(item.area.hidden,!allowed);}
 if(!allowed)return;
 for(const who of ['fujiko','heartnet','original']){ui.setIdentity(who);for(const item of items){const copy=item.all.find(n=>n.tag==='button'&&n.className==='post-share-copy');await copy.events.click();const text=copies.at(-1);assert(text.includes('掲載見本・利用不可'));if(who==='original')assert(!text.includes('からの'));else assert(text.startsWith(who==='fujiko'?'ふじこから':'ハートネット志木から'));
 const line=item.all.find(n=>n.href?.startsWith('https://line.me/')),x=item.all.find(n=>n.href?.startsWith('https://x.com/'));assert.equal(new URL(line.href).searchParams.get('text'),text);assert(text.includes(new URL(x.href).searchParams.get('text')));
 await item.all.find(n=>n.className==='post-share-native').events.click();assert.equal(native.at(-1).text,text);
 }}
 items[0].changeBody();await items[0].all.find(n=>n.className==='post-share-copy').events.click();assert(copies.at(-1).includes('変更後の条件'));
 storage.delete('shiki-merchant-session-v1');for(const fn of events.storage)fn({key:'shiki-merchant-session-v1'});for(const item of items){assert(!item.old.hidden);assert(item.previouslyHidden.hidden);assert(item.area.hidden);item.dispose();}
}
(async()=>{for(const role of [null,'SHOP-0001','SHOP-0002','ADMIN'])await check(role);await check('SHOP-0002',false);
 const locations=fs.readFileSync(path.join(__dirname,'../../omise-demo/fujiko-share-locations.js'),'utf8');assert(locations.includes('replaceExisting:true'));assert(locations.includes("document.querySelectorAll('a[href]')"));
 const sync=fs.readFileSync(path.join(__dirname,'../../omise-demo/merchant-sync.js'),'utf8');assert(sync.includes("sharing.dataset.shareKind='notice'"));assert(sync.includes('sharing.dataset.shareEnd=n.end'));
 const posts=fs.readFileSync(path.join(__dirname,'../../omise-demo/posts.js'),'utf8');assert(posts.includes('options?.replaceExisting?box'));assert(posts.includes('profile:true,replaceExisting:true'));
 console.log('PASS: 店舗・特典・お知らせの旧ボタンを認証時だけ共通欄へ置換、両名義/元文・コピー/LINE/X/スマホ共有、更新とログアウト、一般/他店/認証失敗は元の表示');})();
