const OM_BOOK='1u9JGrQkqml6qoNqIk-nuLxdcFXAPQ_COkCX3vA7cSX8';
function omBook_(){return SpreadsheetApp.openById(OM_BOOK);}
function omSheet_(name,headers){const b=omBook_();let s=b.getSheetByName(name);if(!s){s=b.insertSheet(name);s.appendRow(headers);s.setFrozenRows(1);}return s;}
function setupMerchantEditing(){
 const b=omBook_(), access=omSheet_('店舗管理',['店舗ID','店名','店主用コード（本人だけに渡す）']);
 const rows=b.getSheetByName('店舗一覧').getDataRange().getDisplayValues(),h=rows.shift();
 const props=PropertiesService.getScriptProperties();
 rows.filter(r=>r[h.indexOf('店舗ID')]&&r[h.indexOf('店名')]).forEach(r=>{const id=r[h.indexOf('店舗ID')];if(!props.getProperty('merchant:'+id)){const code=Utilities.getUuid().replace(/-/g,'');props.setProperty('merchant:'+id,code);access.appendRow([id,r[h.indexOf('店名')],code]);}});
 if(!props.getProperty('merchant:ADMIN')){const code=Utilities.getUuid().replace(/-/g,'');props.setProperty('merchant:ADMIN',code);access.appendRow(['ADMIN','ふじこ編集長用（店主には渡さない）',code]);}
 omSheet_('店主申請',['申請ID','受付日時','店舗ID','種類','状態','内容','公開済みJSON','処理日時']);
 omSheet_('店主画像データ',['画像ID','分割番号','データ']);
 access.getRange('A1:C1').setFontWeight('bold');access.setColumnWidth(0+1,140);access.setColumnWidth(2,280);access.setColumnWidth(3,340);
}
function omAuth_(id,code){const expected=PropertiesService.getScriptProperties().getProperty('merchant:'+String(id));if(!expected||!code||String(code)!==expected)throw new Error('店舗IDまたはコードが違います。');}
function omShop_(id){const rows=omBook_().getSheetByName('店舗一覧').getDataRange().getDisplayValues(),h=rows.shift(),r=rows.find(r=>r[h.indexOf('店舗ID')]===id);if(!r)throw new Error('店舗が見つかりません。');return Object.fromEntries(h.map((k,i)=>[k,r[i]||'']));}
function merchantLogin(id,code){omAuth_(id,code);if(id==='ADMIN')return {admin:true,requests:omRequests_()};return {admin:false,shop:omShop_(id)};}
function omImageData_(ids){const s=omBook_().getSheetByName("店主画像データ");const chunks=s?s.getDataRange().getDisplayValues().slice(1):[];return (ids||[]).map(id=>chunks.filter(r=>r[0]===id).sort((a,b)=>Number(a[1])-Number(b[1])).map(r=>r[2]).join(""));}
function omRequests_(){const s=omSheet_('店主申請',['申請ID','受付日時','店舗ID','種類','状態','内容','公開済みJSON','処理日時']);return s.getDataRange().getDisplayValues().slice(1).filter(r=>r[4]==='確認待ち').map(r=>({id:r[0],date:r[1],shop:r[2],type:r[3],payload:JSON.parse(r[5]),previews:r[3]==="media"?omImageData_(JSON.parse(r[5]).photos):[]}));}
function omText_(v,n){return String(v||'').trim().slice(0,n);}
function omUrl_(v){v=omText_(v,1500);if(v&&!/^https?:\/\//i.test(v))throw new Error('リンクはhttps://またはhttp://から入力してください。');return v;}
function merchantSubmit(id,code,type,p){
 omAuth_(id,code);if(id==='ADMIN')throw new Error('店舗IDで送信してください。');omShop_(id);if(!['info','media','notice'].includes(type))throw new Error('申請の種類が違います。');
 const data={};
 if(type==='info'){['店名','業種','住所','紹介文','おすすめ商品・サービス','営業時間','定休日','電話番号','店主のひと言'].forEach(k=>{if(Object.prototype.hasOwnProperty.call(p,k))data[k]=omText_(p[k],k==='紹介文'?1500:500);});['公式サイトURL','Instagram URL','Facebook URL','LINE公式URL','YouTube URL'].forEach(k=>{if(Object.prototype.hasOwnProperty.call(p,k))data[k]=omUrl_(p[k]);});if(!data['店名'])throw new Error('店名を入力してください。');}
 if(type==='notice'){data.title=omText_(p.title,80);data.body=omText_(p.body,1500);data.end=omText_(p.end,10);if(!data.title||!data.body)throw new Error('タイトルと本文を入力してください。');if(data.end&&!/^\d{4}-\d{2}-\d{2}$/.test(data.end))throw new Error('終了日を確認してください。');}
 const images=[];
 if(type==='media'){data.video=omUrl_(p.video);if(data.video&&!/^https:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|instagram\.com|facebook\.com)\//i.test(data.video))throw new Error('動画はYouTube・Instagram・Facebookのリンクを入力してください。');if(!Array.isArray(p.photos)||p.photos.length>4)throw new Error('写真は4枚までです。');p.photos.forEach(v=>{if(!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(v)||v.length>240000)throw new Error('写真の形式またはサイズを確認してください。');images.push(v);});if(!images.length&&!data.video)throw new Error('写真または動画のリンクを入れてください。');}
 const lock=LockService.getScriptLock();lock.waitLock(15000);try{
 const key='REQ-'+Utilities.getUuid(),blobSheet=omSheet_('店主画像データ',['画像ID','分割番号','データ']);
 if(images.length){data.photos=images.map((v,i)=>{const imageId=key+'-'+i;const chunks=[];for(let j=0;j<v.length;j+=35000)chunks.push([imageId,chunks.length,v.slice(j,j+35000)]);blobSheet.getRange(blobSheet.getLastRow()+1,1,chunks.length,3).setValues(chunks);return imageId;});}
 omSheet_('店主申請',['申請ID','受付日時','店舗ID','種類','状態','内容','公開済みJSON','処理日時']).appendRow([key,Utilities.formatDate(new Date(),'Asia/Tokyo','yyyy-MM-dd HH:mm:ss'),id,type,'確認待ち',JSON.stringify(data),'','']);return {ok:true,id:key,message:'送信しました。ふじこの確認後に公開されます。'};
 }finally{lock.releaseLock();}
}
function merchantDecide(code,requestId,approve,permission){omAuth_('ADMIN',code);const lock=LockService.getScriptLock();lock.waitLock(15000);try{const b=omBook_(),s=b.getSheetByName('店主申請'),rows=s.getDataRange().getDisplayValues(),index=rows.findIndex(r=>r[0]===requestId);if(index<1||rows[index][4]!=='確認待ち')throw new Error('この申請は処理済みです。');const r=rows[index],p=JSON.parse(r[5]);if(approve){if(!permission)throw new Error('掲載許可と内容を確認してください。');if(r[3]==='info'){const master=b.getSheetByName('店舗一覧'),all=master.getDataRange().getDisplayValues(),h=all[0],ri=all.findIndex(row=>row[h.indexOf('店舗ID')]===r[2]);if(ri<1)throw new Error('店舗がありません。');Object.keys(p).forEach(k=>{const ci=h.indexOf(k);if(ci>=0)master.getRange(ri+1,ci+1).setValue(String(p[k]).startsWith("=")?"'"+p[k]:p[k]);});[['公開状態','公開'],['掲載許可','確認済み'],['更新日',Utilities.formatDate(new Date(),'Asia/Tokyo','yyyy-MM-dd')]].forEach(([k,v])=>{const ci=h.indexOf(k);if(ci>=0)master.getRange(ri+1,ci+1).setValue(v);});}s.getRange(index+1,7).setValue(JSON.stringify(p));}s.getRange(index+1,5).setValue(approve?'公開':'見送り');s.getRange(index+1,8).setValue(Utilities.formatDate(new Date(),'Asia/Tokyo','yyyy-MM-dd HH:mm:ss'));return {ok:true,requests:omRequests_()};}finally{lock.releaseLock();}}
function omPublic_(id){const s=omBook_().getSheetByName('店主申請');const result={ok:true,shop:null,notice:null,photos:[],video:''};if(!s)return result;const rows=s.getDataRange().getDisplayValues().slice(1).filter(r=>r[2]===id&&r[4]==='公開');rows.forEach(r=>{const p=JSON.parse(r[6]||'{}');if(r[3]==='info')result.shop=p;if(r[3]==='notice'){result.notice=p;}if(r[3]==='media'){result.video=p.video||'';result.photos=p.photos||[];}});if(result.notice&&result.notice.end&&result.notice.end<Utilities.formatDate(new Date(),'Asia/Tokyo','yyyy-MM-dd'))result.notice=null;
 if(result.photos.length){const chunks=omBook_().getSheetByName('店主画像データ').getDataRange().getDisplayValues().slice(1);result.photos=result.photos.map(id=>chunks.filter(r=>r[0]===id).sort((a,b)=>Number(a[1])-Number(b[1])).map(r=>r[2]).join(''));}return result;}
