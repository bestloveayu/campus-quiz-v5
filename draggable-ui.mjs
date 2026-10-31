// Allow dialogs and floating gameplay panels to move without interfering with inputs.
export function enableDraggableWindows(doc=document){
  const handles='dialog h2, dialog .eyebrow, #interaction h3, #panel .panel-head, .mission .mission-top, .mission h3';
  let drag=null;
  doc.addEventListener('pointerdown',e=>{
    const handle=e.target.closest?.(handles);
    if(!handle||e.button!==0||e.target.closest('button,input,textarea,select,a,summary'))return;
    const box=handle.closest('dialog,#interaction,#panel,.mission');
    if(!box||box.classList.contains('hidden'))return;
    const rect=box.getBoundingClientRect();
    box.style.position='fixed';box.style.left=rect.left+'px';box.style.top=rect.top+'px';
    box.style.right='auto';box.style.bottom='auto';box.style.margin='0';box.style.transform='none';
    drag={box,x:e.clientX,y:e.clientY,left:rect.left,top:rect.top,width:rect.width,height:rect.height,pointer:e.pointerId};
    handle.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  });
  doc.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.pointer)return;
    const w=doc.defaultView?.innerWidth||1024,h=doc.defaultView?.innerHeight||768;
    drag.box.style.left=Math.max(0,Math.min(w-60,drag.left+e.clientX-drag.x))+'px';
    drag.box.style.top=Math.max(0,Math.min(h-45,drag.top+e.clientY-drag.y))+'px';
  });
  const end=()=>drag=null;
  doc.addEventListener('pointerup',end);
  doc.addEventListener('pointercancel',end);
}
