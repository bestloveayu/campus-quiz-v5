import {normalizeStudio,areaAccess} from './studio-core.mjs';
import {validateBank,gradeRound} from './core.mjs';
export const kinds={knowledge:'知識站',npc:'人物對話',challenge:'挑戰桌',goal:'任務終點',tree:'樹木',bench:'長椅'};
export const functional=e=>['knowledge','npc','challenge','goal'].includes(e.kind);
export function hintState(run,allowed=true){if(!allowed)return {enabled:false,label:'學長姐提示 · 已關閉'};if(run&&run.hints<=0)return {enabled:false,label:'學長姐提示 · 已用完'};return {enabled:true,label:'學長姐提示'};}
export function defaultProject(){return {id:'my-campus',version:1,title:'我的校園複習路線',startId:'knowledge',entities:[
 {id:'knowledge',kind:'knowledge',name:'知識收藏站',scene:'campus',x:-7,z:5.5,yaw:0,text:'AI 產生的題目需要回到教材查核。先確認題意、答案與解析，再用試玩結果調整。',source:'AI 學習素養示範，請改為自己的教材',requires:[],next:'senior'},
 {id:'senior',kind:'npc',name:'學長姐小莘',scene:'room',x:-3.2,z:4.6,yaw:0,text:'準備好挑戰了嗎？你想先取得提示，還是再複習一次？',requires:['knowledge'],choices:[{text:'請給我思考提示，再開始挑戰',next:'challenge',hints:2},{text:'我想回知識站再看一次',next:'knowledge',hints:0}]},
 {id:'challenge',kind:'challenge',name:'老師的三題挑戰',scene:'room',x:2,z:1,yaw:0,text:'試著先自己回答，再視需要使用提示。',requires:['knowledge','senior'],count:3,threshold:80,difficulty:0,next:'goal',failNext:'knowledge'},
 {id:'goal',kind:'goal',name:'學習成果站',scene:'room',x:7,z:4.3,yaw:0,text:'恭喜完成路線！在筆記寫下最需要複習的概念，留下下一次進步的起點。',requires:['challenge'],next:''}
 ]};}
export function linksFor(e){return e.kind==='npc'?(e.choices||[]).map((c,i)=>({target:c.next,label:`選項 ${i+1}`})):[...(Array.isArray(e.routes)&&e.routes.length?e.routes.map((r,i)=>({target:r.next,label:r.label||`路線 ${i+1}`})):[{target:e.next,label:e.kind==='challenge'?'通過':'下一站'}]),...(e.kind==='challenge'?[{target:e.failNext,label:'未通過'}]:[])];}
export function eligibleRoutes(e,run){return (e.routes||[]).filter(r=>{switch(r.condition||'choice'){
 case 'score-gte':return Number.isFinite(run.lastScore)&&run.lastScore>=Number(r.value);
 case 'score-lt':return Number.isFinite(run.lastScore)&&run.lastScore<Number(r.value);
 case 'visited':return run.visited.includes(r.value);
 case 'item':return (run.items||[]).includes(r.value);
 default:return true;
 }});}
export function resolveRoute(run,index){let routes=run.pendingRoutes;if(!routes||!routes[index])throw Error('無效的分流選項');let route=routes[index];run.activeId=route.next;run.pendingRoutes=null;event(run,'ROUTE_SELECTED',{nodeId:run.pendingFrom,route:index,next:route.next,label:route.label});run.pendingFrom=null;return run.activeId;}
export function checkProject(p){
 let errors=[],warnings=[];if(p?.areas){try{normalizeStudio(p)}catch(e){return {errors:[e.message],warnings}}}
 if(!p||!Array.isArray(p.entities)||p.entities.length>60)return {errors:['專案需要 entities 陣列，最多 60 個素材。'],warnings};
 if(typeof p.title!=='string'||!p.title.trim()||p.title.length>100)errors.push('作品名稱需有 1–100 字');
 let ids=new Set();
 for(let e of p.entities){
  if(!e||typeof e!=='object'){errors.push('素材格式不正確');continue}
  if(typeof e.id!=='string'||!/^[\w-]{1,128}$/.test(e.id))errors.push('素材編號不正確');
  if(['entrance','exit'].includes(e.id))errors.push('素材編號使用系統保留名稱：'+e.id);
  if(ids.has(e.id))errors.push('重複素材編號：'+e.id);ids.add(e.id);
  if(!kinds[e.kind])errors.push('未知素材類型');
  if(!['campus','room'].includes(e.scene)||![e.x,e.z,e.yaw??0].every(Number.isFinite)||Math.abs(e.x)>18||Math.abs(e.z)>14)errors.push(e.name+' 位置不正確');
  if(typeof e.name!=='string'||!e.name.trim()||e.name.length>100)errors.push('素材名稱需有 1–100 字');
  if(!functional(e))continue;
  if(typeof e.text!=='string'||e.text.length>12000)errors.push(e.name+' 內容格式不正確');
  if(!Array.isArray(e.requires)||e.requires.length>60||e.requires.some(r=>typeof r!=='string'))errors.push(e.name+' 前置條件不正確');
  if(e.kind==='goal'&&e.next)errors.push(e.name+' 是任務終點，不能再連接下一站');
  if(e.routes!==undefined){if(!Array.isArray(e.routes)||e.routes.length>8||e.kind==='goal'||e.kind==='npc')errors.push(e.name+' 分流設定不正確');else for(let r of e.routes)if(!r||typeof r.next!=='string'||!r.next||typeof r.label!=='string'||!r.label.trim()||!['choice','score-gte','score-lt','visited','item'].includes(r.condition||'choice')||(['score-gte','score-lt'].includes(r.condition)&&(!Number.isFinite(Number(r.value))||Number(r.value)<0||Number(r.value)>100)))errors.push(e.name+' 分流選項內容不正確');}
  if(e.kind==='npc'){
   if(!Array.isArray(e.choices)||!e.choices.length||e.choices.length>6)errors.push(e.name+' 需要 1–6 個對話選項');
   else for(let c of e.choices)if(!c||typeof c.text!=='string'||!c.text.trim()||!Number.isInteger(c.hints)||c.hints<0||c.hints>10||typeof c.next!=='string')errors.push(e.name+' 選項內容或提示數不正確');
  }else if(typeof e.next!=='string')errors.push(e.name+' 下一站格式不正確');
  if(e.kind==='challenge'&&(!Number.isInteger(e.count)||e.count<1||e.count>10||!Number.isFinite(e.threshold)||e.threshold<0||e.threshold>100||![0,1,2,3].includes(e.difficulty)||typeof e.failNext!=='string'))errors.push(e.name+' 挑戰條件不正確');
 }
 if(errors.length)return {errors:[...new Set(errors)],warnings};
 let nodes=p.entities.filter(functional),byId=new Map(nodes.map(e=>[e.id,e]));
 if(!byId.has(p.startId))errors.push('請指定有效的起始互動點');
 for(let e of nodes){
  for(let {target}of linksFor(e))if(target&&!byId.has(target))errors.push(e.name+' 連到不存在的互動點：'+target);
  for(let r of e.requires)if(!byId.has(r))errors.push(e.name+' 的前置條件目標遺失：'+r);
  if(!linksFor(e).some(l=>l.target)&&e.kind!=='goal')warnings.push(e.name+' 沒有下一站，流程將停在這裡');
 }
 let visiting=new Set(),done=new Set();
 function dfs(id){if(visiting.has(id)){errors.push('前置條件存在循環，請調整：'+(byId.get(id)?.name||id));return}if(done.has(id))return;visiting.add(id);for(let r of byId.get(id)?.requires||[])if(byId.has(r))dfs(r);visiting.delete(id);done.add(id)}for(let e of nodes)dfs(e.id);
 if(errors.length)return {errors:[...new Set(errors)],warnings};
 let reached=new Set();function reach(id){if(reached.has(id)||!byId.has(id))return;reached.add(id);for(let l of linksFor(byId.get(id)))if(l.target)reach(l.target)}reach(p.startId);
 for(let e of nodes)if(!reached.has(e.id))warnings.push(e.name+' 從起點無法連到');
 // Explore actual visited-node states, including failure routes and repeated visits.
 let queue=[{id:p.startId,visited:[]}],seen=new Set(),feasible=new Set(),blocked=new Set(),iterations=0;
 while(queue.length&&iterations++<4096){let current=queue.shift(),key=current.id+'|'+current.visited.slice().sort().join(',');if(seen.has(key))continue;seen.add(key);let e=byId.get(current.id);if(!e)continue;if(e.requires.some(r=>!current.visited.includes(r))){blocked.add(e.id);continue}feasible.add(e.id);if(e.kind==='goal')continue;let visited=[...new Set([...current.visited,e.id])];for(let link of linksFor(e))if(link.target)queue.push({id:link.target,visited:e.kind==='challenge'&&link.label==='未通過'?current.visited:visited});}
 for(let id of blocked)if(!feasible.has(id))errors.push(byId.get(id).name+' 的前置條件無法在此路線完成');else warnings.push(byId.get(id).name+' 有分支可能卡在前置條件，請試玩確認');
 if(queue.length)warnings.push('流程分支較多，已達分析上限，請額外試玩各分支');
 if(!nodes.some(e=>e.kind==='goal'&&feasible.has(e.id)))warnings.push('路線尚未連到可完成的任務終點');
 for(let area of p.areas||[])if(area.door?.mode==='item'&&!nodes.some(e=>e.rewardItem===area.door.item&&e.areaId!==area.id&&feasible.has(e.id)))warnings.push(area.name+' 的門需要「'+area.door.item+'」，但目前沒有可到達的其他場域任務會授予此道具');
 return {errors:[...new Set(errors)],warnings:[...new Set(warnings)]};
}
export function newRun(project,questions,materialVersion,settings={hints:true}){let check=checkProject(project);if(check.errors.length)throw Error(check.errors.join('；'));return {id:crypto.randomUUID(),at:new Date().toISOString(),project:structuredClone(project),questions:structuredClone(questions),materialVersion,settings:structuredClone(settings),activeId:project.startId,visited:[],items:[],hints:0,events:[],notes:'',noteHistory:[],finished:false};}
export function canActivate(run,id){let e=run.project.entities.find(e=>e.id===id);if(!e||!functional(e))return {ok:false,reason:'不是互動點'};if(run.finished)return {ok:false,reason:'本回合已完成，請重設試玩開始新回合'};if(run.activeId!==id)return {ok:false,reason:'請先完成目前任務：'+(run.project.entities.find(e=>e.id===run.activeId)?.name||'上一站')};let missing=(e.requires||[]).filter(r=>!run.visited.includes(r));return missing.length?{ok:false,reason:'尚未完成前置條件：'+missing.map(r=>run.project.entities.find(e=>e.id===r)?.name||r).join('、')}:{ok:true};}
export function event(run,type,data={}){run.events.push({at:new Date().toISOString(),type,...structuredClone(data)});}
export function completeNode(run,id,outcome){
 let status=canActivate(run,id);
 if(!status.ok)throw Error(status.reason);
 let e=run.project.entities.find(e=>e.id===id),first=!run.visited.includes(id),next=e.next||'';
 if(e.kind==='npc'){
  let choice=e.choices[outcome];
  if(!choice)throw Error('請選擇有效對話選項');
  next=choice.next||'';
  if(first)run.hints+=choice.hints||0;
  event(run,'DIALOGUE_CHOICE',{nodeId:id,choice:outcome,text:choice.text,hintsGranted:first?(choice.hints||0):0});
 }else if(e.kind==='challenge'){
  if(typeof outcome!=='boolean')throw Error('挑戰需要評分結果');
  next=outcome?(e.next||''):(e.failNext||id);
  event(run,outcome?'CHALLENGE_PASS':'CHALLENGE_FAIL',{nodeId:id,next});
 }else event(run,e.kind==='knowledge'?'KNOWLEDGE_COLLECT':'GOAL_REACHED',{nodeId:id,first});
 if(first&&(e.kind!=='challenge'||outcome)){
  run.visited.push(id);
  if(e.rewardItem?.trim()){
   run.items=run.items||[];
   if(!run.items.includes(e.rewardItem)){
    run.items.push(e.rewardItem);
    event(run,'ITEM_OBTAINED',{nodeId:id,item:e.rewardItem});
   }
  }
 }
 run.activeId=next;
 if(e.kind==='goal'){
  run.finished=true;
  event(run,'RUN_COMPLETE');
 }else if(Array.isArray(e.routes)&&e.routes.length){
  let eligible=eligibleRoutes(e,run);
  let automatic=eligible.filter(r=>r.condition&&r.condition!=='choice');
  let manual=eligible.filter(r=>!r.condition||r.condition==='choice');
  if(automatic.length){
   // Conditional branches take priority; the first matching rule wins.
   run.activeId=automatic[0].next;
   event(run,'ROUTE_AUTO',{nodeId:id,next:run.activeId,label:automatic[0].label});
  }else if(manual.length===1){
   run.activeId=manual[0].next;
  }else if(manual.length>1){
   run.pendingFrom=id;
   run.pendingRoutes=manual;
   run.activeId='';
  }
 }
 return run.activeId;
}
export function recordNote(run,text){if(run.notes===text)return;run.noteHistory.push({at:new Date().toISOString(),before:run.notes,after:text});run.notes=text;event(run,'NOTE_EDIT',{version:run.noteHistory.length});}

export function validateAuthorBackup(obj){
 if(!['ctcn-author-v3','ctcn-author-v4','ctcn-author-v5'].includes(obj?.format))throw Error('不是 V3 作品備份');
 const check=checkProject(obj.project);if(check.errors.length)throw Error(check.errors.join('；'));
 const array=(v,name,max=20000)=>{if(!Array.isArray(v)||v.length>max)throw Error(name+'格式或數量不正確');return v};
 const question=q=>{let n=validateBank([q])[0];return {...n,id:typeof q.id==='string'?q.id:n.id}};
 const edits=array(obj.editHistory||[],'修改歷程').map(e=>{if(!e||typeof e.action!=='string'||!Number.isFinite(Date.parse(e.at)))throw Error('修改歷程格式不正確');return structuredClone(e)});
 const bank=array(obj.questionBank||[],'題庫',500).map(question);
 const quizLogs=array(obj.quizLogs||[],'答題歷程').map(log=>{if(!log||!Number.isFinite(Date.parse(log.at))||!Number.isInteger(log.version)||!Number.isFinite(log.settings?.passing)||log.settings.passing<0||log.settings.passing>100)throw Error('答題歷程格式不正確');let results=array(log.results,'逐題歷程',10).map(r=>{if(!r||!/^[A-D]$/.test(r.answer)||typeof r.hintUsed!=='boolean')throw Error('逐題答案格式不正確');return {...structuredClone(r),question:question(r.question)}});return {...structuredClone(log),...gradeRound(results,log.settings.passing)}});
 const runs=array(obj.runs||[],'試玩歷程',1000).map(r=>{if(!r||!Number.isFinite(Date.parse(r.at))||checkProject(r.project).errors.length||!Number.isInteger(r.hints)||r.hints<0||!Array.isArray(r.visited)||typeof r.notes!=='string')throw Error('試玩歷程格式不正確');array(r.questions,'回合題庫',500).forEach(question);array(r.events,'行為事件',50000).forEach(e=>{if(!e||typeof e.type!=='string'||!Number.isFinite(Date.parse(e.at)))throw Error('行為事件不正確')});array(r.noteHistory,'筆記歷程').forEach(n=>{if(!n||typeof n.before!=='string'||typeof n.after!=='string')throw Error('筆記歷程不正確')});return structuredClone(r)});
 array(obj.questionEdits||[],'題庫修改歷程');
 if(obj.quizSettings&&(![0,1,2,3].includes(obj.quizSettings.level)||typeof obj.quizSettings.hints!=='boolean'||![60,80,100].includes(obj.quizSettings.passing)))throw Error('題庫設定不正確');
 return {...structuredClone(obj),project:obj.project.areas?normalizeStudio(obj.project):structuredClone(obj.project),questionBank:bank,quizLogs,runs,editHistory:edits};
}
