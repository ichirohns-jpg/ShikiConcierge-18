'use strict';
(()=>{
 const root='https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/';
 const mounted=new WeakSet();
 let loading=null,queued=false;
 function candidate(){try{const a=JSON.parse(localStorage.getItem('shiki-merchant-session-v1')||'null');return ['ADMIN','SHOP-0002'].includes(a?.id)&&Number.isFinite(a.expiresAt)&&a.expiresAt>Date.now();}catch{return false;}}
 function load(){if(window.DXPostShare)return Promise.resolve(window.DXPostShare);if(loading)return loading;loading=new Promise((resolve,reject)=>{let script=[...document.scripts].find(s=>s.src.startsWith(root+'post-share.js'));if(!script){script=document.createElement('script');script.src=root+'post-share.js?v=20261030-line-web-share';document.head.append(script);}script.addEventListener('load',()=>window.DXPostShare?resolve(window.DXPostShare):reject(Error('Unavailable')),{once:true});script.addEventListener('error',()=>reject(Error('Unavailable')),{once:true});}).catch(e=>{loading=null;throw e;});return loading;}
 function sharedPost(node){
  const links=[...node.querySelectorAll('a[href]')].filter(a=>!a.closest('.post-simple-share')); let text='',url=node.dataset.shareUrl||'';
  for(const a of links)try{const u=new URL(a.href);if(u.hostname==='line.me'){if(u.pathname.startsWith('/R/share'))text=u.searchParams.get('text')||text;else if(u.pathname.startsWith('/R/msg/text/'))text=decodeURIComponent(u.search.slice(1))||text;}if(!url&&/(^|\.)facebook\.com$/.test(u.hostname)&&u.pathname.includes('/sharer'))url=u.searchParams.get('u')||'';}catch{}
  text=node.dataset.shareText||text;
  const urls=text.match(/https?:\/\/[^\s]+/g)||[];
  if(!url)url=urls.find(u=>u.startsWith(root)||u.startsWith(root.replace('omise-demo/','p/')))||urls.at(-1)||document.querySelector('link[rel="canonical"]')?.href||location.origin+location.pathname;
  if(text.endsWith(url))text=text.slice(0,-url.length).trim();
  return {name:node.dataset.shareName||document.querySelector('.shop-name,.shop,#intro h1')?.textContent||document.querySelector('h1')?.textContent||'志木のお店・活動',body:text||document.querySelector('.post-body')?.textContent||document.querySelector('meta[name="description"]')?.content||'',shareURL:url,kind:node.dataset.shareKind||'deal',end:node.dataset.shareEnd||''};
 }
 async function scan(){if(!candidate())return;for(const a of document.querySelectorAll('a[href]')){if(a.closest('.news-sharing,.post-simple-share,.article-sharing,.simple-sns-share,.share,[data-dx-share],#intro .primary,#share'))continue;let u;try{u=new URL(a.href);}catch{continue;}if(!((u.hostname==='line.me'&&/^\/R\/(share|msg\/text)/.test(u.pathname))||(['x.com','twitter.com'].includes(u.hostname)&&u.pathname==='/intent/tweet')||(/(^|\.)facebook\.com$/.test(u.hostname)&&u.pathname.includes('/sharer'))))continue;const wrapper=document.createElement('div');wrapper.setAttribute('data-dx-share','');a.before(wrapper);wrapper.append(a);}const groups=[...document.querySelectorAll('.article-sharing,.simple-sns-share,.share,[data-dx-share]')].filter(n=>!n.closest('.news-sharing,.post-simple-share')&&!n.parentElement?.closest('.article-sharing,.simple-sns-share,.share,[data-dx-share]'));const primary=document.querySelector('#intro .primary');if(primary&&!mounted.has(primary))groups.push(primary);const pending=groups.filter(n=>!mounted.has(n));if(!pending.length)return;let ui;try{ui=await load();}catch{return;}for(const node of pending){if(!node.isConnected||mounted.has(node))continue;mounted.add(node);if(node===primary){ui.shortcut(node);continue;}ui.mount(node,sharedPost(node),{privateOnly:true,replaceExisting:true,profile:node.dataset.shareKind==='profile',readPost:()=>sharedPost(node)});}}
 function queue(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;scan();});}
 new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('storage',queue);window.addEventListener('focus',queue);
 scan();
})();


