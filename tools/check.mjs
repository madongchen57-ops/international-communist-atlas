import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),dist=path.join(root,'dist');
async function files(dir){const all=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())all.push(...await files(f));else all.push(f);}return all;}
const all=await files(dist),issues=[],html=new Map();
for(const f of all.filter(f=>f.endsWith('.html')))html.set(f,await fs.readFile(f,'utf8'));
for(const[f,s]of html){
 for(const m of s.matchAll(/(?:href|src)="([^"]+)"/g)){
  const u=m[1];if(/^(https?:|mailto:|data:|javascript:)/.test(u))continue;
  const [pathname,fragment]=u.split('#'),target=pathname.split('?')[0];const dest=target?path.resolve(path.dirname(f),decodeURIComponent(target)):f;
  if(!all.includes(dest)){issues.push(`${path.relative(dist,f)} missing ${u}`);continue;}
  if(fragment&&html.has(dest)&&!new RegExp(`id=["']${fragment.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["']`).test(html.get(dest)))issues.push(`${path.relative(dist,f)} missing anchor ${u}`);
 }
 if(/(?:localhost:4173|127\.0\.0\.1:4173|["'](?:\.\.\/)*QmlmReader\/)/.test(s))issues.push('Original runtime dependency '+f);
}
for(const f of all.filter(f=>f.endsWith('.css'))){const s=await fs.readFile(f,'utf8');for(const m of s.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)){if(m[1].startsWith('#')||/^(data:|https?:)/.test(m[1]))continue;const p=path.resolve(path.dirname(f),m[1].split('?')[0]);if(!all.includes(p))issues.push(`CSS missing ${m[1]}`);}}
const read=async f=>JSON.parse(await fs.readFile(path.join(root,f),'utf8'));
const docs=await read('data/readings.json'),atlas=await read('data/international/atlas.json'),routes=await read('data/reading-routes.json'),world=await read('assets/international/world-50m.json');
assert.equal(docs.length,8);assert.equal(html.size,17);assert.equal(atlas.camps.snapshots.length,24);assert.equal(world.features.length,212);assert.equal(world.chineseIslands.land.geometry.coordinates.length,26);
for(const d of docs){const ids=new Set();for(const p of d.paragraphs){assert(!ids.has(p.id),'Duplicate paragraph '+p.id);ids.add(p.id);assert(html.get(path.join(dist,d.file)).includes(`id="${p.id}"`));}}
for(const e of [...atlas.events,...atlas.organizations])if(e.readingWork){const file=routes[e.readingWork.file],d=docs.find(d=>d.file===file);assert(d,`Missing reading ${e.readingWork.file}`);assert(d.paragraphs.some(p=>p.id===e.readingWork.paragraphId),`Missing reading anchor ${e.id}`);}
for(const g of world.chineseIslands.groups)assert.equal(g.ownerId,'CHN');
assert.deepEqual(world.displayPolicy.appliesTo,['nature','camps','neutral']);
assert.equal(world.displayPolicy.chinaRedFromYear,1949);
if(issues.length){console.error(issues.join('\n'));process.exitCode=1;}else console.log('PASS: 17 pages, 8 readings / '+docs.reduce((n,d)=>n+d.paragraphs.length,0)+' stable paragraphs, 24 stages, 212 countries; all local links, anchors, CSS assets and reading references valid.');
