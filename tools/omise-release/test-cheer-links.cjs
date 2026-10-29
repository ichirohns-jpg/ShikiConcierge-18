const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const root=path.resolve(__dirname,'../..'),context={window:{},URL,document:{createElement:()=>({}),head:{append(){}}}};
vm.runInNewContext(fs.readFileSync(root+'/omise-demo/sns-recommend.js','utf8'),context);const api=context.window.DXSNSRecommend;
for(const link of ['https://www.facebook.com/share/p/ABC/','https://www.threads.com/share/_1J0EXcyH/','https://x.com/someone/status/123','https://example.com/news/1','https://www.instagram.com/p/ABC/']){const body=api.compose('応援しています❣️',link),rec=api.parse(body);assert.equal(rec.href,link);assert.equal(rec.comment,'応援しています❣️');assert.equal(api.compose(rec.comment,rec.href),body);}
assert.equal(api.url('https://example.com/news/1').network,'リンク先');assert.equal(api.url('https://facebook.com.evil.example/p/1').network,'リンク先');assert.equal(api.parse('ふじこの推しのお店🥒\n\n前の紹介\n\nhttps://www.threads.com/@a/post/123').comment,'前の紹介');assert.equal(api.parse('普通の投稿\nhttps://example.com'),null);
for(const value of ['javascript:alert(1)','http://example.com','https://user:secret@example.com','https://example.com:8443/','https://example.com/\nfoo'])assert.equal(api.url(value),null);
assert.throws(()=>api.compose('あ'.repeat(1500),'https://example.com'));
for(const f of fs.readdirSync(root+'/omise-demo')){const s=fs.readFileSync(root+'/omise-demo/'+f,'utf8');if(f.endsWith('.js'))new vm.Script(s);if(f.endsWith('.html'))for(const [,attrs,code] of s.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g))if(!attrs.includes('application/ld+json'))new vm.Script(code);}
console.log('PASS: generic copied links, legacy recommendations, safe URLs, length validation and JS parsing');
