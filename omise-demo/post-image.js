'use strict';
// Article images are made locally. No article or photo is sent to another service.
((root)=>{
 const WIDTH=1080,HEIGHT=1350,PAD=54,INNER=WIDTH-PAD*2;
 const FONT='"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",Meiryo,sans-serif';
 function wrap(ctx,value,width=INNER){
  const result=[];let line='';
  for(const char of Array.from(String(value||'').replace(/\r\n?/g,'\n'))){
   if(char==='\n'){result.push(line);line='';continue;}
   if(line&&ctx.measureText(line+char).width>width){result.push(line);line=char;}else line+=char;
  }
  if(line)result.push(line);return result;
 }
 function textParts(article){
  const body=String(article.body||'').trim();
  const first=body.split('\n')[0];
  const explicit=String(article.title||'').trim();
  // A long first paragraph stays in the body, so it is never silently cut off.
  const useFirst=!explicit&&first&&Array.from(first).length<=55;
  return {title:explicit||(useFirst?first:'お店からのお知らせ'),body:[useFirst?body.slice(first.length).trim():body,article.end?'掲載期間：'+article.end+'まで':''].filter(Boolean).join('\n\n')};
 }
 function plan(ctx,article,hasPhoto){
  const parts=textParts(article),pages=[];
  ctx.font='700 52px '+FONT;let titleLines=wrap(ctx,parts.title),titleSize=52;
  while(titleLines.length>3&&titleSize>34){titleSize-=2;ctx.font='700 '+titleSize+'px '+FONT;titleLines=wrap(ctx,parts.title);}
  // The saved editor limits titles to 60 characters; unusually long legacy titles
  // continue in the body rather than being discarded.
  let overflow='';if(titleLines.length>3){overflow=titleLines.slice(3).join('');titleLines=titleLines.slice(0,3);}
  ctx.font='500 36px '+FONT;const bodyLines=wrap(ctx,[overflow,parts.body].filter(Boolean).join('\n\n'));
  const photoBottom=hasPhoto?(bodyLines.length>5?642:854):146;
  const titleY=photoBottom+76,titleBottom=titleY+(titleLines.length-1)*(titleSize+12);
  const bodyY=titleBottom+64,capacity=Math.max(0,Math.floor((1240-bodyY)/48)+1);
  pages.push({kind:'cover',titleLines,titleSize,titleY,photoBottom,bodyY,bodyLines:bodyLines.splice(0,capacity)});
  while(bodyLines.length)pages.push({kind:'text',bodyY:230,bodyLines:bodyLines.splice(0,22)});
  return pages;
 }
 function loadPhoto(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('記事の写真を読み込めませんでした。'));image.src=src;});}
 function drawContained(ctx,img,x,y,w,h){const scale=Math.min(w/img.naturalWidth,h/img.naturalHeight),dw=img.naturalWidth*scale,dh=img.naturalHeight*scale;ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);}
 function name(ctx,value){let size=34;ctx.font='700 '+size+'px '+FONT;while(ctx.measureText(value).width>INNER&&size>22){size-=1;ctx.font='700 '+size+'px '+FONT;}ctx.fillStyle='#17513f';ctx.fillText(value,PAD,79,INNER);}
 function render(ctx,page,article,index,total,photo){
  ctx.fillStyle='#fff';ctx.fillRect(0,0,WIDTH,HEIGHT);name(ctx,String(article.name||'お店からの投稿'));
  ctx.fillStyle='#dbe6df';ctx.fillRect(PAD,108,INNER,2);
  if(page.kind==='cover'){
   if(photo){ctx.fillStyle='#f4f2eb';ctx.fillRect(0,132,WIDTH,page.photoBottom-132);drawContained(ctx,photo,PAD,150,INNER,page.photoBottom-168);}
   ctx.fillStyle='#17513f';ctx.fillRect(PAD,page.photoBottom+12,68,6);ctx.fillStyle='#173d33';ctx.font='700 '+page.titleSize+'px '+FONT;
   page.titleLines.forEach((line,i)=>ctx.fillText(line,PAD,page.titleY+i*(page.titleSize+12)));
  }else if(page.kind==='photo'){
   drawContained(ctx,photo,PAD,150,INNER,1024);
   ctx.fillStyle='#345b4d';ctx.font='600 32px '+FONT;ctx.fillText(textParts(article).title,PAD,1228,INNER);
  }else{ctx.fillStyle='#17513f';ctx.font='700 34px '+FONT;ctx.fillText('記事のつづき',PAD,176);}
  ctx.fillStyle='#294c3e';ctx.font='500 36px '+FONT;
  (page.bodyLines||[]).forEach((line,i)=>{if(line)ctx.fillText(line,PAD,page.bodyY+i*48);});
  ctx.fillStyle='#dbe6df';ctx.fillRect(PAD,1272,INNER,2);ctx.fillStyle='#61776a';ctx.font='600 25px '+FONT;ctx.fillText('志木なるほど お店めぐりDX',PAD,1310);
  if(total>1){ctx.textAlign='right';ctx.fillText((index+1)+' / '+total,WIDTH-PAD,1310);ctx.textAlign='left';}
 }
 function renderBenefit(ctx,article){
  const offer=article.promotion;
  ctx.fillStyle='#fffaf0';ctx.fillRect(0,0,WIDTH,HEIGHT);name(ctx,article.name);
  ctx.fillStyle='#8e430c';ctx.fillRect(PAD,126,INNER,70);ctx.fillStyle='#fff';ctx.font='700 36px '+FONT;ctx.fillText('掲載見本・利用不可',PAD+24,174);
  ctx.fillStyle='#526f5e';ctx.font='600 32px '+FONT;ctx.fillText('特典の表示例',PAD,276);
  ctx.fillStyle='#193f33';ctx.font='700 58px '+FONT;let y=380;wrap(ctx,offer.condition).forEach(line=>{ctx.fillText(line,PAD,y);y+=76;});
  ctx.fillStyle='#c05a0b';ctx.font='800 88px '+FONT;y+=50;wrap(ctx,offer.reward).forEach(line=>{ctx.fillText(line,PAD,y);y+=108;});
  ctx.fillStyle='#e6eee6';ctx.fillRect(PAD,820,INNER,280);ctx.fillStyle='#193f33';ctx.font='600 36px '+FONT;ctx.fillText('受け取り方の表示例',PAD+30,880);ctx.font='700 50px '+FONT;ctx.fillText('「'+offer.keyword+'」',PAD+30,962,INNER-60);ctx.font='500 32px '+FONT;ctx.fillText('お会計前に画面を見せて伝える',PAD+30,1038,INNER-60);
  ctx.fillStyle='#8e430c';ctx.font='700 34px '+FONT;ctx.fillText('この特典は実際には利用できません',PAD,1170,INNER);
  ctx.fillStyle='#61776a';ctx.font='500 27px '+FONT;wrap(ctx,offer.address).slice(0,2).forEach((line,i)=>ctx.fillText(line,PAD,1220+i*36));ctx.font='600 25px '+FONT;ctx.fillText('志木なるほど お店めぐりDX',PAD,1310);
 }
 async function create(article){
  await document.fonts.ready;
  await Promise.all([
   document.fonts.load('700 52px '+FONT,String(article.name||'')+String(article.title||'')+String(article.promotion?.reward||'')),
   document.fonts.load('500 36px '+FONT,String(article.body||''))
  ]);
  const sources=(article.photos||[]).filter(src=>/^data:image\/jpeg;base64,/.test(src)).slice(0,4);
  const videoCover=!sources.length&&/^data:image\/jpeg;base64,/.test(article.poster||'');if(videoCover)sources.push(article.poster);
  const photos=await Promise.all(sources.map(loadPhoto));
  const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;const ctx=canvas.getContext('2d');if(!ctx)throw Error('画像を作成できません。このページをSafariまたはChromeで開いてください。');
  const pages=article.promotion?[{kind:'benefit'}]:plan(ctx,article,photos.length>0);if(!article.promotion)photos.slice(1).forEach((_,i)=>pages.push({kind:'photo',photoIndex:i+1}));
  const files=[];
  for(let i=0;i<pages.length;i++){
   if(pages[i].kind==='benefit')renderBenefit(ctx,article);else render(ctx,pages[i],article,i,pages.length,photos[pages[i].photoIndex||0]);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.92));if(!blob)throw Error('画像の保存データを作れませんでした。');
   files.push(new File([blob],'shiki-dx-'+String(article.id||'article').replace(/[^a-z0-9-]/ig,'')+'-'+String(i+1).padStart(2,'0')+'.jpg',{type:'image/jpeg'}));
  }
  return {files,videoCover};
 }
 root.DXPostImage={create,plan,textParts,wrap,WIDTH,HEIGHT};
})(typeof window==='undefined'?globalThis:window);
