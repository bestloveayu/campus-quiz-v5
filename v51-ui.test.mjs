import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('V5.2.1 presents new name and keeps JSON actions under advanced backups',async()=>{
 const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
 const author=await readFile(new URL('./author.js',import.meta.url),'utf8');
 const ui=await readFile(new URL('./ui.js',import.meta.url),'utf8');
 assert.match(html,/<title>學習大挑戰 · 互動編輯器 V5\.2\.1<\/title>/);
 assert.doesNotMatch(html,/耕莘學習島/);
 assert.match(author,/<details class="advanced-backup">/);
 assert.match(author,/advancedBackup\.append\(document\.getElementById\(id\)\)/);
 assert.match(ui,/bankAdvanced\.append\(document\.getElementById\(id\)\)/);
});

test('offline module graph bundles the draggable window behavior',async()=>{
 const {buildOfflineTemplate}=await import('./build-offline-template.mjs');
 const html=await buildOfflineTemplate();
 assert.match(html,/學習大挑戰/);
 assert.match(html,/V5\.2\.1/);
 assert.match(html,/MODULES_B64/);
 const encoded=html.match(/const MODULES_B64='([^']+)'/)[1];
 const modules=JSON.parse(Buffer.from(encoded,'base64').toString('utf8'));
 assert.ok(modules.some(m=>m.path==='draggable-ui.mjs'));
});
