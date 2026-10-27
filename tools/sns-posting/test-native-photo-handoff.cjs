const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../omise-demo/post-share.js'),'utf8');
class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.style={};this.handlers={};}
 append(...children){this.children.push(...children);}
 setAttribute(){}focus(){}select(){}
 addEventListener(name,handler){this.handlers[name]=handler;}
}
async function check(fail){
 let copied;
 const window={};
 vm.runInNewContext(source,{window,document:{createElement:tag=>new Element(tag)},navigator:{clipboard:{writeText:async text=>{if(fail)throw Error('denied');copied=text;}},share:()=>{throw Error('Image sharing must be removed');}}});
 const box=new Element('div');
 window.DXPostShare.mount(box,{body:'Do not insert this text',shareURL:'https://example.com/offer',photos:['data:image/jpeg;base64,abc']});
 const area=box.children[0];
 assert.equal(area.children.filter(n=>n.tagName==='button').length,2);
 assert.equal(area.children[0].textContent,'リンクをコピー');
 await area.children[0].handlers.click();
 if(fail){assert.equal(area.children[3].hidden,false);assert.equal(area.children[3].value,'https://example.com/offer');}
 else {assert.equal(copied,'https://example.com/offer');await area.children[1].handlers.click();assert.equal(copied,'Do not insert this text\n\nhttps://example.com/offer');}
}
(async()=>{await check(false);await check(true);console.log('PASS: link-only copy, no image sharing controls, manual copy fallback. Facebook preview is untested.');})().catch(error=>{console.error(error);process.exitCode=1;});
