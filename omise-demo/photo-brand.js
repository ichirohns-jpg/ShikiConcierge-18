'use strict';
(()=>{
 const WIDTH=1080,HEIGHT=1920;
 function image(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('画像を読み込めませんでした。'));img.src=src;});}
 function sourceURL(src){if(/^data:image\/(?:jpeg|png|webp);base64,/i.test(src))return src;const u=new URL(src,location.href);if(u.origin!==location.origin||!/^https?:$/.test(u.protocol))throw Error('画像の形式を確認してください。');return u.href;}
 function rect(photo,mode){
  const pw=photo.naturalWidth,ph=photo.naturalHeight;
  if(![pw,ph].every(n=>Number.isFinite(n)&&n>0))throw Error('画像の大きさを確認してください。');
  const scale=mode==='cover'?Math.max(WIDTH/pw,HEIGHT/ph):Math.min(WIDTH/pw,HEIGHT/ph);
  const width=Math.round(pw*scale),height=Math.round(ph*scale);
  return {x:Math.round((WIDTH-width)/2),y:Math.round((HEIGHT-height)/2),width,height};
 }
 function layout(photo){return {width:WIDTH,height:HEIGHT,background:rect(photo,'cover'),main:rect(photo,'contain')};}
 async function create(src){
  const photo=await image(sourceURL(src));
  const l=layout(photo),canvas=document.createElement('canvas');canvas.width=l.width;canvas.height=l.height;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('このブラウザでは画像を作れません。');
  // The background fills 9:16. The complete original sits on top without crop.
  ctx.save();ctx.filter='blur(34px) brightness(.68)';
  ctx.drawImage(photo,l.background.x-40,l.background.y-40,l.background.width+80,l.background.height+80);ctx.restore();
  ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(0,0,l.width,l.height);
  ctx.save();ctx.shadowColor='rgba(0,0,0,.28)';ctx.shadowBlur=24;ctx.drawImage(photo,l.main.x,l.main.y,l.main.width,l.main.height);ctx.restore();
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.95));canvas.width=canvas.height=0;
  if(!blob)throw Error('画像の保存データを作れませんでした。');
  return {blob,layout:l};
 }
 window.DXPhotoBrand={create,layout};
})();
