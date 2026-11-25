import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const maximum=37_000_000;
function fixture(){
 const context=vm.createContext({});
 vm.runInContext(fs.readFileSync(new URL('./LiveCode.gs',import.meta.url),'utf8'),context);
 context.respond_=value=>value;
 let dispatched=0;
 context.postSend=()=>{dispatched++;return {ok:true};};
 return {context,call:raw=>context.doPost({postData:{contents:raw}}),calls:()=>dispatched};
}
test('owner API accepts a 25 MiB video with four maximum-size photos, poster and social image',()=>{
 const video='data:video/mp4;base64,'+'A'.repeat(4*Math.ceil((25*1024*1024)/3));
 const jpeg=length=>'data:image/jpeg;base64,'+'A'.repeat(length-'data:image/jpeg;base64,'.length);
 const draft={clientRequestId:'a'.repeat(32),kind:'notice',body:'お'.repeat(1500),end:'',photos:Array.from({length:4},()=>jpeg(240000)),video,poster:jpeg(240000),ogImage:jpeg(650000)};
 assert.ok(video.length<=35_000_000,'the existing postSend video limit also accepts this payload');
 const raw=JSON.stringify({api:'owner-v1',method:'postSend',args:['SHOP-0001','fixture-code',draft]});
 assert.ok(raw.length>24_000_000,'this reproduces the old request-size rejection');
 assert.ok(raw.length<maximum,'all supported attachments fit within the new bounded request limit');
 const f=fixture();assert.equal(f.call(raw).ok,true);assert.equal(f.calls(),1);
 assert.equal(f.context.ownerVersion_().maxRequestChars,maximum);
 console.log('Maximum supported payload characters:',raw.length);
});
test('owner API rejects an oversized request before dispatch with an actionable attachment error',()=>{
 const prefix='{"api":"owner-v1","method":"postSend","args":[],"padding":"',suffix='"}';
 const raw=prefix+'A'.repeat(maximum+1-prefix.length-suffix.length)+suffix;
 assert.equal(raw.length,maximum+1);
 const f=fixture(),result=f.call(raw);
 assert.equal(result.ok,false);assert.match(result.error,/添付ファイルの合計.*動画を短く.*写真を減ら/);assert.equal(f.calls(),0);
});
test('standalone owner API and deployable bundles contain the same request-size fix',()=>{
 const source=fs.readFileSync(new URL('./OwnerApi.gs',import.meta.url),'utf8');
 const bundle=fs.readFileSync(new URL('./LiveCode.gs',import.meta.url),'utf8');
 assert.equal(bundle.includes(source),true);
 assert.equal(bundle,fs.readFileSync(new URL('./LiveCode.txt',import.meta.url),'utf8'));
});
