"use strict";
const shareField=document.getElementById('shareText');
async function copyText(text){const status=document.getElementById('copyStatus');try{await navigator.clipboard.writeText(text);status.textContent='コピーしました。LINEやSNSに貼り付けて送れます。';}catch{shareField.value=text;shareField.focus();shareField.select();status.textContent='選択した文章を長押ししてコピーしてください。';}}
document.querySelector('[data-copy-text]').addEventListener('click',()=>copyText(shareField.value));
document.querySelector('[data-copy-url]').addEventListener('click',()=>copyText(document.querySelector('link[rel="canonical"]').href));
document.querySelector('[data-native-share]').addEventListener('click',async()=>{if(!navigator.share)return copyText(shareField.value);try{await navigator.share({title:document.querySelector('h1').textContent,text:shareField.value});}catch(e){if(e.name!=='AbortError')await copyText(shareField.value);}});
const form=document.getElementById('giftForm');
if(form)form.addEventListener('submit',e=>{e.preventDefault();const input=document.getElementById('giftCode');const status=document.getElementById('giftStatus');if(input.value.normalize('NFKC').replace(/\s/g,'')!=='ふじこ'){status.textContent='合言葉は「ふじこ」です。もう一度入力してね。';input.focus();return;}document.getElementById('gift').hidden=false;status.textContent='合言葉、正解！ありがとうカードを受け取れました。';document.getElementById('giftTitle').focus();});
