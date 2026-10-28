'use strict';
(()=>{
 const intro=document.querySelector('#intro'),photos=document.querySelector('#photos'),subtitle=intro?.querySelector('.subtitle');
 if(!intro||!photos||!subtitle)return;
 document.body.classList.add('shop-top-designed');
 const description=intro.querySelector('.profile-description')||subtitle.nextElementSibling;
 if(description?.tagName==='P')description.classList.add('profile-description');
 const hero=document.createElement('div');hero.className='shop-top-visual';hero.setAttribute('aria-label','写真で見るお店・活動の紹介');subtitle.after(hero);
 const element=(tag,text,cls)=>{const node=document.createElement(tag);if(text)node.textContent=text;if(cls)node.className=cls;return node;};
 let fingerprint='';
 function render(){
  const figures=[...photos.querySelectorAll('.promo-scene')].slice(0,4);
  const scenes=figures.map((figure,i)=>{figure.id='shop-scene-'+(i+1);const image=figure.querySelector('img');return {src:image?.getAttribute('src')||'',alt:image?.alt||'',title:figure.querySelector('.scene-title')?.textContent||'紹介 '+(i+1),illustration:!!figure.querySelector('figcaption>span'),target:'#'+figure.id};}).filter(s=>s.src);
  const key=JSON.stringify(scenes);if(!scenes.length||key===fingerprint)return;fingerprint=key;
  const guide=element('div',null,'shop-hero-guide'),avatar=element('img');avatar.src='./fujiko-avatar.jpeg';avatar.alt='';avatar.width=38;avatar.height=38;guide.append(avatar,element('span','ふじこと見つける、志木の魅力'),element('span','✦','shop-hero-spark'));
  const main=element('a',null,'shop-hero-main');main.href=scenes[0].target;main.setAttribute('aria-label',scenes[0].title+'の紹介を見る');
  const backdrop=element('img');backdrop.src=scenes[0].src;backdrop.alt='';backdrop.className='shop-hero-backdrop';backdrop.setAttribute('aria-hidden','true');
  const image=element('img');image.src=scenes[0].src;image.alt=scenes[0].alt||scenes[0].title;image.className='shop-hero-picture';image.loading='eager';image.decoding='async';
  main.append(backdrop,image);
  const caption=element('a',null,'shop-hero-caption');caption.href=scenes[0].target;caption.append(element('span','01','shop-hero-number'),element('span',scenes[0].title),element('span','紹介を見る →','shop-hero-more'));
  const grid=element('div',null,'shop-hero-thumbnails');
  for(const [i,scene] of scenes.slice(1).entries()){const link=element('a',null,'shop-hero-thumb');link.href=scene.target;link.setAttribute('aria-label',scene.title+'の紹介を見る');const img=element('img');img.src=scene.src;img.alt=scene.alt||scene.title;img.loading='eager';img.decoding='async';const label=element('span',scene.title);link.append(img,label);grid.append(link);}
  const note=element('p',scenes.some(s=>s.illustration)?'画像は活動紹介用のイメージです。気になる画像を押すと詳しく見られます。':'気になる画像を押すと、詳しい紹介が見られます。','shop-hero-note');
  hero.replaceChildren(guide,main,caption,grid,note);
 }
 let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render();});};
 new MutationObserver(schedule).observe(photos,{childList:true,subtree:true,attributes:true,attributeFilter:['src','alt']});
 render();
})();
