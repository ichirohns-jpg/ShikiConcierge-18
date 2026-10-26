'use strict';
(()=>{
 const host=document.getElementById('benefitImageShare');if(!host)return;
 const greeting=document.getElementById('friendGreeting');if(greeting)greeting.hidden=new URLSearchParams(location.search).get('from')!=='friend';
 const shortURL='https://is.gd/eNI6PL';
 const caption='【掲載見本・利用不可】おうちcafeパン工房\n\nパンを500円以上買うと、ミニパン1個プレゼント。\n受け取り方の例：お会計前に「ふじこを見たよ」と伝える。\nこの特典は実際には利用できません。\n\n志木なるほど お店めぐりDX\n'+shortURL;
 const section=document.createElement('section');section.className='simple-sns-share';section.setAttribute('aria-label','SNSに投稿する');
 const title=document.createElement('h2');title.textContent='SNSに投稿する';
 const copy=document.createElement('button');copy.type='button';copy.className='sns-copy';copy.textContent='文章とリンクをコピー';
 const status=document.createElement('p');status.className='sns-share-status';status.setAttribute('role','status');status.textContent='文章を貼り付け、保存した画像をSNSに添付してください。';
 const fallback=document.createElement('input');fallback.type='text';fallback.readOnly=true;fallback.value=caption;fallback.hidden=true;fallback.setAttribute('aria-label','コピーするリンク');
 copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(caption);status.textContent='文章とリンクをコピーしました。SNSに貼り付けてください。';}catch(e){fallback.hidden=false;fallback.focus();fallback.select();status.textContent='この文章を長押ししてコピーしてください。';}});
 const links=document.createElement('nav');links.className='sns-links';links.setAttribute('aria-label','投稿するSNSを開く');
 [['Facebook','https://www.facebook.com/','facebook'],['Instagram','https://www.instagram.com/','instagram'],['X','https://x.com/','x'],['LINE','https://line.me/R/share?text='+encodeURIComponent(caption),'line']].forEach(([label,url,name])=>{const a=document.createElement('a');a.textContent=label;a.href=url;a.className='sns-destination '+name;a.target='_blank';a.rel='noopener';links.append(a);});
 const save=document.createElement('a');save.className='sns-copy sns-composite-save';save.textContent='画像を保存';save.href='./cafe-benefit-sns-composite.jpg';save.download='shiki-dx-benefit.jpg';
 section.append(title,copy,save,status,fallback,links);host.replaceChildren(section);
})();
