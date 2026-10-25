"""One-time, read-only import from QmlmReader. Never used by the site build."""
from pathlib import Path
import hashlib, json, re, shutil, posixpath, html
from urllib.parse import urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
OLD = ROOT.parent / 'QmlmReader'
def put(file, text):
    p=ROOT/file; p.parent.mkdir(parents=True, exist_ok=True); p.write_text(text, encoding='utf-8')
def copy(src, dest=None):
    p=ROOT/(dest or src); p.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(OLD/src,p)
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
# Full original-workspace baseline stays local and out of the published repository.
baseline={str(p.relative_to(OLD)).replace('\\','/'):sha(p) for p in OLD.rglob('*') if p.is_file()}
put('.local-audit/original-before.json',json.dumps(baseline,ensure_ascii=False))
pages={
 'html/international/international.html':'index.html',
 'html/international/international-calendar.html':'calendar.html',
 'html/international/international-column.html':'columns/index.html',
 'html/international/international-current.html':'current.html',
 'html/international/international-memorial.html':'memorial.html',
 'html/library/comintern.html':'comintern.html',
}
for p in (OLD/'html/international/international-column').glob('*.html'):
    pages[p.relative_to(OLD).as_posix()]='columns/'+p.name
reading_files=[
 ('Marx/fa-lan-xi-nei-zhan','civil-war'),
 ('CriticismAuthorities/lenin-collapse-1915','second-international'),
 ('Lenin/guo-jia-yu-ge-ming','state-revolution'),
 ('Stalin/lun-lunen-zhu-yi-ji-chu','foundations-leninism'),
 ('Books/short-course','short-course'),
 ('Dimitrov/fascism-united-front','united-front'),
 ('Mao/xin-min-zhu','new-democracy'),
 ('Dimitrov/aid-spain','aid-spain')]
reading_map={'articles/'+old+'.html':'readings/'+slug+'.html' for old,slug in reading_files}
for old,new in reading_map.items(): pages['html/'+old]=new
provenance=[]
def record(src):
    provenance.append({'original':src,'sha256':baseline[src]})

for src,dest in list(pages.items()):
    if dest.startswith('readings/'): continue
    s=(OLD/src).read_text(encoding='utf-8')
    put('sources/pages/'+src,s);record(src)
    # Keep page-specific content/calendar scripts, remove original global UI/state.
    s=re.sub(r'<script\b[^>]*src=["\'][^"\']*(?:site-data|main|darkmode|cursor)\.js["\'][^>]*>\s*</script>','',s,flags=re.I)
    def clean_script(m):
        attrs,body=m[1],m[2]
        if 'function toggleDarkMode' in body:
            # Side-nav behavior is supplied by standalone site.js.
            return ''
        return m[0]
    s=re.sub(r'<script([^>]*)>(.*?)</script>',clean_script,s,flags=re.S)
    def url(m):
        attr,value=m[1],m[2]
        if value.startswith(('#','http:','https:','mailto:','data:','javascript:')):return m[0]
        u=urlsplit(value);resolved=posixpath.normpath(posixpath.join(posixpath.dirname(src),u.path))
        if resolved in pages: target=pages[resolved]
        elif resolved.startswith(('css/','js/','images/','assets/','data/')):target=resolved
        elif resolved in ('html/library/index.html','html/index.html','index.html'):target='index.html'
        else: return attr+'="'+('https://yidiao.github.io/QmlmReader/'+resolved)+(('?'+u.query) if u.query else '')+(('#'+u.fragment) if u.fragment else '')+'"'
        return attr+'="'+posixpath.relpath(target,posixpath.dirname(dest) or '.')+(('?'+u.query) if u.query else '')+(('#'+u.fragment) if u.fragment else '')+'"'
    s=re.sub(r'(href|src)="([^"]+)"',url,s)
    s=s.replace('青年马列毛主义驿站 | Qmlm Reader','国际共运图志').replace('青年马列毛主义驿站','国际共运图志')
    rel=posixpath.relpath('.',posixpath.dirname(dest) or '.')+'/'
    s=s.replace('</head>',f'<link rel="stylesheet" href="{rel}css/site.css"></head>')
    s=s.replace('</body>',f'<script src="{rel}js/site.js"></script><script src="{rel}js/cursor.js"></script></body>')
    s=s.replace('本馆报告节选与原文','报告原文').replace('关于统一战线的报告节选','关于统一战线的报告')
    if dest=='current.html':s=s.replace('<main', '<aside class="archive-notice">时事档案：本页保留原栏目文章及其日期，不代表实时新闻。</aside><main',1)
    put(dest,s)

for f in ['style.css','color-tokens.css','theme-colors.css','module-colors.css','master-colors.css','international-atlas.css','library.css']:
    copy('css/'+f)
copy('js/international-atlas.js');copy('js/cursor.js');copy('data/history-events.js')
for p in (OLD/'js/vendor').glob('d3-*'):copy(p.relative_to(OLD).as_posix())
for name in ['hammer.svg','star.svg']:copy('images/icons/cursor/'+name)
for src in ['data/international/atlas.json','data/international/state-periods-manifest.json','assets/international/world-50m.json','assets/international/world-equal-earth.svg','assets/international/SOURCES.json']:
    copy(src);record(src)
for name in ['official-worldtopo-h.json','official-worldtopo-h.source.json','official-worldtopo.json','official-worldtopo.source.json']:
    copy('.sources-international/'+name,'sources/maps/'+name);record('.sources-international/'+name)

# Preserve body data from each original JSON, and stable IDs from the visible-text index.
index=json.loads((OLD/'data/fulltext-index.json').read_text(encoding='utf-8'))['documents']
docs=[]
for old,slug in reading_files:
    file='articles/'+old+'.html'; doc=next(d for d in index if d['file']==file)
    s=(OLD/'html'/file).read_text(encoding='utf-8');record('html/'+file)
    m=re.search(r'data-article-json="([^"]+)"',s)
    payload=None
    if m:
        src=posixpath.normpath(posixpath.join('html/articles',posixpath.dirname(old),m[1]))
        payload=json.loads((OLD/src).read_text(encoding='utf-8'));copy(src,'sources/readings/'+slug+'.json');record(src)
    else:
        put('sources/readings/'+slug+'.html',s)
    source=(payload or {}).get('source',{})
    # Always derive actual body from JSON, with index IDs asserted against exact text.
    paragraphs=[];chapter_notes=[]
    if payload:
        for c in payload['original']['chapters']:
            for i,p in enumerate(c.get('paragraphs',[])):
                text=p if isinstance(p,str) else p['text']
                pid=(c.get('paragraphIds') or [None]*len(c['paragraphs']))[i] if isinstance(p,str) else p.get('id')
                matches=[x for x in doc['paragraphs'] if x['text']==text]
                if not pid and matches:pid=matches[0]['id']
                if not pid:raise ValueError('Missing paragraph ID '+slug+' '+text[:25])
                paragraphs.append({'text':text,'id':pid,'chapter':c['title']})
        if [p['text'] for p in paragraphs]!=[p['text'] for p in doc['paragraphs']]:raise ValueError('Visible text mismatch: '+slug)
    else:
        # The HTML text index was generated from the actual original-text DOM.
        # Confirm every indexed paragraph occurs in decoded visible HTML.
        plain=html.unescape(re.sub('<[^>]+>','',s))
        for p in doc['paragraphs']:
            if p['text'] not in plain:raise ValueError('HTML paragraph mismatch: '+p['id'])
        paragraphs=doc['paragraphs']
        source={'version':'保留原站 HTML 正文及稳定段落ID；原页面档案见 sources/readings/new-democracy.html。','url':'https://www.marxists.org/chinese/maozedong/index.htm'}
    seen={}
    for p in paragraphs:
        pid=p['id'];seen[pid]=seen.get(pid,0)+1
        if seen[pid]>1:p['originalId']=pid;p['id']=pid+'--occurrence-'+str(seen[pid])
    docs.append({'slug':slug,'title':doc['title'],'author':doc['author'],'source':source,'paragraphs':paragraphs,'originalFile':file,'file':'readings/'+slug+'.html'})
put('data/readings.json',json.dumps(docs,ensure_ascii=False))
put('data/reading-routes.json',json.dumps(reading_map,ensure_ascii=False,indent=2))
put('sources/migration-manifest.json',json.dumps({'sourceRepository':'https://github.com/yidiao/QmlmReader','imported':'2026-10-25','files':provenance},ensure_ascii=False,indent=2))
copy('_tools/serve.mjs','tools/serve.mjs')
p=ROOT/'tools/serve.mjs';p.write_text(p.read_text(encoding='utf-8').replace('4173','4174').replace('/QmlmReader','/international-communist-atlas'),encoding='utf-8')
put('package.json',json.dumps({'name':'international-communist-atlas','private':True,'version':'1.0.0','description':'国际共运图志：独立历史地图与文献阅读项目','scripts':{'start':'node tools/serve.mjs','build':'node tools/build.mjs','test':'node tools/check.mjs'}},ensure_ascii=False,indent=2))
put('.gitignore','dist/\n.local-audit/\n.qa/\nnode_modules/\n')
print('Imported',len(pages),'pages and',sum(len(d['paragraphs']) for d in docs),'paragraphs;',len(baseline),'original files hashed.')
