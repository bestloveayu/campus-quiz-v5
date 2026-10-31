import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {defaultProject,newRun,completeNode,resolveRoute,linksFor} from './flow-core.mjs';

function setup(routes){
 const p=defaultProject();
 const e=p.entities.find(e=>e.id==='challenge');
 e.requires=[];
 e.routes=routes;
 p.startId='challenge';
 return newRun(p,[],1);
}

test('score condition automatically selects matching success route over manual choices',()=>{
 const run=setup([{label:'自行選擇',next:'knowledge',condition:'choice',value:''},{label:'高分',next:'goal',condition:'score-gte',value:'80'}]);
 run.lastScore=90;
 completeNode(run,'challenge',true);
 assert.equal(run.activeId,'goal');
 assert.equal(run.pendingRoutes,undefined);
});

test('failed challenge evaluates score conditions instead of always bypassing routes',()=>{
 const run=setup([{label:'低分補救',next:'knowledge',condition:'score-lt',value:'80'},{label:'自行選擇',next:'goal',condition:'choice',value:''}]);
 run.project.entities.find(e=>e.id==='challenge').failNext='goal';
 run.lastScore=60;
 completeNode(run,'challenge',false);
 assert.equal(run.activeId,'knowledge');
});

test('multiple manual routes wait for player and preserve selected arrow',()=>{
 const run=setup([{label:'路線一',next:'knowledge',condition:'choice',value:''},{label:'路線二',next:'goal',condition:'choice',value:''}]);
 run.lastScore=95;
 completeNode(run,'challenge',true);
 assert.equal(run.activeId,'');
 assert.equal(run.pendingRoutes.length,2);
 assert.equal(resolveRoute(run,1),'goal');
});

test('single route and legacy fail route remain compatible',()=>{
 const run=setup([]);
 completeNode(run,'challenge',false);
 assert.equal(run.activeId,'knowledge');
 assert.ok(linksFor(run.project.entities.find(e=>e.id==='challenge')).some(e=>e.label==='未通過'));
});

test('knowledge and challenge branch controls use a consistent add-option label and route connector',async()=>{
 const source=await readFile(new URL('./author.js',import.meta.url),'utf8');
 assert.match(source,/\['knowledge','challenge'\]\.includes\(e\.kind\)/);
 assert.match(source,/id="addRoute">＋ 增加選項/);
 assert.match(source,/data-connect-route/);
 assert.match(source,/source\.routes\[c\.choice\]\.next=id/);
});
