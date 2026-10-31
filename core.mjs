let seq=0;
const id=()=>globalThis.crypto?.randomUUID?.()||'q-'+Date.now()+'-'+seq++;
export function validateBank(input){
 if(!Array.isArray(input)||!input.length||input.length>500)throw Error('題庫須有 1–500 題。');
 return input.map((q,i)=>{let fail=s=>{throw Error(`第 ${i+1} 題：${s}`)};
 if(!q||typeof q!=='object')fail('資料格式錯誤');
 let text=String(q.text??q.question??'').trim();if(!text)fail('缺少題目');
 if(!Array.isArray(q.options)||q.options.length!==4||Array.from(q.options).some(x=>typeof x!=='string'||!x.trim()))fail('需要四個完整文字選項');
 let answer=String(q.answer||'').trim().toUpperCase();if(!/^[A-D]$/.test(answer))fail('答案須為 A–D');
 let explanation=String(q.explanation||'').trim();if(!explanation)fail('缺少解析');
 let difficulty=Number(q.difficulty??1);if(![1,2,3].includes(difficulty))fail('難度須為 1–3');
 return {id:typeof q.id==='string'&&/^[\w-]{1,128}$/.test(q.id)?q.id:id(),bank:String(q.bank||'未分類').trim().slice(0,100),text:text.slice(0,3000),options:q.options.map(x=>x.trim().slice(0,1500)),answer,explanation:explanation.slice(0,6000),hint:String(q.hint||'').slice(0,1500),source:String(q.source||'未填來源，待查核').slice(0,1000),difficulty};
 });
}
export function parseBank(raw){raw=raw.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');if(!raw)throw Error('請先貼上題庫。');if(/^[{[]/.test(raw)){let d=JSON.parse(raw);return validateBank(Array.isArray(d)?d:d.questions)}
 let blocks=raw.replace(/\r/g,'').split(/\n\s*\n|(?=^題目[：:])/m).filter(x=>x.trim());
 let fields={題目:'text',答案:'answer',解析:'explanation',提示:'hint',難度:'difficulty',來源:'source'};
 return validateBank(blocks.map((block,i)=>{let q={options:[]};for(let line of block.split('\n').map(x=>x.trim()).filter(Boolean)){let m;if(m=line.match(/^([A-D])[.．、:：]\s*(.+)$/i))q.options[m[1].toUpperCase().charCodeAt(0)-65]=m[2];else if(m=line.match(/^(題目|答案|解析|提示|難度|來源)[：:]\s*(.*)$/))q[fields[m[1]]]=m[2];else throw Error(`第 ${i+1} 段無法辨識：「${line.slice(0,30)}」。講義需先命題，請使用範例格式。`)}return q}));
}
export function findPath(start,end,blocked,width,height){
 const inside=(x,z)=>x>=0&&z>=0&&x<width&&z<height;
 if(!inside(start.x,start.z)||!inside(end.x,end.z)||blocked(end.x,end.z))return [];
 let key=p=>p.x+','+p.z,open=[{...start,g:0,f:0}],cost=new Map([[key(start),0]]),prev=new Map(),closed=new Set();
 while(open.length){open.sort((a,b)=>a.f-b.f);let cur=open.shift(),k=key(cur);if(closed.has(k))continue;closed.add(k);
 if(cur.x===end.x&&cur.z===end.z){let out=[{x:cur.x,z:cur.z}];while(prev.has(k)){let p=prev.get(k);out.push(p);k=key(p)}return out.reverse()}
 for(let [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){let x=cur.x+dx,z=cur.z+dz;if(!inside(x,z)||blocked(x,z))continue;let nk=x+','+z,g=cur.g+1;if(g>=(cost.get(nk)??Infinity))continue;cost.set(nk,g);prev.set(nk,{x:cur.x,z:cur.z});open.push({x,z,g,f:g+Math.abs(end.x-x)+Math.abs(end.z-z)})}
 }return [];
}
export function advanceRoute(position,path,distance){let p={x:position.x,z:position.z},remaining=path.slice(),facing=null;while(remaining.length&&distance>0){let next=remaining[0],dx=next.x-p.x,dz=next.z-p.z,d=Math.hypot(dx,dz);facing=Math.atan2(dx,dz);if(d<=distance){p={...next};remaining.shift();distance-=d}else{p.x+=dx/d*distance;p.z+=dz/d*distance;distance=0}}return {position:p,path:remaining,facing};}
export function gradeRound(results,threshold){if(!results.length)throw Error('沒有作答結果');let out=structuredClone(results).map(r=>({...r,correct:r.answer===r.question.answer})),score=Math.round(out.filter(r=>r.correct).length/out.length*100);return {score,passed:score>=threshold,hints:out.filter(r=>r.hintUsed).length,independentCorrect:out.filter(r=>r.correct&&!r.hintUsed).length,results:out};}
export function validateBackup(data){
 if(!['ctcn-island-v2','ctcn-island-v3-bank','ctcn-island-v4-bank','ctcn-island-v5-bank'].includes(data?.format)||!Number.isInteger(data.version)||data.version<1)throw Error('不是有效的 V2 完整作品備份');
 const checkedQuestion=q=>{let checked=validateBank([q])[0];if(typeof q.id==='string'&&q.id.length&&q.id.length<=128)checked.id=q.id;return checked};
 if(!Array.isArray(data.questions)||data.questions.length>500||!Array.isArray(data.logs)||data.logs.length>10000||!Array.isArray(data.edits))throw Error('備份缺少題庫、紀錄或歷程');
 let questions=data.questions.map(checkedQuestion);if(new Set(questions.map(q=>q.id)).size!==questions.length)throw Error('備份含重複題目編號');
 const settings=s=>{if(!s||(!Number.isFinite(s.passing)||s.passing<0||s.passing>100)||![0,1,2,3].includes(s.level)||typeof s.hints!=='boolean')throw Error('備份設定不正確');return {passing:s.passing,level:s.level,hints:s.hints}};
 let logs=data.logs.map(log=>{if(!Array.isArray(log.results)||!log.results.length||log.results.length>100||!Number.isFinite(Date.parse(log.at))||!Number.isInteger(log.version))throw Error('備份回合資料不正確');let config=settings(log.settings),results=log.results.map(r=>{if(!/^[A-D]$/.test(r.answer)||typeof r.hintUsed!=='boolean')throw Error('備份答題紀錄不正確');return {question:checkedQuestion(r.question),answer:r.answer,hintUsed:r.hintUsed,at:typeof r.at==='string'?r.at:log.at}});return {...gradeRound(results,config.passing),id:String(log.id).slice(0,128),at:log.at,version:log.version,settings:config}});
 return {version:data.version,questions,logs,edits:structuredClone(data.edits),settings:settings(data.settings),completed:!!data.completed};
}
export const sampleText='題目：查核 AI 產生的複習題時，最應優先確認什麼？\nA. 文字看起來專業\nB. 答案與指定教材一致\nC. 題目愈長愈好\nD. 選項排列整齊\n答案：B\n解析：應核對教材原文、答案與解析的證據，不以語氣判斷正確性。\n提示：回到原始資料找證據。\n難度：1\n來源：課程示範，請替換為實際教材';
export function demoBank(){return validateBank([
 {text:'查核 AI 產生的複習題時，最應優先確認什麼？',options:['文字看起來專業','答案與指定教材一致','題目愈長愈好','選項排列整齊'],answer:'B',explanation:'應回到指定教材，確認題目、答案與解析都有依據；專業語氣不能保證正確。',hint:'想想哪些資訊能提供原始證據。',source:'AI 學習素養操作示範，非護理正式評量',difficulty:1},
 {text:'AI 的解析與課堂講義不同，下一步應該怎麼做？',options:['立即相信 AI','直接刪除講義','核對來源，標記並修正題目','只修改題目顏色'],answer:'C',explanation:'先核對講義與教師確認內容；查核前應標記不確定，不應直接把生成內容視為正確答案。',hint:'先釐清證據，再決定如何修正。',source:'AI 學習素養操作示範，非護理正式評量',difficulty:1},
 {text:'使用學長姐提示後答對，哪一種紀錄最有助於複習？',options:['只留最高分','刪除提示紀錄','全部當作獨立答對','同時保留作答結果與提示使用'],answer:'D',explanation:'分別保留答案、提示使用與題目版本，才能判斷哪些概念已能獨立掌握、哪些仍需要協助。',hint:'分數以外，哪些歷程也值得保留？',source:'AI 學習素養操作示範，非護理正式評量',difficulty:1}
 ]);}
