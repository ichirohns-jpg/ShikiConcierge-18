'use strict';
(()=>{
 const host=document.getElementById('benefitImageShare');if(!host)return;
 const greeting=document.getElementById('friendGreeting');if(greeting)greeting.hidden=new URLSearchParams(location.search).get('from')!=='friend';
 const shortURL='https://is.gd/eNI6PL';
 const section=document.createElement('section');section.className='simple-sns-share';section.setAttribute('aria-label','SNSに投稿する');
 const title=document.createElement('h2');title.textContent='SNSに投稿する';
 const copy=document.createElement('button');copy.type='button';copy.className='sns-copy';copy.textContent='リンクをコピー';
 const status=document.createElement('p');status.className='sns-share-status';status.setAttribute('role','status');status.textContent='コピーして、投稿したいSNSに貼り付けてください。';
 const fallback=document.createElement('input');fallback.type='url';fallback.readOnly=true;fallback.value=shortURL;fallback.hidden=true;fallback.setAttribute('aria-label','コピーするリンク');
 copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(shortURL);status.textContent='コピーしました。SNSに貼り付けてください。';}catch(e){fallback.hidden=false;fallback.focus();fallback.select();status.textContent='このリンクを長押ししてコピーしてください。';}});
 const links=document.createElement('nav');links.className='sns-links';links.setAttribute('aria-label','投稿するSNSを開く');
 [['Facebook','https://www.facebook.com/','facebook'],['Instagram','https://www.instagram.com/','instagram'],['X','https://x.com/','x'],['LINE','https://line.me/R/share?text='+encodeURIComponent(shortURL),'line']].forEach(([label,url,name])=>{const a=document.createElement('a');a.textContent=label;a.href=url;a.className='sns-destination '+name;a.target='_blank';a.rel='noopener';links.append(a);});
 section.append(title,copy,status,fallback,links);host.replaceChildren(section);
})();
