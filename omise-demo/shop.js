"use strict";
// A fresh shared shop visit starts at the banner. Back/forward browsing keeps its position.
if((!location.hash||location.hash==='#top')&&performance.getEntriesByType('navigation')[0]?.type!=='back_forward'){
 let interacted=false;
 for(const name of ['pointerdown','touchstart','wheel','keydown'])window.addEventListener(name,()=>{interacted=true;},{passive:true,once:true});
 const showTop=()=>{if(!interacted)window.scrollTo({top:0,left:0,behavior:'instant'});};
 requestAnimationFrame(showTop);window.addEventListener('load',showTop,{once:true});window.addEventListener('pageshow',event=>{if(!event.persisted)showTop();});
}
const shareField=document.getElementById('shareText');
const shopCanonical=document.querySelector('link[rel="canonical"]').href;
const shopShareURL=window.DXShortLinks?.[shopCanonical]||shopCanonical.split('#')[0]+'#top';
if(shareField){shareField.value=shareField.value.split(/\n\n【詳しい紹介】|\n\n【お店の地図】/)[0]+'\n\n【詳しい紹介】\n'+shopShareURL;document.querySelectorAll('#intro a[href*="line.me/R/share"],#share a[href*="line.me/R/share"]').forEach(a=>a.href='https://line.me/R/share?text='+encodeURIComponent(shareField.value));}
function currentShareText(){
 try{const saved=JSON.parse(localStorage.getItem('shiki-merchant-session-v1')||'null');const fujiko=['ADMIN','SHOP-0002'].includes(saved?.id)&&/^DXS1\.[a-f0-9]{64}$/.test(saved?.token)&&saved.expiresAt>Date.now();
 if(!fujiko)return shareField.value;
 if(!window.DXPostShare?.profileText)throw Error('ふじこのログインを確認しています。少し待ってから、もう一度押してください。');
 return window.DXPostShare.profileText(shareField.value,document.querySelector('h1').textContent,shopShareURL);
 }catch(e){document.getElementById('copyStatus').textContent=e.message;return null;}
}
async function copyText(text){const status=document.getElementById('copyStatus');try{await navigator.clipboard.writeText(text);status.textContent='コピーしました。LINEやSNSに貼り付けて送れます。';}catch{shareField.value=text;const details=shareField.closest('details');if(details)details.open=true;shareField.focus();shareField.select();status.textContent='選択した文章を長押ししてコピーしてください。';}}
document.querySelector('[data-copy-text]').addEventListener('click',()=>{const text=currentShareText();if(text!==null)return copyText(text);});
document.querySelector('[data-copy-url]').addEventListener('click',()=>copyText(shopShareURL));
document.querySelector('[data-native-share]').addEventListener('click',async()=>{const text=currentShareText();if(text===null)return;if(!navigator.share)return copyText(text);try{await navigator.share({title:document.querySelector('h1').textContent,text});}catch(e){if(e.name!=='AbortError')await copyText(text);}});
// Recompute at the click so later public-info synchronization cannot restore the shop's wording.
 document.querySelector('main').addEventListener('click',event=>{
 const a=event.target.closest('a');if(!a||!a.closest('#intro,#share'))return;
 const href=a.getAttribute('href')||'';let destination;try{destination=new URL(href);}catch{return;}if(!((destination.hostname==='line.me'&&destination.pathname.startsWith('/R/share'))||(['x.com','twitter.com'].includes(destination.hostname)&&destination.pathname==='/intent/tweet')))return;
 const text=currentShareText();if(text===null){event.preventDefault();return;}
 if(href.includes('line.me/'))a.href='https://line.me/R/share?text='+encodeURIComponent(text);
 else a.href='https://x.com/intent/tweet?text='+encodeURIComponent(text);
 },true);
const form=document.getElementById('giftForm');
function colourSNSButtons(){for(const a of document.querySelectorAll('a.btn')){let host;try{host=new URL(a.href).hostname.toLowerCase();}catch{continue;}let colour='';if(/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(host))colour='#c90000';else if(/(^|\.)facebook\.com$/.test(host))colour='#0866c6';else if(/(^|\.)instagram\.com$/.test(host))colour='linear-gradient(115deg,#833ab4,#c52c72,#b94418)';else if(/(^|\.)twitter\.com$|(^|\.)x\.com$/.test(host))colour='#111111';else if(/(^|\.)line\.me$/.test(host))colour='#087f3e';if(colour){a.style.setProperty('background',colour,'important');a.style.setProperty('color','#ffffff','important');}}}
colourSNSButtons();
new MutationObserver(colourSNSButtons).observe(document.querySelector('main'),{childList:true,subtree:true});
if(form)form.addEventListener('submit',e=>{e.preventDefault();const input=document.getElementById('giftCode');const status=document.getElementById('giftStatus');if(input.value.normalize('NFKC').replace(/\s/g,'')!=='ふじこ'){status.textContent='合言葉は「ふじこ」です。もう一度入力してね。';input.focus();return;}document.getElementById('gift').hidden=false;status.textContent='合言葉、正解！ありがとうカードを受け取れました。';document.getElementById('giftTitle').focus();});

