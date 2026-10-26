/* Article revisions: all public reads exclude pending/rejected records. */
function postSheet_(){return omSheet_('投稿記事',['受付ID','記事ID','店舗ID','日時','状態','内容JSON','処理日時']);}
function postRows_(){return postSheet_().getDataRange().getDisplayValues().slice(1).filter(r=>r[0]);}
function postNow_(){return Utilities.formatDate(new Date(),'Asia/Tokyo','yyyy-MM-dd HH:mm:ss');}
function postPayload_(r,images){const p=JSON.parse(r[5]);return {request:r[0],id:r[1],shop:r[2],date:r[3],status:r[4],...p,photos:images?omImageData_(p.photos||[]):p.photos||[]};}
function postOwn(id,code){omAuth_(id,code);const rows=postRows_();if(id==='ADMIN')return rows.filter(r=>r[4]==='確認待ち').map(r=>postPayload_(r,true));const latest={};rows.filter(r=>r[2]===id).forEach(r=>latest[r[1]]=r);return Object.values(latest).reverse().map(r=>postPayload_(r,true));}
function postLogin(id,code){const login=merchantLogin(id,code);return {...login,posts:postOwn(id,code),shops:omBook_().getSheetByName('店舗一覧').getDataRange().getDisplayValues().slice(1).filter(r=>r[0]&&r[2]).map(r=>({id:r[0],name:r[2]}))};}
function postSend(id,code,input){
 omAuth_(id,code);if(id==='ADMIN')throw Error('お店を選んで投稿してください。');omShop_(id);
 const body=omText_(input.body,1500),kind=input.kind,end=omText_(input.end,10),ended=input.ended===true;
 if(!['notice','deal'].includes(kind)||!body)throw Error('投稿の種類とひと言を確認してください。');if(end&&!/^\d{4}-\d{2}-\d{2}$/.test(end))throw Error('終了日を確認してください。');
 const photos=input.photos||[];if(!Array.isArray(photos)||photos.length>4||photos.some(v=>!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(v)||v.length>240000))throw Error('写真は4枚まで選んでください。');
 const video=input.video||'';if(video&&(!/^data:video\/(mp4|webm|quicktime);base64,[A-Za-z0-9+/=]+$/i.test(video)||video.length>35000000))throw Error('動画は25MB以内のMP4・MOV・WebMにしてください。');
 const poster=input.poster||'';if(poster&&(!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(poster)||poster.length>240000))throw Error('動画の表紙を確認してください。');
 const lock=LockService.getScriptLock();lock.waitLock(20000);try{
 const rows=postRows_(),previous=input.id?rows.filter(r=>r[1]===input.id).pop():null;
 if(input.id&&(!previous||previous[2]!==id))throw Error('この記事は修正できません。');if(previous&&previous[0]!==input.revision)throw Error('記事が更新されています。一覧を開き直してください。');
 const pid=previous?previous[1]:'POST-'+Utilities.getUuid(),rid='REV-'+Utilities.getUuid(),p={kind,body,end,ended,photos:[]};
 const chunks=omSheet_('店主画像データ',['画像ID','分割番号','データ']);photos.forEach((v,i)=>{const key=rid+'-'+i,parts=[];for(let j=0;j<v.length;j+=35000)parts.push([key,parts.length,v.slice(j,j+35000)]);chunks.getRange(chunks.getLastRow()+1,1,parts.length,3).setValues(parts);p.photos.push(key);});
 const old=previous?JSON.parse(previous[5]):{};
 if(input.keepVideo&&old.videoFileId){p.videoFileId=old.videoFileId;p.poster=old.poster||'';}
 if(video){const match=video.match(/^data:([^;]+);base64,(.+)$/i),file=postVideoFolder_().createFile(Utilities.newBlob(Utilities.base64Decode(match[2]),match[1],rid+(match[1].toLowerCase()==='video/quicktime'?'.mov':'.mp4')));p.videoFileId=file.getId();p.poster=poster;}
 postSheet_().appendRow([rid,pid,id,postNow_(),'確認待ち',JSON.stringify(p),'']);return {ok:true,id:pid,request:rid,status:'確認待ち',posts:postOwn(id,code)};
 }finally{lock.releaseLock();}
}
function postVideoFolder_(){const props=PropertiesService.getScriptProperties(),id=props.getProperty('postVideoFolder');if(id)return DriveApp.getFolderById(id);const folder=DriveApp.createFolder('お店めぐりDX 投稿動画');props.setProperty('postVideoFolder',folder.getId());return folder;}
function postApprove(code,rid,approve){omAuth_('ADMIN',code);const lock=LockService.getScriptLock();lock.waitLock(20000);try{const s=postSheet_(),rows=s.getDataRange().getDisplayValues(),i=rows.findIndex(r=>r[0]===rid);if(i<1||rows[i][4]!=='確認待ち')throw Error('処理済みです。');const r=rows[i],p=JSON.parse(r[5]);if(approve){const newer=rows.slice(i+1).some(x=>x[1]===r[1]);if(newer)throw Error('新しい申請があります。新しい内容を確認してください。');if(p.videoFileId)DriveApp.getFileById(p.videoFileId).setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);}s.getRange(i+1,5).setValue(approve?'公開':'見送り');s.getRange(i+1,7).setValue(postNow_());return {ok:true,posts:postOwn('ADMIN',code)};}finally{lock.releaseLock();}}
function postFeed_(params){const latest={};postRows_().filter(r=>r[4]==='公開').forEach(r=>latest[r[1]]=r);const today=postNow_().slice(0,10);let rows=Object.values(latest).filter(r=>{const p=JSON.parse(r[5]);return !p.ended&&(!p.end||p.end>=today)&&(!params.shop||r[2]===params.shop)&&(!params.kind||p.kind===params.kind)&&(!params.id||r[1]===params.id);}).sort((a,b)=>b[3].localeCompare(a[3])||b[0].localeCompare(a[0]));const offset=Math.max(0,Math.min(10000,parseInt(params.offset||'0',10)||0));const total=rows.length;rows=rows.slice(offset,offset+10);return {ok:true,total,offset,posts:rows.map(r=>{const p=postPayload_(r,true);delete p.request;const shop=omShop_(r[2]);p.name=shop['店名'];p.address=shop['住所'];delete p.videoFileId;if(JSON.parse(r[5]).videoFileId)p.video='https://drive.google.com/file/d/'+encodeURIComponent(JSON.parse(r[5]).videoFileId)+'/preview';return p;})};}
function setupPosts(){postSheet_();postVideoFolder_();console.log('投稿記事と動画保存先の準備完了');}
