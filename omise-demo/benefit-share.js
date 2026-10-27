'use strict';
(()=>{
 const host=document.getElementById('benefitImageShare');if(!host)return;
 const greeting=document.getElementById('friendGreeting');if(greeting)greeting.hidden=new URLSearchParams(location.search).get('from')!=='friend';
 const shareURL="https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/cafe-benefit-link.html";
 const shareText='おうちcafeパン工房\n\n【掲載見本・利用不可】パンを500円以上買うとミニパン1個プレゼント\n\n'+shareURL;
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 const section=el('section',null,'simple-sns-share');section.setAttribute('aria-label','この特典を友だちに教える');
 const title=el('h2','この特典を友だちに教える');
 const note=el('p','ボタンを押すと、送る相手や投稿先を選べます。','sns-share-guide');
 const links=el('nav',null,'sns-links');links.setAttribute('aria-label','友だちに教える方法');
 const destinations=[
  ['LINEで友だちに送る','https://social-plugins.line.me/lineit/share?url='+encodeURIComponent(shareURL),'line'],
  ['Facebookで教える','https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(shareURL),'facebook'],
  ['Xで教える','https://twitter.com/intent/tweet?text='+encodeURIComponent(shareText),'x']
 ];
 destinations.forEach(([label,url,name])=>{const a=el('a',label,'sns-destination '+name);a.href=url;a.target='_blank';a.rel='noopener';links.append(a);});
 const copy=el('button','リンクをコピー','sns-copy');copy.type='button';
 const status=el('p','', 'sns-share-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const fallback=el('textarea');fallback.readOnly=true;fallback.value=shareText;fallback.hidden=true;fallback.rows=6;fallback.setAttribute('aria-label','コピーする文章とリンク');
 fallback.style.cssText='width:100%;box-sizing:border-box;font:inherit;line-height:1.6;padding:12px';
 copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(shareText);status.textContent='コピーしました。送りたい相手のトークやSNSに貼り付けてください。';}catch(e){fallback.hidden=false;fallback.focus();fallback.select();status.textContent='ここを長押ししてコピーしてください。';}});
 section.append(title,note,links,copy,status,fallback);host.replaceChildren(section);
})();
