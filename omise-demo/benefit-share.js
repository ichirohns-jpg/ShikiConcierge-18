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
 window.DXPostShare.mount(host,article);
})();
