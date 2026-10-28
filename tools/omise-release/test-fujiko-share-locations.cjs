const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(require('path').join(__dirname,'../../omise-demo/fujiko-share-locations.js'),'utf8');
async function check(saved){
 const calls=[],primary={isConnected:true};
 const anchor=href=>({href,closest:()=>null});
 const makeGroup=(dataset={},links=[])=>({isConnected:true,dataset,querySelectorAll:()=>links,closest:()=>null,append(){}});
 const group=makeGroup({},[anchor('https://line.me/R/share?text='+encodeURIComponent('【掲載見本・利用不可】パンの特典\nhttps://example.com/benefit'))]);
 const multiURL=makeGroup({},[anchor('https://line.me/R/share?text='+encodeURIComponent('【掲載見本・利用不可】特典\nhttps://example.com/benefit\n【地図】\nhttps://example.com/map')),anchor('https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Fbenefit')]);
 const notice=makeGroup({shareName:'テスト店',shareText:'本日のお知らせ',shareUrl:'https://example.com/shop#top',shareKind:'notice',shareEnd:'2099-12-31'});
 const loose=anchor('https://line.me/R/share?text='+encodeURIComponent('単独ボタン\nhttps://example.com/loose'));let wrapper=null;
 loose.before=node=>{wrapper=node;};
 const groups=[group,multiURL,notice];
 const context={localStorage:{getItem:()=>JSON.stringify(saved)},document:{scripts:[],body:{},querySelectorAll:s=>s==='a[href]'?[loose]:groups,querySelector:s=>s==='#intro .primary'?primary:s==='h1'?{textContent:'パン工房'}:null,createElement:()=>({...makeGroup(),setAttribute(){},append(a){a.closest=s=>s.includes('[data-dx-share]')?this:null;this.querySelectorAll=()=>[a];groups.push(this);}})},window:{DXPostShare:{mount:(node,p,options)=>calls.push({p,options}),shortcut:()=>calls.push({shortcut:true})},addEventListener(){}},location:{origin:'https://example.com',pathname:'/benefit'},MutationObserver:class{observe(){}},queueMicrotask,Date,JSON,WeakSet,Promise,URL,Error,decodeURIComponent};
 vm.runInNewContext(source,context);await new Promise(r=>setImmediate(r));return{calls,wrapper};
}
(async()=>{assert.equal((await check(null)).calls.length,0);assert.equal((await check({id:'SHOP-0001',expiresAt:Date.now()+100000})).calls.length,0);const {calls,wrapper}=await check({id:'SHOP-0002',expiresAt:Date.now()+100000});assert(wrapper);assert.equal(calls.length,5);assert(calls[4].shortcut);
 for(const c of calls.filter(c=>!c.shortcut)){assert(c.options.privateOnly);assert(c.options.replaceExisting);}
 assert(calls[0].p.body.includes('掲載見本・利用不可'));assert.equal(calls[0].p.shareURL,'https://example.com/benefit');
 assert.equal(calls[1].p.shareURL,'https://example.com/benefit');assert(calls[1].p.body.includes('https://example.com/map'));
 assert.equal(calls[2].p.kind,'notice');assert.equal(calls[2].p.end,'2099-12-31');assert.equal(calls[2].p.body,'本日のお知らせ');assert.equal(calls[3].p.shareURL,'https://example.com/loose');
 console.log('PASS: 特典・複数URL・追加のお知らせ・単独SNSボタン共通化、紹介上部・公開制限・期限と元URL保持');})();
