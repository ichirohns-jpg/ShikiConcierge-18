import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
const props=new Map([['merchant:SHOP-0001','test-cafe-code'],['merchant:SHOP-0002','test-heartnet-code'],['merchant:ADMIN','test-admin-code']]);
let now=Date.now();class Clock extends Date{static now(){return now;}}
const ctx=vm.createContext({Date:Clock,PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)||null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k),getProperties:()=>Object.fromEntries(props)})},Utilities:{getUuid:randomUUID,computeDigest:(_a,s)=>[...createHash('sha256').update(s).digest()],DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'}},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})}});
const bundle=fs.readFileSync(process.env.SHIKI_LOGIN_BUNDLE||new URL('./LiveCode.gs',import.meta.url),'utf8');
vm.runInContext(bundle,ctx);
// Use the actual bundle auth and postLogin, with only sheet reads replaced.
vm.runInContext("merchantLogin=(id,code)=>{omAuth_(id,code);return {admin:id==='ADMIN',shop:{'店名':'テスト店'}}};postPublishPending_=()=>{};postOwn=(id,code)=>{omAuth_(id,code);return []};omBook_=()=>({getSheetByName:()=>({getDataRange:()=>({getDisplayValues:()=>[['ID','x','name'],['SHOP-0001','','テスト店']]})})});",ctx);
assert.throws(()=>ctx.postLogin('SHOP-0001','wrong',true));
assert.equal(ctx.postLogin('SHOP-0001','test-cafe-code',false).auth,undefined);
const a=ctx.postLogin('SHOP-0001','test-cafe-code',true).auth;
assert.match(a.token,/^DXS1\.[a-f0-9]{64}$/);assert.equal(a.expiresAt,now+30*86400000);
assert.ok(!JSON.stringify([...props]).includes(a.token),'server stores only token digest');
assert.throws(()=>ctx.postLogin('SHOP-0002',a.token,true),'other shop cannot use token');
assert.equal(ctx.postLogin('SHOP-0001',a.token,true).auth.token,a.token,'mismatched shop does not destroy valid token');
assert.equal(ctx.postLogin('SHOP-0001',a.token,true).auth.expiresAt,a.expiresAt,'restore does not extend lifetime');
ctx.postLogout('SHOP-0002',a.token);assert.doesNotThrow(()=>ctx.omAuth_('SHOP-0001',a.token));
ctx.postLogout('SHOP-0001',a.token);assert.throws(()=>ctx.omAuth_('SHOP-0001',a.token),'logout revokes');
const changed=ctx.postLogin('SHOP-0001','test-cafe-code',true).auth;props.set('merchant:SHOP-0001','new-test-code');assert.throws(()=>ctx.omAuth_('SHOP-0001',changed.token),'code change revokes');
const expired=ctx.postLogin('SHOP-0001','new-test-code',true).auth;now=expired.expiresAt;assert.throws(()=>ctx.omAuth_('SHOP-0001',expired.token),'expiry is enforced on server');
const tokens=Array.from({length:6},()=>{now++;return ctx.postLogin('SHOP-0001','new-test-code',true).auth.token;});
assert.equal([...props.keys()].filter(k=>k.startsWith('merchantSession:')).length,5,'device sessions bounded');
assert.throws(()=>ctx.omAuth_('SHOP-0001',tokens[0]));assert.doesNotThrow(()=>ctx.omAuth_('SHOP-0001',tokens[5]));
assert.throws(()=>ctx.omAuth_('ADMIN',tokens[5]),'merchant token is not admin');
console.log('PASS: original code login, opt-out, restore, shop isolation, no raw token on server, revocation, code rotation, expiry and bounded sessions');
