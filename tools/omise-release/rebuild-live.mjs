import fs from 'node:fs';
const root=new URL('./',import.meta.url),path=new URL('LiveCode.gs',root),code=fs.readFileSync(path,'utf8'),html=fs.readFileSync(new URL('PostEditor.html',root),'utf8');
const index=code.lastIndexOf('\nconst POST_EDITOR_HTML=');if(index<0)throw Error('Bundle marker missing');
new Function(html.match(/<script>([\s\S]*)<\/script>/)[1]);const result=code.slice(0,index)+'\nconst POST_EDITOR_HTML='+JSON.stringify(html)+';\n';new Function(result);
fs.writeFileSync(path,result);fs.writeFileSync(new URL('LiveCode.txt',root),result);console.log('Editor and full bundle syntax verified');
