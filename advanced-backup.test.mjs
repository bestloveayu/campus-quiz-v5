import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('complete JSON editor backups are only in an advanced disclosure',()=>{
 const src=readFileSync(new URL('./author.js',import.meta.url),'utf8');
 assert.match(src,/<details[^>]*id="advancedBackup"/);
 const section=src.match(/<details[^>]*id="advancedBackup"[\s\S]*?<\/details>/)?.[0]||'';
 for(const id of ['exportProject','importProject','openEditorFile','saveAsProject'])assert.match(section,new RegExp(`id="${id}"`));
});

test('question-bank JSON controls are also behind advanced backup disclosure',()=>{
 const src=readFileSync(new URL('./ui.js',import.meta.url),'utf8');
 assert.match(src,/advancedBankBackup/);
 assert.match(src,/appendChild\(.*exportBank/);
 assert.match(src,/appendChild\(.*restoreFile/);
});
