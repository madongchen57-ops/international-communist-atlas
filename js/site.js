(function () {
 'use strict';
 const root=new URL('../',document.currentScript.src), key='icm-atlas:preferences:v1';
 const el=(t,text,cls)=>{const n=document.createElement(t);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
 let prefs={dark:false}, notice;
 const warn=()=>{if(!notice){notice=el('p','未持久保存：当前会话仍可使用。','storage-notice');notice.setAttribute('role','status');document.body.prepend(notice);}};
 try{prefs={...prefs,...JSON.parse(localStorage.getItem(key)||'{}')};}catch(e){warn();}
 const persist=()=>{try{localStorage.setItem(key,JSON.stringify(prefs));}catch(e){warn();}};
 const host=document.getElementById('nav-placeholder')||document.body.prepend(el('div'));
 const header=el('header',null,'atlas-site-header'),brand=el('a','国际共运图志','atlas-brand');brand.href=root;
 const nav=el('nav',null,'main-nav');nav.setAttribute('aria-label','主导航');
 [['index.html','世界图志'],['calendar.html','历史日历'],['columns/index.html','深度专栏'],['current.html','时事档案'],['memorial.html','纪念'],['comintern.html','第三国际']].forEach(([url,title])=>{const a=el('a',title);a.href=new URL(url,root);if(a.pathname===location.pathname)a.setAttribute('aria-current','page');nav.append(a);});
 const theme=el('button');theme.type='button';theme.className='theme-toggle';
 function apply(){document.body.classList.toggle('dark-mode',!!prefs.dark);theme.textContent=prefs.dark?'浅色主题':'深色主题';theme.setAttribute('aria-pressed',String(!!prefs.dark));}
 theme.onclick=()=>{prefs.dark=!prefs.dark;apply();persist();};apply();
 const search=el('button','搜索');search.type='button';search.onclick=()=>{dialog.showModal();input.focus();};nav.append(search,theme);header.append(brand,nav);(host||document.body).prepend(header);
 window.toggleSideNav=()=>document.getElementById('sideNav')?.classList.toggle('expanded');
 document.addEventListener('click',e=>{let n=document.getElementById('sideNav');if(n&&!n.contains(e.target))n.classList.remove('expanded');});
 const dialog=el('dialog',null,'site-search'),form=el('form');form.method='dialog';
 const close=el('button','关闭搜索');close.type='submit';form.append(el('h2','搜索图志与文献'),close);
 const input=el('input');input.type='search';input.placeholder='事件、国家、组织或文献正文';input.setAttribute('aria-label','站内搜索');input.maxLength=100;
 const status=el('p','按需加载搜索资料，最多显示20条结果。'),results=el('ol'),retry=el('button','重试加载');retry.type='button';retry.hidden=true;
 dialog.append(form,input,status,retry,results);document.body.append(dialog);
 let records,task,timer,serial=0;
 function highlight(parent,text,q){const low=text.toLocaleLowerCase(),needle=q.toLocaleLowerCase();let at=0,pos;while((pos=low.indexOf(needle,at))>=0){parent.append(document.createTextNode(text.slice(at,pos)),el('mark',text.slice(pos,pos+q.length)));at=pos+q.length;}parent.append(document.createTextNode(text.slice(at)));}
 async function run(){const q=input.value.trim(),id=++serial;if(!q){results.replaceChildren();status.textContent='输入关键词搜索，最多显示20条。';return;}status.textContent='正在搜索…';
  try{if(!records){task=task||fetch(new URL('data/search.json',root)).then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).finally(()=>task=null);records=await task;}
   if(id!==serial)return;const needle=q.toLocaleLowerCase(),hits=records.filter(r=>(r.title+' '+r.text).toLocaleLowerCase().includes(needle)).slice(0,20);results.replaceChildren();
   hits.forEach(r=>{const li=el('li'),a=el('a'),u=new URL(r.url,root);u.searchParams.set('q',q);a.href=u;highlight(a,r.title,q);li.append(a,el('small',r.kind));const n=r.text.toLocaleLowerCase().indexOf(needle),snippet=r.text.slice(Math.max(0,n-38),Math.max(0,n-38)+170),p=el('p');highlight(p,snippet,q);li.append(p);results.append(li);});
   status.textContent=hits.length?'显示 '+hits.length+' 条结果（上限20条）。':'没有匹配结果。';retry.hidden=true;
  }catch(e){if(id!==serial)return;status.textContent='搜索资料未载入，已有结果保留。';retry.hidden=false;}}
 input.oninput=()=>{clearTimeout(timer);timer=setTimeout(run,180);};input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();run();}};retry.onclick=run;
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();dialog.showModal();input.focus();}});
})();
