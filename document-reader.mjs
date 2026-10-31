// Document extraction runs locally in the browser; no upload or AI API.
export async function extractDocument(file){
 if(file.size>15*1024*1024)throw Error('文件上限 15 MB');
 let ext=file.name.split('.').pop().toLowerCase();
 if(ext==='pdf'){
  let pdfjs=await import('./vendor/pdf.mjs');pdfjs.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.mjs',import.meta.url).href;
  // Embedded browsers may suspend module workers without firing an error.
  // PDF.js supports a local loopback handler; load it explicitly for text-only extraction.
  globalThis.pdfjsWorker=await import('./vendor/pdf.worker.mjs');
  let loading=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false}),doc=await loading.promise;
  try{if(doc.numPages>150)throw Error('PDF 上限 150 頁');let pages=[];for(let i=1;i<=doc.numPages;i++){let page=await doc.getPage(i),content=await page.getTextContent(),lines=[],line='';for(let item of content.items){if(typeof item.str!=='string')continue;line+=item.str+' ';if(item.hasEOL){lines.push(line);line='';}}if(line)lines.push(line);pages.push(lines.join('\n'));}let text=pages.join('\n\n');if(!text.trim())throw Error('此 PDF 無可讀文字，掃描文件請先 OCR。');return text;}finally{await doc.destroy();}
 }
 if(ext==='docx'){
  if(!globalThis.mammoth)await new Promise((resolve,reject)=>{let script=document.createElement('script');script.src=new URL('./vendor/mammoth.browser.min.js',import.meta.url).href;script.onload=resolve;script.onerror=()=>reject(Error('Word 讀取元件載入失敗'));document.head.append(script);});
  let result=await globalThis.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});return result.value;
 }
 throw Error('不支援此文件格式');
}
