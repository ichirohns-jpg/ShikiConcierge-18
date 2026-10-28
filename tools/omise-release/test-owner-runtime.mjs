import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const script=fs.readFileSync(new URL('./owner-runtime.js',import.meta.url),'utf8');const map=new Map();let clock=Date.now();class Clock extends Date{static now(){return clock;}}
const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
let requests=[];let response=async()=>({ok:true,json:async()=>({ok:true,result:{ok:true}})});
function page(){const ctx=vm.createContext({window:{},Date:Clock,localStorage:storage,fetch:async(u,o)=>{requests.push({u,o});return response();},AbortController,setTimeout:()=>1,clearTimeout(){},TypeError});vm.runInContext(script,ctx);return ctx.window;}
const auth={id:'SHOP-0001',token:'DXS1.'+'a'.repeat(64),expiresAt:clock+30*86400000};
const post=page();assert.equal(post.omiseOwnerSession.save({...auth,password:'must-not-save'}),true);assert.ok(![...map.values()].join('').includes('must-not-save'));
const scenes=page(),info=page();assert.equal(scenes.omiseOwnerSession.read().token,auth.token);assert.equal(info.omiseOwnerSession.read().token,auth.token);
await info.omiseOwnerCall('postLogin',['SHOP-0001',auth.token,true]);const request=requests.pop();assert.equal(request.o.method,'POST');assert.equal(request.o.credentials,'omit');assert.equal(request.u.includes(auth.token),false);assert.equal(JSON.parse(request.o.body).args[1],auth.token);
response=async()=>{throw new TypeError('Failed to fetch');};await assert.rejects(()=>scenes.omiseOwnerCall('postOwn',['SHOP-0001',auth.token]));assert.equal(scenes.omiseOwnerSession.read().token,auth.token,'network failures must preserve saved login');
response=async()=>({ok:true,json:async()=>({ok:false,error:'ログインの有効期限が切れました。'})});await assert.rejects(()=>info.omiseOwnerCall('postOwn',['SHOP-0001',auth.token]),/有効期限/);
assert.equal(info.omiseOwnerSession.authError(new Error('Failed to fetch')),false);assert.equal(info.omiseOwnerSession.authError(new Error('ログインの有効期限が切れました。')),true);
await assert.rejects(()=>info.omiseOwnerCall('setupMerchantEditing',[]));info.omiseOwnerSession.forget();assert.equal(post.omiseOwnerSession.read(),null);
assert.equal(post.omiseOwnerSession.save(auth),true);clock=auth.expiresAt;assert.equal(page().omiseOwnerSession.read(),null);assert.equal(map.size,0);
for(const file of ['owner.html','owner-scenes.html','owner-info.html']){const s=fs.readFileSync(new URL('./'+file,import.meta.url),'utf8');assert.ok(s.includes('const sessionMemory=window.omiseOwnerSession;'));assert.ok(s.includes('owner-runtime.js'));assert.ok(!s.includes('google.script.run'));assert.ok(!s.includes('exec?mode='));for(const m of s.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(m[1],{filename:file});}
console.log('PASS: one login shared across three first-party pages, token-only storage, credential-free URLs, POST transport, preserved login on network failure, logout and expiry');
