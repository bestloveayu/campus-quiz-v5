import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultProject,checkProject,linksFor,newRun,completeNode,resolveRoute} from './flow-core.mjs';

test('V5.2 supports several route arrows while retaining legacy next',()=>{
 const p=defaultProject();const k=p.entities[0];
 assert.equal(linksFor(k)[0].target,'senior');
 k.routes=[{label:'前往挑戰',next:'challenge',condition:'choice'},{label:'先找學長',next:'senior',condition:'choice'}];
 assert.deepEqual(linksFor(k).map(x=>x.target),['challenge','senior']);
 assert.equal(checkProject(p).errors.length,0);
});

test('V5.2 route selection records the chosen branch',()=>{
 const p=defaultProject();p.entities[0].routes=[{label:'A',next:'senior',condition:'choice'},{label:'B',next:'challenge',condition:'choice'}];
 const run=newRun(p,[],1);
 completeNode(run,'knowledge');
 assert.equal(run.pendingRoutes.length,2);
 resolveRoute(run,0);
 assert.equal(run.activeId,'senior');
 assert.equal(run.pendingRoutes,null);
 assert.equal(run.events.at(-1).type,'ROUTE_SELECTED');
});

test('V5.2 applies score threshold automatically with fallback',()=>{
 const p=defaultProject();const k=p.entities[0];
 k.routes=[{label:'高分',next:'challenge',condition:'score-gte',value:'80'},{label:'其他',next:'senior',condition:'choice'}];
 const run=newRun(p,[],1);run.lastScore=90;
 completeNode(run,'knowledge');
 assert.equal(run.activeId,'challenge');
});

test('V5.2 rejects dangling branch destinations',()=>{
 const p=defaultProject();p.entities[0].routes=[{label:'失效路線',next:'missing',condition:'choice'}];
 assert.match(checkProject(p).errors.join(' '),/不存在/);
});
