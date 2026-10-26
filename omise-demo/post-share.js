'use strict';
(()=>{
 const base='https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/';
 const dxURL='https://is.gd/G6uCmY';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 const pageURL=p=>(p.url&&window.DXShortLinks?.[p.url])||p.url||base+'article.html?id='+encodeURIComponent(p.id);
 function socialMark(label){const n=el('span',{'Facebook':'f','Instagram':'◎','X':'𝕏','LINE':'L'}[label]||label,'sns-mark');n.setAttribute('aria-hidden','true');return n;}
 let imageMakerPromise=null;
 const imageScriptURL=new URL('./post-image.js?v=20261026-image2',document.currentScript?.src||base+'posts.js').href;
 function imageMaker(){
  if(window.DXPostImage)return Promise.resolve(window.DXPostImage);
  if(!imageMakerPromise)imageMakerPromise=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src=imageScriptURL;
   script.onload=()=>window.DXPostImage?resolve(window.DXPostImage):reject(Error('画像作成機能を読み込めませんでした。'));
   script.onerror=()=>{script.remove();imageMakerPromise=null;reject(Error('画像作成機能を読み込めませんでした。通信を確認してもう一度押してください。'));};
   document.head.append(script);
  });
  return imageMakerPromise;
 }
 function share(box,p){
  const url=pageURL(p);
  const caption=p.name+'\n\n'+p.body+(p.end?'\n\n掲載期間：'+p.end+'まで':'');
  const linkedCaption=caption+'\n\n志木なるほど お店めぐりDX\n'+dxURL;
  const area=el('section',null,'post-publish');
  area.append(el('h3','この記事をSNSに投稿する'),el('p','写真と文章を、SNSに載せる画像にまとめます。','post-publish-intro'));
  const message=el('p',null,'post-share-message');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
  const primary=el('button','SNS投稿画像を作る','post-image-primary');primary.type='button';area.append(primary);
  const row=el('div',null,'post-share post-image-networks');row.setAttribute('aria-label','画像を投稿するSNS');
  const preview=el('section',null,'sns-image-preview');preview.hidden=true;preview.setAttribute('aria-label','SNS投稿画像の確認');
  const previewHeading=el('h3','投稿する画像を確認');
  const help=el('p',null,'sns-image-help'),gallery=el('div',null,'sns-image-gallery');
  const actions=el('div',null,'sns-image-actions'),send=el('button','② 画像をSNSに渡す','sns-image-send'),close=el('button','閉じる','sns-image-close');
  send.type=close.type='button';send.disabled=true;actions.append(send,close);
  const captionBox=el('section',null,'sns-caption-options');captionBox.append(el('h3','① 投稿文とDXリンクをコピー'));
  captionBox.append(el('p','ひと言を書き換えてコピーできます。画像を渡したあと、SNSの本文欄に貼り付けてください。'));
  const captionField=el('textarea');captionField.value=linkedCaption;captionField.rows=5;captionField.setAttribute('aria-label','SNS用の投稿文とDXリンク');
  const copyButton=el('button','① 投稿文とDXリンクをコピー');copyButton.type='button';
  const copyLink=el('button','記事リンクをコピー');copyLink.type='button';
  captionBox.append(captionField,copyButton);
  const extra=el('details');extra.append(el('summary','DXの紹介カードを共有・記事リンクをコピー'));
  const card=el('a','DXの紹介カードをFacebookで共有');card.href='https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(base);card.target='_blank';card.rel='noopener';card.className='btn';
  extra.append(el('p','リンクとして共有するときの入口です。画像付き投稿とOGPカードの同時表示は、SNS側の表示によって異なります。'),card,copyLink);
  preview.append(previewHeading,help,gallery,captionBox,actions,extra);
  let readyFiles=[],urls=[],target='',building=null;
  const openButtons=[primary];
  function showHelp(){
   const prefix=target?'共有画面で「'+target+'」を選びます。':'共有画面で投稿先のSNSを選びます。';
   help.textContent='① 投稿文とDXリンクをコピー → ② 画像をSNSに渡す → SNSの本文欄に貼り付けて投稿します。'+prefix;
  }
  function canSend(files){try{return Boolean(navigator.share&&navigator.canShare?.({files}));}catch{return false;}}
  function sendFiles(files,button){
   if(!canSend(files)){message.textContent='このブラウザでは画像付き共有を使えません。下の「画像を保存」から保存し、SNSの写真投稿に添付できます。Safariで開くと共有できる場合があります。';return;}
   // Keep the call in the button's activation event. Only image files are sent:
   // no URL/text item that could be selected as a generic website preview.
   button.disabled=true;
   try{navigator.share({files}).then(()=>{
    message.textContent='共有画面への受け渡しが終わりました。実際の投稿はSNS側で確認してください。';
   }).catch(e=>{if(e.name!=='AbortError')message.textContent='画像を渡せませんでした。「画像を保存」から保存してSNSに添付できます。';}).finally(()=>{button.disabled=false;});}
   catch(e){button.disabled=false;message.textContent='共有画面を開けませんでした。「画像を保存」を使えます。';}
  }
  function renderImages(result){
   readyFiles=result.files;gallery.replaceChildren();
   readyFiles.forEach((file,i)=>{
    const figure=el('figure'),image=el('img'),caption=el('figcaption');
    const url=URL.createObjectURL(file);urls.push(url);image.src=url;image.alt='この記事のSNS投稿画像 '+(i+1)+' / '+readyFiles.length;
    const save=el('a','画像を保存'+(readyFiles.length>1?'（'+(i+1)+'枚目）':''));save.href=url;save.download=file.name;save.className='sns-image-save';
    const one=el('button','この1枚を共有');one.type='button';one.className='sns-image-one';one.onclick=()=>sendFiles([file],one);
    caption.append(save);if(readyFiles.length>1)caption.append(one);figure.append(image,caption);gallery.append(figure);
   });
   send.disabled=false;send.textContent=readyFiles.length>1?'② '+readyFiles.length+'枚の画像をSNSに渡す':'② 画像をSNSに渡す';
   if(result.videoCover||p.video)gallery.append(el('p','動画の記事は表紙と文章を画像にしています。動画そのものは、この共有には含まれません。','sns-image-note'));
   if(readyFiles.length>1&&!canSend(readyFiles))gallery.append(el('p','まとめて共有できない場合は、各画像の「この1枚を共有」または「画像を保存」を使えます。','sns-image-note'));
  }
  async function openImage(chosen=''){
   target=chosen;showHelp();preview.hidden=false;previewHeading.textContent=chosen?chosen+'に載せる画像':'投稿する画像を確認';
   if(!readyFiles.length){
    if(!building)building=(async()=>{
     openButtons.forEach(b=>{b.disabled=true;b.setAttribute('aria-busy','true');});message.textContent='記事から投稿画像を作っています…';
     try{const maker=await imageMaker();renderImages(await maker.create(p));}
     finally{openButtons.forEach(b=>{b.disabled=false;b.removeAttribute('aria-busy');});building=null;}
    })();
    try{await building;}catch(e){message.textContent=e.message;return;}
   }
   message.textContent=readyFiles.length+'枚の投稿画像ができました。画像を確認して「画像をSNSに渡す」を押してください。';
   preview.scrollIntoView({behavior:'smooth',block:'start'});
  }
  primary.onclick=()=>openImage();
  const networks=[['Facebook','#0866c6'],['Instagram','linear-gradient(115deg,#833ab4,#c52c72,#b94418)'],['X','#111'],['LINE','#087f3e']];
  for(const [label,background]of networks){
   const b=el('button');b.type='button';b.style.background=background;b.append(socialMark(label),el('span',label));b.setAttribute('aria-label',label+'用の投稿画像を作る');b.onclick=()=>openImage(label);openButtons.push(b);row.append(b);
  }
  send.onclick=()=>sendFiles(readyFiles,send);
  close.onclick=()=>{preview.hidden=true;primary.focus();};
  async function copy(value,what){
   try{await navigator.clipboard.writeText(value);message.textContent=what+'をコピーしました。';}
   catch{captionField.value=value;captionField.focus();captionField.select();message.textContent='文章を選択しました。長押ししてコピーしてください。';}
  }
  copyButton.onclick=()=>copy(captionField.value,'投稿文とDXリンク');
  copyLink.onclick=()=>copy(url,'記事リンク');
  window.addEventListener('pagehide',()=>urls.forEach(u=>URL.revokeObjectURL(u)),{once:true});
  area.append(row,preview,message);box.append(area);
 }

 window.DXPostShare={mount:share};
})();


