export const templates={campus:'校園校舍',garden:'花園廣場',classroom:'教室',library:'圖書館',skills:'護理技能教室'};
export const templateMode=t=>['campus','garden'].includes(t)?'campus':'room';
export const doorwayFor=t=>t==='campus'?{x:0,z:1.6,type:'entrance'}:t==='garden'?{x:0,z:8,type:'garden-exit'}:{x:0,z:8,type:'exit'};
const functional=e=>['knowledge','npc','challenge','goal'].includes(e.kind);
export function normalizeStudio(input){
 let p=structuredClone(input);if(!p||!Array.isArray(p.entities))throw Error('缺少作品素材');
 if(!p.areas){p.areas=[{id:'campus',name:'新店校園',template:'campus',requires:[]},{id:'room',name:'教學大樓',template:'classroom',requires:p.entities.some(e=>e.id==='knowledge')?['knowledge']:[]}];
  if(p.txtDesign){let regionMap=new Map([['校門口','campus'],['校園廣場','campus'],['教學大樓','room'],['教室','room']]);for(let s of p.txtDesign.stages){let areaId=regionMap.get(s.scene);if(!areaId){areaId='area-'+s.id;regionMap.set(s.scene,areaId);p.areas.push({id:areaId,name:s.scene,template:s.scene==='圖書館'?'library':'garden',requires:[]});}let a=p.areas.find(a=>a.id===areaId),prev=p.txtDesign.stages.find(x=>x.unlock===s.id);if(!p.entities.some(e=>e.areaId===a.id)&&prev)a.requires=[prev.id];for(let e of p.entities.filter(e=>e.stageId===s.id))e.areaId=areaId;}}
 }
 if(!Array.isArray(p.areas)||!p.areas.length||p.areas.length>16)throw Error('場域數量須為 1–16');
 let ids=new Set();for(let a of p.areas){if(!a||typeof a.id!=='string'||!/^[\w-]{1,80}$/.test(a.id)||ids.has(a.id))throw Error('場域編號重複或不正確');ids.add(a.id);if(!templates[a.template]||typeof a.name!=='string'||!a.name.trim()||a.name.length>80)throw Error('場域名稱或模板不正確');if(!Array.isArray(a.requires)||a.requires.some(id=>!p.entities.some(e=>e.id===id&&functional(e))))throw Error(a.name+' 的解鎖條件不存在');
  if(a.door!==undefined&&(!a.door||typeof a.door!=='object'||Array.isArray(a.door)))throw Error(a.name+' 的門條件格式不正確');
  a.door={mode:'open',requires:[],item:'',...a.door};let d=a.door;
  if(!['open','tasks','item'].includes(d.mode)||!Array.isArray(d.requires)||d.requires.length>60||d.requires.some(id=>typeof id!=='string')||typeof d.item!=='string'||d.item.length>80)throw Error(a.name+' 的門條件格式不正確');
  if(d.mode==='tasks'&&(!d.requires.length||d.requires.some(id=>!p.entities.some(e=>e.id===id&&functional(e)))))throw Error(a.name+' 的門前置條件不存在');
  if(d.mode==='tasks'&&d.requires.some(id=>p.entities.some(e=>e.id===id&&(e.areaId||e.scene)===a.id)))throw Error(a.name+' 的門條件位於同一場域，無法從門外完成');
  if(d.mode==='item'&&!d.item.trim())throw Error(a.name+' 的門通行道具不得空白');
 }
 for(let e of p.entities)if(e.rewardItem!==undefined&&(typeof e.rewardItem!=='string'||e.rewardItem.length>80))throw Error(e.name+' 的通行道具名稱不正確');
 for(let e of p.entities){e.areaId=e.areaId||(ids.has(e.scene)?e.scene:p.areas[0].id);let a=p.areas.find(a=>a.id===e.areaId);if(!a)throw Error(e.name+' 所在場域不存在');e.scene=templateMode(a.template);}
 p.visibility={mode:'progressive',fixedAreaId:p.areas[0].id,...p.visibility};if(!['progressive','all','fixed'].includes(p.visibility.mode))throw Error('視野模式不正確');if(!ids.has(p.visibility.fixedAreaId))throw Error('固定場域不存在');
 if(p.visibility.mode==='progressive'){let first=p.entities.find(e=>e.id===p.startId)?.areaId||p.areas[0].id,done=new Set(),visiting=new Set();function visit(id){if(id===first||p.areas.find(a=>a.id===id)?.initialVisible||done.has(id))return;if(visiting.has(id))throw Error('場域解鎖存在循環，請調整解鎖條件或素材所在場域');visiting.add(id);let a=p.areas.find(a=>a.id===id);for(let node of a.requires){let location=p.entities.find(e=>e.id===node)?.areaId;if(location===id)throw Error(a.name+' 的解鎖條件位於同一場域，請改選其他場域的任務');if(location)visit(location);}visiting.delete(id);done.add(id);}for(let a of p.areas)visit(a.id);}
 p.flowLayout=p.flowLayout||{};for(let [id,pos]of Object.entries(p.flowLayout)){if(!pos||![pos.x,pos.y].every(n=>Number.isFinite(n)&&n>=0&&n<=10000))throw Error('流程節點位置不正確：'+id);}
 let nodes=p.entities.filter(functional).map(e=>e.id);p.flowOrder=[...new Set([...(p.flowOrder||[]).filter(id=>nodes.includes(id)),...nodes])];return p;
}
export function areaAccess(project,visited=[],currentAreaId='',editing=false){let first=project.entities.find(e=>e.id===project.startId)?.areaId||project.areas[0].id;return project.areas.map(a=>{let allowed=a.id===first||a.initialVisible===true||(a.requires.length>0&&a.requires.every(id=>visited.includes(id)))||project.entities.some(e=>e.areaId===a.id&&visited.includes(e.id));let visible=editing||project.visibility.mode==='all'||(project.visibility.mode==='fixed'?a.id===project.visibility.fixedAreaId:allowed);return {...structuredClone(a),visible,enterable:visible,current:a.id===currentAreaId};});}
export function doorAccess(project,run,areaId){
 let area=project.areas.find(a=>a.id===areaId);if(!area)return {ok:false,reason:'找不到目標場域'};
 let start=project.entities.find(e=>e.id===project.startId)?.areaId||project.areas[0].id;
 if(area.id===start)return {ok:true};
 let door=area.door||{mode:'open',requires:[],item:''};
 if(door.mode==='open')return {ok:true};
 if(door.mode==='item')return (run?.items||[]).includes(door.item)?{ok:true}:{ok:false,reason:'門尚未解鎖，需要道具：'+door.item};
 if(door.mode==='tasks'){
  let missing=(door.requires||[]).filter(id=>!(run?.visited||[]).includes(id));
  return missing.length?{ok:false,reason:'門尚未解鎖，請先完成：'+missing.map(id=>project.entities.find(e=>e.id===id)?.name||id).join('、')}:{ok:true};
 }
 return {ok:false,reason:'門條件設定不正確'};
}
export function travelAccess(project,run,areaId,editing=false){
 if(editing)return project.areas.some(a=>a.id===areaId)?{ok:true}:{ok:false,reason:'找不到目標場域'};
 let visible=areaAccess(project,run?.visited||[],'',false).find(a=>a.id===areaId)?.visible;
 if(!visible)return {ok:false,reason:'此入口尚未揭露，或不在固定場域的可探索範圍內。'};
 return doorAccess(project,run,areaId);
}
export function navigationTarget(project,run,fromAreaId,toAreaId){
 if(fromAreaId===toAreaId)return {ok:true,pointId:null};
 let status=travelAccess(project,run,toAreaId);if(!status.ok)return status;
 let current=project.areas.find(a=>a.id===fromAreaId);if(!current)return {ok:false,reason:'目前場域不存在'};
 return {ok:true,pointId:doorwayFor(current.template).type};
}
export function addArea(project,name,template){if(project.areas.length>=16)throw Error('最多 16 個場域');if(!templates[template]||!name.trim()||name.length>80)throw Error('請填場域名稱並選擇模板');let i=1;while(project.areas.some(a=>a.id==='area-'+i))i++;let last=project.entities.filter(e=>e.kind==='challenge').at(-1);let area={id:'area-'+i,name:name.trim(),template,requires:last?[last.id]:[]};project.areas.push(area);return area;}
export function removeArea(project,id){if(project.areas.length<=1)throw Error('至少保留一個場域');if(project.entities.some(e=>e.areaId===id))throw Error('此場域仍有素材，請先移動或移除素材');project.areas=project.areas.filter(a=>a.id!==id);if(project.visibility.fixedAreaId===id)project.visibility.fixedAreaId=project.areas[0].id;}
export function moveEntityArea(project,id,areaId){let a=project.areas.find(a=>a.id===areaId),e=project.entities.find(e=>e.id===id);if(!a||!e)throw Error('素材或場域不存在');e.areaId=areaId;e.scene=templateMode(a.template);}
export function removeEntity(project,id){project.entities=project.entities.filter(e=>e.id!==id);for(let e of project.entities){e.requires=(e.requires||[]).filter(r=>r!==id);if(e.next===id)e.next='';if(e.failNext===id)e.failNext='';for(let c of e.choices||[])if(c.next===id)c.next='';}for(let a of project.areas){let had=a.requires.includes(id);a.requires=a.requires.filter(r=>r!==id);if(had&&!a.requires.length)a.initialVisible=true;if(a.door?.requires?.includes(id)){a.door.requires=a.door.requires.filter(r=>r!==id);if(a.door.mode==='tasks'&&!a.door.requires.length)a.door.mode='open';}}if(project.startId===id)project.startId=project.entities.find(functional)?.id||'';delete project.flowLayout[id];project.flowOrder=project.flowOrder.filter(x=>x!==id);project.extendedFlow=true;}
export function reorderFlow(project,order){let ids=project.entities.filter(functional).map(e=>e.id);if(order.length!==ids.length||new Set(order).size!==ids.length||order.some(id=>!ids.includes(id)))throw Error('流程排列必須包含每個互動點一次');project.flowOrder=[...order];}
export function chainFlow(project,order){reorderFlow(project,order);let list=order.map(id=>project.entities.find(e=>e.id===id));if(list.some((e,i)=>e.kind==='goal'&&i!==list.length-1))throw Error('任務終點必須排在最後');for(let [i,e]of list.entries()){e.requires=i?[list[i-1].id]:[];let next=list[i+1]?.id||'';if(e.kind==='npc')e.choices.forEach(c=>c.next=next);else e.next=next;if(e.kind==='challenge')e.failNext=e.id;}project.startId=list[0]?.id||'';project.extendedFlow=true;}
export function mergeExtendedProject(old,candidate){let p=normalizeStudio(candidate);if(old.id!==candidate.id)return p;old=normalizeStudio(old);let managed=new Set(old.txtDesign?[...old.txtDesign.stages.map(s=>s.id),...old.txtDesign.characters.map(c=>c.id),'txt-goal']:[]),ids=new Set(p.entities.map(e=>e.id));p.entities=p.entities.map(e=>{let previous=old.entities.find(x=>x.id===e.id);return previous?{...e,x:previous.x,z:previous.z,yaw:previous.yaw,areaId:previous.areaId,rewardItem:previous.rewardItem,...(old.extendedFlow?{requires:previous.requires,next:previous.next,failNext:previous.failNext,...(e.kind==='npc'?{choices:previous.choices}:{})}:{})}:e;});p.entities.push(...old.entities.filter(e=>!ids.has(e.id)&&!managed.has(e.id)));p.areas=[...old.areas,...p.areas.filter(a=>!old.areas.some(x=>x.id===a.id))];p.visibility=old.visibility;p.flowLayout=old.flowLayout;p.flowOrder=[...old.flowOrder.filter(id=>p.entities.some(e=>e.id===id)),...p.entities.filter(e=>functional(e)&&!old.flowOrder.includes(e.id)).map(e=>e.id)];p.workspaceLayout=old.workspaceLayout;p.makingNotes=old.makingNotes;p.extendedFlow=old.extendedFlow;return normalizeStudio(p);}
