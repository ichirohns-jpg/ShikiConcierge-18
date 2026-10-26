'use strict';
(()=>{
 const endpoint='https://script.google.com/macros/s/AKfycbzMec1R3le4e-cOUyBUl6Eq2dU3OI-5HHtkEyJQT7SWx4IjUHGtW8Z3zatJxoA2GUhn2A/exec';
 const base='https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/';
 const slug=location.pathname.split('/').pop();
 const ids={'ouchicafe.html':'SHOP-0001','heartnet.html':'SHOP-0002','newtimes.html':'SHOP-0003'};
 const avatarImages={'SHOP-0002':'fujiko-avatar.jpeg'};
 const article=slug==='article.html',deals=slug==='deals.html',timeline=slug==='timeline.html';
 if(!article&&!deals&&!timeline&&!ids[slug])return;
 const id=article?new URLSearchParams(location.search).get('id'):null;
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 document.body.classList.add('social-view');if(ids[slug]){document.body.classList.add('social-profile');const description=document.querySelector('#intro .subtitle')?.nextElementSibling;if(description?.tagName==='P')description.classList.add('profile-description');}
 const nav=el('nav',null,'social-nav');nav.setAttribute('aria-label','DXのメニュー');
 for(const [text,path,active] of [['お店を探す','./#shops',false],['投稿を見る','timeline.html',timeline],['特典を見る','deals.html',deals],['投稿・管理','./#owner',false]]){
  const a=el('a',text);a.href=path;if(active)a.setAttribute('aria-current','page');nav.append(a);
 }
 const main=document.querySelector('main'),header=main.querySelector(':scope > header');
 if(header)header.after(nav);else main.prepend(nav);
 let offset=0;
 const section=el('section'),bar=el('div',null,'feed-heading');
 const heading=el('h2',article?'投稿記事':deals?'お店からのお得情報':ids[slug]?'投稿':'新着の投稿');
 const status=el('p','読み込み中…','feed-status'),list=el('div'),paging=el('div',null,'feed-paging');
 section.id='posts-timeline';bar.append(heading,status);section.append(bar,list,paging);
 if(article||timeline)main.append(section);else if(deals)document.querySelector('article').prepend(section);else document.querySelector('#photos').before(section);
 const shopURL=p=>{const file=Object.keys(ids).find(f=>ids[f]===p.shop);return file?base+file+'#posts-timeline':null;};
 const pageURL=p=>base+'article.html?id='+encodeURIComponent(p.id);
 const shortDate=value=>{const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);return m?Number(m[2])+'月'+Number(m[3])+'日 '+m[4]+':'+m[5]:String(value||'');};
 function socialMark(label){
  const mark=el('span',{'コピー':'⧉','Facebook':'f','Instagram':'◎','X':'𝕏','LINE':'L'}[label]||label,'sns-mark');
  mark.setAttribute('aria-hidden','true');return mark;
 }
 let postSharePromise=null;
 const postShareURL=new URL('./post-share.js?v=20261026-text7',document.currentScript?.src||base+'posts.js').href;
 function share(box,p){
  const mount=el('div');box.append(mount);
  if(!postSharePromise)postSharePromise=new Promise((resolve,reject)=>{
   if(window.DXPostShare){resolve(window.DXPostShare);return;}
   const script=document.createElement('script');script.src=postShareURL;
   script.onload=()=>window.DXPostShare?resolve(window.DXPostShare):reject(Error('投稿機能を読み込めませんでした。'));
   script.onerror=()=>{postSharePromise=null;reject(Error('投稿機能を読み込めませんでした。ページを更新してください。'));};
   document.head.append(script);
  });
  postSharePromise.then(ui=>{if(mount.isConnected)ui.mount(mount,p);}).catch(e=>mount.append(el('p',e.message,'post-share-message')));
 }
 function render(rows){
  list.replaceChildren();
  for(const p of rows){
   const shop=shopURL(p),card=el('article',null,'post-card'),head=el('div',null,'post-header');
   const avatarImage=avatarImages[p.shop],avatar=el(shop?'a':'span',avatarImage?'':p.name.slice(0,1),'post-avatar'+(avatarImage?' has-image':''));
   if(avatarImage){const img=el('img');img.src=base+avatarImage;img.alt='';img.loading='lazy';img.decoding='async';avatar.append(img);}
   if(shop){avatar.href=shop;avatar.setAttribute('aria-label',p.name+'の投稿を見る');}else avatar.setAttribute('aria-hidden','true');
   const identity=el('div',null,'post-identity'),author=el(shop?'a':'span',p.name,'post-author');
   if(shop){author.href=shop;author.setAttribute('aria-label',p.name+'のページと投稿を見る');}
   const date=el('a',shortDate(p.date),'post-date');date.href=pageURL(p);date.setAttribute('aria-label',p.date+'の記事を開く');
   identity.append(author,date);head.append(avatar,identity,el('span',p.kind==='deal'?'お得情報':'お知らせ','post-kind'+(p.kind==='deal'?' deal':'')));
   card.append(head,el('p',p.body,'post-body'));
   const photos=(p.photos||[]).filter(src=>/^data:image\/jpeg;base64,/.test(src));
   if(photos.length){const media=el('div',null,'post-media');for(const src of photos){const img=el('img');img.src=src;img.alt=p.name+'の投稿写真';img.loading=article?'eager':'lazy';img.decoding='async';media.append(img);}card.append(media);}
   if(p.video&&/^https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]+\/preview$/.test(p.video)){
    const video=el('div',null,'post-video');
    if(p.poster&&/^data:image\/jpeg;base64,/.test(p.poster)){const poster=el('img');poster.src=p.poster;poster.alt='動画の表紙';video.append(poster);}
    const play=el('button','▶ 動画を見る');play.type='button';play.onclick=()=>{const frame=el('iframe');frame.src=p.video;frame.title=p.name+'の投稿動画';frame.allowFullscreen=true;video.replaceChildren(frame);};video.append(play);card.append(video);
   }
   if(p.end)card.append(el('p',p.end+'まで','post-end'));
   const links=el('div',null,'post-links');
   if(!article){const detail=el('a','この記事を開く');detail.href=pageURL(p);links.append(detail);}
   if(shop){const profile=el('a','お店の紹介・場所を見る →');profile.href=shop;profile.setAttribute('aria-label','志木なるほどDXはこちら：'+p.name+'の紹介ページ');links.append(profile);}
   card.append(links);share(card,p);list.append(card);
  }
 }
 function load(){
  paging.replaceChildren();status.textContent='読み込み中…';
  const callback='omPosts'+Math.random().toString(36).slice(2),script=document.createElement('script');
  let settled=false;const cleanup=()=>{script.remove();delete window[callback];};
  window[callback]=data=>{
   settled=true;cleanup();if(!data?.ok){status.textContent='読み込めませんでした。';return;}
   const rows=data.posts||[],total=data.total||0;render(rows);
   status.textContent=article?(rows.length?'':'掲載が終了しているか、公開前です。'):!total?'公開された投稿はまだありません。':offset?'過去の投稿 '+(offset+1)+'〜'+Math.min(offset+10,total)+'件':'最新'+Math.min(10,total)+'件';
   if(article&&rows[0])document.title=rows[0].body.split('\n')[0].slice(0,60)+'｜お店めぐりDX';
   if(location.hash==='#posts-timeline')section.scrollIntoView();
   if(!article){
    if(offset){const back=el('button','最新の投稿に戻る','btn secondary');back.onclick=()=>{offset=0;load();};paging.append(back);}
    if(offset+10<total){const older=el('button','過去の投稿を見る','btn secondary');older.onclick=()=>{offset+=10;load();section.scrollIntoView();};paging.append(older);}
   }
  };
  script.onerror=()=>{settled=true;cleanup();status.textContent='読み込めませんでした。';};
  const params=new URLSearchParams({action:'posts',callback,offset:String(offset)});
  if(ids[slug])params.set('shop',ids[slug]);if(deals)params.set('kind','deal');if(id)params.set('id',id);
  script.src=endpoint+'?'+params;document.head.append(script);
  setTimeout(()=>{if(!settled){cleanup();status.textContent='読み込みに時間がかかっています。ページを更新してください。';}},20000);
 }
 if(article&&!/^POST-[a-f0-9-]+$/i.test(id||'')){status.textContent='記事が指定されていません。';return;}
 load();
})();

