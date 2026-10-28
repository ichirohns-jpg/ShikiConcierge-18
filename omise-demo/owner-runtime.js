'use strict';
// Runs on the public site's own origin, outside Apps Script's nested frames.
(()=>{
 const endpoint='https://script.google.com/macros/s/AKfycbzMec1R3le4e-cOUyBUl6Eq2dU3OI-5HHtkEyJQT7SWx4IjUHGtW8Z3zatJxoA2GUhn2A/exec';
 const key='shiki-merchant-session-v1';
 const valid=a=>a&&/^(SHOP-[0-9]{4}|ADMIN)$/.test(a.id)&&/^DXS1\.[a-f0-9]{64}$/.test(a.token)&&Number.isFinite(a.expiresAt)&&a.expiresAt>Date.now();
 window.omiseOwnerSession={
  read(){try{const a=JSON.parse(localStorage.getItem(key)||'null');if(valid(a))return a;if(a)localStorage.removeItem(key);}catch{}return null;},
  save(a){if(!valid(a))return false;try{const value=JSON.stringify({id:a.id,token:a.token,expiresAt:a.expiresAt});localStorage.setItem(key,value);return localStorage.getItem(key)===value;}catch{return false;}},
  forget(){try{localStorage.removeItem(key);}catch{}},
  authError(e){return /有効期限|専用コードが違|セッション.*(?:無効|失効)|invalid.*(?:session|token)/i.test(e?.message||String(e));}
 };
 const allowed=new Set(['postLoginByCode','postLogin','postOwn','postSend','postDelete','postLogout','thanksCardSet','merchantScenesGet','merchantScenesSave','merchantSubmit','merchantDecide']);
 window.omiseOwnerCall=async(name,args)=>{
  if(!allowed.has(name)||!Array.isArray(args))throw Error('この操作には対応していません。');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),120000);
  try{
   // Safelisted content type: no preflight, no cookies, no credentials in URLs.
   const response=await fetch(endpoint,{method:'POST',mode:'cors',credentials:'omit',redirect:'follow',referrerPolicy:'no-referrer',cache:'no-store',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({api:'owner-v1',method:name,args}),signal:controller.signal});
   if(!response.ok)throw Error('接続できませんでした。入力内容はそのままで、もう一度お試しください。');
   let data;try{data=await response.json();}catch{throw Error('管理画面に接続できませんでした。少し待ってからもう一度お試しください。');}
   if(data?.ok!==true)throw Error(data?.error||'処理を完了できませんでした。');
   return data.result;
  }catch(e){if(e?.name==='AbortError')throw Error('接続に時間がかかっています。保存結果を確認してから、もう一度お試しください。');if(e instanceof TypeError)throw Error('接続できませんでした。ログイン情報と入力内容は残っています。');throw e;
  }finally{clearTimeout(timer);}
 };
})();
