'use strict';
(()=>{
 const endpoint='https://script.google.com/macros/s/AKfycbzMec1R3le4e-cOUyBUl6Eq2dU3OI-5HHtkEyJQT7SWx4IjUHGtW8Z3zatJxoA2GUhn2A/exec';
 const base='https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/';
 const slug=location.pathname.split('/').pop();
 const ids={'ouchicafe.html':'SHOP-0001','heartnet.html':'SHOP-0002','newtimes.html':'SHOP-0003'};
 const article=slug==='article.html',deals=slug==='deals.html',timeline=slug==='timeline.html';
 if(!article&&!deals&&!timeline&&!ids[slug])return;
 const id=article?new URLSearchParams(location.search).get('id'):null;
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 document.body.classList.add('social-view');if(ids[slug]){document.body.classList.add('social-profile');const description=document.querySelector('#intro .subtitle')?.nextElementSibling;if(description?.tagName==='P')description.classList.add('profile-description');}
 const nav=el('nav',null,'social-nav');nav.setAttribute('aria-label','DXのメニュー');
 for(const [text,path,active] of [['みんなの投稿','timeline.html',timeline],['お店を探す','./#shops',false],['お得情報','deals.html',deals]]){
  const a=el('a',text);a.href=path;if(active)a.setAttribute('aria-current','page');nav.append(a);
 }
 const main=document.querySelector('main'),header=main.querySelector(':scope > header');
 if(header)header.after(nav);else main.prepend(nav);
 let offset=0;
 const section=el('section'),bar=el('div',null,'feed-heading');
 const heading=el('h2',article?'投稿記事':deals?'お店からのお得情報':ids[slug]?'投稿':'新着の投稿');
 const status=el('p','読み込み中…','feed-status'),list=el('div'),paging=el('div',null,'feed-paging');
 section.id='posts-timeline';bar.append(heading,status);section.append(bar,list,paging);
 if(article||timeline)main.append(section);else if(deals)document.querySelector('article').prepend(section);else document.querySelector('#photos').before(section);
 const shopURL=p=>{const file=Object.keys(ids).find(f=>ids[f]===p.shop);return file?base+file+'#posts-timeline':null;};
 const pageURL=p=>base+'article.html?id='+encodeURIComponent(p.id);
 const shortDate=value=>{const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);return m?Number(m[2])+'月'+Number(m[3])+'日 '+m[4]+':'+m[5]:String(value||'');};
 function socialMark(label){
  const mark=el('span',{'コピー':'⧉','Facebook':'f','Instagram':'◎','X':'𝕏','LINE':'L'}[label]||label,'sns-mark');
  mark.setAttribute('aria-hidden','true');return mark;
 }
 function share(box,p){
  const url=pageURL(p),shop=shopURL(p);
  // 共有本文は「記事本文＋記事URL」の一組にする。店舗ページや地図まで
  // 追加すると、Facebook/LINE側でURLが並び、記事の写真・本文が埋もれる。
  const text=p.name+'\n\n'+p.body+(p.end?'\n\n'+p.end+'まで':'')+'\n\n'+url;
  const row=el('div',null,'post-share'),message=el('p',null,'post-share-message');
  row.setAttribute('aria-label','この記事を共有');message.setAttribute('role','status');
  const fallback=el('textarea',null,'post-fallback');fallback.value=text;fallback.readOnly=true;fallback.hidden=true;fallback.setAttribute('aria-label','紹介文');
  const preview=el('section',null,'sns-image-preview');preview.hidden=true;
  preview.style.cssText='margin:12px 16px;padding:16px;border:1px solid #b7d0c1;border-radius:12px;background:#f5faf6';
  preview.append(el('h3','SNSに投稿する画像'));
  const picture=el('img');picture.alt='この記事から作成したSNS投稿画像';picture.style.cssText='display:block;width:100%;max-width:432px;height:auto;margin:12px auto';preview.append(picture);
  const previewNote=el('p','画像の中に記事の内容が入ります。全文と記事リンクは投稿文に添えます。');preview.append(previewNote);
  const actions=el('div');actions.style.cssText='display:flex;flex-wrap:wrap;gap:10px';
  const send=el('button','画像と文章を共有'),save=el('a','画像を保存'),close=el('button','閉じる');
  for(const b of [send,save,close])b.style.cssText='display:inline-block;padding:12px 16px;border:0;border-radius:8px;background:#174f40;color:#fff;font:inherit;cursor:pointer;text-decoration:none';
  send.type=close.type='button';actions.append(send,save,close);preview.append(actions);close.onclick=()=>{preview.hidden=true;};
  let readyFile=null,imageURL='';
  const font='"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",Meiryo,sans-serif';
  function lines(ctx,value,width){const result=[];let line='';for(const c of Array.from(String(value))){if(c==='\n'){result.push(line);line='';}else if(line&&ctx.measureText(line+c).width>width){result.push(line);line=c;}else line+=c;}if(line)result.push(line);return result;}
  function posterFile(src){return new Promise((resolve,reject)=>{
   const image=new Image();image.onerror=()=>reject(Error('写真を読み込めませんでした。'));
   image.onload=async()=>{try{
    await document.fonts.ready;
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');canvas.width=1080;canvas.height=1350;
    ctx.fillStyle='#f5f3eb';ctx.fillRect(0,0,1080,1350);
    const scale=Math.min(984/image.naturalWidth,700/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;
    ctx.drawImage(image,(1080-w)/2,32+(700-h)/2,w,h);
    ctx.fillStyle='#174f40';ctx.fillRect(0,764,1080,8);ctx.fillStyle='#fff';ctx.fillRect(0,772,1080,578);
    ctx.fillStyle='#174f40';ctx.font='700 34px '+font;ctx.fillText(p.name,52,832,976);
    const body=String(p.body||'').trim(),first=String(p.title||body.split('\n')[0]||'お店からのお知らせ');
    let size=56,titleLines;do{ctx.font='700 '+size+'px '+font;titleLines=lines(ctx,first,976);if(titleLines.length<=3)break;size-=2;}while(size>36);
    if(titleLines.length>3){titleLines=titleLines.slice(0,3);titleLines[2]=titleLines[2].slice(0,-1)+'…';}
    ctx.fillStyle='#173d33';titleLines.forEach((line,i)=>ctx.fillText(line,52,910+i*(size+12)));
    const rest=p.title?body:body.slice(first.length).trim(),y=930+titleLines.length*(size+12);
    ctx.font='500 32px '+font;ctx.fillStyle='#34544b';let excerpt=lines(ctx,rest,976),limit=Math.max(0,Math.floor((1260-y)/44));
    if(excerpt.length>limit&&limit){excerpt=excerpt.slice(0,limit);excerpt[limit-1]=excerpt[limit-1].slice(0,-1)+'…';}
    excerpt.slice(0,limit).forEach((line,i)=>ctx.fillText(line,52,y+i*44));
    ctx.fillStyle='#6b8175';ctx.font='600 25px '+font;ctx.fillText('志木なるほど お店めぐりDX',52,1310,976);
    canvas.toBlob(blob=>blob?resolve(new File([blob],'shiki-dx-'+p.id+'.jpg',{type:'image/jpeg'})):reject(Error('画像を作成できませんでした。')),'image/jpeg',.92);
   }catch(e){reject(e);}};
   image.src=src;
  });}
  send.onclick=()=>{if(!readyFile)return;try{
   if(!navigator.share||!navigator.canShare?.({files:[readyFile]})){message.textContent='このブラウザでは画像付き共有が使えません。「画像を保存」と「コピー」を使えます。';return;}
   navigator.share({files:[readyFile],text}).then(()=>{message.textContent='共有先で投稿を確定してください。SNSによって文章が渡らない場合は「コピー」を使えます。';}).catch(e=>{if(e.name!=='AbortError')message.textContent='共有できませんでした。画像は保存できます。';});
  }catch(e){message.textContent=e.message;}};
  const native=el('button','SNS投稿画像を作る');native.type='button';native.className='native-share';
  const source=(p.photos||[]).find(v=>/^data:image\/jpeg;base64,/.test(v))||(/^data:image\/jpeg;base64,/.test(p.poster||'')?p.poster:null);
  native.hidden=!source;native.onclick=async()=>{native.disabled=true;try{
   if(!readyFile){readyFile=await posterFile(source);imageURL=URL.createObjectURL(readyFile);picture.src=imageURL;save.href=imageURL;save.download=readyFile.name;window.addEventListener('pagehide',()=>URL.revokeObjectURL(imageURL),{once:true});}
   preview.hidden=false;preview.scrollIntoView({behavior:'smooth',block:'nearest'});message.textContent='投稿画像ができました。確認して「画像と文章を共有」を押してください。';
  }catch(e){message.textContent=e.message;}finally{native.disabled=false;}};row.append(native);
  async function copy(){try{await navigator.clipboard.writeText(text);message.textContent='コピーしました。SNSに貼り付けて投稿できます。';}catch{fallback.hidden=false;fallback.focus();fallback.select();message.textContent='文章を長押ししてコピーしてください。';}}
  const copyButton=el('button');copyButton.type='button';copyButton.append(socialMark('コピー'),el('span','コピー'));copyButton.onclick=copy;row.append(copyButton);
  const destinations=[
   ['Facebook','https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url),'#0866c6'],
   ['Instagram','https://www.instagram.com/','linear-gradient(115deg,#833ab4,#c52c72,#b94418)'],
   ['X','https://twitter.com/intent/tweet?text='+encodeURIComponent(p.name+'\n'+p.body.slice(0,100))+'&url='+encodeURIComponent(url),'#111'],
   ['LINE','https://line.me/R/share?text='+encodeURIComponent(text),'#087f3e']
  ];
  for(const [label,href,background] of destinations){
   const a=el('a');a.href=href;a.style.background=background;a.target='_blank';a.rel='noopener';
   a.append(socialMark(label),el('span',label));if(label==='Instagram')a.onclick=copy;row.append(a);
  }
  box.append(row,preview,message,fallback);
 }
 function render(rows){
  list.replaceChildren();
  for(const p of rows){
   const shop=shopURL(p),card=el('article',null,'post-card'),head=el('div',null,'post-header');
   const avatar=el(shop?'a':'span',p.name.slice(0,1),'post-avatar');
   if(shop){avatar.href=shop;avatar.setAttribute('aria-label',p.name+'の投稿を見る');}else avatar.setAttribute('aria-hidden','true');
   const identity=el('div',null,'post-identity'),author=el(shop?'a':'span',p.name,'post-author');
   if(shop){author.href=shop;author.setAttribute('aria-label',p.name+'のページと投稿を見る');}
   const date=el('a',shortDate(p.date),'post-date');date.href=pageURL(p);date.setAttribute('aria-label',p.date+'の記事を開く');
   identity.append(author,date);head.append(avatar,identity,el('span',p.kind==='deal'?'お得情報':'お知らせ','post-kind'+(p.kind==='deal'?' deal':'')));
   card.append(head,el('p',p.body,'post-body'));
   const photos=(p.photos||[]).filter(src=>/^data:image\/jpeg;base64,/.test(src));
   if(photos.length){const media=el('div',null,'post-media');for(const src of photos){const img=el('img');img.src=src;img.alt=p.name+'の投稿写真';img.loading=article?'eager':'lazy';img.decoding='async';media.append(img);}card.append(media);}
   if(p.video&&/^https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]+\/preview$/.test(p.video)){
    const video=el('div',null,'post-video');
    if(p.poster&&/^data:image\/jpeg;base64,/.test(p.poster)){const poster=el('img');poster.src=p.poster;poster.alt='動画の表紙';video.append(poster);}
    const play=el('button','▶ 動画を見る');play.type='button';play.onclick=()=>{const frame=el('iframe');frame.src=p.video;frame.title=p.name+'の投稿動画';frame.allowFullscreen=true;video.replaceChildren(frame);};video.append(play);card.append(video);
   }
   if(p.end)card.append(el('p',p.end+'まで','post-end'));
   const links=el('div',null,'post-links');
   if(!article){const detail=el('a','この記事を開く');detail.href=pageURL(p);links.append(detail);}
   if(shop){const profile=el('a','志木なるほどDXはこちら →');profile.href=shop;profile.setAttribute('aria-label','志木なるほどDXはこちら：'+p.name+'の紹介ページ');links.append(profile);}
   card.append(links);share(card,p);list.append(card);
  }
 }
 function load(){
  paging.replaceChildren();status.textContent='読み込み中…';
  const callback='omPosts'+Math.random().toString(36).slice(2),script=document.createElement('script');
  let settled=false;const cleanup=()=>{script.remove();delete window[callback];};
  window[callback]=data=>{
   settled=true;cleanup();if(!data?.ok){status.textContent='読み込めませんでした。';return;}
   const rows=data.posts||[],total=data.total||0;render(rows);
   status.textContent=article?(rows.length?'':'掲載が終了しているか、公開前です。'):!total?'公開された投稿はまだありません。':offset?'過去の投稿 '+(offset+1)+'〜'+Math.min(offset+10,total)+'件':'最新'+Math.min(10,total)+'件';
   if(article&&rows[0])document.title=rows[0].body.split('\n')[0].slice(0,60)+'｜お店めぐりDX';
   if(location.hash==='#posts-timeline')section.scrollIntoView();
   if(!article){
    if(offset){const back=el('button','最新の投稿に戻る','btn secondary');back.onclick=()=>{offset=0;load();};paging.append(back);}
    if(offset+10<total){const older=el('button','過去の投稿を見る','btn secondary');older.onclick=()=>{offset+=10;load();section.scrollIntoView();};paging.append(older);}
   }
  };
  script.onerror=()=>{settled=true;cleanup();status.textContent='読み込めませんでした。';};
  const params=new URLSearchParams({action:'posts',callback,offset:String(offset)});
  if(ids[slug])params.set('shop',ids[slug]);if(deals)params.set('kind','deal');if(id)params.set('id',id);
  script.src=endpoint+'?'+params;document.head.append(script);
  setTimeout(()=>{if(!settled){cleanup();status.textContent='読み込みに時間がかかっています。ページを更新してください。';}},20000);
 }
 if(article&&!/^POST-[a-f0-9-]+$/i.test(id||'')){status.textContent='記事が指定されていません。';return;}
 load();
})();

