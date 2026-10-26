"use strict";
const shareField=document.getElementById('shareText');
const shopCanonical=document.querySelector('link[rel="canonical"]').href;
const shopShareURL=window.DXShortLinks?.[shopCanonical]||shopCanonical;
if(shareField){shareField.value=shareField.value.split(/\n\n【詳しい紹介】|\n\n【お店の地図】/)[0]+'\n\n【詳しい紹介】\n'+shopShareURL;document.querySelectorAll('#intro a[href*="line.me/R/share"],#share a[href*="line.me/R/share"]').forEach(a=>a.href='https://line.me/R/share?text='+encodeURIComponent(shareField.value));}
async function copyText(text){const status=document.getElementById('copyStatus');try{await navigator.clipboard.writeText(text);status.textContent='コピーしました。LINEやSNSに貼り付けて送れます。';}catch{shareField.value=text;shareField.focus();shareField.select();status.textContent='選択した文章を長押ししてコピーしてください。';}}
document.querySelector('[data-copy-text]').addEventListener('click',()=>copyText(shareField.value));
document.querySelector('[data-copy-url]').addEventListener('click',()=>copyText(shopShareURL));
document.querySelector('[data-native-share]').addEventListener('click',async()=>{if(!navigator.share)return copyText(shareField.value);try{await navigator.share({title:document.querySelector('h1').textContent,text:shareField.value});}catch(e){if(e.name!=='AbortError')await copyText(shareField.value);}});
const form=document.getElementById('giftForm');
// Keep sharing controls visible immediately below each real shop introduction.
const shareSection=document.getElementById('share');
if(shareSection){
 const row=document.createElement('div');row.className='grid';row.setAttribute('aria-label','この記事をSNSで紹介する');
 const canonical=shopShareURL;
 const copy=document.createElement('button');copy.className='secondary';copy.textContent='コピー';copy.type='button';copy.onclick=()=>copyText(shareField.value);row.append(copy);
 const destinations=[['Facebook','https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(canonical)],['Instagram','https://www.instagram.com/'],['X','https://twitter.com/intent/tweet?text='+encodeURIComponent(document.querySelector('h1').textContent+'をご紹介！')+'&url='+encodeURIComponent(canonical)],['LINE','https://line.me/R/share?text='+encodeURIComponent(shareField.value)]];
 for(const [label,href] of destinations){const a=document.createElement('a');a.className='btn '+(label==='LINE'?'line':'secondary');a.textContent=label;a.href=href;a.target='_blank';a.rel='noopener';if(label==='Instagram')a.onclick=()=>copyText(shareField.value);row.append(a);}
 const oldLine=shareSection.querySelector(':scope > a[href*="line.me/R/share"]');if(oldLine)oldLine.replaceWith(row);else shareSection.querySelector('h2').after(row);
 const note=document.createElement('p');note.className='muted';note.textContent='Instagramは紹介文をコピーして開きます。ご自身の写真・動画と一緒に貼り付けて投稿してください。';row.after(note);
}
function colourSNSButtons(){for(const a of document.querySelectorAll('a.btn')){let host;try{host=new URL(a.href).hostname.toLowerCase();}catch{continue;}let colour='';if(/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(host))colour='#c90000';else if(/(^|\.)facebook\.com$/.test(host))colour='#0866c6';else if(/(^|\.)instagram\.com$/.test(host))colour='linear-gradient(115deg,#833ab4,#c52c72,#b94418)';else if(/(^|\.)twitter\.com$|(^|\.)x\.com$/.test(host))colour='#111111';else if(/(^|\.)line\.me$/.test(host))colour='#087f3e';if(colour){a.style.setProperty('background',colour,'important');a.style.setProperty('color','#ffffff','important');}}}
colourSNSButtons();
new MutationObserver(colourSNSButtons).observe(document.querySelector('main'),{childList:true,subtree:true});
if(form)form.addEventListener('submit',e=>{e.preventDefault();const input=document.getElementById('giftCode');const status=document.getElementById('giftStatus');if(input.value.normalize('NFKC').replace(/\s/g,'')!=='ふじこ'){status.textContent='合言葉は「ふじこ」です。もう一度入力してね。';input.focus();return;}document.getElementById('gift').hidden=false;status.textContent='合言葉、正解！ありがとうカードを受け取れました。';document.getElementById('giftTitle').focus();});
