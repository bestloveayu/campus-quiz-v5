import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {defaultProject} from './flow-core.mjs';
import {normalizeStudio,doorDestinations,navigationTarget,removeArea} from './studio-core.mjs';

function project(){
 const p=normalizeStudio(defaultProject());
 p.areas.push({id:'library',name:'圖書館',template:'library',requires:[],initialVisible:true});
 p.visibility.mode='all';
 return normalizeStudio(p);
}

test('legacy doors offer every other area by default',()=>{
 const p=project();
 assert.deepEqual(doorDestinations(p,'room').map(a=>a.id),['campus','library']);
 assert.deepEqual(doorDestinations(p,'campus').map(a=>a.id),['room','library']);
});

test('a source door can limit its selectable destinations',()=>{
 const p=project();
 p.areas.find(a=>a.id==='room').door.destinations=['library'];
 const normalized=normalizeStudio(p);
 assert.deepEqual(doorDestinations(normalized,'room').map(a=>a.id),['library']);
 assert.equal(navigationTarget(normalized,{visited:[]},'room','campus').ok,false);
});

test('invalid destinations and self-links are rejected',()=>{
 const p=project();
 p.areas.find(a=>a.id==='room').door.destinations=['room'];
 assert.throws(()=>normalizeStudio(p),/目的地/);
 p.areas.find(a=>a.id==='room').door.destinations=['missing'];
 assert.throws(()=>normalizeStudio(p),/目的地/);
});

test('deleting an empty area removes old door destination references',()=>{
 const p=project();
 p.areas.find(a=>a.id==='room').door.destinations=['campus','library'];
 removeArea(p,'library');
 assert.deepEqual(p.areas.find(a=>a.id==='room').door.destinations,['campus']);
 assert.doesNotThrow(()=>normalizeStudio(p));
});

test('indoor exit opens the same multi-destination chooser as campus entrance',async()=>{
 const source=await readFile(new URL('./author.js',import.meta.url),'utf8');
 assert.match(source,/\['entrance','exit','garden-exit'\]\.includes\(point\.id\)/);
 assert.match(source,/doorDestinations\(p,from\)/);
 assert.match(source,/DOOR_TRAVEL.*from,to:id/);
});

test('author UI allows selecting each door destination and formal offline game retains movable mission',async()=>{
 const studio=await readFile(new URL('./studio.js',import.meta.url),'utf8');
 const drag=await readFile(new URL('./draggable-ui.mjs',import.meta.url),'utf8');
 const css=await readFile(new URL('./v522-fixes.css',import.meta.url),'utf8');
 assert.match(studio,/data-door-destinations/);
 assert.match(studio,/destinations:\[\.\.\.card\.querySelector\('\[data-door-destinations\]'\)/);
 assert.match(drag,/\.mission \.mission-top/);
 assert.match(drag,/dialog,#interaction,#panel,\.mission/);
 assert.match(css,/body\.offline-student #openTxtTop/);
 assert.match(css,/\.author-play-buttons\{top:70px/);
});

test('offline export embeds new door chooser, mission dragging and hidden editor controls',async()=>{
 const {buildOfflineTemplate}=await import('./build-offline-template.mjs');
 const html=await buildOfflineTemplate();
 assert.match(html,/body\.offline-student #openTxtTop/);
 assert.match(html,/V5\.2\.2/);
 const encoded=html.match(/const MODULES_B64='([^']+)'/)?.[1];
 assert.ok(encoded);
 const modules=JSON.parse(Buffer.from(encoded,'base64').toString('utf8'));
 assert.match(modules.find(m=>m.path==='author.js').source,/doorDestinations\(p,from\)/);
 assert.match(modules.find(m=>m.path==='draggable-ui.mjs').source,/\.mission \.mission-top/);
});

test('all four editing panels provide maximize and restore controls without losing saved sizes',async()=>{
 const studio=await readFile(new URL('./studio.js',import.meta.url),'utf8');
 const css=await readFile(new URL('./v522-fixes.css',import.meta.url),'utf8');
 assert.match(studio,/data-maximize/);
 assert.match(studio,/maximizeFlow/);
 assert.match(studio,/miniMaximize/);
 assert.match(studio,/applyMaximizedState\(\);syncBounds\(\)/);
 assert.match(studio,/if\(applying\|\|restoring\|\|layout\.maximizedPane\)return/);
 assert.match(css,/\.studio-maximized\{/);
});
