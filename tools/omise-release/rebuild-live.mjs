import fs from 'node:fs';
const root=new URL('./',import.meta.url),path=new URL('LiveCode.gs',root),code=fs.readFileSync(path,'utf8'),html=fs.readFileSync(new URL('PostEditor.html',root),'utf8');
const marker='\nconst POST_EDITOR_HTML=',index=code.lastIndexOf(marker);if(index<0)throw Error('Bundle marker missing');
const after=code.slice(index+marker.length),embedded=after.match(/^("(?:\\.|[^"\\])*");/);if(!embedded)throw Error('Embedded editor string missing');
const suffix=after.slice(embedded[0].length);
let server=code.slice(0,index);
const posts=fs.readFileSync(new URL('Posts.gs',root),'utf8');
const articlePattern=/\/\* Article revisions:[\s\S]*?function setupPosts\(\)\{[^\n]*\}\n?/;
if(!articlePattern.test(server))throw Error('Article bundle markers missing');
server=server.replace(articlePattern,posts.trim()+'\n\n');
new Function(html.match(/<script>([\s\S]*)<\/script>/)[1]);
let result=server+marker+JSON.stringify(html)+';'+suffix;
const basic=fs.readFileSync(new URL('MerchantEditor.html',root),'utf8'),scenes=fs.readFileSync(new URL('Scenes.html',root),'utf8'),sceneServer=fs.readFileSync(new URL('Scenes.gs',root),'utf8');
for(const [name,value] of [['MERCHANT_HTML',basic],['SCENES_HTML',scenes]]){
 new Function(value.match(/<script>([\s\S]*)<\/script>/)[1]);
 const pattern=new RegExp('const '+name+'=("(?:\\\\.|[^"\\\\])*");');
 if(!pattern.test(result))throw Error('Editor missing: '+name);
 result=result.replace(pattern,()=> 'const '+name+'='+JSON.stringify(value)+';');
}
const scenePattern=/\/\*\* 店舗共通の紹介4枠。[\s\S]*?(?=\nconst SCENES_HTML=)/;
if(!scenePattern.test(result))throw Error('Scene server markers missing');
result=result.replace(scenePattern,()=>sceneServer.trim()+'\n');
for(const name of ['merchantScenesSave','thanksCardSet','postLoginByCode','postLogout'])if(!result.includes('function '+name+'('))throw Error('Live helper missing: '+name);
new Function(result);fs.writeFileSync(path,result);fs.writeFileSync(new URL('LiveCode.txt',root),result);
console.log('Full bundle verified; server helpers and trailing scene editor preserved');

