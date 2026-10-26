'use strict';
(()=>{
 const host=document.getElementById('benefitImageShare');if(!host)return;
 const greeting=document.getElementById('friendGreeting');if(greeting)greeting.hidden=new URLSearchParams(location.search).get('from')!=='friend';
 const shortURL='https://is.gd/t4tkaP';
 const caption='【掲載見本・利用不可】おうちcafeパン工房\n\nパンを500円以上買うと、ミニパン1個プレゼント。\n受け取り方の例：お会計前に「ふじこを見たよ」と伝える。\nこの特典は実際には利用できません。\n\n志木なるほど お店めぐりDX\n'+shortURL;
 const section=document.createElement('section');section.className='simple-sns-share';section.setAttribute('aria-label','SNSに投稿する');
 const title=document.createElement('h2');title.textContent='SNSに投稿する';
 const copy=document.createElement('button');copy.type='button';copy.className='sns-copy';copy.textContent='① 文章とDXリンクをコピー';
 const status=document.createElement('p');status.className='sns-share-status';status.setAttribute('role','status');status.textContent='①文章をコピー → ②画像を保存 → ③SNSで貼り付け、保存した画像を添付。';
 const fallback=document.createElement('textarea');fallback.rows=6;fallback.readOnly=true;fallback.value=caption;fallback.hidden=true;fallback.setAttribute('aria-label','コピーする投稿文');
 copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(caption);status.textContent='コピーしました。次に画像を保存し、SNSで文章を貼り付けて画像を添付してください。';}catch(e){fallback.hidden=false;fallback.focus();fallback.select();status.textContent='この文章を長押ししてコピーしてください。';}});
 const links=document.createElement('nav');links.className='sns-links';links.setAttribute('aria-label','投稿するSNSを開く');
 [['Facebook','https://www.facebook.com/','facebook'],['Instagram','https://www.instagram.com/','instagram'],['X','https://x.com/','x'],['LINE','https://line.me/','line']].forEach(([label,url,name])=>{const a=document.createElement('a');a.textContent=label;a.href=url;a.className='sns-destination '+name;a.target='_blank';a.rel='noopener';links.append(a);});
 const save=document.createElement('a');save.className='sns-copy sns-composite-save';save.textContent='② 合成画像を保存';save.href='./cafe-benefit-sns-composite.jpg?v=20261026-brand9';save.download='shiki-dx-benefit.jpg';
 const preview=document.createElement('img');preview.src=save.href;preview.alt='SNSに載せる合成画像：お店の特典と下部のDXバナー';preview.className='sns-final-preview';preview.width=1080;preview.height=1350;preview.loading='lazy';
 const next=document.createElement('p');next.textContent='③ 投稿するSNSを開く';next.className='sns-share-next';
 section.append(title,preview,copy,save,status,fallback,next,links);host.replaceChildren(section);
})();
