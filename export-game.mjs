/** Produce a student-only, offline ZIP in the browser; no upload or API call. */
const DATA_PLACEHOLDER='__CAMPUS_GAME_DATA_BASE64__';

function b64(text){
 const bytes=new TextEncoder().encode(text);
 let binary='';
 for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(binary);
}

export function studentGameFiles({project,questions,template}){
 if(!project||!Array.isArray(project.entities)||!project.title)throw Error('作品資料不完整，無法匯出');
 if(!Array.isArray(questions)||!questions.length)throw Error('題庫為空，請先匯入或建立題目');
 if(typeof template!=='string'||template.split(DATA_PLACEHOLDER).length!==2)throw Error('離線遊戲模板未正確載入');
 const filename=String(project.title).replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').trim().slice(0,75)||'學生冒險遊戲';
 const gameData=b64(JSON.stringify({project,questions}));
 const html=template.replace(DATA_PLACEHOLDER,gameData);
 const cmd='@echo off\r\ncd /d "%~dp0"\r\nstart "" "%~dp0index.html"\r\n';
 const readme=`${project.title}\r\n\r\n啟動遊戲（Windows）：\r\n1. 解壓縮本 ZIP，保留所有檔案在同一個資料夾。\r\n2. 雙擊「執行遊戲.cmd」，或直接雙擊 index.html。\r\n3. 使用 Google Chrome 或 Microsoft Edge；遊戲無須安裝 Python，也無須網路。\r\n4. 在 3D 校園靠近門按 E，依互動流程完成遊戲。\r\n\r\n本 ZIP 為學生作品的遊玩版本，不包含線上編輯工具。\r\n遊戲題目與答案均包含於 HTML 檔案中，請勿用於保密考試。\r\n`;
 return {name:`${filename}.zip`,files:{'index.html':html,'執行遊戲.cmd':cmd,'README.txt':readme}};
}

export async function studentGameZip(input,JSZip){
 const {files}=studentGameFiles(input),zip=new JSZip();
 for(const [path,content] of Object.entries(files))zip.file(path,content);
 return zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6}});
}

async function jszip(){
 if(globalThis.JSZip)return globalThis.JSZip;
 await new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=new URL('./vendor/jszip.min.js',import.meta.url).href;
  script.onload=resolve;
  script.onerror=()=>reject(Error('ZIP 壓縮元件載入失敗'));
  document.head.append(script);
 });
 if(!globalThis.JSZip)throw Error('ZIP 壓縮元件無法啟動');
 return globalThis.JSZip;
}

export async function downloadStudentGame({project,questions}){
 const response=await fetch(new URL('./offline-player-template.html',import.meta.url),{cache:'no-store'});
 if(!response.ok)throw Error('無法取得離線遊戲模板，請確認完整上傳 GitHub Pages 檔案');
 const template=await response.text();
 const {name}=studentGameFiles({project,questions,template});
 const bytes=await studentGameZip({project,questions,template},await jszip());
 const link=document.createElement('a'),url=URL.createObjectURL(new Blob([bytes],{type:'application/zip'}));
 link.href=url;link.download=name;link.click();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
 return name;
}
