import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const SITE='https://ichirohns-jpg.github.io/ShikiConcierge-18/';
const API='https://script.google.com/macros/s/AKfycbzMec1R3le4e-cOUyBUl6Eq2dU3OI-5HHtkEyJQT7SWx4IjUHGtW8Z3zatJxoA2GUhn2A/exec';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function jpegSize(bytes){if(bytes[0]!==255||bytes[1]!==216)throw Error('Expected JPEG');let i=2;while(i<bytes.length){if(bytes[i++]!==255)continue;while(bytes[i]===255)i++;const marker=bytes[i++];if(marker===0xd9||marker===0xda)break;if(marker===0xd8||marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;const length=bytes.readUInt16BE(i);if(length<2||i+length>bytes.length)throw Error('Invalid JPEG');if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return {height:bytes.readUInt16BE(i+3),width:bytes.readUInt16BE(i+5)};i+=length;}throw Error('JPEG dimensions missing');}
export function compileShop(shop,live,bytes){
 if(!/^SHOP-[0-9]{4}$/.test(shop.id)||!live||live.ok!==true)throw Error('Invalid shop snapshot');
 const scene=live.scenes?.[0]||shop.images?.[0],source=scene?.src||shop.photo;
 const dimensions=jpegSize(bytes);if(dimensions.width<200||dimensions.height<200)throw Error('Share image too small');
 const name=live.shop?.['店名']||shop.name,body=live.shop?.['紹介文']||shop.description;
 const description=body+(scene?.illustration?'（画像は活動紹介用イメージです）':'');
 const imageHash=createHash('sha256').update(bytes).digest('hex').slice(0,12);
 const revision=createHash('sha256').update(JSON.stringify({name,description,imageHash,alt:scene?.alt||name})).digest('hex').slice(0,12);
 const number=Number(shop.id.slice(5)),relative='s/'+number+'/'+revision;
 const url=SITE+relative+'/',target=SITE+'omise-demo/'+shop.slug+'.html#top';
 let image;if(source.startsWith('data:image/jpeg;base64,'))image=url+'image.jpg';else{const u=new URL(source,SITE+'omise-demo/');if(u.protocol!=='https:'||u.hostname!=='ichirohns-jpg.github.io')throw Error('Unapproved image host');u.searchParams.set('v',imageHash);image=u.href;}
 const alt=scene?.alt||name;
 const html='<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(name)+'｜志木なるほど お店めぐりDX</title><link rel="canonical" href="'+url+'"><meta name="description" content="'+esc(description)+'"><meta property="og:type" content="website"><meta property="og:locale" content="ja_JP"><meta property="og:site_name" content="志木なるほど お店めぐりDX"><meta property="og:url" content="'+url+'"><meta property="og:title" content="'+esc(name)+'"><meta property="og:description" content="'+esc(description)+'"><meta property="og:image" content="'+esc(image)+'"><meta property="og:image:secure_url" content="'+esc(image)+'"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="'+dimensions.width+'"><meta property="og:image:height" content="'+dimensions.height+'"><meta property="og:image:alt" content="'+esc(alt)+'"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+esc(name)+'"><meta name="twitter:description" content="'+esc(description)+'"><meta name="twitter:image" content="'+esc(image)+'"><meta name="twitter:image:alt" content="'+esc(alt)+'"></head><body><main><h1>'+esc(name)+'</h1><p>'+esc(description)+'</p><a href="'+target+'"><img src="'+esc(image)+'" alt="'+esc(alt)+'" style="max-width:100%;height:auto">お店の紹介を一番上から見る</a></main><script>location.replace('+JSON.stringify(target)+');</script></body></html>\n';
 return {relative,url,html,source,inline:source.startsWith('data:'),image:{src:image,alt,...dimensions},name,description};
}
export function updateMetadata(html,result){
 const tags={'og:title':result.name,'og:description':result.description,'og:image':result.image.src,'og:image:secure_url':result.image.src,'og:image:type':'image/jpeg','og:image:width':result.image.width,'og:image:height':result.image.height,'og:image:alt':result.image.alt,'twitter:title':result.name,'twitter:description':result.description,'twitter:image':result.image.src,'twitter:image:alt':result.image.alt};
 for(const [key,value] of Object.entries(tags)){const attribute=key.startsWith('twitter:')?'name':'property',pattern=new RegExp('<meta '+attribute+'="'+key+'"[^>]*>','g'),tag='<meta '+attribute+'="'+key+'" content="'+esc(value)+'">';html=pattern.test(html)?html.replace(pattern,()=>tag):html.replace('</head>',tag+'</head>');}
 return html;
}
async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error('Public share source HTTP '+r.status);return r;}
export async function build(root,snapshots){
 const directory=path.join(root,'omise-demo'),data=JSON.parse(await fs.readFile(path.join(directory,'shops.json'),'utf8'));
 const oldMap=await fs.readFile(path.join(directory,'short-links.js'),'utf8'),links=JSON.parse(oldMap.slice(oldMap.indexOf('{'),oldMap.lastIndexOf('}')+1));
 // Fetch and validate every input before writing any public file.
 const rows=await Promise.all(data.shops.map(async shop=>{
  const live=snapshots?JSON.parse(await fs.readFile(path.join(snapshots,shop.id+'.json'),'utf8')):await(await get(API+'?action=merchantPublic&shop='+shop.id)).json();
  const scene=live.scenes?.[0]||shop.images?.[0],source=scene?.src||shop.photo;
  let bytes;if(snapshots)bytes=await fs.readFile(path.join(snapshots,shop.id+'.jpg'));else if(source.startsWith('data:image/jpeg;base64,'))bytes=Buffer.from(source.slice(source.indexOf(',')+1),'base64');else{const u=new URL(source,SITE+'omise-demo/');if(u.protocol!=='https:'||u.hostname!=='ichirohns-jpg.github.io')throw Error('Unapproved image source');bytes=Buffer.from(await(await get(u)).arrayBuffer());}
  if(bytes.length>10000000)throw Error('Image is too large');
  const result=compileShop(shop,live,bytes),html=await fs.readFile(path.join(directory,shop.slug+'.html'),'utf8');
  return {shop,result,bytes,html:updateMetadata(html,result)};
 }));
 const manifest={version:1,shops:{}};
 for(const {shop,result,bytes,html} of rows){const folder=path.join(root,result.relative);await fs.mkdir(folder,{recursive:true});await fs.writeFile(path.join(folder,'index.html'),result.html);if(result.inline)await fs.writeFile(path.join(folder,'image.jpg'),bytes);await fs.writeFile(path.join(directory,shop.slug+'.html'),html);links[SITE+'omise-demo/'+shop.slug+'.html']=result.url;shop.shareURL=result.url;shop.shareImage=result.image;manifest.shops[shop.id]={shareURL:result.url,image:result.image.src};}
 await fs.writeFile(path.join(directory,'shops.json'),JSON.stringify(data,null,2)+'\n');
 await fs.writeFile(path.join(directory,'short-links.js'),"'use strict';\nwindow.DXShortLinks=Object.freeze("+JSON.stringify(links,null,2)+");\n");
 await fs.writeFile(path.join(directory,'shop-share-links.json'),JSON.stringify(manifest,null,2)+'\n');
 return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const root=fileURLToPath(new URL('../../',import.meta.url)),i=process.argv.indexOf('--snapshots');const result=await build(root,i>=0?process.argv[i+1]:undefined);console.log('Published shop share cards: '+Object.keys(result.shops).length);}
