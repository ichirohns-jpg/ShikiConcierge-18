import test from 'node:test';
import assert from 'node:assert/strict';
import {compilePosts,fetchPosts,writePosts,BASE,SHORT_BASE} from './build-post-shares.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

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

test('Short URLs contain only a small number and preserve the same image metadata',()=>{
 const result=compilePosts([fixture]),entry=result.manifest.posts[id],short=result.shortFiles.get('1/index.html').toString();
 assert.equal(entry.shortURL,SHORT_BASE+'1/');
 assert.ok(short.includes('property="og:url" content="'+entry.shortURL+'"'));
 assert.ok(short.includes('rel="canonical" href="'+entry.shortURL+'"'));
 assert.ok(short.includes('property="og:image" content="'+entry.imageURL+'"'));
 assert.ok(short.includes('via=short'));
 assert.ok(result.files.get(id+'/index.html').toString().includes(entry.shareURL));
 assert.ok(entry.shortURL.length<entry.shareURL.length/2);
});
test('Numbers persist across reordering and edits get a short numeric cache version',()=>{
 const first=compilePosts([fixture]),another={...fixture,id:'POST-b',body:'別の記事'};
 const second=compilePosts([another,fixture],first.links);
 assert.equal(second.manifest.posts[id].shortURL,SHORT_BASE+'1/');
 assert.equal(second.manifest.posts['POST-b'].shortURL,SHORT_BASE+'2/');
 assert.equal(first.links.next,2);
 const changed=compilePosts([{...fixture,body:'更新後'}],second.links);
 assert.equal(changed.manifest.posts[id].shortURL,SHORT_BASE+'1/?v=2');
 assert.equal(compilePosts([{...fixture,body:'更新後'}],changed.links).manifest.posts[id].shortURL,SHORT_BASE+'1/?v=2');
});
test('Expired numbers are retained and never reused for another post',()=>{
 const first=compilePosts([fixture]),empty=compilePosts([],first.links);
 const next=compilePosts([{...fixture,id:'POST-c'}],empty.links);
 assert.equal(next.manifest.posts['POST-c'].shortURL,SHORT_BASE+'2/');
 assert.equal(next.links.posts[id].number,1);
});
test('Malformed registries cannot overwrite another short page',()=>{
 const first=compilePosts([fixture]);
 assert.throws(()=>compilePosts([fixture],{...first.links,next:1}));
 assert.throws(()=>compilePosts([fixture],{...first.links,posts:{...first.links.posts,'POST-b':{...first.links.posts[id]}}}));
});
test('Writer preserves the registry across refreshes and removes expired public aliases',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'omise-short-'));
 try{
  const destination=path.join(root,'post-shares'),shortRoot=path.join(root,'p');
  await writePosts([fixture],destination,shortRoot);
  assert.ok((await fs.readFile(path.join(shortRoot,'1/index.html'),'utf8')).includes(SHORT_BASE+'1/'));
  await writePosts([],destination,shortRoot);
  await assert.rejects(fs.access(path.join(shortRoot,'1/index.html')));
  const result=await writePosts([{...fixture,id:'POST-d'}],destination,shortRoot);
  assert.equal(result.posts['POST-d'].shortURL,SHORT_BASE+'2/');
  assert.ok(await fs.readFile(path.join(shortRoot,'2/index.html'),'utf8'));
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
