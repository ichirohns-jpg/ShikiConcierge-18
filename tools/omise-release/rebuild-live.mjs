import fs from 'node:fs';
const root=new URL('./',import.meta.url),path=new URL('LiveCode.gs',root),code=fs.readFileSync(path,'utf8'),html=fs.readFileSync(new URL('PostEditor.html',root),'utf8');
const index=code.lastIndexOf('\nconst POST_EDITOR_HTML=');if(index<0)throw Error('Bundle marker missing');
const remember=fs.readFileSync(new URL('RememberLogin.gs',root),'utf8');
let server=code.slice(0,index).replace(/\n\/\/ BEGIN REMEMBER LOGIN[\s\S]*?\/\/ END REMEMBER LOGIN\n?/,'\n');
const posts=fs.readFileSync(new URL('Posts.gs',root),'utf8');
const articlePattern=/\/\* Article revisions:[\s\S]*?function setupPosts\(\)\{[^\n]*\}\n?/;
if(!articlePattern.test(server))throw Error('Article bundle markers missing');
server=server.replace(articlePattern,posts.trim()+'\n\n');
new Function(html.match(/<script>([\s\S]*)<\/script>/)[1]);const result=server+'\n// BEGIN REMEMBER LOGIN\n'+remember+'\n// END REMEMBER LOGIN\nconst POST_EDITOR_HTML='+JSON.stringify(html)+';\n';new Function(result);
fs.writeFileSync(path,result);fs.writeFileSync(new URL('LiveCode.txt',root),result);console.log('Editor and full bundle syntax verified');

