'use strict';
(()=>{
 const dxURL='https://is.gd/G6uCmY';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 let brandPromise=null,preparationQueue=Promise.resolve();
 const brandScriptURL=new URL('./photo-brand.js?v=20261027-nine-sixteen1',document.currentScript?.src||location.href).href;
 function photoBrand(){
  if(window.DXPhotoBrand)return Promise.resolve(window.DXPhotoBrand);
  if(!brandPromise)brandPromise=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src=brandScriptURL;
   script.onload=()=>window.DXPhotoBrand?resolve(window.DXPhotoBrand):reject(Error('画像を準備できませんでした。'));
   script.onerror=()=>{script.remove();brandPromise=null;reject(Error('画像を準備できませんでした。'));};document.head.append(script);
  });
  return brandPromise;
 }
 function canSend(files){try{return !!(navigator.share&&navigator.canShare&&navigator.canShare({files}));}catch{return false;}}
 function share(box,p){
  const caption=[p.name,p.title,p.body,p.end?'掲載期間：'+p.end+'まで':'','志木なるほど お店めぐりDX\n'+(p.shareURL||dxURL)].filter(Boolean).join('\n\n');
  const area=el('section',null,'post-publish post-simple-share');
  area.append(el('h3','9:16画像をSNSへ'));
  const photos=(p.photos||[]).filter(src=>/^data:image\/jpeg;base64,/i.test(src)).slice(0,4);
  const videoCover=!photos.length&&/^data:image\/jpeg;base64,/i.test(p.poster||'');if(videoCover)photos.push(p.poster);
  const message=el('p',photos.length?'9:16画像を準備しています…':'文章とDXリンクをコピーしてSNSに貼り付けられます。','post-share-message');
  message.setAttribute('role','status');message.setAttribute('aria-live','polite');
  const send=el('button','9:16画像を準備しています…','post-copy-primary');send.type='button';send.disabled=true;
  const copy=el('button',photos.length?'投稿文だけ再コピー':'投稿文とDXリンクをコピー','post-save-photo');copy.type='button';
  const fallback=el('textarea');fallback.value=caption;fallback.readOnly=true;fallback.hidden=true;fallback.rows=6;fallback.setAttribute('aria-label','コピーする投稿文');
  async function copyText(){try{await navigator.clipboard.writeText(caption);return true;}catch{return false;}}
  copy.addEventListener('click',async()=>{
   if(await copyText())message.textContent='投稿文とDXリンクをコピーしました。SNSの投稿欄に貼り付けてください。';
   else{fallback.hidden=false;fallback.focus();fallback.select();message.textContent='この文章を長押ししてコピーしてください。';}
  });
  let readyFiles=[],busy=false,disposed=false,shareTurn=0;
  if(photos.length)area.append(send);
  area.append(message,copy,fallback);
  const saves=el('div',null,'post-photo-saves'),savedURLs=[];
  if(photos.length)area.append(saves);
  function sendFiles(files,button){
   if(busy||!files.length)return;
   if(!canSend(files)){message.textContent='この端末では画像を直接渡せません。下の「画像を保存」を使えます。';return;}
   busy=true;button.disabled=true;const turn=++shareTurn;
   // Copy is best-effort: it must never delay the image's user-initiated share.
   const copied=copyText();
   let handoff;
   try{handoff=navigator.share({files});}
   catch(error){finish(error);return;}
   Promise.resolve(handoff).then(()=>finish(),finish);
   async function finish(error){
    busy=false;button.disabled=false;
    const didCopy=await copied;
    if(disposed||turn!==shareTurn)return;
    if(error){
     message.textContent=error.name==='AbortError'?'共有をキャンセルしました。':(didCopy?'画像を渡せませんでした。投稿文とDXリンクはコピーされています。':'画像を渡せませんでした。画像の保存も使えます。');
    }else{
     message.textContent=didCopy?'投稿文とDXリンクをコピーしました。SNSの投稿欄に貼り付けてください。投稿完了はSNS側で確認してください。':'投稿文とDXリンクは下のコピーボタンからコピーできます。投稿完了はSNS側で確認してください。';
    }
   }
  }
  send.addEventListener('click',()=>sendFiles(readyFiles,send));
  async function prepare(){
   let originalFallback=false;
   for(let i=0;i<photos.length;i++){
    if(disposed)return;
    let blob;
    try{const maker=await photoBrand();blob=(await maker.create(photos[i])).blob;}
    catch{
     originalFallback=true;
     const response=await fetch(photos[i]);if(!response.ok)throw Error('写真を読み込めませんでした。');blob=await response.blob();
    }
    if(!blob||!blob.size||blob.type!=='image/jpeg')throw Error('画像を準備できませんでした。');
    const name='shiki-dx-9x16-'+String(p.id||'post').replace(/[^a-z0-9-]/ig,'')+'-'+(i+1)+'.jpg';
    readyFiles.push(new File([blob],name,{type:'image/jpeg'}));
   }
   if(disposed)return;
   for(let i=0;i<readyFiles.length;i++){
    const file=readyFiles[i],url=URL.createObjectURL(file);savedURLs.push(url);
    const save=el('a',(videoCover?'9:16表紙画像を保存':'9:16画像を保存')+(readyFiles.length>1?'（'+(i+1)+'枚目）':''),'post-save-photo');
    save.href=url;save.download=file.name;saves.append(save);
    if(readyFiles.length>1&&!canSend(readyFiles)&&canSend([file])){
     const one=el('button',(i+1)+'枚目をSNSへ','post-save-photo');one.type='button';one.addEventListener('click',()=>sendFiles([file],one));saves.append(one);
    }
   }
   if(canSend(readyFiles)){
    send.disabled=false;send.textContent=readyFiles.length>1?'9:16画像'+readyFiles.length+'枚＋投稿文をSNSへ':'9:16画像＋投稿文をSNSへ';
    message.textContent='このボタンを押してFacebookなどを選んでください。画像が添付され、投稿文とDXリンクは自動でコピーされます。SNSの本文欄で「貼り付け」を使います。';
   }else{
    send.textContent='この端末では画像の保存を使ってください';
    message.textContent='画像を直接共有する機能に対応していません。下の「画像を保存」を使えます。';
   }
   if(originalFallback)message.textContent+=' 9:16画像を作れなかった写真は、元の画像を使います。';
   if(videoCover)message.textContent+=' 共有するのは表紙画像です。動画本体は含みません。';
  }
  if(photos.length){
   // Only one canvas is built at a time, including when a feed has many posts.
   preparationQueue=preparationQueue.catch(()=>{}).then(prepare).catch(()=>{
    if(!disposed){send.textContent='画像を準備できませんでした';message.textContent='ページを開き直して試してください。';}
   });
  }
  box.append(area);
  function dispose(){disposed=true;readyFiles=[];savedURLs.splice(0).forEach(url=>URL.revokeObjectURL(url));window.removeEventListener('pagehide',onPageHide);}
  function onPageHide(event){if(!event.persisted)dispose();}
  window.addEventListener('pagehide',onPageHide);
  return dispose;
 }
 window.DXPostShare={mount:share};
})();
