import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {studentGameFiles,studentGameZip} from './export-game.mjs';

const require=createRequire(import.meta.url),JSZip=require('jszip');
const project={id:'nursing42',version:2,title:'護理冒險',startId:'first',areas:[{id:'campus'}],entities:[{id:'first',kind:'knowledge',name:'知識',text:'</script><script>alert(1)</script>'}]};
const questions=[{id:'q1',text:'台灣護理知識－題目'}];
const template=await fs.readFile(new URL('./offline-player-template.html',import.meta.url),'utf8');

test('ZIP includes offline HTML, correctly named Chinese CMD, and instructions',async()=>{
 const {name,files}=studentGameFiles({project,questions,template});
 assert.equal(name,'護理冒險.zip');
 assert.deepEqual(Object.keys(files).sort(),['README.txt','index.html','執行遊戲.cmd'].sort());
 assert.match(files['執行遊戲.cmd'],/start "" "%~dp0index\.html"/);
 assert.doesNotMatch(files['執行遊戲.cmd'],/python|powershell|https?:\/\//i);
 const html=files['index.html'];
 assert.doesNotMatch(html,/__CAMPUS_GAME_DATA_BASE64__/);
 assert.doesNotMatch(html,/<\/script><script>alert\(1\)<\/script>/);
 const encoded=html.match(/atob\('([A-Za-z0-9+/=]+)'\)/)?.[1];
 assert.ok(encoded,'game data must be encoded, not interpolated into HTML');
 const embedded=JSON.parse(Buffer.from(encoded,'base64').toString('utf8'));
 assert.deepEqual(embedded.project,project);
 assert.deepEqual(embedded.questions,questions);
 const archive=await studentGameZip({project,questions,template},JSZip);
 const opened=await JSZip.loadAsync(archive);
 assert.deepEqual(Object.keys(opened.files).sort(),['README.txt','index.html','執行遊戲.cmd'].sort());
 assert.equal(await opened.file('執行遊戲.cmd').async('string'),files['執行遊戲.cmd']);
});

test('invalid or incomplete games are rejected without producing an archive',()=>{
 assert.throws(()=>studentGameFiles({project:null,questions,template}),/作品/);
 assert.throws(()=>studentGameFiles({project,questions:null,template}),/題庫/);
 assert.throws(()=>studentGameFiles({project,questions,template:'no placeholder'}),/模板/);
});
