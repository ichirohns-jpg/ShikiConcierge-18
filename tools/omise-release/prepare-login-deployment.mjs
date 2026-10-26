// Patch a freshly copied live bundle; preserve unrelated work and the existing editor.
import fs from 'node:fs';
const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('Usage: node prepare-login-deployment.mjs live-before.gs output.gs');
const root=new URL('./',import.meta.url),template=fs.readFileSync(new URL('LiveCode.gs',root),'utf8'),wanted=fs.readFileSync(new URL('PostEditor.html',root),'utf8');
let code=fs.readFileSync(input,'utf8');
for(const name of ['omAuth_','postLogin']){
 const re=new RegExp('^function '+name+'\\(.*$','m'),replacement=template.match(re)?.[0];if(!replacement||!re.test(code))throw Error(name+' missing');code=code.replace(re,()=>replacement);
}
const marker='\nconst POST_EDITOR_HTML=',index=code.lastIndexOf(marker);if(index<0)throw Error('Editor bundle missing');
const before=code.slice(0,index),html=JSON.parse(code.slice(index+marker.length).trim().replace(/;$/,''));
let updated=html;
const oldForm=updated.match(/<section id="login">[\s\S]*?<\/section>/)?.[0],newForm=wanted.match(/<section id="login">[\s\S]*?<\/section>\n<div id="account"[\s\S]*?<\/div>/)?.[0];
if(!oldForm||!newForm)throw Error('Login form missing');updated=updated.replace(oldForm,()=>newForm);
const oldLogin=updated.match(/^\$\('loginForm'\)\.onsubmit=.*$/m)?.[0],newLogin=wanted.slice(wanted.indexOf("const rememberKey="),wanted.indexOf('function renderOwn()'));
if(!oldLogin||!newLogin.includes('async function restoreLogin'))throw Error('Login logic missing');updated=updated.replace(oldLogin,()=>newLogin).replace('</script>','restoreLogin();\n</script>');
new Function(updated.match(/<script>([\s\S]*)<\/script>/)[1]);
const helpers=fs.readFileSync(new URL('RememberLogin.gs',root),'utf8');
const result=before+'\n// BEGIN REMEMBER LOGIN\n'+helpers+'\n// END REMEMBER LOGIN\nconst POST_EDITOR_HTML='+JSON.stringify(updated)+';\n';new Function(result);fs.writeFileSync(output,result);fs.writeFileSync(output+'.html',updated);
console.log('Live-only login patch prepared; existing article actions preserved');
