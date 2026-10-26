/**
 * 志木なるほど お店めぐりDX：公開承認済み店舗だけを配信
 * このコードは新規作成した単独の Apps Script プロジェクトに貼り付けます。
 * 個人情報を含む登録申請シートは公開しません。
 */
function publicShopsGet_(e) {
  const callback = (e && e.parameter && e.parameter.callback) || '';
  const sheet = SpreadsheetApp.openById('1u9JGrQkqml6qoNqIk-nuLxdcFXAPQ_COkCX3vA7cSX8').getSheetByName('店舗一覧');
  if (!sheet) return respond_({ok:false,error:'店舗一覧シートがありません'}, callback);
  const values = sheet.getDataRange().getDisplayValues();
  if (!values.length) return respond_({ok:true,shops:[]}, callback);
  const headers = values.shift();
  const col = name => headers.indexOf(name);
  const get = (row, name) => col(name) < 0 ? '' : String(row[col(name)] || '').trim();
  const shops = values.filter(row => {
    const state = get(row, '公開状態');
    const permission = get(row, '掲載許可');
    return state === '公開' && ['確認済み','承認済み','はい','YES'].includes(permission) && get(row, '店名');
  }).map(row => ({
    id: get(row, '店舗ID'),
    name: get(row, '店名'),
    category: get(row, '業種'),
    address: get(row, '住所'),
    description: get(row, '紹介文'),
    recommendation: get(row, 'おすすめ商品・サービス'),
    hours: get(row, '営業時間'),
    closed: get(row, '定休日'),
    phone: get(row, '電話番号'),
    site: get(row, '公式サイトURL'),
    map: get(row, 'GoogleマップURL'),
    instagram: get(row, 'Instagram URL'),
    facebook: get(row, 'Facebook URL'),
    photo: get(row, '写真URL'),
    video: get(row, '動画URL'),
    message: get(row, '店主のひと言'),
    updated: get(row, '更新日')
  }));
  return respond_({ok:true,shops:shops}, callback);
}

function respond_(data, callback) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  // GitHub Pages から読み込むため JSONP を使用。
  // コールバック名は英数字・_・. のみ許可し、コード注入を防止。
  if (callback && /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(callback) && callback.length < 100) {
    return ContentService.createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
function doGet(e){const p=(e&&e.parameter)||{};if(p.mode==='edit')return HtmlService.createHtmlOutput(MERCHANT_HTML).setTitle('お店の情報を更新').addMetaTag('viewport','width=device-width,initial-scale=1');if(p.action==='merchantPublic'){if(!/^SHOP-[0-9]{4}$/.test(p.shop||''))return respond_({ok:false},p.callback||'');return respond_(omPublic_(p.shop),p.callback||'');}return publicShopsGet_(e);}
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

const MERCHANT_HTML="<!doctype html><html lang=\"ja\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>お店の情報を更新｜志木なるほど お店めぐりDX</title><style>*{box-sizing:border-box}body{margin:0;background:#f5f8f4;color:#193f33;font:16px/1.8 -apple-system,BlinkMacSystemFont,sans-serif}main{max-width:620px;padding:18px;margin:auto}section{background:white;border:1px solid #d4e5db;padding:20px;border-radius:16px;margin:16px 0}h1{font-size:25px}h2{font-size:22px}label{display:block;font-weight:700;margin-top:12px}input,textarea,select,button{font:inherit;width:100%;padding:12px;border:1px solid #a8c8b7;border-radius:10px}textarea{min-height:130px}button{background:#146b57;color:white;font-weight:700;margin-top:14px;cursor:pointer}button:disabled{opacity:.6}.secondary{background:#e4f1e9;color:#193f33}.muted{font-size:14px;color:#536d5f}#status{background:#fff5dd;padding:12px;border-radius:10px}img{max-width:100%;border-radius:12px}.preview{display:grid;grid-template-columns:1fr 1fr;gap:8px}[hidden]{display:none!important}a{color:#146b57}.request{border-top:1px solid #d4e5db;padding:14px 0;white-space:pre-wrap}button:focus-visible,a:focus-visible,input:focus-visible{outline:3px solid orange;outline-offset:3px}</style></head><body><main><h1>お店の情報を更新</h1><p>変更を送ると、ふじこが確認して公開します。</p><section id=\"login\"><form id=\"loginForm\"><label for=\"shopId\">お店を選ぶ</label><select id=\"shopId\"><option value=\"SHOP-0001\">おうちcafeパン工房</option><option value=\"SHOP-0002\">ハートネット志木</option><option value=\"SHOP-0003\">ニュータイムス社</option><option value=\"ADMIN\">ふじこ編集長</option></select><label for=\"code\">専用コード</label><input id=\"code\" type=\"password\" autocomplete=\"current-password\" required><p class=\"muted\">お店にお渡ししたコードを入力してください。コードはほかの人に教えないでください。</p><button>更新画面を開く</button></form></section><section id=\"editor\" hidden><h2 id=\"shopName\"></h2><label for=\"kind\">何を変えますか？</label><select id=\"kind\"><option value=\"info\">1 お店の情報を直す</option><option value=\"media\">2 写真・動画を載せる</option><option value=\"notice\">3 今日のお知らせを出す</option></select><form id=\"editForm\"><div id=\"infoFields\"></div><div id=\"mediaFields\" hidden><label for=\"photos\">スマホから写真を選ぶ（4枚まで）</label><input id=\"photos\" type=\"file\" accept=\"image/*\" multiple><div class=\"preview\" id=\"previews\"></div><label for=\"video\">動画のリンク（任意）</label><input id=\"video\" type=\"url\" placeholder=\"YouTubeなどの動画URL\"><p class=\"muted\">写真はスマホから選べます。動画はYouTube・Instagram・Facebookのリンクを貼ってください。</p></div><div id=\"noticeFields\" hidden><label for=\"noticeTitle\">お知らせのタイトル</label><input id=\"noticeTitle\" maxlength=\"80\"><label for=\"noticeBody\">お知らせの本文</label><textarea id=\"noticeBody\" maxlength=\"1500\"></textarea><label for=\"noticeEnd\">いつまで載せる？（任意）</label><input id=\"noticeEnd\" type=\"date\"><p class=\"muted\">特典の内容・条件・期間は、お店で実施するものだけを書いてください。</p></div><button id=\"submit\">確認をお願いして送る</button></form></section><section id=\"admin\" hidden><h2>ふじこの確認待ち</h2><div id=\"requests\"></div></section><p id=\"status\" role=\"status\" aria-live=\"polite\" hidden></p><a href=\"https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/\" target=\"_top\">⌂ DXトップへ戻る</a></main><script>\nconst $=id=>document.getElementById(id);let session=null,photos=[];const fields=['店名','業種','住所','紹介文','おすすめ商品・サービス','営業時間','定休日','電話番号','公式サイトURL','Instagram URL','Facebook URL','LINE公式URL','YouTube URL','店主のひと言'];\nfunction status(t){$('status').hidden=false;$('status').textContent=t;}function busy(on){document.querySelectorAll('button').forEach(b=>b.disabled=on);}function fail(e){busy(false);status(e.message||String(e));}\nfunction rpc(name,args,done){busy(true);google.script.run.withSuccessHandler(r=>{busy(false);done(r);}).withFailureHandler(fail)[name](...args);}\n$('loginForm').onsubmit=e=>{e.preventDefault();const id=$('shopId').value,code=$('code').value.trim();rpc('merchantLogin',[id,code],r=>{session={id,code};$('login').hidden=true;if(r.admin){$('admin').hidden=false;renderRequests(r.requests);}else{$('editor').hidden=false;$('shopName').textContent=r.shop['店名'];$('infoFields').replaceChildren();fields.forEach((k,i)=>{const label=document.createElement('label');label.htmlFor='field'+i;label.textContent=k;const input=document.createElement(k==='紹介文'||k==='おすすめ商品・サービス'?'textarea':'input');input.id='field'+i;input.dataset.field=k;input.value=r.shop[k]||'';input.maxLength=k==='紹介文'?1500:500;$('infoFields').append(label,input);});}status('更新する内容を選んでください。');});};\n$('kind').onchange=()=>{['info','media','notice'].forEach(k=>$(k+'Fields').hidden=$('kind').value!==k);};\n$('photos').onchange=async()=>{photos=[];$('previews').replaceChildren();const files=[...$('photos').files];if(files.length>4){$('photos').value='';status('写真は4枚まで選んでください。');return;}busy(true);try{for(const f of files){const im=await createImageBitmap(f);const canvas=document.createElement('canvas');const ratio=Math.min(1,1000/Math.max(im.width,im.height));canvas.width=Math.round(im.width*ratio);canvas.height=Math.round(im.height*ratio);canvas.getContext('2d').drawImage(im,0,0,canvas.width,canvas.height);let q=.76,data=canvas.toDataURL('image/jpeg',q);while(data.length>230000&&q>.25){q-=.1;data=canvas.toDataURL('image/jpeg',q);}im.close();if(data.length>240000)throw Error('写真が大きすぎます。別の写真を選んでください。');photos.push(data);const img=document.createElement('img');img.src=data;img.alt='送信する写真';$('previews').append(img);}status(photos.length+'枚を選びました。まだ送信されていません。');}catch(e){photos=[];$('photos').value='';$('previews').replaceChildren();status('写真を読み込めませんでした。JPEGなどの別の写真でお試しください。');}busy(false);};\n$('editForm').onsubmit=e=>{e.preventDefault();const type=$('kind').value;let p={};if(type==='info')document.querySelectorAll('[data-field]').forEach(i=>p[i.dataset.field]=i.value);if(type==='notice')p={title:$('noticeTitle').value,body:$('noticeBody').value,end:$('noticeEnd').value};if(type==='media')p={photos,video:$('video').value};rpc('merchantSubmit',[session.id,session.code,type,p],r=>{status(r.message+' 受付番号：'+r.id);$('submit').textContent='続けて別の変更を送る';});};\nfunction renderRequests(rows){$('requests').replaceChildren();if(!rows.length){$('requests').textContent='確認待ちはありません。';return;}rows.forEach(r=>{const box=document.createElement('div');box.className='request';const text=document.createElement('p');text.textContent=r.shop+' / '+({info:'お店の情報',media:'写真・動画',notice:'お知らせ'}[r.type])+'\\n'+r.date+'\\n'+JSON.stringify(r.payload,null,2);box.append(text);(r.previews||[]).forEach(src=>{const img=document.createElement(\"img\");img.src=src;img.alt=\"申請された写真\";box.append(img);});const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.style.width='auto';label.append(check,document.createTextNode('店舗の掲載許可と内容を確認しました'));box.append(label);for(const approve of [true,false]){const btn=document.createElement('button');btn.type='button';btn.textContent=approve?'確認して公開する':'見送る';if(!approve)btn.className='secondary';btn.onclick=()=>rpc('merchantDecide',[session.code,r.id,approve,check.checked],res=>{renderRequests(res.requests);status(approve?'公開しました。':'見送りにしました。');});box.append(btn);}$('requests').append(box);});}\n</script></body></html>\n";
