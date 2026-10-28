const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../../omise-demo/fujiko.html'),'utf8'),script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(x=>x.includes('async function restore'));
new vm.Script(script);
const token='DXS1.'+'b'.repeat(64);
function fixture(id,saved=null,fail=false){const nodes={},events={},calls=[];let stored=saved;const $=key=>nodes[key]??={hidden:false,value:'',textContent:'',disabled:false};$('inside').hidden=true;const context={document:{getElementById:$},window:{addEventListener:(k,f)=>events[k]=f,omiseOwnerSession:{read:()=>stored,save:a=>{stored=a;return true},forget:()=>{stored=null},authError:e=>/有効期限/.test(e.message)},omiseOwnerCall:async(name,args)=>{calls.push({name,args});if(fail)throw Error('有効期限が切れました');if(name==='postLoginByCode')return{loginId:id,auth:{id,token,expiresAt:Date.now()+100000}};return[];}},Date,Array,Error};vm.runInNewContext(script,context);return{$,calls,stored:()=>stored,events};}
const settle=()=>new Promise(r=>setImmediate(r));
(async()=>{
for(const id of ['SHOP-0002','ADMIN']){const a=fixture(id);a.$('code').value='fixture-private-code';await a.$('loginForm').onsubmit({preventDefault(){}});assert(!a.$('inside').hidden);assert(a.$('login').hidden);assert.equal(a.stored().token,token);assert(!JSON.stringify(a.stored()).includes('fixture-private-code'));assert.equal(a.$('code').value,'');await a.$('logout').onclick();assert(a.$('inside').hidden);assert.equal(a.stored(),null);}
const other=fixture('SHOP-0001');other.$('code').value='fixture';await other.$('loginForm').onsubmit({preventDefault(){}});assert(other.$('inside').hidden);assert.equal(other.stored(),null);
const restored=fixture('SHOP-0002',{id:'SHOP-0002',token,expiresAt:Date.now()+100000});await settle();assert(!restored.$('inside').hidden);assert.equal(restored.calls[0].name,'postOwn');
const expired=fixture('SHOP-0002',{id:'SHOP-0002',token,expiresAt:Date.now()+100000},true);await settle();assert(expired.$('inside').hidden);assert.equal(expired.stored(),null);
console.log('PASS: ふじこ・編集長で入場、他店は拒否、共有トークン保存・コード非保存、再入場・ログアウト・失効');
})();
