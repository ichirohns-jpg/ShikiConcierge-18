import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const BASE='https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/';
export const SHORT_BASE=new URL('../p/',BASE).href;
const ENDPOINT='https://script.google.com/macros/s/AKfycbzMec1R3le4e-cOUyBUl6Eq2dU3OI-5HHtkEyJQT7SWx4IjUHGtW8Z3zatJxoA2GUhn2A/exec';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export async function fetchPosts(request=fetch){
 const posts=[];let offset=0,total=null;
 do{
  const url=new URL(ENDPOINT);url.search=new URLSearchParams({action:'posts',offset:String(offset)});
  const response=await request(url,{signal:AbortSignal.timeout(45000)});
  if(!response.ok)throw Error('Public posts HTTP '+response.status);
  const page=await response.json();
  if(page.ok!==true||!Number.isInteger(page.total)||page.total<0||page.total>10000||!Array.isArray(page.posts))throw Error('Invalid public posts response');
  if(total!==null&&total!==page.total)throw Error('Posts changed during pagination; retry on the next run');
  total=page.total;
  if(page.offset!==offset||(!page.posts.length&&offset<total))throw Error('Incomplete public posts response');
  posts.push(...page.posts);offset+=page.posts.length;
 }while(offset<total);
 if(posts.length!==total||new Set(posts.map(p=>p.id)).size!==posts.length)throw Error('Incomplete or duplicate public posts');
 return posts;
}

function shortLinksState(input){
 const state=input??{version:1,next:1,posts:{}};
 if(state.version!==1||!Number.isSafeInteger(state.next)||state.next<1||!state.posts||typeof state.posts!=='object'||Array.isArray(state.posts))throw Error('Invalid short-link registry');
 const used=new Set(),entries={};
 for(const [id,entry] of Object.entries(state.posts)){
  if(!/^POST-[a-f0-9-]+$/i.test(id)||!entry||!Number.isSafeInteger(entry.number)||entry.number<1||entry.number>=state.next||used.has(entry.number)||!Number.isSafeInteger(entry.version)||entry.version<1||!/^[a-f0-9]{16}$/.test(entry.revision||''))throw Error('Invalid short-link registry entry');
  used.add(entry.number);entries[id]={...entry};
 }
 return {version:1,next:state.next,posts:entries};
}

export function compilePosts(posts,knownLinks){
 const files=new Map(),shortFiles=new Map(),links=shortLinksState(knownLinks),manifest={version:1,posts:{}};
 for(const p of posts){
  if(!/^POST-[a-f0-9-]+$/i.test(p.id||'')||p.status!=='公開'||p.ended)throw Error('Only public active posts can be published');
  const photo=(p.photos||[])[0]||p.poster||'';
  if(photo&&!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo))throw Error('Invalid public JPEG');
  const bytes=photo?Buffer.from(photo.split(',')[1],'base64'):null;
  if(bytes&&(bytes.length>5000000||bytes[0]!==255||bytes[1]!==216||bytes[2]!==255))throw Error('Invalid public JPEG bytes');
  const revision=createHash('sha256').update(JSON.stringify([p.id,p.name,p.body,p.date,p.end||''])).update(bytes||'').digest('hex').slice(0,16);
  let short=links.posts[p.id];
  if(!short)short=links.posts[p.id]={number:links.next++,revision,version:1};
  else if(short.revision!==revision){short.revision=revision;short.version++;}
  const shortURL=SHORT_BASE+short.number+'/'+(short.version>1?'?v='+short.version:'');
  const shareURL=BASE+'post-shares/'+encodeURIComponent(p.id)+'/?v='+revision;
  const articleURL=BASE+'article.html?id='+encodeURIComponent(p.id);
  const imageURL=bytes?BASE+'post-shares/'+encodeURIComponent(p.id)+'/photo-'+revision+'.jpg':BASE+'dx-share-ogp-v1.jpg';
  const title=(String(p.body||'').split('\n')[0]||'お店からのお知らせ').slice(0,70)+'｜'+p.name;
  const description=String(p.body||'').replace(/\s+/g,' ').slice(0,160);
  const html='<!doctype html>\n<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
   '<title>'+escape(title)+'</title><meta name="description" content="'+escape(description)+'">'+
   '<meta property="og:type" content="article"><meta property="og:site_name" content="志木なるほど お店めぐりDX">'+
   '<meta property="og:title" content="'+escape(title)+'"><meta property="og:description" content="'+escape(description)+'">'+
   '<meta property="og:url" content="'+escape(shareURL)+'"><meta property="og:image" content="'+escape(imageURL)+'">'+
   '<meta property="og:image:secure_url" content="'+escape(imageURL)+'"><meta property="og:image:type" content="image/jpeg">'+
   '<meta property="og:image:alt" content="'+escape(p.name+'の投稿写真')+'">'+
   '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+escape(title)+'">'+
   '<meta name="twitter:description" content="'+escape(description)+'"><meta name="twitter:image" content="'+escape(imageURL)+'">'+
   '<link rel="canonical" href="'+escape(shareURL)+'"><style>body{max-width:720px;margin:32px auto;padding:16px;font:18px/1.7 sans-serif;color:#193f33}img{max-width:100%;height:auto}p{white-space:pre-wrap}a{color:#146b57}</style></head><body><main>'+
   '<h1>'+escape(p.name)+'</h1><p>'+escape(p.body)+'</p>'+(bytes?'<img src="'+escape(imageURL)+'" alt="'+escape(p.name+'の投稿写真')+'">':'')+
   '<p><a href="'+escape(articleURL)+'">この記事を開く</a></p></main><script>location.replace('+JSON.stringify(articleURL).replace(/</g,'\\u003c')+');</script></body></html>\n';
  files.set(p.id+'/index.html',Buffer.from(html));
  if(bytes)files.set(p.id+'/photo-'+revision+'.jpg',bytes);
  const freshArticleURL=articleURL+'&via=short';
  const shortHtml=html.replace('property="og:url" content="'+escape(shareURL)+'"','property="og:url" content="'+escape(shortURL)+'"').replace('rel="canonical" href="'+escape(shareURL)+'"','rel="canonical" href="'+escape(shortURL)+'"');
  shortFiles.set(short.number+'/index.html',Buffer.from(shortHtml.replace('<p><a href="'+escape(articleURL)+'">','<p><a href="'+escape(freshArticleURL)+'">').replace('location.replace('+JSON.stringify(articleURL),'location.replace('+JSON.stringify(freshArticleURL))));
  manifest.posts[p.id]={date:p.date,shareURL,shortURL,imageURL};
 }
 files.set('manifest.json',Buffer.from(JSON.stringify(manifest,null,2)+'\n'));
 files.set('short-links.json',Buffer.from(JSON.stringify(links,null,2)+'\n'));
 return {files,shortFiles,manifest,links};
}

export async function writePosts(posts,destination,shortDestination=path.resolve(destination,'../../p')){
 let previous;
 try{previous=JSON.parse(await fs.readFile(path.join(destination,'short-links.json'),'utf8'));}
 catch(error){if(error.code!=='ENOENT')throw error;}
 const result=compilePosts(posts,previous); // Validate everything before changing public files.
 await fs.rm(destination,{recursive:true,force:true});
 for(const [relative,bytes] of result.files){const file=path.join(destination,relative);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,bytes);}
 const active=new Set(posts.map(p=>result.links.posts[p.id].number));
 for(const entry of Object.values(previous?.posts||{}))if(!active.has(entry.number))await fs.rm(path.join(shortDestination,String(entry.number)),{recursive:true,force:true});
 for(const [relative,bytes] of result.shortFiles){const file=path.join(shortDestination,relative);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,bytes);}
 return result.manifest;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const inputIndex=process.argv.indexOf('--input');
 const posts=inputIndex<0?await fetchPosts():JSON.parse(await fs.readFile(process.argv[inputIndex+1],'utf8')).posts;
 const destination=fileURLToPath(new URL('../../omise-demo/post-shares/',import.meta.url));
 const result=await writePosts(posts,destination);
 console.log('Published share pages: '+Object.keys(result.posts).length);
}
