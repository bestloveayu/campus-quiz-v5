import test from 'node:test';
import assert from 'node:assert/strict';
import {offlineStorageKey,offlineProjectData,offlineBankState} from './offline-boot.mjs';

const embedded={project:{id:'game-42',version:7,title:'護理冒險',entities:[],areas:[]},questions:[{id:'q1',text:'題目'}]};

test('offline boot loads embedded project and bank without inheriting old editor content',()=>{
 const old={project:{id:'unrelated'},edits:[{action:'edit'}],runs:[{id:'old'}]};
 const next=offlineProjectData(embedded,old);
 assert.equal(next.project.id,'game-42');
 assert.deepEqual(next.edits,[]);
 assert.deepEqual(next.runs,[]);
 assert.notStrictEqual(next.project,embedded.project);
 const bank=offlineBankState({questions:[{id:'demo'}],logs:[{id:'old'}],edits:[1],version:1},embedded);
 assert.deepEqual(bank.questions,embedded.questions);
 assert.deepEqual(bank.logs,[]);
 assert.deepEqual(bank.edits,[]);
 assert.equal(bank.version,1);
});

test('different offline games have separate stable browser storage keys',()=>{
 assert.equal(offlineStorageKey('ctcn-author-v5',embedded),'ctcn-author-v5-offline-game-42');
 assert.notEqual(offlineStorageKey('ctcn-author-v5',{project:{id:'other'}}),offlineStorageKey('ctcn-author-v5',embedded));
 assert.equal(offlineStorageKey('ctcn-author-v5',null),'ctcn-author-v5');
});
