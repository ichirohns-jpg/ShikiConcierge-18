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
  area.append(el('h3','文章とリンクをコピーして、各SNSに貼り付けて投稿してください'));
  const message=el('p','', 'post-share-message');
  message.setAttribute('role','status');message.setAttribute('aria-live','polite');
  const fallback=el('textarea');fallback.value=link;fallback.readOnly=true;fallback.hidden=true;fallback.rows=7;
  fallback.setAttribute('aria-label','コピーするリンク');
  fallback.style.cssText='width:100%;box-sizing:border-box;font:inherit;line-height:1.6;padding:12px';
  let disposed=false,timer=null;
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
  const copy=el('button','① 文章とリンクをコピー','post-share-copy');copy.type='button';copy.disabled=dynamic;
  copy.addEventListener('click',()=>{if(link)copyValue((ownText?ownText+'\n\n':'')+link);});area.append(copy);
  area.append(el('p','② 投稿するSNSを開く','post-share-guide'));
  const networks=el('div',null,'post-share post-simple-networks');
  for(const [label,href,color] of [
   ['Facebookを開く','https://www.facebook.com/','#0866c6'],
   ['LINEを開く','https://line.me/R/','#087f3e'],
   ['Xを開く','https://x.com/','#111']
  ]){const a=el('a',label);a.href=href;a.target='_blank';a.rel='noopener';a.style.background=color;networks.append(a);}
  area.append(networks,message,fallback);box.append(area);
  async function prepare(){
   if(disposed||!area.isConnected)return;
   try{
    const data=await sharePages(),entry=data.version===1&&data.posts?.[p.id];
    if(entry&&entry.date===p.date&&entry.shareURL.startsWith(dxURL+'post-shares/'+encodeURIComponent(p.id)+'/?v=')){
     link=entry.shareURL;copy.disabled=false;message.textContent='';return;
    }
    message.textContent='写真付きの共有リンクを準備しています。準備ができるとコピーボタンが使えます。';
   }catch{message.textContent='共有リンクを読み込み直しています。';}
   if(!disposed&&area.isConnected)timer=setTimeout(prepare,30000);
  }
  if(dynamic)prepare();
  return ()=>{disposed=true;clearTimeout(timer);};
 }
 window.DXPostShare={mount};
})();
