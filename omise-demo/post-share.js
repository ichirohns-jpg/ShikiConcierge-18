'use strict';
(()=>{
 const dxURL='https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/';
 const articleBase=dxURL+'article.html?id=';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 function mount(box,p){
  const link=/^https:\/\//.test(p.shareURL||'')?p.shareURL:(/^POST-[a-f0-9-]+$/i.test(p.id||'')?articleBase+encodeURIComponent(p.id):dxURL);
  const ownText=[p.title,p.body].filter(Boolean).join('\n\n');
  const area=el('section',null,'post-publish post-simple-share');
  area.append(el('h3','文章とリンクをコピーして、各SNSに貼り付けて投稿してください'));
  const message=el('p','', 'post-share-message');
  message.setAttribute('role','status');message.setAttribute('aria-live','polite');
  const fallback=el('textarea');fallback.value=link;fallback.readOnly=true;fallback.hidden=true;fallback.rows=7;
  fallback.setAttribute('aria-label','コピーするリンク');
  fallback.style.cssText='width:100%;box-sizing:border-box;font:inherit;line-height:1.6;padding:12px';
  let disposed=false;
  async function copyValue(value){
   try{
    await navigator.clipboard.writeText(value);
    if(!disposed)message.textContent='コピーしました。自分のSNSを開いて、投稿欄に貼り付けてください。';
   }catch{
    if(disposed)return;
    fallback.value=value;fallback.hidden=false;fallback.focus();fallback.select();
    message.textContent='ここを長押ししてコピーしてください。';
   }
  }
  const copy=el('button','① 文章とリンクをコピー','post-share-copy');copy.type='button';
  copy.addEventListener('click',()=>copyValue((ownText?ownText+'\n\n':'')+link));area.append(copy);
  area.append(el('p','② 投稿するSNSを開く','post-share-guide'));
  const networks=el('div',null,'post-share post-simple-networks');
  const items=[
   ['Facebookを開く','https://www.facebook.com/','#0866c6'],
   ['LINEを開く','https://line.me/R/','#087f3e'],
   ['Xを開く','https://x.com/','#111']
  ];
  for(const [label,href,color] of items){const a=el('a',label);a.href=href;a.target='_blank';a.rel='noopener';a.style.background=color;networks.append(a);}
  area.append(networks);
  area.append(message,fallback);box.append(area);
  return ()=>{disposed=true;};
 }
 window.DXPostShare={mount};
})();
