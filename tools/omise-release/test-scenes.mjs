import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const tables=new Map(),props=new Map();let serial=0;
class Range{constructor(sheet,r,c,n=1,m=1){Object.assign(this,{sheet,r,c,n,m});}getDisplayValues(){return Array.from({length:this.n},(_,i)=>Array.from({length:this.m},(_,j)=>String(this.sheet.rows[this.r-1+i]?.[this.c-1+j]??'')));}setValue(v){return this.setValues([[v]]);}setValues(rows){rows.forEach((row,i)=>row.forEach((v,j)=>{const target=this.sheet.rows[this.r-1+i]??(this.sheet.rows[this.r-1+i]=[]);target[this.c-1+j]=v;}));return this;}setFontWeight(){return this;}}
class Sheet{constructor(){this.rows=[];}appendRow(r){this.rows.push(r);return this;}getDataRange(){return new Range(this,1,1,this.rows.length,Math.max(...this.rows.map(r=>r.length),1));}getRange(...a){if(typeof a[0]==='string')return {setFontWeight(){}};return new Range(this,...a);}getLastRow(){return this.rows.length;}setFrozenRows(){}setColumnWidth(){}}
const master=new Sheet();master.rows=[['店舗ID','店名','公開状態','掲載許可','紹介文','更新日'],['SHOP-0002','ハートネット志木','下書き','未確認','元の紹介','2026-10-25']];tables.set('店舗一覧',master);
const book={getSheetByName:n=>tables.get(n),insertSheet:n=>{const s=new Sheet();tables.set(n,s);return s;}};
const ctx=vm.createContext({SpreadsheetApp:{openById:()=>book},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k),setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k),getProperties:()=>Object.fromEntries(props)})},Utilities:{getUuid:()=>String(++serial).padStart(8,'0')+'-0000-4000-8000-000000000000',formatDate:(_d,_tz,fmt)=>fmt.includes('HH')?'2026-10-26 12:00:00':'2026-10-26'},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},ScriptApp:{getService:()=>({getUrl:()=>'https://example.test/exec'})},Date,console});
vm.runInContext(fs.readFileSync(new URL('./LiveCode.gs',import.meta.url),'utf8'),ctx);ctx.setupMerchantEditing();
const code=props.get('merchant:SHOP-0002'),admin=props.get('merchant:ADMIN');
assert.throws(()=>ctx.merchantScenesGet('SHOP-0002','wrong','SHOP-0002'));
const initial=ctx.merchantScenesGet('SHOP-0002',code,'SHOP-0001');assert.equal(initial.shopId,'SHOP-0002');assert.equal(initial.scenes.length,4);assert.equal(initial.scenes[0].title,'地域活動');
const scenes=JSON.parse(JSON.stringify(initial.scenes));scenes[0].title='編集したタイトル';scenes[0].body='変更した説明\n2行目';scenes[1].src='data:image/jpeg;base64,'+'A'.repeat(70000);
assert.throws(()=>ctx.merchantScenesSave('SHOP-0002',code,'SHOP-0002',{revision:initial.revision,scenes:scenes.slice(0,3)}));
assert.throws(()=>ctx.merchantScenesSave('SHOP-0002',code,'SHOP-0002',{revision:initial.revision,scenes:scenes.map((s,i)=>i? s:{...s,src:'javascript:alert(1)'})}));
const saved=ctx.merchantScenesSave('SHOP-0002',code,'SHOP-0001',{revision:initial.revision,scenes});assert.equal(saved.ok,true);
const loaded=ctx.merchantScenesGet('ADMIN',admin,'SHOP-0002');assert.equal(loaded.scenes[0].title,'編集したタイトル');assert.equal(loaded.scenes[0].body,'変更した説明\n2行目');assert.equal(loaded.scenes[1].src,scenes[1].src);assert.equal(loaded.scenes[2].src,initial.scenes[2].src);
assert.equal(ctx.omPublic_('SHOP-0002').scenes[0].title,'編集したタイトル');assert.throws(()=>ctx.merchantScenesSave('SHOP-0002',code,'SHOP-0002',{revision:initial.revision,scenes}));
assert.equal(tables.get('店舗紹介4枠').getLastRow(),2);assert.ok(!JSON.stringify(ctx.omPublic_('SHOP-0002')).includes(code));
const adminSaved=ctx.merchantScenesSave('ADMIN',admin,'SHOP-0002',{revision:saved.revision,scenes});assert.equal(adminSaved.ok,true);
console.log('PASS: initial four slots, store isolation, administrator edit, title/text/image round trip, chunk reconstruction, unchanged images, validation, public feed and conflict protection');
