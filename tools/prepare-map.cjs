// Rebuild only derived island/fallback resources inside this independent project.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8')),write=(f,d)=>fs.writeFileSync(path.join(root,f),typeof d==='string'?d:JSON.stringify(d));
const baseline=path.join(root,'sources/maps/derived-world-baseline.json');if(!fs.existsSync(baseline))fs.copyFileSync(path.join(root,'assets/international/world-50m.json'),baseline);
const world=read('sources/maps/derived-world-baseline.json'),t=read('sources/maps/official-worldtopo.json'),meta=read('sources/maps/official-worldtopo.source.json');
if(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'sources/maps/official-worldtopo.json'))).digest('hex')!==meta.sha256)throw Error('Official low-detail source checksum mismatch');
function line(ids){const out=[];for(const id of ids){let a=t.arcs[id<0?~id:id];if(id<0)a=a.slice().reverse();if(out.length)out.pop();out.push(...a);}return out.map(p=>p.map(n=>+(n/1000).toFixed(8)));}
const china=t.objects['中国区域'].geometries.find(g=>g.properties.FCNAME==='中华人民共和国');
const parts=china.arcs.map(p=>p.map(line));
// Southern land components only, never the generalized companion mainland border.
const islands=parts.filter(p=>Math.max(...p.flat().map(v=>v[1]))<0.20855);
if(islands.length<20)throw Error('Missing officially attributed island land components');
const islandFeature={type:'Feature',id:'CHN-SCS',properties:{name:'中国南海诸岛陆地要素',ownerId:'CHN',source:'自然资源部 worldtopo.json / 中国区域'},geometry:{type:'MultiPolygon',coordinates:islands}};
const chn=world.features.find(f=>f.id==='CHN');chn.properties.ownerId='CHN';if(chn.geometry.type!=='MultiPolygon')throw Error('Expected China MultiPolygon');chn.geometry.coordinates.push(...islands);
world.chineseIslands={land:islandFeature,groups:[{id:'CHN-DONGSHA',ownerId:'CHN',name:'东沙群岛（中国）',center:[116.7,20.7]},{id:'CHN-XISHA',ownerId:'CHN',name:'西沙群岛（中国）',center:[112,16.5]},{id:'CHN-ZHONGSHA',ownerId:'CHN',name:'中沙群岛（中国）',center:[114.5,15.5]},{id:'CHN-NANSHA',ownerId:'CHN',name:'南沙群岛（中国）',center:[114,9.5]}],note:'土地要素取官方中国区域；群岛名称符号为位置示意，不是控制区或海域填色。',ownershipSource:'https://www.mfa.gov.cn/web/zyxw/201607/t20160712_338577.shtml'};
world.displayPolicy={chinaRedFromYear:1949,color:'#df444a',appliesTo:['nature','camps','neutral'],historyDataUnchanged:true};
write('assets/international/world-50m.json',world);
const s=read('assets/international/SOURCES.json');s.companionSource='sources/maps/official-worldtopo.source.json';s.transformations=s.transformations.filter(x=>!x.includes('南海岛屿陆地要素'));s.transformations.push('补充伴随底图中国区域中的'+islands.length+'个南海岛屿陆地要素；单位除以1000，仅补南部岛屿，不覆盖高精度大陆边界');s.chineseIslands={source:meta.url,sha256:meta.sha256,components:islands.length,ownershipSource:world.chineseIslands.ownershipSource,labelPositions:'群岛位置示意，不修改海岸与范围线'};s.displayPolicy=world.displayPolicy;write('assets/international/SOURCES.json',s);
const sandbox={};vm.createContext(sandbox);for(const f of ['d3-array-3.2.4.min.js','d3-geo-3.1.1.min.js'])vm.runInContext(fs.readFileSync(path.join(root,'js/vendor',f),'utf8'),sandbox);
const d3=sandbox.d3,proj=d3.geoIdentity().reflectY(true).fitExtent([[22,12],[978,548]],world.frame),p=d3.geoPath(proj).digits(2).pointRadius(.55);
for(const red of [false,true]){const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 560"><title>国际共运图志·官方参考底图${red?'，中国1949年起红色':''}</title><rect width="1000" height="560" fill="#102d3f"/>${world.features.map(f=>`<path data-state="${f.id}" d="${p(f)}" fill="${red&&f.id==='CHN'?'#df444a':'#607982'}"/>`).join('')}${world.boundaries.map(b=>`<path d="${p(b.geometry)}" fill="none" stroke="#c5d1d1" stroke-width=".5" ${/未定|停火|归属/.test(b.name)?'stroke-dasharray="3 2"':''}/>`).join('')}<text x="25" y="548" fill="#f6e6be" font-size="13">静态预览：${red?'中国1949年起固定红色；':''}其他国家不显示阵营色。南海岛屿请放大互动图查看。</text></svg>`;write('assets/international/world-'+(red?'china-red':'neutral')+'.svg',svg);}
console.log('Official Chinese island components added:',islands.length);
