import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeStudio, exitDestination} from './studio-core.mjs';

const fixture=()=>({entities:[],areas:[{id:'campus',name:'校園',template:'campus',requires:[]},{id:'room',name:'教室',template:'classroom',requires:[]},{id:'lab',name:'實習室',template:'skills',requires:[]}],visibility:{mode:'all',fixedAreaId:'campus'}});

test('door can lead directly from one room to another',()=>{
 const p=fixture();p.areas[1].door={mode:'open',requires:[],item:'',nextAreaId:'lab'};
 const normalized=normalizeStudio(p);
 assert.equal(exitDestination(normalized,'room'),'lab');
 assert.equal(exitDestination(normalized,'lab'),'campus');
});
test('invalid or self-referencing destinations are rejected',()=>{
 for(const target of ['room','missing']){
  const p=fixture();p.areas[1].door={mode:'open',requires:[],item:'',nextAreaId:target};
  assert.throws(()=>normalizeStudio(p),/目的地/);
 }
});
test('editor provides outgoing door destination setting',()=>{
 const src=readFileSync(new URL('./studio.js',import.meta.url),'utf8');
 assert.match(src,/data-door-next/);
});
