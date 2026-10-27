// Remember this device without persisting the merchant's dedicated code.
const OM_SESSION_PREFIX_='merchantSession:';
const OM_SESSION_TTL_=30*24*60*60*1000;
function omSessionHash_(text){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(text),Utilities.Charset.UTF_8).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');}
function omSessionRead_(id,token){
 if(!/^DXS1\.[a-f0-9]{64}$/.test(String(token||'')))return null;
 const props=PropertiesService.getScriptProperties(),key=OM_SESSION_PREFIX_+omSessionHash_(token),raw=props.getProperty(key);
 if(!raw)return null;
 let record;try{record=JSON.parse(raw);}catch{props.deleteProperty(key);return null;}
 if(record.id!==String(id))return null;
 const code=props.getProperty('merchant:'+String(id));
 if(!code||!Number.isFinite(record.expiresAt)||record.expiresAt<=Date.now()||record.fingerprint!==omSessionHash_(code)){props.deleteProperty(key);return null;}
 return record;
}
function omSessionIssue_(id){
 const props=PropertiesService.getScriptProperties(),lock=LockService.getScriptLock();lock.waitLock(10000);
 try{
  const now=Date.now(),code=props.getProperty('merchant:'+String(id));if(!code)throw Error('お店の登録を確認してください。');
  const records=[];
  Object.entries(props.getProperties()).forEach(([key,value])=>{if(!key.startsWith(OM_SESSION_PREFIX_))return;try{const r=JSON.parse(value);if(!Number.isFinite(r.expiresAt)||r.expiresAt<=now)props.deleteProperty(key);else if(r.id===String(id))records.push({key,createdAt:r.createdAt||0});}catch{props.deleteProperty(key);}});
  records.sort((a,b)=>b.createdAt-a.createdAt).slice(4).forEach(r=>props.deleteProperty(r.key));
  const token='DXS1.'+(Utilities.getUuid()+Utilities.getUuid()).replace(/-/g,'').toLowerCase(),expiresAt=now+OM_SESSION_TTL_;
  props.setProperty(OM_SESSION_PREFIX_+omSessionHash_(token),JSON.stringify({id:String(id),createdAt:now,expiresAt,fingerprint:omSessionHash_(code)}));
  return {id:String(id),token,expiresAt};
 }finally{lock.releaseLock();}
}

// The owner screen accepts only the dedicated code. Resolve the matching shop
// on the server so shop owners never have to choose a shop from a list.
function postLoginByCode(code,remember){
 const value=String(code||'').trim();
 if(!value)throw Error('専用コードを入力してください。');
 const props=PropertiesService.getScriptProperties();
 const rows=omBook_().getSheetByName('店舗一覧').getDataRange().getDisplayValues();
 const headers=rows.shift()||[],idColumn=headers.indexOf('店舗ID');
 const ids=rows.map(row=>String(row[idColumn]||'')).filter(id=>/^SHOP-[0-9]{4}$/.test(id));
 ids.push('ADMIN');
 const id=ids.find(candidate=>props.getProperty('merchant:'+candidate)===value);
 if(!id)throw Error('専用コードが違います。コードを確認して、もう一度入力してください。');
 const result=postLogin(id,value,remember===true);
 result.loginId=id;
 if(id==='ADMIN')result.thanksCard=thanksCardPublic_().image||'';
 return result;
}

function postLogout(id,token){
 if(/^DXS1\.[a-f0-9]{64}$/.test(String(token||''))){const props=PropertiesService.getScriptProperties(),key=OM_SESSION_PREFIX_+omSessionHash_(token),raw=props.getProperty(key);try{if(raw&&JSON.parse(raw).id===String(id))props.deleteProperty(key);}catch{}}
 return {ok:true};
}
