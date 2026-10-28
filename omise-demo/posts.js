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
 document.body.classList.add('social-view');if(ids[slug]){document.body.classList.add('social-profile');const description=document.querySelector('#intro .profile-description')||document.querySelector('#intro .subtitle')?.nextElementSibling;if(description?.tagName==='P')description.classList.add('profile-description');}
 const nav=el('nav',null,'social-nav');nav.setAttribute('aria-label','DXのメニュー');
 for(const [text,path,active] of [['お店を探す','./#shops',false],['投稿を見る','timeline.html',timeline],['お得情報','deals.html',deals],['投稿・管理','./#owner',false]]){
  const a=el('a',text);a.href=path;if(active)a.setAttribute('aria-current','page');nav.append(a);
 }
 const main=document.querySelector('main'),header=main.querySelector(':scope > header');
 if(header)header.after(nav);else main.prepend(nav);
 const continuous=deals||timeline;
 let offset=0,loading=false,moreObserver=null;
 const shown=new Map(),seen=new Set();
 let returnState=null,returnKey='',loadedThrough=0;
 if(continuous)try{
  const state=window.history.state&&typeof window.history.state==='object'?window.history.state:{};
  returnKey=state.dxFeedKey||'dx-feed-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  if(!state.dxFeedKey)window.history.replaceState({...state,dxFeedKey:returnKey},'');
  if(window.performance?.getEntriesByType('navigation')[0]?.type==='back_forward'){
   const saved=JSON.parse(sessionStorage.getItem(returnKey)||'null');
   if(saved&&saved.url===location.pathname+location.search&&Number.isInteger(saved.count)&&saved.count>0&&saved.count<=10000&&Number.isFinite(saved.y)&&Number.isFinite(saved.time)&&Date.now()-saved.time<7200000)returnState=saved;
  }
  window.addEventListener('pagehide',()=>{
   let anchor='',top=0;
   for(const [key,{card}] of shown){const rect=card.getBoundingClientRect();if(rect.bottom>0){anchor=key;top=rect.top;break;}}
   try{sessionStorage.setItem(returnKey,JSON.stringify({url:location.pathname+location.search,count:loadedThrough,y:window.scrollY,anchor,top,time:Date.now()}));}catch{}
  });
 }catch{}
 async function restorePosition(saved){
  const images=[...list.querySelectorAll('img')];
  await Promise.race([Promise.all(images.map(img=>typeof img.decode==='function'?img.decode().catch(()=>{}):Promise.resolve())),new Promise(resolve=>setTimeout(resolve,2000))]);
  if(postSharePromise)await postSharePromise.catch(()=>{});
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const anchor=shown.get(saved.anchor)?.card;
  const y=anchor?window.scrollY+anchor.getBoundingClientRect().top-(Number(saved.top)||0):saved.y;
  window.scrollTo({top:Math.max(0,y),behavior:'auto'});
 }
 const ended=p=>p.ended===true||(/^\d{4}-\d{2}-\d{2}$/.test(p.end||'')&&p.end<new Date(Date.now()+32400000).toISOString().slice(0,10));
 const section=el('section'),bar=el('div',null,'feed-heading');
 const heading=el('h2',article?'投稿記事':deals?'お得情報の投稿':ids[slug]?'投稿':'新着の投稿');
 const status=el('p','読み込み中…','feed-status'),list=el('div'),paging=el('div',null,'feed-paging');
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 section.id='posts-timeline';bar.append(heading,status);section.append(bar,list,paging);
 if(deals)(document.querySelector('#deals-feed')||main).append(section);else if(article||timeline)main.append(section);else document.querySelector('#photos').before(section);
 const shopURL=p=>{const file=Object.keys(ids).find(f=>ids[f]===p.shop);return file?base+file:/^SHOP-[\w-]+$/.test(p.shop||'')?base+'?shop='+encodeURIComponent(p.shop)+'#detail':null;};
 const pageURL=p=>base+'article.html?id='+encodeURIComponent(p.id);
 const shortDate=value=>{const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);return m?Number(m[2])+'月'+Number(m[3])+'日 '+m[4]+':'+m[5]:String(value||'');};
 function socialMark(label){
  const mark=el('span',{'コピー':'⧉','Facebook':'f','Instagram':'◎','X':'𝕏','LINE':'L'}[label]||label,'sns-mark');
  mark.setAttribute('aria-hidden','true');return mark;
 }
 let postSharePromise=null;
 const postShareURL=new URL('./post-share.js?v=20261028-fujiko-copy4',document.currentScript?.src||base+'posts.js').href;
 function share(box,p,options){
  const mount=el('div');box.append(mount);
  if(!postSharePromise)postSharePromise=new Promise((resolve,reject)=>{
   if(window.DXPostShare){resolve(window.DXPostShare);return;}
   const existing=[...document.scripts].find(s=>s.src===postShareURL);if(existing){existing.addEventListener('load',()=>window.DXPostShare?resolve(window.DXPostShare):reject(Error('共有機能を読み込めませんでした。')),{once:true});existing.addEventListener('error',()=>{existing.remove();postSharePromise=null;reject(Error('共有機能を読み込めませんでした。'));},{once:true});return;}
   const script=document.createElement('script');script.src=postShareURL;
   script.onload=()=>window.DXPostShare?resolve(window.DXPostShare):reject(Error('投稿機能を読み込めませんでした。'));
   script.onerror=()=>{postSharePromise=null;reject(Error('投稿機能を読み込めませんでした。ページを更新してください。'));};
   document.head.append(script);
  });
  postSharePromise.then(ui=>{if(mount.isConnected)ui.mount(mount,p,options);}).catch(e=>mount.append(el('p',e.message,'post-share-message')));
 }
 // The extra profile sharing area stays hidden unless ADMIN authentication succeeds.
 if(ids[slug]&&document.querySelector('#share')){
  const readProfile=()=>{const name=document.querySelector('#intro h1')?.textContent||document.querySelector('h1')?.textContent||'';let body=document.querySelector('#shareText')?.value||document.querySelector('#intro .profile-description')?.textContent||'';body=body.split('\n\n【詳しい紹介】')[0];if(body.startsWith(name+'をご紹介！'))body=body.slice((name+'をご紹介！').length).trim();return {name,body};};
  const p={...readProfile(),shareURL:window.DXShortLinks?.[base+slug]||base+slug+'#top'};
  share(document.querySelector('#share'),p,{privateOnly:true,profile:true,readProfile});
 }
 function cafeAdCard(){
  const card=el('article',null,'post-card cafe-ad-card'),head=el('div',null,'post-header');
  const avatar=el('a','お','post-avatar');avatar.href=base+'ouchicafe.html';avatar.setAttribute('aria-label','おうちcafeパン工房のページを見る');
  const identity=el('div',null,'post-identity'),author=el('a','おうちcafeパン工房','post-author');author.href=base+'ouchicafe.html';
  identity.append(author,el('span','広告イメージの見本','post-date'));
  head.append(avatar,identity,el('span','お知らせ','post-kind'));
  const body=el('p','焼きたてパンとコーヒーで、ほっとひと息。\n志木市本町のパン工房です。','post-body');
  const media=el('a',null,'post-media');media.href=base+'ouchicafe.html';media.setAttribute('aria-label','おうちcafeパン工房の店舗情報を見る');
  const image=el('img');image.src=base+'ouchicafe-ad-post-v1.jpg';image.alt='おうちcafeパン工房の広告見本。焼きたてパンとコーヒーで、ほっとひと息。';image.loading='eager';image.decoding='async';media.append(image);
  const links=el('div',null,'post-links'),profile=el('a','お店の紹介・場所を見る →');profile.href=base+'ouchicafe.html';links.append(profile);
  const note=el('p','実際の写真をもとに作った広告イメージです。','post-ad-note');
  card.append(head,body,media,links,note);
  share(card,{title:'おうちcafeパン工房',body:'焼きたてパンとコーヒーで、ほっとひと息。\n志木市本町のパン工房です。',shareURL:base+'ouchicafe-ad-share-v2.html'});
  return card;
 }
 function render(rows,append=false){
  if(!append){list.replaceChildren();shown.clear();seen.clear();}
  if(!append&&slug==='ouchicafe.html'&&offset===0)list.append(cafeAdCard());
  for(const p of rows){
   if(ended(p)||seen.has(p.id))continue;
   seen.add(p.id);
   const shop=shopURL(p),card=el('article',null,'post-card'),head=el('div',null,'post-header');
   const avatarImage=avatarImages[p.shop],avatar=el(shop?'a':'span',avatarImage?'':p.name.slice(0,1),'post-avatar'+(avatarImage?' has-image':''));
   if(avatarImage){const img=el('img');img.src=base+avatarImage;img.alt='';img.loading='lazy';img.decoding='async';avatar.append(img);}
   if(shop){avatar.href=shop;avatar.setAttribute('aria-label',p.name+'のトップページを見る');}else avatar.setAttribute('aria-hidden','true');
   const identity=el('div',null,'post-identity'),author=el(shop?'a':'span',p.name,'post-author');
   if(shop){author.href=shop;author.setAttribute('aria-label',p.name+'のトップページを見る');}
   const date=el('a',shortDate(p.date),'post-date');date.href=pageURL(p);date.setAttribute('aria-label',p.date+'の記事を開く');
   identity.append(author,date);head.append(avatar,identity,el('span',p.kind==='deal'?'お得情報':'お知らせ','post-kind'+(p.kind==='deal'?' deal':'')));
   card.append(head,el('p',p.body,'post-body'));
   const photos=(p.photos||[]).filter(src=>/^data:image\/jpeg;base64,/.test(src));
   if(photos.length){const media=el(article?'div':'a',null,'post-media');if(!article){media.href=pageURL(p);media.setAttribute('aria-label',p.name+'の投稿記事を開く');}for(const src of photos){const img=el('img');img.src=src;img.alt=p.name+'の投稿写真';img.loading=article||returnState?'eager':'lazy';img.decoding='async';media.append(img);}card.append(media);}
   if(p.video&&/^https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]+\/preview$/.test(p.video)){
    const video=el('div',null,'post-video');
    if(p.poster&&/^data:image\/jpeg;base64,/.test(p.poster)){const poster=el('img');poster.src=p.poster;poster.alt='動画の表紙';video.append(poster);}
    const play=el('button','▶ 動画を見る');play.type='button';play.onclick=()=>{const frame=el('iframe');frame.src=p.video;frame.title=p.name+'の投稿動画';frame.allowFullscreen=true;video.replaceChildren(frame);};video.append(play);card.append(video);
   }
   if(p.end)card.append(el('p',p.end+'まで','post-end'));
   const links=el('div',null,'post-links');
   if(!article){const detail=el('a','この記事を開く');detail.href=pageURL(p);links.append(detail);}
   if(shop){const profile=el('a','お店の紹介・場所を見る →');profile.href=shop;profile.setAttribute('aria-label',p.name+'のトップページを見る');links.append(profile);}
   card.append(links);share(card,p);list.append(card);shown.set(p.id,{p,card});
  }
 }
 function pruneEnded(){
  let removed=false;
  for(const [key,{p,card}] of shown)if(ended(p)){card.remove();shown.delete(key);removed=true;}
  if(removed)status.textContent=article?'掲載が終了しました。':shown.size?shown.size+'件表示中':deals?'公開中のお得情報はまだありません。':'公開された投稿はまだありません。';
 }
 function load({append=false,nextOffset=offset}={}){
  if(loading)return;
  loading=true;
  if(moreObserver){moreObserver.disconnect();moreObserver=null;}
  paging.replaceChildren();status.textContent='読み込み中…';
  const callback='omPosts'+Math.random().toString(36).slice(2),script=document.createElement('script');
  let settled=false,timer;
  const cleanup=()=>{clearTimeout(timer);script.remove();delete window[callback];};
  const fail=message=>{
   if(settled)return;settled=true;cleanup();loading=false;status.textContent=message;
   const retry=el('button','もう一度読み込む','btn secondary');retry.type='button';retry.onclick=()=>load({append,nextOffset});paging.append(retry);
  };
  window[callback]=data=>{
   if(settled)return;
   if(data?.ok!==true||!Array.isArray(data.posts)||!Number.isInteger(data.total)||data.total<0||(!data.posts.length&&nextOffset<data.total)){fail('読み込めませんでした。もう一度お試しください。');return;}
   settled=true;cleanup();loading=false;offset=nextOffset;
   const rows=data.posts,total=data.total;loadedThrough=offset+rows.length;render(rows,append);
   status.textContent=article?(shown.size?'':'掲載が終了しているか、公開前です。'):!shown.size?(deals?'公開中のお得情報はまだありません。':'公開された投稿はまだありません。'):continuous?shown.size+'件表示中':offset?'過去の投稿 '+(offset+1)+'〜'+Math.min(offset+10,total)+'件':'最新'+Math.min(10,total)+'件';
   if(article&&rows[0])document.title=rows[0].body.split('\n')[0].slice(0,60)+'｜お店めぐりDX';
   if(!append&&location.hash==='#posts-timeline')section.scrollIntoView();
   const finishPaging=()=>{if(!article){
    if(!continuous&&offset){const back=el('button','最新の投稿に戻る','btn secondary');back.onclick=()=>load({nextOffset:0});paging.append(back);}
    if(rows.length&&offset+rows.length<total){
     const older=el('button',continuous?'続きを見る':'過去の投稿を見る','btn secondary');older.type='button';
     const next=()=>{load({append:continuous,nextOffset:offset+rows.length});if(!continuous)section.scrollIntoView();};
     older.onclick=next;paging.append(older);
     if(continuous&&'IntersectionObserver' in window){moreObserver=new IntersectionObserver(entries=>{if(older.isConnected&&entries.some(entry=>entry.isIntersecting)&&!loading)next();},{rootMargin:'300px 0px'});moreObserver.observe(older);}
    }
   }};
   if(returnState){
    if(rows.length&&loadedThrough<Math.min(returnState.count,total)){load({append:true,nextOffset:loadedThrough});return;}
    const saved=returnState;returnState=null;
    restorePosition(saved).catch(()=>{}).finally(finishPaging);
   }else finishPaging();
  };
  script.onerror=()=>fail('読み込めませんでした。もう一度お試しください。');
  const params=new URLSearchParams({action:'posts',callback,offset:String(nextOffset)});
  if(ids[slug])params.set('shop',ids[slug]);if(deals)params.set('kind','deal');if(id)params.set('id',id);
  script.src=endpoint+'?'+params;document.head.append(script);
  timer=setTimeout(()=>fail('読み込みに時間がかかっています。もう一度お試しください。'),20000);
 }
 if(article&&!/^POST-[a-f0-9-]+$/i.test(id||'')){status.textContent='記事が指定されていません。';return;}
 load();
 setInterval(pruneEnded,30000);
 window.addEventListener('focus',pruneEnded);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)pruneEnded();});
})();


