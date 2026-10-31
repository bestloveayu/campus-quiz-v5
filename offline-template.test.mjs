import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

function build(){return spawnSync(process.execPath,['build-offline-template.mjs','--stdout'],{encoding:'utf8',maxBuffer:15*1024*1024});}

test('self-contained offline shell embeds every V5 module, styles and one game-data placeholder',()=>{
 const run=build();assert.equal(run.status,0,run.stderr);
 const html=run.stdout;
 assert.match(html,/<!doctype html>/i);
 assert.equal((html.match(/__CAMPUS_GAME_DATA_BASE64__/g)||[]).length,1);
 assert.match(html,/<style>[^]*?\.brand/);
 assert.doesNotMatch(html,/<link[^>]+stylesheet/i);
 assert.doesNotMatch(html,/<script[^>]+src=/i);
 const encoded=html.match(/const MODULES_B64='([A-Za-z0-9+/=]+)'/)?.[1];
 assert.ok(encoded,'module manifest must be inlined');
 const modules=JSON.parse(Buffer.from(encoded,'base64').toString('utf8'));
 const paths=modules.map(m=>m.path);
 for(const path of ['ui.js','world.js','author.js','studio-core.mjs','vendor/three.module.js','vendor/three.core.js','vendor/OrbitControls.js'])assert.ok(paths.includes(path),`${path} not bundled`);
 assert.equal(paths.at(-1),'ui.js','imports must load before the entry module');
 for(const module of modules){
  assert.ok(typeof module.source==='string'&&module.source.length>0);
  for(const dep of Object.values(module.imports))assert.ok(paths.indexOf(dep)<paths.indexOf(module.path),`${module.path} has unresolved dependency ${dep}`);
 }
});
