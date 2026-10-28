'use strict';
(()=>{
 const dxURL='https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/';
 const style=document.createElement('style');style.textContent=`.post-fujiko-button{display:block!important;width:100%;margin:12px 0;background:#e7f1df!important;color:#194c3c!important;border:1px solid #b8ceb2!important;font-size:18px!important;min-height:50px}.post-fujiko-editor{padding:18px;margin:12px 0 20px;background:#f3f7ee;border:1px solid #c9d9c0;border-radius:14px}.post-fujiko-editor[hidden]{display:none}.post-fujiko-editor label{display:block;font-size:17px;font-weight:700}.post-fujiko-editor select,.post-fujiko-editor textarea{display:block;width:100%;box-sizing:border-box;font:400 18px/1.7 -apple-system,BlinkMacSystemFont,sans-serif;color:#193f33;background:#fff;border:1px solid #afc6b5;border-radius:10px;padding:12px;margin:8px 0 16px}.post-fujiko-preview{display:flex;align-items:center;gap:10px;margin:18px 0;font-size:22px}.post-fujiko-preview img{width:48px;height:48px;object-fit:cover;border-radius:50%}.post-fujiko-note{font-size:16px;line-height:1.7;color:#506352}`;document.head.append(style);
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 // Private controls are opt-in only after the saved ADMIN session passes server authentication.
 const sessionKey='shiki-merchant-session-v1',accessListeners=new Set();
 let verifiedToken='',checkingToken='',verification=null,runtimePromise=null;
 function adminSession(){try{const a=JSON.parse(localStorage.getItem(sessionKey)||'null');return a?.id==='ADMIN'&&/^DXS1\.[a-f0-9]{64}$/.test(a.token)&&Number.isFinite(a.expiresAt)&&a.expiresAt>Date.now()?a:null;}catch{return null;}}
 function hasAdminAccess(){return !!verifiedToken&&adminSession()?.token===verifiedToken;}
 function notifyAccess(){for(const callback of accessListeners)callback(hasAdminAccess());}
 function ownerRuntime(){if(window.omiseOwnerCall)return Promise.resolve();if(!runtimePromise)runtimePromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=dxURL+'owner-runtime.js?v=20261028-firstparty1';script.onload=()=>window.omiseOwnerCall?resolve():reject(Error('Unavailable'));script.onerror=()=>reject(Error('Unavailable'));document.head.append(script);}).catch(e=>{runtimePromise=null;throw e;});return runtimePromise;}
 function checkAdminAccess(){
  const a=adminSession();
  if(!a){verifiedToken='';notifyAccess();return Promise.resolve(false);}
  if(verification&&checkingToken===a.token)return verification;
  // Hide while checking; failed or expired authentication never shows these controls.
  if(verifiedToken!==a.token){verifiedToken='';notifyAccess();}checkingToken=a.token;
  const attempt=ownerRuntime().then(()=>window.omiseOwnerCall('postOwn',['ADMIN',a.token])).then(result=>{if(checkingToken===a.token&&adminSession()?.token===a.token&&Array.isArray(result))verifiedToken=a.token;else if(checkingToken===a.token)verifiedToken='';}).catch(()=>{if(checkingToken===a.token)verifiedToken='';}).finally(()=>{if(checkingToken===a.token){verification=null;checkingToken='';notifyAccess();}});
  verification=attempt;return attempt;
 }
 window.addEventListener('storage',event=>{if(event.key===sessionKey||event.key===null)checkAdminAccess();});
 window.addEventListener('focus',checkAdminAccess);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkAdminAccess();});
 setInterval(()=>{if(verifiedToken&&!hasAdminAccess()){verifiedToken='';notifyAccess();}},1000);
 const privacyStyle=document.createElement('style');privacyStyle.textContent='.post-fujiko-button[hidden],.post-simple-share[hidden]{display:none!important}';document.head.append(privacyStyle);
 let manifestPromise=null,manifestTime=0;
 function sharePages(){
  if(!manifestPromise||Date.now()-manifestTime>15000){
   manifestTime=Date.now();
   manifestPromise=fetch(dxURL+'post-shares/manifest.json?check='+Math.floor(Date.now()/15000),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Share links unavailable');return r.json();}).catch(e=>{manifestPromise=null;throw e;});
  }
  return manifestPromise;
 }
 function mount(box,p,options={}){
  const dynamic=/^POST-[a-f0-9-]+$/i.test(p.id||'');
  const expiresAt=/^\d{4}-\d{2}-\d{2}$/.test(p.end||'')?Date.parse(p.end+'T00:00:00+09:00')+86400000:Infinity;
  const ended=()=>p.ended===true||Date.now()>=expiresAt;
  let link=dynamic?'':(/^https:\/\//.test(p.shareURL||'')?p.shareURL:dxURL);
  let ownText=[p.title,p.body].filter(Boolean).join('\n\n');
  const makeText=name=>name==='original'?ownText:(name==='fujiko'?'ふじこからの'+(options.profile?'お店・活動紹介🥒':p.kind==='deal'?'お得情報🥒':'街のお知らせ🥒'):'ハートネット志木からのお知らせ')+'\n'+(p.name?p.name+'さん'+(options.profile?'をご紹介します。':'の投稿をご紹介します。'):'志木のお店・活動をご紹介します。')+'\n\n'+ownText+(p.end?'\n\n掲載期限：'+p.end+'まで':'')+'\n\n詳しくは'+(options.profile?'紹介ページ':'元の投稿')+'をご覧ください。';
  let shareText=ownText;
  const area=el('section',null,'post-publish post-simple-share');
  area.hidden=!!options.privateOnly;
  area.append(el('h3','投稿をSNSで共有する'));
  const fujiko=el('button','🥒 ふじことして紹介・シェア','post-fujiko-button');fujiko.type='button';fujiko.hidden=true;fujiko.setAttribute('aria-expanded','false');
  const editor=el('div',null,'post-fujiko-editor');editor.hidden=true;
  const identity=el('label','紹介する名義');
  const sender=el('select');sender.setAttribute('aria-label','紹介する名義');
  for(const [value,label] of [['fujiko','ふじこ'],['heartnet','ハートネット志木'],['original','元の投稿の文章']]){const option=el('option',label);option.value=value;sender.append(option);}
  identity.append(sender);
  const preview=el('div',null,'post-fujiko-preview');
  const avatar=el('img');avatar.src=dxURL+'fujiko-avatar.jpeg';avatar.alt='';avatar.width=48;avatar.height=48;
  const byline=el('strong','ふじこ');preview.append(avatar,byline);
  const textLabel=el('label','SNSに載せる紹介文（変更できます）');
  const draft=el('textarea');draft.rows=9;draft.setAttribute('aria-label','SNSに載せる紹介文');textLabel.append(draft);
  const note=el('p','下のボタンでコピー・共有できます。SNSでは投稿するアカウントを選んでください。Facebookは紹介文をコピーして、共有画面に貼り付けてください。','post-fujiko-note');
  editor.append(identity,preview,textLabel,note);
  const currentText=()=>!hasAdminAccess()||editor.hidden?ownText:shareText;
  function chooseSender(){shareText=makeText(sender.value);draft.value=shareText;byline.textContent=sender.value==='fujiko'?'ふじこ':sender.value==='heartnet'?'ハートネット志木':p.name||'元の投稿';avatar.hidden=sender.value!=='fujiko';ready();}
  sender.addEventListener('change',chooseSender);
  draft.addEventListener('input',()=>{shareText=draft.value;ready();});
  fujiko.addEventListener('click',()=>{if(!hasAdminAccess()||expire())return;editor.hidden=!editor.hidden;fujiko.setAttribute('aria-expanded',String(!editor.hidden));if(!editor.hidden){if(!draft.value){if(options.profile&&options.readProfile){const current=options.readProfile();p={...p,...current};ownText=[p.title,p.body].filter(Boolean).join('\n\n');}sender.value='fujiko';chooseSender();}draft.focus();}ready();});
  area.append(fujiko,editor);
  const message=el('p','', 'post-share-message');
  message.setAttribute('role','status');message.setAttribute('aria-live','polite');
  const fallback=el('textarea');fallback.value=(ownText?ownText+'\n\n':'')+link;fallback.readOnly=true;fallback.hidden=true;fallback.rows=7;
  fallback.setAttribute('aria-label','コピーする文章と短いURL');
  fallback.style.cssText='width:100%;box-sizing:border-box;font:inherit;line-height:1.6;padding:12px';
  let disposed=false,timer=null,expiryTimer=null;
  async function copyValue(value){
   if(expire())return;
   try{
    await navigator.clipboard.writeText(value);
    if(!disposed)message.textContent='コピーしました。';
   }catch{
    if(disposed)return;
    fallback.value=value;fallback.hidden=false;fallback.focus();fallback.select();
    message.textContent='ここを長押ししてコピーしてください。';
   }
  }
  const copy=el('button','文章と短いURLをコピー','post-share-copy');copy.type='button';
  copy.addEventListener('click',()=>{if(!expire()&&link)return copyValue((currentText()?currentText()+'\n\n':'')+link);});
  area.append(el('p','コピーして、SNSに貼り付けてください。','post-share-guide'));
  const networks=el('div',null,'post-share post-simple-networks');
  const facebook=el('a','Facebookで共有');facebook.target='_blank';facebook.rel='noopener';facebook.style.background='#0866c6';networks.append(facebook);
  const line=el('a','LINEで共有');line.style.background='#087f3e';
  const x=el('a','Xで共有');x.style.background='#111';
  for(const a of [line,x]){a.target='_blank';a.rel='noopener';networks.append(a);}
  for(const a of [facebook,line,x])a.addEventListener('click',event=>{if(expire())event.preventDefault();});
  function ready(){
   copy.disabled=!link||ended();
   const buttons=[facebook,line,x];
   if(link&&!ended()){
    facebook.href='https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(link);
    line.href='https://line.me/R/share?text='+encodeURIComponent((currentText()?currentText()+'\n\n':'')+link);
    x.href='https://x.com/intent/tweet?text='+encodeURIComponent(currentText())+'&url='+encodeURIComponent(link);
    for(const a of buttons)a.removeAttribute('aria-disabled');
   }else{
    for(const a of buttons){a.removeAttribute('href');a.setAttribute('aria-disabled','true');}
   }
  }
  function expire(){
   if(!ended())return false;
   link='';clearTimeout(timer);clearTimeout(expiryTimer);ready();fallback.value='';fallback.hidden=true;fujiko.disabled=true;
   message.textContent='掲載が終了したため共有できません。';return true;
  }
  function watchExpiry(){
   if(disposed||!area.isConnected||expire())return;
   if(Number.isFinite(expiresAt))expiryTimer=setTimeout(watchExpiry,Math.min(60000,expiresAt-Date.now()));
  }
  const updateAccess=allowed=>{if(options.privateOnly)area.hidden=!allowed;fujiko.hidden=!allowed;if(!allowed){editor.hidden=true;draft.value='';shareText=ownText;fallback.hidden=true;fallback.value='';fujiko.setAttribute('aria-expanded','false');}ready();};
  accessListeners.add(updateAccess);
  ready();
  area.append(copy,networks,message,fallback);box.append(area);
  updateAccess(hasAdminAccess());
  if(!verification&&!hasAdminAccess())checkAdminAccess();
  async function prepare(){
   if(disposed||!area.isConnected||expire())return;
   try{
    const data=await sharePages(),entry=data.version===1&&data.posts?.[p.id];
    if(disposed||!area.isConnected||expire())return;
    if(entry&&entry.date===p.date&&entry.shareURL.startsWith(dxURL+'post-shares/'+encodeURIComponent(p.id)+'/?v=')){
     const shortBase=dxURL.replace(/omise-demo\/$/,'p/'),short=String(entry.shortURL||'');
     link=short.startsWith(shortBase)&&/^[1-9]\d*\/(?:\?v=[1-9]\d*)?$/.test(short.slice(shortBase.length))?short:entry.shareURL;ready();message.textContent='';
    }else{
     link='';ready();fallback.value='';fallback.hidden=true;
     message.textContent='共有リンクを準備しています。';
    }
   }catch{message.textContent='共有カードを読み込み直しています。';}
   if(!disposed&&area.isConnected)timer=setTimeout(prepare,30000);
  }
  watchExpiry();
  if(dynamic)prepare();
  return ()=>{disposed=true;accessListeners.delete(updateAccess);clearTimeout(timer);clearTimeout(expiryTimer);};
 }
 window.DXPostShare={mount};
})();


