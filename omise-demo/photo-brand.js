'use strict';
(()=>{
 const bannerURL=new URL('./sns-dx-footer.jpg',document.currentScript?.src||location.href).href;
 const WIDTH=1080,MAX_MAIN_HEIGHT=1080;
 let bannerPromise=null;
 function image(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('画像を読み込めませんでした。'));img.src=src;});}
 function banner(){if(!bannerPromise)bannerPromise=image(bannerURL).catch(e=>{bannerPromise=null;throw e;});return bannerPromise;}
 function sourceURL(src){if(/^data:image\/(?:jpeg|png|webp);base64,/i.test(src))return src;const u=new URL(src,location.href);if(u.origin!==location.origin||!/^https?:$/.test(u.protocol))throw Error('画像の形式を確認してください。');return u.href;}
 function layout(photo,badge){
  const scale=Math.min(WIDTH/photo.naturalWidth,MAX_MAIN_HEIGHT/photo.naturalHeight);
  const mainWidth=Math.max(1,Math.round(photo.naturalWidth*scale)),mainHeight=Math.max(1,Math.round(photo.naturalHeight*scale));
  const footerHeight=Math.min(270,Math.max(48,Math.round(mainHeight*.33))),padding=Math.min(12,Math.floor(footerHeight/8));
  const badgeScale=Math.min((WIDTH-48)/badge.naturalWidth,(footerHeight-padding*2)/badge.naturalHeight);
  const badgeWidth=Math.round(badge.naturalWidth*badgeScale),badgeHeight=Math.round(badge.naturalHeight*badgeScale);
  return {width:WIDTH,height:mainHeight+footerHeight,main:{x:(WIDTH-mainWidth)/2,y:0,width:mainWidth,height:mainHeight},footer:{x:(WIDTH-badgeWidth)/2,y:mainHeight+(footerHeight-badgeHeight)/2,width:badgeWidth,height:badgeHeight},mainHeight,footerHeight};
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
