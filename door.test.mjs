import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeStudio,doorAccess,travelAccess,doorwayFor,navigationTarget,removeEntity} from './studio-core.mjs';
import {defaultProject,newRun,completeNode,checkProject} from './flow-core.mjs';

const project=()=>normalizeStudio(defaultProject());

test('legacy V5 areas stay enterable when door metadata is missing',()=>{
 const p=project();
 assert.equal(p.areas[1].door.mode,'open');
 assert.equal(doorAccess(p,{visited:[],items:[]},p.areas[1].id).ok,true);
});

test('task-locked door requires completed nodes and identifies missing task',()=>{
 const p=project();p.areas[1].door={mode:'tasks',requires:['knowledge'],item:''};
 assert.match(doorAccess(p,{visited:[],items:[]},'room').reason,/知識收藏站/);
 assert.equal(doorAccess(p,{visited:['knowledge'],items:[]},'room').ok,true);
});

test('item-locked door opens only after a successful first completion reward',()=>{
 const p=project();p.entities[0].rewardItem='護理通行證';p.areas[1].door={mode:'item',requires:[],item:'護理通行證'};
 const run=newRun(p,[],1);
 assert.equal(doorAccess(p,run,'room').ok,false);
 completeNode(run,'knowledge');
 assert.deepEqual(run.items,['護理通行證']);
 assert.equal(doorAccess(p,run,'room').ok,true);
});

test('a failed challenge cannot grant its reward item',()=>{
 const p=project();p.entities.find(e=>e.id==='challenge').rewardItem='通關鑰匙';
 const run=newRun(p,[],1);completeNode(run,'knowledge');completeNode(run,'senior',0);
 completeNode(run,'challenge',false);
 assert.equal(run.items.includes('通關鑰匙'),false);
});

test('invalid door tasks and self-locking tasks are rejected',()=>{
 const p=project();p.areas[1].door={mode:'tasks',requires:['missing'],item:''};
 assert.throws(()=>normalizeStudio(p),/門|條件/);
 p.areas[1].door.requires=['challenge'];
 assert.throws(()=>normalizeStudio(p),/同一場域|門/);
});

test('removing a door prerequisite does not leave a permanent broken lock',()=>{
 const p=project();p.areas[1].door={mode:'tasks',requires:['knowledge'],item:''};
 removeEntity(p,'knowledge');
 assert.equal(normalizeStudio(p).areas[1].door.mode,'open');
});

test('old running records without items are still safe to evaluate',()=>{
 const p=project();p.areas[1].door={mode:'item',requires:[],item:'護理通行證'};
 assert.equal(doorAccess(p,{visited:[]},'room').ok,false);
});

test('travel rejects visible but locked rooms even with all-areas vision',()=>{
 const p=project();p.visibility.mode='all';p.areas[1].door={mode:'tasks',requires:['knowledge'],item:''};
 assert.equal(travelAccess(p,{visited:[],items:[]},'room').ok,false);
 assert.equal(travelAccess(p,{visited:['knowledge'],items:[]},'room').ok,true);
});

test('travel never reveals hidden room names in progressive or fixed vision',()=>{
 const p=project();
 const result=travelAccess(p,{visited:[],items:[]},'room');
 assert.equal(result.ok,false);
 assert.equal(result.reason.includes('教學大樓'),false);
 p.visibility={mode:'fixed',fixedAreaId:'room'};
 assert.equal(travelAccess(p,{visited:[],items:[]},'campus').ok,false);
 assert.equal(travelAccess(p,{visited:[],items:[]},'room').ok,true);
});

test('all five templates have a walkable near-door point',()=>{
 assert.deepEqual(doorwayFor('campus'),{x:0,z:1.6,type:'entrance'});
 for(const t of ['classroom','library','skills'])assert.deepEqual(doorwayFor(t),{x:0,z:8,type:'exit'});
 assert.deepEqual(doorwayFor('garden'),{x:0,z:8,type:'garden-exit'});
});

test('checker warns when no reachable task awards a required door item',()=>{
 const p=project();p.areas[1].door={mode:'item',requires:[],item:'圖書館鑰匙'};
 assert.equal(checkProject(p).warnings.some(s=>s.includes('圖書館鑰匙')),true);
 p.entities[0].rewardItem='圖書館鑰匙';
 assert.equal(checkProject(p).warnings.some(s=>s.includes('圖書館鑰匙')),false);
});

test('cross-area navigation guides players to E doors instead of teleporting',()=>{
 const p=project();p.visibility.mode='all';const run={visited:[],items:[]};
 assert.deepEqual(navigationTarget(p,run,'campus','room'),{ok:true,pointId:'entrance'});
 assert.deepEqual(navigationTarget(p,run,'room','campus'),{ok:true,pointId:'exit'});
 assert.deepEqual(navigationTarget(p,run,'campus','campus'),{ok:true,pointId:null});
 p.areas.push({id:'garden',name:'花園',template:'garden',requires:[],door:{mode:'open',requires:[],item:''}});
 assert.deepEqual(navigationTarget(p,run,'garden','campus'),{ok:true,pointId:'garden-exit'});
});
