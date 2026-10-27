'use strict';
(()=>{
 const dxURL='https://is.gd/G6uCmY';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 function mount(box,p){
  const link=/^https:\/\//.test(p.shareURL||'')?p.shareURL:dxURL;
  const ownText=[p.title,p.body].filter(Boolean).join('\n\n');
  const area=el('section',null,'post-publish post-simple-share');
  const copy=el('button','リンクをコピー','post-copy-primary');copy.type='button';
  const message=el('p','SNSの投稿欄に貼り付けてください。','post-share-message');
  message.setAttribute('role','status');message.setAttribute('aria-live','polite');
  const fallback=el('textarea');fallback.value=link;fallback.readOnly=true;fallback.hidden=true;fallback.rows=7;
  fallback.setAttribute('aria-label','コピーするリンク');
  fallback.style.cssText='width:100%;box-sizing:border-box;font:inherit;line-height:1.6;padding:12px';
  let disposed=false;
  async function copyValue(value){
   try{
    await navigator.clipboard.writeText(value);
    if(!disposed)message.textContent='コピーしました。SNSに貼り付けてください。';
   }catch{
    if(disposed)return;
    fallback.value=value;fallback.hidden=false;fallback.focus();fallback.select();
    message.textContent='ここを長押ししてコピーしてください。';
   }
  }
  copy.addEventListener('click',()=>copyValue(link));
  area.append(copy);
  if(ownText){
   const copyOwn=el('button','書いた文章とリンクをコピー','post-save-photo');copyOwn.type='button';
   copyOwn.addEventListener('click',()=>copyValue(ownText+'\n\n'+link));area.append(copyOwn);
  }
  area.append(message,fallback);box.append(area);
  return ()=>{disposed=true;};
 }
 window.DXPostShare={mount};
})();
