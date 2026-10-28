import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';

function fixture(){
 const tables=new Map(),props=new Map();let serial=0,now=Date.parse('2026-10-28T03:00:00Z');
 class Clock extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
 class Range{
  constructor(sheet,r,c,n=1,m=1){Object.assign(this,{sheet,r,c,n,m});}
  getDisplayValues(){return Array.from({length:this.n},(_,i)=>Array.from({length:this.m},(_,j)=>String(this.sheet.rows[this.r-1+i]?.[this.c-1+j]??'')));}
  setValue(v){return this.setValues([[v]]);}
  setValues(rows){rows.forEach((row,i)=>row.forEach((v,j)=>{const target=this.sheet.rows[this.r-1+i]??(this.sheet.rows[this.r-1+i]=[]);target[this.c-1+j]=v;}));return this;}
  setFontWeight(){return this;}
 }
 class Sheet{
  constructor(){this.rows=[];}
  appendRow(r){this.rows.push(r);return this;}
  getDataRange(){return new Range(this,1,1,this.rows.length,Math.max(...this.rows.map(r=>r.length),1));}
  getRange(...a){if(typeof a[0]==='string')return {setFontWeight(){}};return new Range(this,...a);}
  getLastRow(){return this.rows.length;}setFrozenRows(){}setColumnWidth(){}
 }
 const master=new Sheet();master.rows=[
  ['店舗ID','店名','業種','公開状態','掲載許可','紹介文','更新日','住所','電話番号','管理者メール'],
  ['SHOP-0001','パン屋','飲食','公開','確認済み','パンのお店','2026-10-27','志木市1','000111','private-one@example.invalid'],
  ['SHOP-0002','地域活動','地域活動','下書き','未確認','元の紹介','2026-10-27','志木市2','000222','private-two@example.invalid']
 ];tables.set('店舗一覧',master);
 const book={getSheetByName:n=>tables.get(n),insertSheet:n=>{const s=new Sheet();tables.set(n,s);return s;}};
 const propertyStore={getProperty:k=>props.get(k),setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k),getProperties:()=>Object.fromEntries(props)};
 const output=t=>({text:t,setMimeType(){return this;},setTitle(){return this;},addMetaTag(){return this;},setXFrameOptionsMode(){return this;}});
 const ctx=vm.createContext({
  SpreadsheetApp:{openById:()=>book},PropertiesService:{getScriptProperties:()=>propertyStore},
  Utilities:{getUuid:()=>String(++serial).padStart(8,'0')+'-0000-4000-8000-000000000000',formatDate:(date,_tz,fmt)=>{const value=new Date(date.getTime()+32400000).toISOString();return fmt.includes('HH')?value.slice(0,19).replace('T',' '):value.slice(0,10);},DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_a,s)=>[...createHash('sha256').update(s).digest()]},
  LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
  ScriptApp:{getService:()=>({getUrl:()=>'https://example.invalid/exec'})},
  ContentService:{createTextOutput:output,MimeType:{JSON:'json',JAVASCRIPT:'javascript'}},
  HtmlService:{createHtmlOutput:output,XFrameOptionsMode:{ALLOWALL:'all'}},Date:Clock,console
 });
 vm.runInContext(fs.readFileSync(new URL('./LiveCode.gs',import.meta.url),'utf8'),ctx);ctx.setupMerchantEditing();
 return {ctx,tables,props,master,code:id=>props.get('merchant:'+id),advance:value=>{now=Date.parse(value);}};
}

test('one save updates the directory and public profile from the same record without exposing private fields',()=>{
 const f=fixture(),{ctx}=f;assert.equal(ctx.omPublic_('SHOP-0002').shop,null);
 const result=ctx.merchantSubmit('SHOP-0002',f.code('SHOP-0002'),'info',{'店名':'新しい店名','紹介文':'変更後の紹介','住所':'新住所','電話番号':'123456'});
 assert.equal(result.ok,true);assert.equal(ctx.omPublic_('SHOP-0002').shop['店名'],'新しい店名');
 assert.equal(ctx.omRequests_().length,0,'basic information is published immediately');
 let directory=JSON.parse(ctx.publicShopsGet_({parameter:{}}).text);assert.equal(directory.shops.find(s=>s.id==='SHOP-0002').description,'変更後の紹介');
 f.master.rows[2][5]='さらに更新した紹介';assert.equal(ctx.omPublic_('SHOP-0002').shop['紹介文'],'さらに更新した紹介');
 assert.equal('管理者メール' in ctx.omPublic_('SHOP-0002').shop,false);
 ctx.merchantSubmit('SHOP-0002',f.code('SHOP-0002'),'info',{'店名':'新しい店名','紹介文':''});
 assert.equal(ctx.omPublic_('SHOP-0002').shop['紹介文'],'');
 assert.equal(JSON.parse(ctx.publicShopsGet_({parameter:{}}).text).shops.find(s=>s.id==='SHOP-0002').description,'');
 assert.throws(()=>ctx.merchantSubmit('SHOP-0001',f.code('SHOP-0002'),'info',{'店名':'他店の変更'}));
});

test('legacy video links are editable and missing public-field columns are created on save',()=>{
 const f=fixture(),{ctx}=f;f.master.rows[0].push('動画URL');f.master.rows[1].push('https://www.youtube.com/@existing');f.master.rows[2].push('');
 assert.equal(ctx.merchantLogin('SHOP-0001',f.code('SHOP-0001')).shop['YouTube URL'],'https://www.youtube.com/@existing');
 ctx.merchantSubmit('SHOP-0001',f.code('SHOP-0001'),'info',{'店名':'パン屋','YouTube URL':'https://www.youtube.com/@updated','LINE公式URL':'https://line.me/example'});
 assert.equal(ctx.omPublic_('SHOP-0001').shop['YouTube URL'],'https://www.youtube.com/@updated');assert.equal(ctx.omPublic_('SHOP-0001').shop['LINE公式URL'],'https://line.me/example');
 ctx.merchantSubmit('SHOP-0001',f.code('SHOP-0001'),'info',{'店名':'パン屋','YouTube URL':''});assert.equal(ctx.omPublic_('SHOP-0001').shop['YouTube URL'],'');
});

test('deal entry selects deals automatically; unrecognized input cannot change the editor template',()=>{
 const {ctx}=fixture();
 const deal=ctx.doGet({parameter:{mode:'edit',kind:'deal'}}).text;
 const notice=ctx.doGet({parameter:{mode:'edit',kind:'notice'}}).text;
 assert.ok(deal.includes("const initialKind='deal'==='deal'"));
 assert.ok(notice.includes("const initialKind='notice'==='deal'"));
 assert.equal(deal.includes('__OMISE_INITIAL_KIND__'),false);
 const untrusted=ctx.doGet({parameter:{mode:'edit',kind:"deal';alert(1)"}}).text;
 assert.ok(untrusted.includes("const initialKind='notice'==='deal'"));
});

test('deals require a real current or future end date; notices may omit it',()=>{
 const f=fixture(),{ctx}=f,code=f.code('SHOP-0001');
 for(const end of ['', '2026-10-27','2026-02-30','2026-13-01','invalid'])assert.throws(()=>ctx.postSend('SHOP-0001',code,{kind:'deal',body:'特典',end,photos:[]}));
 const deal=ctx.postSend('SHOP-0001',code,{kind:'deal',body:'今日までの特典',end:'2026-10-28',photos:[]});
 assert.equal(deal.status,'公開');assert.equal(ctx.postFeed_({kind:'deal'}).total,1);assert.equal(ctx.postFeed_({shop:'SHOP-0001'}).total,1);
 ctx.postSend('SHOP-0001',code,{kind:'notice',body:'終了日なしのお知らせ',photos:[]});
 assert.equal(ctx.postFeed_({}).total,2);
 f.advance('2026-10-28T15:00:00Z');assert.equal(ctx.postFeed_({kind:'deal'}).total,0,'Japan midnight expires the deal');
 assert.equal(ctx.postFeed_({}).total,1,'undated notice remains visible');
 assert.ok(ctx.postShareHtml_(deal.id).text.includes('掲載が終了'));
});

test('retrying a successful submission or revision cannot create another article',()=>{
 const f=fixture(),{ctx}=f,code=f.code('SHOP-0001');
 const draft={clientRequestId:'a'.repeat(32),kind:'deal',body:'同じ投稿',end:'2026-10-29',photos:[]};
 const first=ctx.postSend('SHOP-0001',code,draft),again=ctx.postSend('SHOP-0001',code,draft);
 assert.equal(first.id,again.id);assert.equal(ctx.postRows_().length,1);
 const edit={...draft,clientRequestId:'b'.repeat(32),id:first.id,revision:first.request,body:'修正した投稿'};
 const updated=ctx.postSend('SHOP-0001',code,edit),retry=ctx.postSend('SHOP-0001',code,edit);
 assert.equal(updated.request,retry.request);assert.equal(ctx.postRows_().length,2);assert.equal(ctx.postFeed_({}).total,1);
 assert.throws(()=>ctx.postSend('SHOP-0001',code,{...draft,body:'同じ送信IDで別の内容'}));
 assert.throws(()=>ctx.postSend('SHOP-0001',code,{...edit,clientRequestId:'c'.repeat(32),revision:first.request}));
});

test('request identifiers are scoped to the authenticated store and ownership stays isolated',()=>{
 const f=fixture(),{ctx}=f;
 const draft={clientRequestId:'a'.repeat(32),kind:'deal',body:'同じ送信ID',end:'2026-10-29',photos:[]};
 const one=ctx.postSend('SHOP-0001',f.code('SHOP-0001'),draft);
 const two=ctx.postSend('SHOP-0002',f.code('SHOP-0002'),draft);
 assert.notEqual(one.request,two.request);assert.notEqual(one.id,two.id);
 assert.equal(ctx.postOwn('SHOP-0001',f.code('SHOP-0001')).length,1);
 assert.equal(ctx.postOwn('SHOP-0002',f.code('SHOP-0002')).length,1);
 assert.throws(()=>ctx.postSend('SHOP-0002',f.code('SHOP-0002'),{...draft,clientRequestId:'c'.repeat(32),id:one.id,revision:one.request}));
 assert.throws(()=>ctx.postDelete('SHOP-0002',f.code('SHOP-0002'),one.id,one.request));
 ctx.postDelete('SHOP-0001',f.code('SHOP-0001'),one.id,one.request);
 assert.equal(ctx.postFeed_({shop:'SHOP-0001'}).total,0);assert.equal(ctx.postFeed_({shop:'SHOP-0002'}).total,1);
});

test('changing the first introduction image also updates the directory cover in one save',()=>{
 const f=fixture(),{ctx}=f;f.master.rows[0].push('写真URL');f.master.rows[1].push('https://example.invalid/old.jpg');f.master.rows[2].push('');
 let files=0;const shared=[];ctx.postSocialFolder_=()=>({createFile:()=>{files++;return {getId:()=> 'cover-file'};}});ctx.postShareFile_=id=>shared.push(id);ctx.Utilities.base64Decode=value=>Buffer.from(value,'base64');ctx.Utilities.newBlob=(bytes,type,name)=>({bytes,type,name});
 const initial=ctx.merchantScenesGet('SHOP-0001',f.code('SHOP-0001'));
 const scenes=initial.scenes.map(s=>({...s}));scenes[0].src='data:image/jpeg;base64,'+Buffer.from('fixture-image').toString('base64');
 const saved=ctx.merchantScenesSave('SHOP-0001',f.code('SHOP-0001'),'',{revision:initial.revision,scenes});
 const cover=JSON.parse(ctx.publicShopsGet_({parameter:{}}).text).shops.find(s=>s.id==='SHOP-0001').photo;
 assert.equal(cover,'https://lh3.googleusercontent.com/d/cover-file=w600');assert.equal(ctx.omPublic_('SHOP-0001').scenes[0].src,scenes[0].src);assert.equal(shared[0],'cover-file');
 scenes[0].body='画像はそのままで説明だけ変更';ctx.merchantScenesSave('SHOP-0001',f.code('SHOP-0001'),'',{revision:saved.revision,scenes});assert.equal(files,1,'unchanged cover is reused');
});

test('the deployment text and editor source match the complete bundle and preserve existing features',()=>{
 const gs=fs.readFileSync(new URL('./LiveCode.gs',import.meta.url),'utf8'),txt=fs.readFileSync(new URL('./LiveCode.txt',import.meta.url),'utf8'),editor=fs.readFileSync(new URL('./PostEditor.html',import.meta.url),'utf8');
 assert.equal(gs,txt);const marker='\nconst POST_EDITOR_HTML=',index=gs.lastIndexOf(marker);assert.ok(index>0);
 const embedded=gs.slice(index+marker.length).match(/^("(?:\\.|[^"\\])*");/);assert.ok(embedded);assert.equal(JSON.parse(embedded[1]),editor);
 for(const name of ['merchantScenesSave','thanksCardSet','postLoginByCode','postLogout'])assert.ok(gs.includes('function '+name+'('));
 for(const [constant,path] of [['MERCHANT_HTML','MerchantEditor.html'],['SCENES_HTML','Scenes.html']]){const pattern=new RegExp('const '+constant+'=("(?:\\\\.|[^"\\\\])*");');assert.equal(JSON.parse(gs.match(pattern)[1]).trim(),fs.readFileSync(new URL('./'+path,import.meta.url),'utf8').trim());}
 assert.ok(editor.includes('内容は残っています'));assert.ok(editor.includes("$('end').required=$('kind').value==='deal'"));
 new Function(gs);new Function(editor.match(/<script>([\s\S]*)<\/script>/)[1]);
});

test('photo posts and retries work when every Drive operation is denied',()=>{
 const f=fixture(),{ctx}=f;let driveCalls=0;
 ctx.DriveApp=new Proxy({}, {get(){driveCalls++;throw Error('DriveApp.getFolderById を呼び出す権限がありません。');}});
 const photo='data:image/jpeg;base64,/9j/2Q==';
 const draft={clientRequestId:'d'.repeat(32),kind:'deal',body:'缶バッジの写真付き投稿',end:'2026-10-31',photos:[photo]};
 const result=ctx.postSend('SHOP-0001',f.code('SHOP-0001'),draft);
 const repeated=ctx.postSend('SHOP-0001',f.code('SHOP-0001'),draft);
 assert.equal(result.ok,true);assert.equal(repeated.id,result.id);assert.equal(result.posts[0].photos[0],photo);
 assert.equal(ctx.postFeed_({shop:'SHOP-0001'}).posts[0].photos[0],photo);
 assert.equal(ctx.postRows_().length,1);assert.equal(driveCalls,0,'photo publishing must not depend on Drive OGP uploads');
});
