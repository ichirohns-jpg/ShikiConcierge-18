'use strict';
(()=>{
 const dxURL='https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/';
 const articleBase=dxURL+'article.html?id=';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 function mount(box,p){
  const link=/^POST-[a-f0-9-]+$/i.test(p.id||'')?articleBase+encodeURIComponent(p.id):(/^https:\/\//.test(p.shareURL||'')?p.shareURL:dxURL);
  const ownText=[p.title,p.body].filter(Boolean).join('\n\n');
  const area=el('section',null,'post-publish post-simple-share');
  const copy=el('button','リンクをコピー','post-copy-primary');copy.type='button';
  const message=el('p','このリンクを投稿すると、画像付きのカードからDXの記事を開けます。','post-share-message');
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
  const networks=el('div',null,'post-share post-simple-networks');
  const items=[
   ['Facebook','https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(link),'#0866c6'],
   ['LINE','https://line.me/R/share?text='+encodeURIComponent(ownText+'\n\n'+link),'#087f3e'],
   ['X','https://twitter.com/intent/tweet?text='+encodeURIComponent(ownText)+'&url='+encodeURIComponent(link),'#111'],
   ['Instagram','https://www.instagram.com/','linear-gradient(115deg,#833ab4,#c52c72,#b94418)']
  ];
  for(const [label,href,color] of items){const a=el('a',label);a.href=href;a.target='_blank';a.rel='noopener';a.style.background=color;if(label==='Instagram')a.addEventListener('click',()=>copyValue(ownText+'\n\n'+link));networks.append(a);}
  area.append(networks);
  if(ownText){
   const copyOwn=el('button','書いた文章とリンクをコピー','post-save-photo');copyOwn.type='button';
   copyOwn.addEventListener('click',()=>copyValue(ownText+'\n\n'+link));area.append(copyOwn);
  }
  area.append(message,fallback);box.append(area);
  return ()=>{disposed=true;};
 }
 window.DXPostShare={mount};
})();
