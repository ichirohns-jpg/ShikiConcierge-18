'use strict';
(()=>{
 const bannerURL=new URL('./sns-dx-footer.jpg',document.currentScript?.src||location.href).href;
 const WIDTH=1080,MAX_SIDE=4096;
 let bannerPromise=null;
 function image(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('画像を読み込めませんでした。'));img.src=src;});}
 function banner(){if(!bannerPromise)bannerPromise=image(bannerURL).catch(e=>{bannerPromise=null;throw e;});return bannerPromise;}
 function sourceURL(src){if(/^data:image\/(?:jpeg|png|webp);base64,/i.test(src))return src;const u=new URL(src,location.href);if(u.origin!==location.origin||!/^https?:$/.test(u.protocol))throw Error('画像の形式を確認してください。');return u.href;}
 function layout(photo,badge){
  const pw=photo.naturalWidth,ph=photo.naturalHeight,bw=badge.naturalWidth,bh=badge.naturalHeight;
  if(![pw,ph,bw,bh].every(n=>Number.isFinite(n)&&n>0))throw Error('画像の大きさを確認してください。');
  // Size the canvas around the original aspect ratios. Portrait photos fill its
  // width instead of being shrunk inside a fixed square with side margins.
  const aspect=ph/pw+bh/bw;
  if(aspect>MAX_SIDE-2)throw Error('画像が縦長すぎるため、元の写真を使います。');
  const width=Math.max(1,Math.min(WIDTH,Math.floor((MAX_SIDE-2)/aspect)));
  const mainHeight=Math.max(1,Math.round(width*ph/pw));
  const footerHeight=Math.max(1,Math.round(width*bh/bw));
  return {width,height:mainHeight+footerHeight,main:{x:0,y:0,width,height:mainHeight},footer:{x:0,y:mainHeight,width,height:footerHeight},mainHeight,footerHeight};
 }
 async function create(src){
  const [photo,badge]=await Promise.all([image(sourceURL(src)),banner()]);
  const l=layout(photo,badge),canvas=document.createElement('canvas');canvas.width=l.width;canvas.height=l.height;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('このブラウザでは画像を作れません。');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,l.width,l.height);ctx.drawImage(photo,l.main.x,l.main.y,l.main.width,l.main.height);
  ctx.fillStyle='#f0f7f1';ctx.fillRect(0,l.mainHeight,l.width,l.footerHeight);
  ctx.drawImage(badge,l.footer.x,l.footer.y,l.footer.width,l.footer.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.95));canvas.width=canvas.height=0;
  if(!blob)throw Error('画像の保存データを作れませんでした。');
  return {blob,layout:l};
 }
 window.DXPhotoBrand={create,layout};
})();
