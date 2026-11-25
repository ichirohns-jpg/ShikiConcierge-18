'use strict';
(()=>{
 const file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
 const fujikoSharing=document.createElement('script');fujikoSharing.src='https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/fujiko-share-locations.js?v=20261119-private2';document.head.append(fujikoSharing);
 if(document.querySelector('.dx-global-nav'))return;
 // Keep the publisher entrance reachable while reading any public page.
 if(file!=='fujiko-news.html'&&!document.querySelector('.dx-editor-toolbar')){
  const toolbar=document.createElement('nav');toolbar.className='dx-editor-toolbar';toolbar.setAttribute('aria-label','ページ上部の共通メニュー');
  const directory=document.createElement('a');directory.href=new URL('./#shops',document.currentScript.src).href;directory.textContent='← お店一覧';directory.className='dx-directory-link';toolbar.append(directory);
  const editor=document.createElement('a');editor.href=new URL('./owner.html#top',document.currentScript.src).href;editor.textContent='投稿・編集';editor.setAttribute('aria-label','お店・活動の投稿と編集を開く');
  toolbar.append(editor);document.body.prepend(toolbar);
 }
 const routes={
  'ohtaka.html':{back:'./#shops',backText:'← お店一覧',current:'蕎麦処 大鷹',active:'shops'},
  'ouchicafe.html':{back:'./#shops',backText:'← お店一覧',current:'おうちcafeパン工房',active:'shops'},
  'heartnet.html':{back:'./#shops',backText:'← お店一覧',current:'ハートネット志木',active:'shops'},
  'fujiko-news.html':{back:'./#fujiko',backText:'← DXトップ',current:'ふじこからのお知らせ',active:'home'},
  'fujiko.html':{back:'./#shops',backText:'← お店一覧',current:'ふじこの紹介',active:'home'},
  'heartnet-fujiko-goods.html':{back:'./heartnet.html#fujiko-goods',backText:'← ハートネット志木',current:'ふじこグッズ',active:'shops'},
  'fujiko-timeline.html':{back:'./heartnet.html',backText:'← ハートネット志木',current:'ふじこの応援紹介',active:'posts'},
  'cheer-archive.html':{back:'./heartnet.html',backText:'← ハートネット志木',current:'過去の応援紹介',active:'posts'},
  'newtimes.html':{back:'./#shops',backText:'← お店一覧',current:'ニュータイムス社',active:'shops'},
  'timeline.html':{back:'./',backText:'← DXトップ',current:'みんなの投稿',active:'posts'},
  'article.html':{back:'./timeline.html',backText:'← 投稿一覧',current:'投稿記事',active:'posts'},
  'cafe-benefit-card.html':{back:'./ouchicafe.html',backText:'← お店へ戻る',current:'おうちcafeの特典',active:'deals'},
  'ad-maker.html':{back:'./timeline.html',backText:'← 投稿一覧',current:'SNS用の画像作成',active:'posts'},
  'deals.html':{back:'./',backText:'← DXトップ',current:'お得情報',active:'deals'},
  'benefit-shop-0001-002.html':{back:'./ouchicafe.html',backText:'← お店へ戻る',current:'おうちcafeの特典',active:'deals'},
  'benefit-shop-0002-001.html':{back:'./heartnet.html',backText:'← 活動紹介へ戻る',current:'ありがとうカード',active:'deals'},
  'cafe-benefit.html':{back:'./ouchicafe.html',backText:'← お店へ戻る',current:'おうちcafeの特典',active:'deals'},
  'cafe-benefit-link.html':{back:'./ouchicafe.html',backText:'← お店へ戻る',current:'おうちcafeの特典',active:'deals'}
 };
 const profile=document.body.classList.contains('social-profile');
 const route={...(routes[file]||(profile?{back:'./#shops',backText:'← お店一覧',current:document.querySelector('#intro h1')?.textContent||'お店の紹介',active:'shops'}:{active:location.hash==='#shops'?'shops':'home'}))};
 // Explicit return links keep the original video reachable, including the archive.
 const newsArchive=document.body.dataset.newsArchive==='1';
 if(file==='fujiko-news.html'){
  route.back=newsArchive?'./fujiko-news.html':'./#fujiko';
  route.backText=newsArchive?'最新の動画一覧に戻る':'DXトップのお知らせへ戻る';
  route.current=newsArchive?'ふじこの過去の動画':'ふじこからのお知らせ';
 }
 const originParams=new URLSearchParams(location.search);
 const newsVideo=originParams.get('video')||'';
 const newsShopFiles=['newtimes.html','ohtaka.html','heartnet.html','ouchicafe.html'];
 const fromNews=originParams.get('from')==='fujiko-news'&&newsShopFiles.includes(file)&&/^[a-zA-Z][a-zA-Z0-9_-]{0,99}$/.test(newsVideo);
 if(fromNews){
  route.back='./fujiko-news.html'+(originParams.get('archive')==='1'?'?archive=1':'')+'#'+encodeURIComponent(newsVideo);
  route.backText='見ていた動画へ戻る';
 }
 // An article reached from inside the DX returns to its explicit, safe source.
 if(file==='article.html')try{
  const ref=new URL(document.referrer),root=new URL('./',location.href);
  const parent=ref.pathname.split('/').pop();
  if(ref.origin===root.origin&&ref.pathname.startsWith(root.pathname)){
   const labels={'ohtaka.html':'← お店の紹介','timeline.html':'← 投稿一覧','deals.html':'← お得情報','ouchicafe.html':'← お店の紹介','heartnet.html':'← 活動の紹介','newtimes.html':'← お店の紹介'};
   if(labels[parent]){route.back='./'+parent;route.backText=labels[parent];}
  }
 }catch{}
 document.body.dataset.dxNavigation='20261118-navigation1';
 const main=document.querySelector('main')||document.body;
 if(route.back){
  for(const old of main.querySelectorAll(':scope > nav[aria-label="現在地"]'))old.remove();
  const locationBar=document.createElement('nav');
  locationBar.className='dx-route';
  locationBar.setAttribute('aria-label','現在地と戻り先');
  const back=document.createElement('a');back.href=route.back;back.textContent=route.backText;
  const current=document.createElement('span');current.className='dx-route-current';current.textContent='現在：'+route.current;
  locationBar.append(back,current);main.prepend(locationBar);
 }
 if(fromNews){
  const backLink=()=>{const a=document.createElement('a');a.href=route.back;a.textContent='見ていた動画へ戻る';a.className='news-origin-return';a.style.cssText='display:flex;align-items:center;justify-content:center;box-sizing:border-box;min-height:56px;padding:12px 16px;margin:12px 0;border:2px solid #531a65;border-radius:12px;background:#f4eaf7;color:#482252;font:700 18px/1.6 -apple-system,BlinkMacSystemFont,"Hiragino Kaku Gothic ProN",sans-serif;text-align:center;text-decoration:none';return a;};
  document.querySelector('#intro')?.prepend(backLink());
  const bottom=document.createElement('nav');bottom.setAttribute('aria-label','元の動画への戻り先');bottom.append(backLink());
  const related=main.querySelector('.related');if(related)related.before(bottom);else main.append(bottom);
 }
 // Keep profile actions in one consistent location, before the long imagery.
 if(profile){
  const intro=document.querySelector('#intro');
  if(intro){
   let jump=intro.querySelector('.jump');
   if(!jump){jump=document.createElement('nav');jump.className='jump';jump.setAttribute('aria-label','このページの中を見る');intro.append(jump);}
   const add=(href,label)=>{if(!jump.querySelector('a[href="'+href+'"]')){const a=document.createElement('a');a.href=href;a.textContent=label;jump.append(a);}};
   if(document.getElementById('photos'))add('#photos','写真・紹介');
   if(document.getElementById('information'))add('#information','店舗情報・SNS');
   if(document.getElementById('share'))add('#share','紹介・共有する');
   intro.querySelector('.subtitle')?.after(jump);
  }
  const related=document.querySelector('.related');
  if(related&&!related.querySelector('a[href="./#shops"]')){const a=document.createElement('a');a.href='./#shops';a.textContent='すべてのお店・活動を見る →';related.append(a);}
 }
 const nav=document.createElement('nav');nav.className='dx-global-nav';nav.setAttribute('aria-label','お店めぐりDX 共通メニュー');
 const items=[
  ['home','⌂ トップ','./'],
  ['shops','お店を探す','./#shops'],
  ['posts','みんなの投稿','./timeline.html'],
  ['deals','お得情報','./deals.html']
 ];
 for(const [key,label,href] of items){
  const link=document.createElement('a');link.href=href;link.textContent=label;
  if(key==='posts'){const text=document.createElement('span');text.className='dx-posts-label';text.append('みんなの',document.createElement('wbr'),'投稿');link.replaceChildren(text);}
  if(route.active===key)link.setAttribute('aria-current','page');
  nav.append(link);
 }
 document.body.append(nav);
 if(file==='index.html')window.addEventListener('hashchange',()=>{const active=location.hash==='#shops'?'shops':'home';for(const [i,a] of Array.from(nav.children).entries()){if(items[i][0]===active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}});
})();



