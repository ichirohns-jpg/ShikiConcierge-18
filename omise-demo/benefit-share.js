'use strict';
(()=>{
 const host=document.getElementById('benefitImageShare');if(!host)return;
 const greeting=document.getElementById('friendGreeting');if(greeting)greeting.hidden=new URLSearchParams(location.search).get('from')!=='friend';
 const shareURL="https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/cafe-benefit-link.html";
 const facebookURL="https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/cafe-benefit-facebook-v2.html";
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 const section=el('section',null,'simple-sns-share');section.setAttribute('aria-label','SNSに投稿する');
 const title=el('h2','SNSに投稿する');
 const preview=el('img',null,'sns-final-preview');preview.src="https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/cafe-benefit-wide-v2.jpg";preview.alt='リンクの表紙：パン500円以上でミニパン1個の掲載見本とDXの案内';preview.width=1200;preview.height=630;
 const copy=el('button','リンクをコピー','sns-copy');copy.type='button';
 const status=el('p','リンクをSNSに貼り付けてから、文章を自由に書いてください。','sns-share-status');status.setAttribute('role','status');
 const fallback=el('input');fallback.type='text';fallback.readOnly=true;fallback.value=shareURL;fallback.hidden=true;fallback.setAttribute('aria-label','コピーするリンク');
 copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(shareURL);status.textContent='リンクをコピーしました。SNSに貼り付けて、文章を書いてください。';}catch(e){fallback.hidden=false;fallback.focus();fallback.select();status.textContent='このリンクを長押ししてコピーしてください。';}});
 const links=el('nav',null,'sns-links');links.setAttribute('aria-label','投稿するSNSを開く');
 [['Facebook','https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(facebookURL),'facebook'],['X','https://twitter.com/intent/tweet?url='+encodeURIComponent(shareURL),'x'],['LINE','https://line.me/R/share?text='+encodeURIComponent('https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/cafe-benefit-composite.html'),'line']].forEach(([label,url,name])=>{const a=el('a',label,'sns-destination '+name);a.href=url;a.target='_blank';a.rel='noopener';links.append(a);});
 section.append(title,preview,copy,status,fallback,links);host.replaceChildren(section);
})();
