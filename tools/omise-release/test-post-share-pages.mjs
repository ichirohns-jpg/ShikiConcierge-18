import test from 'node:test';
import assert from 'node:assert/strict';
import {compilePosts,fetchPosts,BASE} from './build-post-shares.mjs';

const id='POST-56783934-e23c-4233-90fe-ce46e4fedd61';
const photo='data:image/jpeg;base64,'+Buffer.from([255,216,255,224,0,2,255,217]).toString('base64');
const fixture={id,status:'公開',name:'ハートネット志木',body:'お知らせ\n写真のある投稿',date:'2026-10-27 20:12:05',photos:[photo]};
test('Crawler receives photo metadata in the actual HTML head and exact JPEG bytes',()=>{
 const {files,manifest}=compilePosts([fixture]),page=files.get(id+'/index.html').toString();
 const head=page.split('</head>')[0];
 assert.match(head,/<meta property="og:image" content="https:\/\/ichirohns-jpg\.github\.io\/ShikiConcierge-18\/omise-demo\/post-shares\/POST-/);
 assert.ok(head.includes(manifest.posts[id].shareURL));assert.ok(!head.includes('script.google.com'));
 assert.ok(!page.includes('http-equiv="refresh"'));
 const imagePath=manifest.posts[id].imageURL.slice((BASE+'post-shares/').length);
 assert.deepEqual(files.get(imagePath),Buffer.from(photo.split(',')[1],'base64'));
 assert.ok(page.includes('location.replace('));
});
test('Changing text or a photo produces a new share URL, without changing the article ID',()=>{
 const first=compilePosts([fixture]).manifest.posts[id];
 const second=compilePosts([{...fixture,body:'変更後'}]).manifest.posts[id];
 const changedPhoto='data:image/jpeg;base64,'+Buffer.from([255,216,255,224,0,3,255,217]).toString('base64');
 const third=compilePosts([{...fixture,photos:[changedPhoto]}]).manifest.posts[id];
 assert.notEqual(first.shareURL,second.shareURL);assert.notEqual(first.shareURL,third.shareURL);
 assert.match(second.shareURL,new RegExp(id));
});
test('Public text is escaped and invalid or ended data cannot be published',()=>{
 const page=compilePosts([{...fixture,name:'"><script>alert(1)</script>',body:'A & <B>'}]).files.get(id+'/index.html').toString();
 assert.ok(!page.includes('<script>alert(1)</script>'));assert.ok(page.includes('A &amp; &lt;B&gt;'));
 for(const p of [{...fixture,status:'draft'},{...fixture,ended:true},{...fixture,id:'../../x'},{...fixture,photos:['data:image/jpeg;base64,AAAA']}])assert.throws(()=>compilePosts([p]));
});
test('Fetch every page and reject partial, changing, or malformed responses',async()=>{
 let calls=0;
 const posts=await fetchPosts(async url=>({ok:true,json:async()=>{const offset=Number(url.searchParams.get('offset'));calls++;return {ok:true,total:2,offset,posts:[{...fixture,id:offset?'POST-a':id}]};}}));
 assert.equal(calls,2);assert.equal(posts.length,2);
 for(const page of [{ok:false},{ok:true,total:1,offset:0,posts:[]},{ok:true,total:1,offset:1,posts:[fixture]}])await assert.rejects(fetchPosts(async()=>({ok:true,json:async()=>page})));
});
