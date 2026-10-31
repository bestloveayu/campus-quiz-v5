import {validateBank} from './core.mjs';

export const sceneNames=['校門口','校園廣場','中庭花園','教學大樓','圖書館','教室'];
export const conditions=['單次全對','累計完成挑戰','連續通關'];
const allowed={作品:['格式版本','編號','名稱','作者','開場劇情','配色','關卡數'],關卡:['編號','名稱','場景','題庫','出題數','通關分數','允許提示','通關解鎖','劇情','提示次數'],人物:['編號','名稱','所在關卡','對話','提示'],成就:['編號','名稱','條件','最低作答題數','次數','獎勵文字'],題目:['編號','題庫','題幹','A','B','C','D','答案','解析','提示','來源','難度'],需求:['內容'],AI對話:['內容']};
const fail=(b,msg,key)=>{throw Error(`第 ${b?.lines?.[key]||b?.line||1} 行：${msg}`)};
function number(b,key,def,min,max){let s=b.fields[key];if(s===undefined)return def;if(!/^\d+$/.test(s)||+s<min||+s>max)fail(b,`${key}必須是 ${min}–${max} 的整數`,key);return +s;}
function identifier(b){let s=b.fields.編號;if(!s||!/^[A-Za-z0-9_-]{1,60}$/.test(s))fail(b,'編號須為 1–60 個英數字、底線或連字號','編號');if(['entrance','exit','txt-goal'].includes(s))fail(b,'此編號是系統保留名稱：'+s,'編號');return s;}
function required(b,key){let v=b.fields[key];if(!v?.trim())fail(b,`缺少${key}`,key);return v.trim();}
function unique(blocks){let ids=new Set();for(let b of blocks){let id=identifier(b);if(ids.has(id))fail(b,`重複編號：${id}`,'編號');ids.add(id);}}

export function parseText(raw){
 if(typeof raw!=='string'||raw.length>2_000_000)throw Error('TXT 上限 200 萬字元');
 raw=raw.replace(/^\uFEFF/,'').replace(/\r/g,'').trim().replace(/^```(?:txt|text)?\s*\n/,'').replace(/\n```$/,'');
 let blocks=[],current=null,last=null,multiline=false;
 raw.split('\n').forEach((line,i)=>{if(current&&multiline&&/^\s/.test(line)){current.fields[last]+=(current.fields[last]?'\n':'')+line.replace(/^ {1,2}|^\t/,'');return;}let s=line.trim();if(!s||s.startsWith('#'))return;let head=s.match(/^\[([^\]]+)\]$/);if(head){if(!allowed[head[1]])fail({line:i+1},`不支援的區塊「${head[1]}」`);current={type:head[1],fields:{},lines:{},line:i+1};blocks.push(current);last=null;multiline=false;return;}
 if(!current)fail({line:i+1},'請先寫區塊標記，例如 [作品] 或 [題目]');
 if(multiline&&/^\s/.test(line)){current.fields[last]+=(current.fields[last]?'\n':'')+line.replace(/^ {1,2}|^\t/,'');return;}
 let m=s.match(/^([^：:]+)[：:]\s*(.*)$/);if(!m)fail({line:i+1},'請使用「欄位：內容」；多行內容請縮排兩格');
 let key=m[1].trim();if(!allowed[current.type].includes(key))fail({line:i+1},`${current.type} 不支援欄位「${key}」`);if(Object.hasOwn(current.fields,key))fail({line:i+1},`欄位重複：${key}`);current.fields[key]=m[2]==='|'?'':m[2];current.lines[key]=i+1;last=key;multiline=m[2]==='|';
 });
 if(!blocks.length)throw Error('TXT 沒有內容');
 let of=type=>blocks.filter(b=>b.type===type),design=null;
 if(of('作品').length>1)fail(of('作品')[1],'只能有一個 [作品]');
 if(of('作品').length){let b=of('作品')[0];if(number(b,'格式版本',1,1,1)!==1)fail(b,'格式版本只支援 1');let stages=of('關卡');if(!stages.length||stages.length>10)fail(b,'作品須有 1–10 個關卡');unique([...stages,...of('人物')]);unique(of('成就'));
 design={id:b.fields.編號||'txt-campus',title:required(b,'名稱'),author:b.fields.作者||'',story:b.fields.開場劇情||'',theme:b.fields.配色||'森林綠',stages:stages.map(s=>{let f=s.fields;let scene=f.場景||'校門口';if(!sceneNames.includes(scene))fail(s,`場景須為：${sceneNames.join('、')}`,'場景');if(f.允許提示!==undefined&&!['是','否'].includes(f.允許提示))fail(s,'允許提示須為「是」或「否」','允許提示');return {id:identifier(s),name:required(s,'名稱'),scene,bank:f.題庫||'全部',count:number(s,'出題數',3,1,10),threshold:number(s,'通關分數',80,0,100),hints:f.允許提示!=='否',hintCount:number(s,'提示次數',3,0,10),unlock:f.通關解鎖||'',text:f.劇情||''};}),characters:of('人物').map(s=>({id:identifier(s),name:required(s,'名稱'),stage:required(s,'所在關卡'),text:s.fields.對話||'',hint:s.fields.提示||''})),achievements:of('成就').map(s=>{let condition=required(s,'條件');if(!conditions.includes(condition))fail(s,'條件須為：'+conditions.join('、'),'條件');return {id:identifier(s),name:required(s,'名稱'),condition,minimum:number(s,'最低作答題數',1,1,10),times:number(s,'次數',1,1,1000),reward:s.fields.獎勵文字||''};})};
 if(!/^[\w-]{1,60}$/.test(design.id))fail(b,'作品編號須為英數字、底線或連字號','編號');
 if(design.title.length>100)fail(b,'作品名稱上限 100 字','名稱');
 if(!['森林綠','海洋藍','暖橘'].includes(design.theme))fail(b,'配色支援森林綠、海洋藍、暖橘','配色');
 if(b.fields.關卡數!==undefined&&number(b,'關卡數',0,1,10)!==design.stages.length)fail(b,'關卡數與實際 [關卡] 數量不同','關卡數');
 let ids=new Set(design.stages.map(s=>s.id)),incoming=new Map();for(let s of design.stages){if(s.unlock&&!ids.has(s.unlock))fail(stages.find(x=>x.fields.編號===s.id),`通關解鎖目標不存在：${s.unlock}`,'通關解鎖');if(s.unlock){if(incoming.has(s.unlock))fail(b,'每關只能有一個前關');incoming.set(s.unlock,s.id);}}
 let visited=new Set(),cur=design.stages[0].id;while(cur){if(visited.has(cur))fail(b,'通關解鎖存在循環');visited.add(cur);cur=design.stages.find(s=>s.id===cur).unlock;}if(visited.size!==ids.size)fail(b,'所有關卡須以通關解鎖從第一關連成一條路線');
 for(let c of design.characters)if(!ids.has(c.stage))fail(b,'人物所在關卡不存在：'+c.stage);if(design.characters.length>10)fail(b,'最多 10 位人物');
 }else if(of('關卡').length||of('人物').length||of('成就').length)fail(blocks[0],'請先提供 [作品] 區塊');
 let qb=of('題目');unique(qb);let questions=qb.map(b=>{let f=b.fields;let q;try{q=validateBank([{id:identifier(b),sourceId:identifier(b),bank:f.題庫||'未分類',text:required(b,'題幹'),options:['A','B','C','D'].map(k=>required(b,k)),answer:required(b,'答案'),explanation:required(b,'解析'),hint:f.提示||'',source:f.來源||'未填來源',difficulty:number(b,'難度',1,1,3)}])[0];}catch(e){if(/^第 \d+ 行/.test(e.message))throw e;fail(b,e.message);}return q;});
 return {design,questions,notes:blocks.filter(b=>['需求','AI對話'].includes(b.type)).map(b=>({type:b.type,text:b.fields.內容||''})),warnings:[]};
}

export function compileDesign(d){
 let entities=[],slots={campus:0,room:0};
 const pos=scene=>{let i=slots[scene]++;return scene==='campus'?{x:[-12,-7,-2,3,7,12][i%6],z:5+Math.floor(i/6)*3}:{x:[-7,-3.2,2,7][i%4],z:4.6-Math.floor(i/4)*3};};
 const scene=s=>['教學大樓','圖書館','教室'].includes(s.scene)?'room':'campus';
 const first=s=>d.characters.find(c=>c.stage===s.id)?.id||s.id;
 for(let s of d.stages){let previous=d.stages.find(p=>p.unlock===s.id),requires=previous?[previous.id]:[],sc=scene(s),characters=d.characters.filter(c=>c.stage===s.id);
 for(let [i,c]of characters.entries())entities.push({id:c.id,kind:'npc',name:c.name,scene:sc,...pos(sc),yaw:0,text:c.text+(c.hint?'\n小提醒：'+c.hint:''),requires:[...requires],stageId:s.id,choices:[{text:'準備好了，前往挑戰',next:characters[i+1]?.id||s.id,hints:0}]});
 entities.push({id:s.id,kind:'challenge',name:s.name,scene:sc,...pos(sc),yaw:0,text:s.text||'完成此關即可解鎖下一個探索區域。',requires,stageId:s.id,region:s.scene,bank:s.bank,count:s.count,threshold:s.threshold,difficulty:0,hintsEnabled:s.hints,hintCount:s.hintCount,next:s.unlock?first(d.stages.find(n=>n.id===s.unlock)):'txt-goal',failNext:s.id});}
 let last=d.stages.find(s=>!s.unlock);entities.push({id:'txt-goal',kind:'goal',name:'完成校園探索',scene:'room',...pos('room'),yaw:0,text:'所有關卡已通關。查看成就與學習紀錄，或重玩已解鎖關卡。',requires:[last.id],next:''});
 return {id:d.id,version:1,title:d.title,startId:first(d.stages[0]),entities,txtDesign:structuredClone(d)};
}
export function syncDesignFromProject(project){let d=project.txtDesign;if(!d)return;let retained=d.stages.filter(s=>project.entities.some(e=>e.id===s.id&&e.kind==='challenge'));if(retained.length!==d.stages.length){d.stages=retained;d.stages.forEach((s,i)=>s.unlock=d.stages[i+1]?.id||'');}d.characters=d.characters.filter(c=>project.entities.some(e=>e.id===c.id&&e.kind==='npc')&&d.stages.some(s=>s.id===c.stage));d.title=project.title;for(let s of d.stages){let e=project.entities.find(e=>e.id===s.id&&e.kind==='challenge');if(!e)continue;Object.assign(s,{name:e.name,text:e.text,bank:e.bank||'全部',count:e.count,threshold:e.threshold,hints:e.hintsEnabled!==false,hintCount:e.hintCount??3});let wasRoom=['教學大樓','圖書館','教室'].includes(s.scene);if(wasRoom!==(e.scene==='room'))s.scene=e.scene==='room'?'教室':'校園廣場';e.region=s.scene;}for(let c of d.characters){let e=project.entities.find(e=>e.id===c.id&&e.kind==='npc');if(e){c.name=e.name;let marker='\n小提醒：',index=e.text.lastIndexOf(marker);c.text=index>=0?e.text.slice(0,index):e.text;c.hint=index>=0?e.text.slice(index+marker.length):'';}}}
export function mergeQuestions(existing,incoming,mode='append'){if(mode==='replace')return structuredClone(incoming);let map=new Map(existing.map(q=>[q.id,q]));for(let q of incoming)map.set(q.id,structuredClone(q));if(map.size>500)throw Error('題庫合併後超過 500 題');return [...map.values()];}
export function achievementStatus(rules,logs){let seen=new Set(),valid=logs.filter(l=>l&&l.id&&!seen.has(l.id)&&seen.add(l.id)&&Array.isArray(l.results)&&l.results.length&&Number.isFinite(l.score));return rules.map(rule=>{let progress=0,unlocked=false,streak=0;for(let l of valid){if(rule.condition==='單次全對'){if(l.score===100&&l.results.length>=rule.minimum)unlocked=true;progress=Math.max(progress,l.score===100?l.results.length:0);}else if(rule.condition==='累計完成挑戰'){progress++;if(progress>=rule.times)unlocked=true;}else {streak=l.passed?streak+1:0;progress=streak;if(streak>=rule.times)unlocked=true;}}return {...rule,unlocked,progress,target:rule.condition==='單次全對'?rule.minimum:rule.times};});}
const field=(k,v)=>String(v??'').includes('\n')?`${k}：|\n${String(v).split('\n').map(s=>'  '+s).join('\n')}`:`${k}：${v??''}`;
const block=(name,fields)=>`[${name}]\n`+Object.entries(fields).map(([k,v])=>field(k,v)).join('\n');
export function exportDesign(d,notes=[]){return [block('作品',{'格式版本':1,'編號':d.id,'名稱':d.title,'作者':d.author,'開場劇情':d.story,'配色':d.theme,'關卡數':d.stages.length}),...d.stages.map(s=>block('關卡',{'編號':s.id,'名稱':s.name,'場景':s.scene,'題庫':s.bank,'出題數':s.count,'通關分數':s.threshold,'允許提示':s.hints?'是':'否','提示次數':s.hintCount,'通關解鎖':s.unlock,'劇情':s.text})),...d.characters.map(c=>block('人物',{'編號':c.id,'名稱':c.name,'所在關卡':c.stage,'對話':c.text,'提示':c.hint})),...d.achievements.map(a=>block('成就',{'編號':a.id,'名稱':a.name,'條件':a.condition,'最低作答題數':a.minimum,'次數':a.times,'獎勵文字':a.reward})),...notes.map(n=>block(n.type,{'內容':n.text}))].join('\n\n')+'\n';}
export function exportQuestions(questions){return questions.map(q=>block('題目',{'編號':q.id,'題庫':q.bank||'未分類','題幹':q.text,'A':q.options[0],'B':q.options[1],'C':q.options[2],'D':q.options[3],'答案':q.answer,'解析':q.explanation,'提示':q.hint,'來源':q.source,'難度':q.difficulty})).join('\n\n')+'\n';}
