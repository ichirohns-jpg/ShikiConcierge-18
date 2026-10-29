'use strict';
(()=>{
 const heading='ふじこの応援紹介🥒',legacyHeading='ふじこの推しのお店🥒';
 const element=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 function url(value){
  try{const u=new URL(String(value).trim());if(u.protocol!=='https:'||u.username||u.password||u.port)return null;
   const host=u.hostname.toLowerCase().replace(/^(www|m|web)\./,'');
   if(!u.hostname||/[\u0000-\u0020]/.test(String(value)))return null;
   return {href:u.href,network:host==='facebook.com'||host==='fb.watch'?'Facebook':host==='instagram.com'?'Instagram':['threads.com','threads.net'].includes(host)?'Threads':'リンク先'};
  }catch{return null;}
 }
 function parse(body){const s=String(body||'');if(![heading,legacyHeading].some(h=>s.startsWith(h+'\n')))return null;const lines=s.trim().split('\n');const link=url(lines.pop());if(!link)return null;return {...link,comment:lines.slice(1).join('\n').trim()};}
 function compose(comment,link){const valid=url(link);if(!valid)throw Error('コピーした投稿・記事のリンク（https://から始まるURL）を貼ってください。');const result=heading+'\n\n'+comment.trim()+'\n\n'+valid.href;if(result.length>1500)throw Error('紹介文とリンクを合わせて1,500文字以内にしてください。');return result;}
 const scripts=new Map();
 function script(src,refresh){if(scripts.has(src))return scripts.get(src).then(()=>refresh?.());const p=new Promise((resolve,reject)=>{const s=element('script');s.src=src;s.async=true;s.onload=()=>{refresh?.();resolve();};s.onerror=()=>{scripts.delete(src);s.remove();reject(Error('SNSの表示を読み込めませんでした。'));};document.head.append(s);});scripts.set(src,p);return p;}
 async function canonical(link){
  if(link.network!=='Threads'||/\/(?:@[^/]+\/post|t)\/[^/]+/.test(new URL(link.href).pathname))return link.href;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{const response=await fetch('https://graph.threads.com/oembed?url='+encodeURIComponent(link.href),{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)throw Error();const data=await response.json();const doc=new DOMParser().parseFromString(data.html||'','text/html');const candidate=doc.querySelector('[data-text-post-permalink]')?.getAttribute('data-text-post-permalink');const found=url(candidate);if(found?.network==='Threads')return found.href;throw Error();}finally{clearTimeout(timer);}
 }
 function mount(box,link){
  const card=element('div');card.className='sns-recommend';const label=element('strong',link.network==='リンク先'?'応援したい投稿・記事':link.network+'の元投稿');const content=element('div');content.className='sns-recommend-embed';const open=element('a',link.network==='リンク先'?'元の投稿・記事を開く ↗':'元の投稿を'+link.network+'で見る ↗');open.href=link.href;open.target='_blank';open.rel='noopener noreferrer';open.className='sns-recommend-open';const note=element('p','元の投稿の写真・文章を表示します。表示されない場合は、上のリンクからご覧ください。');note.className='sns-recommend-note';card.append(label,content,open,note);box.append(card);
  const render=async()=>{
   if(link.network==='Facebook'){const frame=element('iframe');frame.src='https://www.facebook.com/plugins/post.php?href='+encodeURIComponent(link.href)+'&show_text=true&width=500';frame.title='お店のFacebook投稿';frame.loading='lazy';frame.allow='encrypted-media; picture-in-picture; web-share';frame.referrerPolicy='no-referrer';frame.style.cssText='width:100%;height:640px;border:0;max-height:none';content.append(frame);}
   else if(link.network==='Threads'){const href=await canonical(link);if(!card.isConnected)return;const quote=element('blockquote');quote.className='text-post-media';quote.setAttribute('data-text-post-permalink',href);quote.setAttribute('data-text-post-version','0');const a=element('a','Threadsで投稿を見る');a.href=href;a.target='_blank';a.rel='noopener noreferrer';quote.append(a);content.append(quote);await script('https://www.threads.com/embed.js',()=>window.text_post_embed?.process?.());}
   else if(link.network==='Instagram'){const quote=element('blockquote');quote.className='instagram-media';quote.setAttribute('data-instgrm-permalink',link.href);quote.setAttribute('data-instgrm-version','14');content.append(quote);await script('https://www.instagram.com/embed.js',()=>window.instgrm?.Embeds?.process?.());}
  };
  if(link.network==='リンク先')note.textContent='ふじこが応援したい投稿・記事です。上のリンクからご覧ください。';
  render().catch(()=>{content.replaceChildren();note.textContent='このリンクでは写真・文章のプレビューを表示できませんでした。「元の投稿を見る」から開けます。Threadsは投稿を開いた後の「/@名前/post/…」のリンクを使うと表示しやすくなります。';});
  return card;
 }
 const style=element('style');style.textContent='.sns-recommend{margin:18px;padding:16px;background:#f8f3fa;border:1px solid #e5d5eb;border-radius:18px;min-width:0;overflow:hidden}.sns-recommend strong{display:block;color:#531a65;font-size:18px;margin-bottom:12px}.sns-recommend-embed{max-width:100%;overflow:hidden}.sns-recommend-embed iframe{max-width:100%!important;max-height:none!important;margin:0!important}.sns-recommend-embed blockquote{margin:0 auto!important;min-width:0!important;max-width:100%!important}.sns-recommend-open{display:block;margin-top:14px;padding:13px 15px;border-radius:12px;background:#531a65;color:white!important;text-decoration:none;font-size:18px;font-weight:700;overflow-wrap:anywhere}.sns-recommend-note{font-size:15px!important;line-height:1.6!important;color:#6b5d6f;margin:12px 0 0}';document.head.append(style);
 window.DXSNSRecommend={heading,url,parse,compose,mount};
})();


