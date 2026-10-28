/** 店舗共通の紹介4枠。運営が初期登録し、各店が同じ画面で更新する。 */
function omScenesTarget_(id,code,target){
 omAuth_(id,code);const shopId=id==='ADMIN'?String(target||''):id;
 if(!/^SHOP-[0-9]{4}$/.test(shopId))throw Error('お店を選んでください。');
 omShop_(shopId);return shopId;
}
function omScenesRead_(id){
 const sheet=omBook_().getSheetByName('店舗紹介4枠');
 const rows=sheet?sheet.getDataRange().getDisplayValues().slice(1):[];
 const row=rows.filter(r=>r[0]===id).pop();
 let scenes=row?JSON.parse(row[2]):JSON.parse(JSON.stringify(OM_SCENE_DEFAULTS_[id]||Array.from({length:4},()=>({title:'',src:'',body:'',alt:'',illustration:false}))));
 // Older approved photo replacements retain their four slot titles and text.
 if(!row){const legacy=omBook_().getSheetByName('店主申請');const media=legacy?legacy.getDataRange().getDisplayValues().slice(1).filter(r=>r[2]===id&&r[3]==='media'&&r[4]==='公開').pop():null;
 if(media){const p=JSON.parse(media[6]||'{}');const pictures=omImageData_(p.photos||[]);pictures.forEach((src,i)=>{if(i<4&&src)scenes[i]={...scenes[i],src:src,illustration:false};});}}
 const ids=scenes.filter(s=>s.imageId).map(s=>s.imageId),data=omImageData_(ids);let i=0;
 scenes=scenes.map(s=>s.imageId?{title:s.title,body:s.body,alt:s.alt,illustration:!!s.illustration,src:data[i++]||''}:s);
 return {revision:row?row[1]:'initial',scenes:scenes};
}
function merchantScenesGet(id,code,target){const shopId=omScenesTarget_(id,code,target);return {ok:true,shopId:shopId,name:omShop_(shopId)['店名'],...omScenesRead_(shopId)};}
function merchantScenesSave(id,code,target,p){
 const shopId=omScenesTarget_(id,code,target);
 if(!p||!Array.isArray(p.scenes)||p.scenes.length!==4)throw Error('紹介は4セットで保存してください。');
 const scenes=p.scenes.map(s=>{const title=omText_(s.title,80),body=omText_(s.body,1500),src=String(s.src||'');
 if(!title||!body||!src)throw Error('4セットすべてのタイトル・画像・説明文を入れてください。');
 if(!(/^https:\/\/[^\s]+$/i.test(src)||(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(src)&&src.length<=240000)))throw Error('写真の形式やサイズを確認してください。');
 return {title:title,body:body,src:src,alt:omText_(s.alt||title,200),illustration:!!s.illustration};});
 const lock=LockService.getScriptLock();lock.waitLock(20000);try{
 const current=omScenesRead_(shopId);if(p.revision!==current.revision)throw Error('別の画面で更新されています。画面を開き直して最新内容を確認してください。');
 const revision=Utilities.getUuid(),blobs=omSheet_('店主画像データ',['画像ID','分割番号','データ']);
 const stored=scenes.map((s,i)=>{if(!s.src.startsWith('data:'))return s;
 const imageId='SCENE-'+revision+'-'+i,parts=[];for(let j=0;j<s.src.length;j+=35000)parts.push([imageId,parts.length,s.src.slice(j,j+35000)]);
 blobs.getRange(blobs.getLastRow()+1,1,parts.length,3).setValues(parts);
 return {title:s.title,body:s.body,alt:s.alt,illustration:s.illustration,imageId:imageId};});
 const sheet=omSheet_('店舗紹介4枠',['店舗ID','改訂ID','内容JSON','更新日時']);const rows=sheet.getDataRange().getDisplayValues();const index=rows.findIndex(r=>r[0]===shopId);
 const values=[shopId,revision,JSON.stringify(stored),Utilities.formatDate(new Date(),'Asia/Tokyo','yyyy-MM-dd HH:mm:ss')];
 if(index>0)sheet.getRange(index+1,1,1,4).setValues([values]);else sheet.appendRow(values);
 return {ok:true,revision:revision,scenes:scenes,message:'保存しました。お店の紹介ページに反映されます。'};
 }finally{lock.releaseLock();}
}
