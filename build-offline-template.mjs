import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const ENTRY='ui.js';
const STYLES=['style.css','author.css','workshop.css','studio.css','v522-fixes.css'];
const IMPORT_RE=/\bfrom\s*(['"])([^'"]+)\1/g;

function resolveImport(from,spec){
 if(spec==='three')return 'vendor/three.module.js';
 if(!spec.startsWith('./')&&!spec.startsWith('../'))throw Error(`Unexpected external import ${spec} from ${from}`);
 const target=path.posix.normalize(path.posix.join(path.posix.dirname(from),spec.split('?')[0].split('#')[0]));
 if(target==='..'||target.startsWith('../')||target.startsWith('/'))throw Error(`Import leaves project: ${from} -> ${spec}`);
 return target;
}

async function collectModules(root){
 const result=[],done=new Set(),visiting=new Set();
 async function visit(p){
  if(done.has(p))return;
  if(visiting.has(p))throw Error(`Circular ESM import: ${p}`);
  visiting.add(p);
  const source=await fs.readFile(path.join(root,p),'utf8');
  const imports={};
  const withoutDocumentedImports=source.replace(/^\s*\*\s*@three_import[^\n]*$/gm,'');
  for(const match of withoutDocumentedImports.matchAll(IMPORT_RE))imports[match[2]]=resolveImport(p,match[2]);
  for(const dep of Object.values(imports))await visit(dep);
  visiting.delete(p);done.add(p);
  result.push({path:p,source,imports});
 }
 await visit(ENTRY);
 return result;
}

const BOOTSTRAP=`<script>
document.body.classList.add('offline-student');
document.title='學習大挑戰 · 學生遊戲';
document.querySelector('.brand .version').innerHTML='V5.2.2<br>遊玩';
const brandTitle=document.querySelector('.brand h1');if(brandTitle)brandTitle.textContent='學習大挑戰';
window.__CAMPUS_OFFLINE_GAME__=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob('__CAMPUS_GAME_DATA_BASE64__'),c=>c.charCodeAt(0))));
</script>`;

function loader(encoded){return `<script type="module">
const MODULES_B64='${encoded}';
try{
 const modules=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(MODULES_B64),c=>c.charCodeAt(0))));
 const urls=new Map();
 for(const module of modules){
  const transformed=module.source.replace(/\\bfrom\\s*(['"])([^'"]+)\\1/g,(whole,quote,spec)=>{
   const target=module.imports[spec];
   if(!target)return whole;
   if(!urls.has(target))throw Error('缺少遊戲模組：'+module.path+' → '+spec);
   return 'from '+JSON.stringify(urls.get(target));
  });
  urls.set(module.path,URL.createObjectURL(new Blob([transformed],{type:'text/javascript'})));
 }
 await import(urls.get('ui.js'));
}catch(error){
 const el=document.querySelector('#loading');
 if(el){el.classList.remove('hidden');el.innerHTML='<div class="webgl-error"><h2>離線遊戲無法啟動</h2><p></p></div>';el.querySelector('p').textContent=String(error.message||error);}
}
</script>`;}

export async function buildOfflineTemplate(root=ROOT){
 let html=await fs.readFile(path.join(root,'index.html'),'utf8');
 const css=(await Promise.all(STYLES.map(f=>fs.readFile(path.join(root,f),'utf8')))).join('\n');
 const offlineCss=`\nbody.offline-student .author-bar,body.offline-student #returnEditor,body.offline-student #openTxtTop,body.offline-student #togglePanel,body.offline-student #panel,body.offline-student #openJourney,body.offline-student .author-left,body.offline-student .author-inspector,body.offline-student .author-flow,body.offline-student #txtWorkshop{display:none!important;}\n`;
 html=html.replace(/<link\s+rel="stylesheet"\s+href="[^"]+"\s*>/g,'');
 html=html.replace(/<script type="importmap">[\s\S]*?<\/script>/,'');
 html=html.replace('</head>',`<style>${css}${offlineCss}</style></head>`);
 const modules=await collectModules(root);
 const encoded=Buffer.from(JSON.stringify(modules),'utf8').toString('base64');
 const script=BOOTSTRAP+loader(encoded);
 const prior='<script type="module" src="ui.js?v=5.2.2"></script>';
 if(!html.includes(prior))throw Error('V5 entry script was not found');
 return html.replace(prior,script);
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const html=await buildOfflineTemplate();
 if(process.argv.includes('--stdout'))process.stdout.write(html);
 else{
  const out=path.join(ROOT,'offline-player-template.html');
  await fs.writeFile(out,html,'utf8');
  process.stdout.write(`${out} (${Buffer.byteLength(html)} bytes)\n`);
 }
}
