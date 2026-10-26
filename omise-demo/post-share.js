'use strict';
(()=>{
 const dxURL='https://is.gd/G6uCmY';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 let brandPromise=null;
 const brandScriptURL=new URL('./photo-brand.js?v=20261026-brand9',document.currentScript?.src||location.href).href;
 function photoBrand(){if(window.DXPhotoBrand)return Promise.resolve(window.DXPhotoBrand);if(!brandPromise)brandPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=brandScriptURL;script.onload=()=>window.DXPhotoBrand?resolve(window.DXPhotoBrand):reject(Error('画像の準備に失敗しました。'));script.onerror=()=>{script.remove();brandPromise=null;reject(Error('画像の準備に失敗しました。'));};document.head.append(script);});return brandPromise;}
 function share(box,p){
  const caption=[p.name,p.title,p.body,p.end?'掲載期間：'+p.end+'まで':'','志木なるほど お店めぐりDX\n'+dxURL].filter(Boolean).join('\n\n');
  const area=el('section',null,'post-publish post-simple-share');area.append(el('h3','SNSに投稿する'));
  const copy=el('button','① 文章とDXリンクをコピー','post-copy-primary');copy.type='button';
  const message=el('p','①文章をコピー → ②画像を保存 → ③SNSで貼り付け、保存した画像を添付。','post-share-message');message.setAttribute('role','status');
  const fallback=el('textarea');fallback.value=caption;fallback.readOnly=true;fallback.hidden=true;fallback.rows=6;fallback.setAttribute('aria-label','コピーする投稿文');
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(caption);message.textContent='コピーしました。次に画像を保存し、SNSで文章を貼り付けて画像を添付してください。';}catch(e){fallback.hidden=false;fallback.focus();fallback.select();message.textContent='この文章を長押ししてコピーしてください。';}});
  area.append(copy);
  const photos=(p.photos||[]).filter(src=>/^data:image\/jpeg;base64,/.test(src)).slice(0,4);
  const videoCover=!photos.length&&/^data:image\/jpeg;base64,/.test(p.poster||'');if(videoCover)photos.push(p.poster);
  const saves=el('div',null,'post-photo-saves');
  const savedURLs=[];
  photos.forEach((src,i)=>{
   const label=(videoCover?'② 表紙画像を保存':'② 合成画像を保存')+(photos.length>1?'（'+(i+1)+'枚目）':'');
   const a=el('a',label,'post-save-photo');a.href=src;a.download='shiki-dx-photo-'+String(p.id||'post').replace(/[^a-z0-9-]/ig,'')+'-'+(i+1)+'.jpg';
   let ready=false,building=false;
   a.addEventListener('click',async event=>{
    if(ready)return;event.preventDefault();if(building)return;building=true;a.setAttribute('aria-busy','true');a.textContent='画像を準備しています…';
    try{const maker=await photoBrand(),result=await maker.create(src),url=URL.createObjectURL(result.blob);savedURLs.push(url);a.href=url;ready=true;message.textContent='保存した画像をSNSに添付してください。文章はコピーできます。';a.click();}
    catch(e){a.href=src;ready=true;a.textContent='元の写真を保存';message.textContent='DX画像を合成できませんでした。このボタンから元の写真を保存できます。';}
    finally{building=false;a.removeAttribute('aria-busy');if(a.textContent!=='元の写真を保存')a.textContent=label;}
   });saves.append(a);
  });
  window.addEventListener('pagehide',()=>savedURLs.forEach(url=>URL.revokeObjectURL(url)),{once:true});
  if(photos.length)area.append(saves);else message.textContent='コピーした文章をSNSに貼り付けてください。';
  if(videoCover)area.append(el('p','保存できるのは表紙画像です。動画本体は含まれません。','post-share-message'));
  const row=el('nav',null,'post-share post-simple-networks');row.setAttribute('aria-label','投稿するSNSを開く');
  [['Facebook','https://www.facebook.com/','#0866c6'],['Instagram','https://www.instagram.com/','#a32b87'],['X','https://x.com/','#151515'],['LINE','https://line.me/','#087f3e']].forEach(([label,href,color])=>{const a=el('a',label);a.href=href;a.target='_blank';a.rel='noopener';a.style.background=color;row.append(a);});
  area.append(message,fallback,el('p','③ 投稿するSNSを開く','post-share-message'),row);box.append(area);
 }
 window.DXPostShare={mount:share};
})();
