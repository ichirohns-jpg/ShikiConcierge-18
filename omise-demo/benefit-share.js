'use strict';
(()=>{
 const host=document.getElementById('benefitImageShare');
 if(!host||!window.DXPostShare)return;
 const greeting=document.getElementById('friendGreeting');if(greeting)greeting.hidden=new URLSearchParams(location.search).get('from')!=='friend';
 const article={
  id:'cafe-benefit-sample',name:'おうちcafeパン工房',
  title:'【掲載見本・利用不可】パン500円以上でミニパン1個',
  body:'特典の掲載見本です。実際のセールやプレゼントは実施していません。\n\n表示例：パンを500円以上買うと、ミニパン1個プレゼント。\n受け取り方の表示例：お会計前に画面を見せて「ふじこを見たよ」と伝える。\n\n埼玉県志木市本町2-5-46 やまかく館1F',
  url:'https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/cafe-benefit.html',
  promotion:{condition:'パンを500円以上買うと',reward:'ミニパン1個\nプレゼント',keyword:'ふじこを見たよ',address:'埼玉県志木市本町2-5-46 やまかく館1F'}
 };
 const cardURL='https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/cafe-benefit-card.html';
 const card=document.createElement('section');card.className='click-card-share';card.setAttribute('aria-label','画像タップで特典ページを開ける共有');
 const title=document.createElement('h2');title.textContent='画像タップで特典を開ける投稿';
 const note=document.createElement('p');note.textContent='特典画像をリンクカードとして共有します。画像をタップすると、このDXの特典ページが開きます。投稿文はFacebookの画面で書けます。';
 const image=document.createElement('img');image.src='./cafe-benefit-ogp-v1.jpg';image.width=1200;image.height=630;image.alt='特典の掲載見本・実際には利用できません。パン500円以上でミニパン1個。志木なるほど お店めぐりDX';
 const facebook=document.createElement('a');facebook.className='btn';facebook.href='https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(cardURL);facebook.target='_blank';facebook.rel='noopener';facebook.textContent='Facebookで画像リンクを共有';
 const line=document.createElement('a');line.className='btn line';line.href='https://line.me/R/share?text='+encodeURIComponent('【掲載見本・利用不可】おうちcafeパン工房の特典例\n'+cardURL);line.target='_blank';line.rel='noopener';line.textContent='LINEで画像リンクを送る';
 const hint=document.createElement('p');hint.className='muted';hint.textContent='掲載見本のため、特典は利用できません。SNS側の画像サイズ・表示方法は投稿前に確認してください。';
 card.append(title,note,image,facebook,line,hint);host.append(card);
 const more=document.createElement('details');more.className='photo-post-options';const summary=document.createElement('summary');summary.textContent='画像を保存・ほかのSNSに投稿';const images=document.createElement('div');more.append(summary,images);host.append(more);window.DXPostShare.mount(images,article);
})();
