'use strict';
(()=>{
 const fujikoSharing=document.createElement('script');fujikoSharing.src='https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/fujiko-share-locations.js?v=20261028-card14';document.head.append(fujikoSharing);
 if(document.querySelector('.dx-global-nav'))return;
 const file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
 const routes={
  'ouchicafe.html':{back:'./#shops',backText:'← お店一覧',current:'おうちcafeパン工房',active:'shops'},
  'heartnet.html':{back:'./#shops',backText:'← お店一覧',current:'ハートネット志木',active:'shops'},
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
 const route=routes[file]||{active:location.hash==='#shops'?'shops':'home'};
 const main=document.querySelector('main')||document.body;
 if(route.back){
  const locationBar=document.createElement('nav');
  locationBar.className='dx-route';
  locationBar.setAttribute('aria-label','現在地と戻り先');
  const back=document.createElement('a');back.href=route.back;back.textContent=route.backText;
  const current=document.createElement('span');current.className='dx-route-current';current.textContent='現在：'+route.current;
  locationBar.append(back,current);main.prepend(locationBar);
 }
 const nav=document.createElement('nav');nav.className='dx-global-nav';nav.setAttribute('aria-label','お店めぐりDX 共通メニュー');
 const items=[
  ['home','⌂ トップ','./'],
  ['shops','お店を探す','./#shops'],
  ['posts','投稿を見る','./timeline.html'],
  ['deals','お得情報','./deals.html']
 ];
 for(const [key,label,href] of items){
  const link=document.createElement('a');link.href=href;link.textContent=label;
  if(route.active===key)link.setAttribute('aria-current','page');
  nav.append(link);
 }
 document.body.append(nav);
 if(file==='index.html')window.addEventListener('hashchange',()=>{const active=location.hash==='#shops'?'shops':'home';for(const [i,a] of Array.from(nav.children).entries()){if(items[i][0]===active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}});
})();


