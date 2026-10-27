'use strict';
(()=>{
 const dxURL='https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 let manifestPromise=null,manifestTime=0;
 function sharePages(){
  if(!manifestPromise||Date.now()-manifestTime>15000){
   manifestTime=Date.now();
   manifestPromise=fetch(dxURL+'post-shares/manifest.json?check='+Math.floor(Date.now()/15000),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Share links unavailable');return r.json();}).catch(e=>{manifestPromise=null;throw e;});
  }
  return manifestPromise;
 }
 function mount(box,p){
  const dynamic=/^POST-[a-f0-9-]+$/i.test(p.id||'');
  let link=dynamic?'':(/^https:\/\//.test(p.shareURL||'')?p.shareURL:dxURL);
  const ownText=[p.title,p.body].filter(Boolean).join('\n\n');
  const area=el('section',null,'post-publish post-simple-share');
  area.append(el('h3','投稿をSNSで共有する'));
  const message=el('p','', 'post-share-message');
  message.setAttribute('role','status');message.setAttribute('aria-live','polite');
  const fallback=el('textarea');fallback.value=ownText;fallback.readOnly=true;fallback.hidden=true;fallback.rows=7;
  fallback.setAttribute('aria-label','コピーする文章');
  fallback.style.cssText='width:100%;box-sizing:border-box;font:inherit;line-height:1.6;padding:12px';
  let disposed=false,timer=null;
  async function copyValue(value){
   try{
    await navigator.clipboard.writeText(value);
    if(!disposed)message.textContent='文章をコピーしました。';
   }catch{
    if(disposed)return;
    fallback.value=value;fallback.hidden=false;fallback.focus();fallback.select();
    message.textContent='ここを長押しして文章をコピーしてください。';
   }
  }
  const copy=el('button','文章だけコピー','post-share-copy');copy.type='button';
  copy.addEventListener('click',()=>copyValue(ownText));
  area.append(el('p','コピーして、SNSに貼り付けてください。','post-share-guide'));
  const networks=el('div',null,'post-share post-simple-networks');
  const facebook=el('a','Facebookで共有');facebook.target='_blank';facebook.rel='noopener';facebook.style.background='#0866c6';networks.append(facebook);
  const line=el('a','LINEで共有');line.style.background='#087f3e';
  const x=el('a','Xで共有');x.style.background='#111';
  for(const a of [line,x]){a.target='_blank';a.rel='noopener';networks.append(a);}
  function ready(){
   const buttons=[facebook,line,x];
   if(link){
    facebook.href='https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(link);
    line.href='https://line.me/R/share?text='+encodeURIComponent((ownText?ownText+'\n\n':'')+link);
    x.href='https://x.com/intent/tweet?text='+encodeURIComponent(ownText)+'&url='+encodeURIComponent(link);
    for(const a of buttons)a.removeAttribute('aria-disabled');
   }else{
    for(const a of buttons){a.removeAttribute('href');a.setAttribute('aria-disabled','true');}
   }
  }
  ready();
  area.append(copy,networks,message,fallback);box.append(area);
  async function prepare(){
   if(disposed||!area.isConnected)return;
   try{
    const data=await sharePages(),entry=data.version===1&&data.posts?.[p.id];
    if(entry&&entry.date===p.date&&entry.shareURL.startsWith(dxURL+'post-shares/'+encodeURIComponent(p.id)+'/?v=')){
     link=entry.shareURL;ready();message.textContent='';return;
    }
    message.textContent='共有リンクを準備しています。';
   }catch{message.textContent='共有カードを読み込み直しています。';}
   if(!disposed&&area.isConnected)timer=setTimeout(prepare,30000);
  }
  if(dynamic)prepare();
  return ()=>{disposed=true;clearTimeout(timer);};
 }
 window.DXPostShare={mount};
})();
