import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
createRequire(import.meta.url)('./prepare-map.cjs');
const root=fileURLToPath(new URL('../',import.meta.url));
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const docs=JSON.parse(await fs.readFile(path.join(root,'data/readings.json'),'utf8'));
await fs.mkdir(path.join(root,'readings'),{recursive:true});
for(const d of docs){
 let chapter='',n=0,toc=[],body=[];
 for(const p of d.paragraphs){if(p.chapter!==chapter){chapter=p.chapter;const id='chapter-'+(++n);toc.push(`<a href="#${id}">${esc(chapter||'正文')}</a>`);body.push(`<h2 id="${id}">${esc(chapter||'正文')}</h2>`);}body.push(`<p id="${esc(p.id)}" data-paragraph tabindex="0">${esc(p.text)}</p>`);}
 const source=d.source||{},u=source.url||'https://github.com/yidiao/QmlmReader';
 const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(d.title)} · 国际共运图志</title><link rel="stylesheet" href="../css/site.css"></head><body data-reading="${d.slug}"><div id="nav-placeholder"></div><main class="reading-shell"><nav class="reading-toc" aria-label="章节目录"><h2>目录</h2>${toc.join('')}</nav><article class="reader"><header><a href="../index.html">← 返回世界图志</a><h1>${esc(d.title)}</h1><p>${esc(d.author)} · 文献原文</p><details class="source-note"><summary>版本与来源</summary><p>${esc(source.version)}</p><p>${esc(source.editorial||'原文按原站可见正文迁移，保留段落ID。')}</p><a href="${esc(u)}" target="_blank" rel="noopener">核对原始来源 ↗</a></details></header><div class="reader-tools"><label>字号 <select id="readerSize"><option value="16">16</option><option value="18" selected>18</option><option value="20">20</option><option value="22">22</option></select></label><label>行距 <select id="readerLine"><option value="1.6">1.6</option><option value="1.95" selected>默认</option><option value="2.2">2.2</option></select></label><button id="readerDefault">恢复默认</button><button id="readerFocus" aria-pressed="false">专注阅读</button><button id="readerBookmark" aria-pressed="false">收藏</button><button id="readerDownload">下载原文TXT</button><button id="readerNote">为当前段落记笔记</button></div><p class="reader-status" role="status" id="readerStatus">选择正文段落后可记笔记；原文与笔记分别保存。</p><div class="reader-body">${body.join('\n')}</div><section class="note-panel"><h2>本篇笔记</h2><p id="noteQuote">尚未选择段落</p><label for="noteText">笔记内容</label><textarea id="noteText"></textarea><button id="noteSave">保存笔记</button><button id="noteCancel">取消编辑</button><button id="noteExport">导出本篇笔记Markdown</button><div id="readerNotes"></div></section></article></main><footer class="site-footer">国际共运图志 · 文献按来源版本保留，本站导读与作者原文分别标示。</footer><script src="../js/site.js"></script><script src="../js/cursor.js"></script><script src="../js/reader.js"></script></body></html>`;
 await fs.writeFile(path.join(root,d.file),html);
}
const atlas=JSON.parse(await fs.readFile(path.join(root,'data/international/atlas.json'),'utf8'));
const search=[];
for(const e of [...atlas.events,...atlas.organizations])search.push({title:e.title,kind:e.paragraphs?'历史节点':'组织资料',url:'index.html?view='+(e.paragraphs?'history':'organizations')+'&entry='+e.id,text:[e.summary,...(e.paragraphs||[]),e.history,e.position,e.status,e.date,e.asOf].filter(Boolean).join(' ')});
for(const d of docs)for(const p of d.paragraphs)search.push({title:d.title+' · '+p.chapter,kind:'文献正文 · '+d.author,url:d.file+'?paragraph='+p.id,text:p.text});
const pages=['index.html','calendar.html','columns/index.html','columns/tieliu-yu-xianfeng.html','columns/encirclement.html','columns/foundations.html','current.html','memorial.html','comintern.html'];
for(const f of pages){const s=await fs.readFile(path.join(root,f),'utf8'),title=/<title>(.*?)<\/title>/s.exec(s)?.[1]||f,text=s.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');search.push({title,kind:'栏目文章',url:f,text});}
await fs.writeFile(path.join(root,'data/search.json'),JSON.stringify(search));
// Publish an explicit allowlist. No source archives, caches, or workstation paths.
const out=path.join(root,'dist');await fs.mkdir(out,{recursive:true});
for(const f of [...pages,'readings','css','js','data','assets','images'])await fs.cp(path.join(root,f),path.join(out,f),{recursive:true});
await fs.writeFile(path.join(out,'.nojekyll'),'');
console.log(`Built ${pages.length+docs.length} pages; ${search.length} search records. Output: dist/`);
