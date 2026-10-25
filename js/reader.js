(function(){
 'use strict';
 const slug=document.body.dataset.reading,key='icm-atlas:reader:v1',article=document.querySelector('.reader'),body=document.querySelector('.reader-body'),status=document.getElementById('readerStatus'),paras=[...body.querySelectorAll('[data-paragraph]')];
 let state={settings:{size:'18',line:'1.95'},works:{}},active=paras[0],editing=null,storageFailed=false;
 function message(t){status.textContent=t+(storageFailed?' · 未持久保存：当前会话内容仍可导出。':'');}
 try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved&&saved.settings&&saved.works)state=saved;}catch(e){storageFailed=true;message('阅读记录仅在当前会话保留');}
 const work=state.works[slug]||(state.works[slug]={notes:[],bookmark:false,paragraph:''});
 function persist(){try{localStorage.setItem(key,JSON.stringify(state));}catch(e){storageFailed=true;message('未持久保存');}}
 const size=document.getElementById('readerSize'),line=document.getElementById('readerLine');
 function apply(){size.value=state.settings.size;line.value=state.settings.line;body.style.setProperty('--reader-size',size.value+'px');body.style.setProperty('--reader-line',line.value);}
 size.onchange=line.onchange=()=>{state.settings={size:size.value,line:line.value};apply();persist();};apply();
 document.getElementById('readerDefault').onclick=()=>{state.settings={size:'18',line:'1.95'};apply();persist();};
 const focus=document.getElementById('readerFocus');focus.onclick=()=>{const on=!document.body.classList.contains('reading-focus');document.body.classList.toggle('reading-focus',on);article.classList.toggle('focus',on);focus.setAttribute('aria-pressed',String(on));focus.textContent=on?'退出专注（Esc）':'专注阅读';};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('reading-focus'))focus.click();});
 const bookmark=document.getElementById('readerBookmark');function showBookmark(){bookmark.setAttribute('aria-pressed',String(work.bookmark));bookmark.textContent=work.bookmark?'已收藏':'收藏';}bookmark.onclick=()=>{work.bookmark=!work.bookmark;showBookmark();persist();};showBookmark();
 const quote=document.getElementById('noteQuote'),text=document.getElementById('noteText'),list=document.getElementById('readerNotes');
 function choose(p){if(!p)return;active=p;quote.textContent='引用：'+p.textContent;}
 paras.forEach(p=>{p.addEventListener('click',()=>choose(p));p.addEventListener('focus',()=>choose(p));});
 const create=(tag,t)=>{const e=document.createElement(tag);e.textContent=t;return e;};
 function locate(id,expected){const p=document.getElementById(id);if(!p||!p.matches('[data-paragraph]')||(expected&&p.textContent!==expected)){message('原文目标已失效；保留笔记，请核对来源。');return false;}document.querySelectorAll('.search-target').forEach(n=>n.classList.remove('search-target'));p.classList.add('search-target');p.scrollIntoView({block:'center'});p.focus({preventScroll:true});choose(p);return true;}
 function notes(){list.replaceChildren();work.notes.forEach(n=>{const card=create('div','');card.className='note-card';card.append(create('blockquote',n.quote),create('p',n.text),create('small',n.time));const jump=create('button','定位原文'),edit=create('button','修改'),del=create('button','删除此条');jump.onclick=()=>locate(n.paragraph,n.quote);edit.onclick=()=>{editing=n.id;text.value=n.text;active=paras.find(p=>p.id===n.paragraph&&p.textContent===n.quote)||null;quote.textContent='引用：'+n.quote;text.focus();};del.onclick=()=>{work.notes=work.notes.filter(x=>x.id!==n.id);if(editing===n.id)reset();persist();notes();};card.append(jump,edit,del);list.append(card);});}
 function reset(){editing=null;text.value='';choose(active||paras[0]);}
 document.getElementById('readerNote').onclick=()=>{choose(active||paras[0]);text.scrollIntoView({block:'center'});text.focus();};
 document.getElementById('noteSave').onclick=()=>{if(!text.value.trim()){message('请填写笔记内容');return;}if(editing){const n=work.notes.find(n=>n.id===editing);n.text=text.value;n.time=new Date().toISOString();}else{if(!active){message('请先选择有效原文段落');return;}work.notes.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),paragraph:active.id,quote:active.textContent,text:text.value,time:new Date().toISOString()});}persist();notes();reset();message('笔记已保存');};
 document.getElementById('noteCancel').onclick=reset;
 function download(name,content,type){const u=URL.createObjectURL(new Blob(['\ufeff',content],{type})),a=create('a','');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
 const title=document.querySelector('h1').textContent;
 document.getElementById('readerDownload').onclick=()=>download(title+'.txt',title+'\n'+document.querySelector('header .source-note').textContent+'\n\n'+[...body.children].map(p=>p.textContent).join('\n\n'),'text/plain;charset=utf-8');
 document.getElementById('noteExport').onclick=()=>download(title+'-笔记.md','# '+title+'\n\n'+new URL(location.pathname,location.origin).href+'\n\n'+work.notes.map(n=>'## '+n.time+'\n\n> '+n.quote.replace(/\n/g,'\n> ')+'\n\n'+n.text+'\n\n[定位原文](?paragraph='+n.paragraph+')').join('\n\n'),'text/markdown;charset=utf-8');
 notes();choose(active);
 const params=new URLSearchParams(location.search),target=params.get('paragraph'),q=(params.get('q')||'').slice(0,100);
 if(q){for(const p of paras){const raw=p.textContent,low=raw.toLocaleLowerCase(),needle=q.toLocaleLowerCase();let at=0,pos;if(!low.includes(needle))continue;p.replaceChildren();while((pos=low.indexOf(needle,at))>=0){p.append(document.createTextNode(raw.slice(at,pos)),create('mark',raw.slice(pos,pos+q.length)));at=pos+q.length;}p.append(document.createTextNode(raw.slice(at)));}}
 requestAnimationFrame(()=>{if(target){if(locate(target))message('已定位搜索段落');}else if(location.hash){const node=document.getElementById(decodeURIComponent(location.hash.slice(1)));node?.scrollIntoView();}else if(work.paragraph)locate(work.paragraph);});
 let timer;window.addEventListener('scroll',()=>{clearTimeout(timer);timer=setTimeout(()=>{const p=paras.find(p=>p.getBoundingClientRect().bottom>80);if(p){work.paragraph=p.id;persist();}},300);},{passive:true});
})();
