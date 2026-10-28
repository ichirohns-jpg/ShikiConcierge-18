'use strict';
(()=>{
 const root='https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/';
 const mounted=new WeakSet();
 let loading=null,queued=false;
 function candidate(){try{const a=JSON.parse(localStorage.getItem('shiki-merchant-session-v1')||'null');return ['ADMIN','SHOP-0002'].includes(a?.id)&&Number.isFinite(a.expiresAt)&&a.expiresAt>Date.now();}catch{return false;}}
 function load(){if(window.DXPostShare)return Promise.resolve(window.DXPostShare);if(loading)return loading;loading=new Promise((resolve,reject)=>{let script=[...document.scripts].find(s=>s.src.startsWith(root+'post-share.js'));if(!script){script=document.createElement('script');script.src=root+'post-share.js?v=20261028-fujiko-copy4';document.head.append(script);}script.addEventListener('load',()=>window.DXPostShare?resolve(window.DXPostShare):reject(Error('Unavailable')),{once:true});script.addEventListener('error',()=>reject(Error('Unavailable')),{once:true});}).catch(e=>{loading=null;throw e;});return loading;}
 function sharedPost(node){const line=[...node.querySelectorAll('a[href]')].find(a=>{try{return new URL(a.href).hostname==='line.me';}catch{return false;}});let text='',url='';if(line)try{text=new URL(line.href).searchParams.get('text')||'';}catch{}
 const urlMatch=text.match(/https?:\/\/[^\s]+$/);if(urlMatch){url=urlMatch[0];text=text.slice(0,urlMatch.index).trim();}
 if(!url)url=document.querySelector('link[rel="canonical"]')?.href||location.origin+location.pathname;
 return {name:document.querySelector('h1')?.textContent||'志木のお店・活動',body:text||document.querySelector('.post-body')?.textContent||document.querySelector('meta[name="description"]')?.content||'',shareURL:url,kind:'deal'};
 }
 async function scan(){if(!candidate())return;const groups=[...document.querySelectorAll('.article-sharing,.simple-sns-share,section.share')].filter(n=>!n.closest('.post-simple-share'));const primary=document.querySelector('#intro .primary');if(primary&&!mounted.has(primary))groups.push(primary);const pending=groups.filter(n=>!mounted.has(n));if(!pending.length)return;let ui;try{ui=await load();}catch{return;}for(const node of pending){if(!node.isConnected||mounted.has(node))continue;mounted.add(node);if(node===primary){ui.shortcut(node);continue;}const mount=document.createElement('div');mount.className='fujiko-extra-sharing';node.append(mount);ui.mount(mount,sharedPost(node),{privateOnly:true});}}
 function queue(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;scan();});}
 new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('storage',queue);window.addEventListener('focus',queue);
 scan();
})();
