'use strict';
(()=>{
 const dxURL='https://is.gd/G6uCmY';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 function share(box,p){
  const caption=[p.name,p.title,p.body,p.end?'掲載期間：'+p.end+'まで':'','志木なるほど お店めぐりDX\n'+dxURL].filter(Boolean).join('\n\n');
  const area=el('section',null,'post-publish post-simple-share');area.append(el('h3','SNSに投稿する'));
  const copy=el('button','文章とDXリンクをコピー','post-copy-primary');copy.type='button';
  const message=el('p','文章をSNSに貼り付け、写真を添付してください。','post-share-message');message.setAttribute('role','status');
  const fallback=el('textarea');fallback.value=caption;fallback.readOnly=true;fallback.hidden=true;fallback.rows=6;fallback.setAttribute('aria-label','コピーする投稿文');
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(caption);message.textContent='文章とDXリンクをコピーしました。SNSに貼り付けてください。';}catch(e){fallback.hidden=false;fallback.focus();fallback.select();message.textContent='この文章を長押ししてコピーしてください。';}});
  area.append(copy);
  const photos=(p.photos||[]).filter(src=>/^data:image\/jpeg;base64,/.test(src)).slice(0,4);
  const videoCover=!photos.length&&/^data:image\/jpeg;base64,/.test(p.poster||'');if(videoCover)photos.push(p.poster);
  const saves=el('div',null,'post-photo-saves');
  photos.forEach((src,i)=>{const a=el('a',(videoCover?'動画の表紙を保存':'写真を保存')+(photos.length>1?'（'+(i+1)+'枚目）':''),'post-save-photo');a.href=src;a.download='shiki-photo-'+String(p.id||'post').replace(/[^a-z0-9-]/ig,'')+'-'+(i+1)+'.jpg';saves.append(a);});
  if(photos.length)area.append(saves);else message.textContent='コピーした文章をSNSに貼り付けてください。';
  if(videoCover)area.append(el('p','保存できるのは表紙画像です。動画本体は含まれません。','post-share-message'));
  const row=el('nav',null,'post-share post-simple-networks');row.setAttribute('aria-label','投稿するSNSを開く');
  [['Facebook','https://www.facebook.com/','#0866c6'],['Instagram','https://www.instagram.com/','#a32b87'],['X','https://x.com/','#151515'],['LINE','https://line.me/R/share?text='+encodeURIComponent(caption),'#087f3e']].forEach(([label,href,color])=>{const a=el('a',label);a.href=href;a.target='_blank';a.rel='noopener';a.style.background=color;row.append(a);});
  area.append(message,fallback,row);box.append(area);
 }
 window.DXPostShare={mount:share};
})();
