'use strict';
(()=>{
 const pageSize=20,base='https://ichirohns-jpg.github.io/ShikiConcierge-18/omise-demo/';
 const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 function mount({list,status,paging,renderPost,endpoint,archive=false}){
  const query=new URLSearchParams(location.search),hasCursor=archive&&query.has('offset');
  const parsed=Number(query.get('offset')),start=hasCursor&&Number.isInteger(parsed)&&parsed>=0&&parsed<=10000?parsed:0;
  const page=archive?Math.max(2,Math.min(502,parseInt(query.get('page')||'2',10)||2)):1;
  let generation=0;
  const active=p=>p.shop==='SHOP-0002'&&!p.ended&&(!p.end||p.end>=new Date(Date.now()+32400000).toISOString().slice(0,10))&&window.DXSNSRecommend.parse(p.body);
  function fetchBatch(offset){return new Promise((resolve,reject)=>{
   const name='dxCheer'+Math.random().toString(36).slice(2),script=el('script');let timer;
   const clean=()=>{clearTimeout(timer);script.remove();delete window[name];};
   window[name]=data=>{clean();if(data?.ok!==true||!Array.isArray(data.posts)||!Number.isInteger(data.total)||data.total<0||(!data.posts.length&&offset<data.total)){reject(Error('応援紹介を読み込めませんでした。'));return;}resolve(data);};
   script.onerror=()=>{clean();reject(Error('応援紹介を読み込めませんでした。'));};
   script.src=endpoint+'?'+new URLSearchParams({action:'posts',shop:'SHOP-0002',callback:name,offset:String(offset)});
   timer=setTimeout(()=>{clean();reject(Error('読み込みに時間がかかっています。'));},20000);document.head.append(script);
  });}
  async function load(){
   const attempt=++generation;status.textContent='応援紹介を読み込み中…';paging.replaceChildren();
   const posts=[],seen=new Set();let cursor=start,skip=archive&&!hasCursor?pageSize:0,next=null;
   try{
    while(true){
     if(cursor>10000)throw Error('この先の応援紹介を読み込めませんでした。');
     const data=await fetchBatch(cursor);if(attempt!==generation)return;
     let stop=false;
     for(let i=0;i<data.posts.length;i++){
      const p=data.posts[i];if(!active(p)||seen.has(p.id))continue;seen.add(p.id);
      if(skip){skip--;continue;}
      if(posts.length===pageSize){stop=true;break;}
      posts.push(p);next=cursor+i+1;
     }
     cursor+=data.posts.length;
     if(stop){break;}
     if(!data.posts.length||cursor>=data.total){next=null;break;}
    }
    list.replaceChildren();for(const post of posts)list.append(renderPost(post));
    status.textContent=posts.length?(archive?'アーカイブ '+page+'ページ目・':'新着')+posts.length+'件':archive?'アーカイブには、まだ応援紹介がありません。':'応援紹介を準備中です。';
    if(archive){const newest=el('a','← 新着20件に戻る');newest.href=base+'fujiko-timeline.html';newest.className='btn secondary';paging.append(newest);}
    if(next!==null){const older=el('a',archive?'次の20件を見る →':'過去の応援紹介・アーカイブ →');older.href=base+'cheer-archive.html?'+new URLSearchParams({offset:String(next),page:String(page+1)});older.className='btn secondary';paging.append(older);}
    else if(!archive){const older=el('a','応援紹介のアーカイブを見る →');older.href=base+'cheer-archive.html';older.className='btn secondary';paging.append(older);}
    if(location.hash==='#cheer-posts')document.getElementById('cheer-posts')?.scrollIntoView({block:'start'});
   }catch(e){if(attempt!==generation)return;status.textContent=e.message+' もう一度お試しください。';const retry=el('button','もう一度読み込む');retry.type='button';retry.className='btn secondary';retry.onclick=load;paging.append(retry);}
  }
  load();
  const expire=()=>{let count=0;for(const card of [...list.children]){const p=card.dxSupportPost;if(p&&!active(p)){card.remove();count++;}}if(count&&!list.children.length)status.textContent='掲載中の応援紹介はありません。';};
  window.addEventListener('focus',expire);document.addEventListener('visibilitychange',()=>{if(!document.hidden)expire();});setInterval(expire,30000);
  return {reload:load};
 }
 window.DXSupportFeed={mount,pageSize};
})();
