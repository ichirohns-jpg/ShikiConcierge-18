/** Authenticated management calls. The same per-store checks as google.script.run apply. */
function ownerVersion_(){return {ok:true,version:'firstparty-owner-v1'};}
function doPost(e){
 try{
  const raw=e&&e.postData&&e.postData.contents;
  if(!raw||raw.length>24000000)throw Error('送信内容を確認してください。');
  const request=JSON.parse(raw);
  if(request.api!=='owner-v1'||!Array.isArray(request.args)||request.args.length>8)throw Error('送信形式を確認してください。');
  // Never dispatch arbitrary global functions, setup routines or private helpers.
  const methods={postLoginByCode:postLoginByCode,postLogin:postLogin,postOwn:postOwn,postSend:postSend,postDelete:postDelete,postLogout:postLogout,thanksCardSet:thanksCardSet,merchantScenesGet:merchantScenesGet,merchantScenesSave:merchantScenesSave,merchantSubmit:merchantSubmit,merchantDecide:merchantDecide};
  if(!Object.prototype.hasOwnProperty.call(methods,request.method))throw Error('この操作には対応していません。');
  const result=methods[request.method].apply(null,request.args);
  return respond_({ok:true,result:result},'');
 }catch(e){return respond_({ok:false,error:e instanceof SyntaxError?'送信形式を確認してください。':String(e&&e.message||'処理を完了できませんでした。')},'');}
}
