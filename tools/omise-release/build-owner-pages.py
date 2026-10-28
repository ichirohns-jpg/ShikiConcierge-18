from pathlib import Path
import re,json,sys
folder=Path(__file__).parent
output=Path(sys.argv[1]) if len(sys.argv)>1 else folder.parents[1]/'omise-demo'
output.mkdir(parents=True,exist_ok=True)
endpoint='https://script.google.com/macros/s/AKfycbzMec1R3le4e-cOUyBUl6Eq2dU3OI-5HHtkEyJQT7SWx4IjUHGtW8Z3zatJxoA2GUhn2A/exec'
styles='<meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><style>body{font-size:18px}p,li{font-size:17px;line-height:1.85}.muted{font-size:16px}button,.btn,input,textarea,select{font-size:18px}h1{font-size:29px}h2{font-size:24px}.admin-nav a{font-size:16px}#code{font-size:18px}#login[hidden]{display:none!important}</style><script src="./owner-runtime.js?v=20261028-firstparty1"></script>'
for original,out in [('PostEditor.html','owner.html'),('Scenes.html','owner-scenes.html'),('Merchant.html','owner-info.html')]:
 s=json.loads(re.search(r'^const MERCHANT_HTML=(".*");$',(folder/'LiveCode.gs').read_text(),re.M)[1]) if original=='Merchant.html' else (folder/original).read_text()
 # All three pages use one storage module on the same first-party origin.
 s,n=re.subn(r'const sessionMemory=\(\(\)=>\{.*?\n\}\)\(\);','const sessionMemory=window.omiseOwnerSession;',s,count=1,flags=re.S);assert n==1,original
 if original=='Merchant.html':
  old="function rpc(name,args,done,failed=fail){busy(true);google.script.run.withSuccessHandler(r=>{busy(false);done(r);}).withFailureHandler(e=>{busy(false);failed(e);})[name](...args);}"
  new="function rpc(name,args,done,failed=fail){busy(true);return window.omiseOwnerCall(name,args).then(r=>{busy(false);done(r);},e=>{busy(false);failed(e);});}"
 elif original=='Scenes.html':
  old="function rpc(name,args){busy(true);return new Promise((resolve,reject)=>google.script.run.withSuccessHandler(r=>{busy(false);resolve(r);}).withFailureHandler(e=>{busy(false);status(e.message||String(e));reject(e);})[name](...args));}"
  new="function rpc(name,args){busy(true);return window.omiseOwnerCall(name,args).then(r=>{busy(false);return r;},e=>{busy(false);status(e.message||String(e));throw e;});}"
 else:
  old="function rpc(name,args){busy(true);return new Promise((resolve,reject)=>google.script.run.withSuccessHandler(r=>{busy(false);resolve(r);}).withFailureHandler(e=>{busy(false);status(e.message||String(e));reject(e);})[name](...args));}"
  new="function rpc(name,args){busy(true);return window.omiseOwnerCall(name,args).then(r=>{busy(false);return r;},e=>{busy(false);status(e.message||String(e));throw e;});}"
 assert old in s,original
 s=s.replace(old,new)
 s=s.replace("const initialKind='__OMISE_INITIAL_KIND__'==='deal'?'deal':'notice';","const initialKind=new URLSearchParams(location.search).get('kind')==='deal'?'deal':'notice';")
 for mode,target in [('edit','owner.html'),('scenes','owner-scenes.html'),('info','owner-info.html')]:
  s=s.replace(endpoint+'?mode='+mode,'./'+target+'#top')
 s=s.replace('target="_top"','target="_self"')
 if '<main id="top">' not in s:s=s.replace('<main>','<main id="top">',1)
 s=s.replace('</head>',styles+'</head>',1)
 assert 'google.script.run' not in s,original
 (output/out).write_text(s)
