'use strict';
(()=>{
 const intro=document.querySelector('#intro'),photos=document.querySelector('#photos'),subtitle=intro?.querySelector('.subtitle');
 if(!intro||!photos||!subtitle)return;
 document.body.classList.add('shop-top-designed');
 const description=intro.querySelector('.profile-description')||subtitle.nextElementSibling;
 if(description?.tagName==='P')description.classList.add('profile-description');
 const hero=document.createElement('div');hero.className='shop-top-visual';hero.setAttribute('aria-label','写真で見るお店・活動の紹介');subtitle.after(hero);
 const element=(tag,text,cls)=>{const node=document.createElement(tag);if(text)node.textContent=text;if(cls)node.className=cls;return node;};
 // One SNS renderer serves the profile introduction and the shop information.
 const information=document.querySelector('#information'),networkGrid=information?.querySelector('.grid');
 const svgWrap=paths=>'<svg viewBox="0 0 28 28" aria-hidden="true" focusable="false">'+paths+'</svg>';
 const networks=[
  {key:'YouTube URL',name:'YouTube',cls:'sns-youtube',host:/(^|\.)youtube\.com$|(^|\.)youtu\.be$/,icon:svgWrap('<rect x="2" y="6" width="24" height="16" rx="5" fill="white"/><path d="m12 10 7 4-7 4z" fill="currentColor"/>')},
  {key:'Facebook URL',name:'Facebook',cls:'sns-facebook',host:/(^|\.)facebook\.com$/,icon:svgWrap('<path fill="white" d="M16 26V15h3l.5-4H16V8.5c0-1.2.4-2 2-2h2V3.2c-.6-.1-1.6-.2-2.9-.2C14.2 3 12 4.8 12 8v3H9v4h3v11z"/>')},
  {key:'Instagram URL',name:'Instagram',cls:'sns-instagram',host:/(^|\.)instagram\.com$/,icon:svgWrap('<rect x="4" y="4" width="20" height="20" rx="6" fill="none" stroke="white" stroke-width="2.2"/><circle cx="14" cy="14" r="5" fill="none" stroke="white" stroke-width="2.2"/><circle cx="20" cy="8" r="1.4" fill="white"/>')},
  {key:'LINE公式URL',name:'LINE',cls:'sns-line',host:/(^|\.)line\.me$|(^|\.)lin\.ee$/,icon:svgWrap('<path fill="white" d="M25 12.5C25 7.3 20.1 3 14 3S3 7.3 3 12.5c0 4.7 3.9 8.6 9.1 9.4.4.1.8.3.8.7l-.2 2c0 .5.3.6.7.4 2.7-1.2 7.3-4.2 9.5-7.1 1.4-1.7 2.1-3.5 2.1-5.4z"/><text x="14" y="15.5" text-anchor="middle" fill="currentColor" font-size="8" font-family="Arial,sans-serif" font-weight="bold">LINE</text>')}
 ];
 function networkFor(a){try{const u=new URL(a.href);if(!/^https?:$/.test(u.protocol))return null;if(u.hostname==='line.me'&&/^\/R\/(share|msg\/text)/.test(u.pathname))return null;return networks.find(n=>n.host.test(u.hostname))||null;}catch{return null;}}
 let networkFingerprint='';
 function renderNetworks(){
  if(!networkGrid)return;
  const found=new Map();
  for(const a of [...networkGrid.querySelectorAll('a[href]'),...intro.querySelectorAll('.profile-social a[href]')]){const n=networkFor(a);if(n&&!found.has(n.key))found.set(n.key,{...n,href:a.href});}
  const entries=networks.map(n=>found.get(n.key)).filter(Boolean),key=JSON.stringify(entries.map(n=>[n.key,n.href]));
  if(key===networkFingerprint)return;networkFingerprint=key;
  let top=intro.querySelector('.profile-social'),lower=networkGrid.querySelector('.profile-social-information');
  if(!entries.length){top?.remove();lower?.remove();return;}
  if(!top){top=element('div',null,'profile-social');const before=intro.querySelector('.profile-share,.primary,.jump');if(before)before.before(top);else intro.append(top);}
  if(!lower){lower=element('div',null,'profile-social profile-social-information');networkGrid.prepend(lower);}
  for(const box of [top,lower]){box.setAttribute('aria-label','公式SNS');const links=entries.map(n=>{const a=element('a',null,n.cls);a.dataset.profileNetwork=n.key;a.href=n.href;a.target='_blank';a.rel='noopener';a.setAttribute('aria-label',n.name+'を開く');const icon=element('span',null,'sns-mark');icon.setAttribute('aria-hidden','true');icon.innerHTML=n.icon;a.append(icon,element('span',n.name,'sns-label'));return a;});box.replaceChildren(...links);}
  for(const a of [...networkGrid.querySelectorAll(':scope > a[href]')])if(networkFor(a))a.remove();
 }
 let networkQueued=false;const scheduleNetworks=()=>{if(networkQueued)return;networkQueued=true;requestAnimationFrame(()=>{networkQueued=false;renderNetworks();});};
 if(information)new MutationObserver(scheduleNetworks).observe(information,{childList:true,subtree:true,attributes:true,attributeFilter:['href']});
 renderNetworks();
 let fingerprint='';
 function render(){
  const figures=[...photos.querySelectorAll('.promo-scene')].slice(0,4);
  const scenes=figures.map((figure,i)=>{figure.id='shop-scene-'+(i+1);const image=figure.querySelector('img');return {src:image?.getAttribute('src')||'',alt:image?.alt||'',title:figure.querySelector('.scene-title')?.textContent||'紹介 '+(i+1),illustration:!!figure.querySelector('figcaption>span'),target:'#'+figure.id};}).filter(s=>s.src);
  const key=JSON.stringify(scenes);if(!scenes.length||key===fingerprint)return;fingerprint=key;
  const guide=element('div',null,'shop-hero-guide'),avatar=element('img');avatar.src='./fujiko-avatar.jpeg';avatar.alt='';avatar.width=38;avatar.height=38;guide.append(avatar,element('span','ふじこと見つける、志木の魅力'),element('span','✦','shop-hero-spark'));
  const main=element('div',null,'shop-hero-main');
  const backdrop=element('img');backdrop.src=scenes[0].src;backdrop.alt='';backdrop.className='shop-hero-backdrop';backdrop.setAttribute('aria-hidden','true');
  const image=element('img');image.src=scenes[0].src;image.alt=scenes[0].alt||scenes[0].title;image.className='shop-hero-picture';image.loading='eager';image.decoding='async';
  main.append(backdrop,image);
  const caption=element('div',null,'shop-hero-caption');caption.append(element('span',scenes[0].title));
  const grid=element('div',null,'shop-hero-thumbnails');
  for(const [i,scene] of scenes.slice(1).entries()){const link=element('div',null,'shop-hero-thumb');const img=element('img');img.src=scene.src;img.alt=scene.alt||scene.title;img.loading='eager';img.decoding='async';const label=element('span',scene.title);link.append(img,label);grid.append(link);}
  const note=element('p','画像は活動紹介用のイメージです。','shop-hero-note');note.hidden=!scenes.some(s=>s.illustration);
  hero.replaceChildren(guide,main,caption,grid,note);
 }
 let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render();});};
 new MutationObserver(schedule).observe(photos,{childList:true,subtree:true,attributes:true,attributeFilter:['src','alt']});
 render();
})();


