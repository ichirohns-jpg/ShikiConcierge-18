'use strict';
// Activate site-origin management only after the matching Apps Script API is deployed.
(()=>{
 const endpoint='https://script.google.com/macros/s/AKfycbzMec1R3le4e-cOUyBUl6Eq2dU3OI-5HHtkEyJQT7SWx4IjUHGtW8Z3zatJxoA2GUhn2A/exec';
 const root=new URL('./',document.currentScript.src);
 const modes={edit:'owner.html',info:'owner-info.html',scenes:'owner-scenes.html'};
 let active=false,resolved=false,settle;
 const ready=new Promise(resolve=>settle=resolve);
 function source(a){try{const u=new URL(a.href);return u.origin===new URL(endpoint).origin&&u.pathname===new URL(endpoint).pathname&&Object.prototype.hasOwnProperty.call(modes,u.searchParams.get('mode'))?u:null;}catch{return null;}}
 function destination(u){const link=new URL(modes[u.searchParams.get('mode')],root);if(u.searchParams.get('kind')==='deal')link.searchParams.set('kind','deal');link.hash='top';return link.href;}
 function rewrite(){if(!active)return;document.querySelectorAll('a[href]').forEach(a=>{const u=source(a);if(u){a.href=destination(u);a.target='_self';}});}
 function complete(value){if(resolved)return;resolved=true;active=value;settle(value);rewrite();if(active)new MutationObserver(rewrite).observe(document.body,{childList:true,subtree:true});}
 window.omiseOwnerVersionLoaded=data=>complete(data?.ok===true&&data.version==='firstparty-owner-v1');
 document.addEventListener('click',async e=>{
  if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  const a=e.target.closest('a[href]'),u=a&&source(a);if(!u||resolved&&!active)return;
  e.preventDefault();a.setAttribute('aria-busy','true');const useSite=await ready;a.removeAttribute('aria-busy');location.assign(useSite?destination(u):u.href);
 });
 const script=document.createElement('script');script.src=endpoint+'?action=ownerVersion&callback=omiseOwnerVersionLoaded';script.onerror=()=>complete(false);document.head.append(script);setTimeout(()=>complete(false),12000);
})();
