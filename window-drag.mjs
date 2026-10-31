// Pointer-based positioning for playtest and offline student overlays.
const handles=[
 ['#studioDialog','#studioContent h2'],
 ['#quizDialog','#quizContent h2'],
 ['#welcome','h2'],
 ['#questionDialog','h2'],
 ['#panel','.panel-head'],
 ['#interaction','#interactTitle'],
 ['.mission','.mission-top']
];

export function installWindowDragging(root=document){
 let drag=null;
 root.addEventListener('pointerdown',e=>{
  if(e.button!==0||e.target.closest('button,input,select,textarea,a,summary'))return;
  const match=handles.find(([windowSelector,handleSelector])=>{
   const panel=e.target.closest(windowSelector);
   return panel&&!panel.classList.contains('hidden')&&e.target.closest(handleSelector)&&panel.contains(e.target.closest(handleSelector));
  });
  if(!match)return;
  const panel=e.target.closest(match[0]);
  const bounds=panel.getBoundingClientRect();
  if(!bounds.width||!bounds.height)return;
  e.preventDefault();
  panel.style.position='fixed';
  panel.style.left=bounds.left+'px';
  panel.style.top=bounds.top+'px';
  panel.style.right='auto';panel.style.bottom='auto';panel.style.transform='none';
  panel.style.margin='0';
  panel.style.zIndex='25';
  drag={panel,pointerId:e.pointerId,x:e.clientX,y:e.clientY,left:bounds.left,top:bounds.top};
  e.target.setPointerCapture?.(e.pointerId);
 },true);
 root.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.pointerId)return;
  const {panel,x,y,left,top}=drag;
  panel.style.left=Math.max(0,Math.min(window.innerWidth-80,left+e.clientX-x))+'px';
  panel.style.top=Math.max(0,Math.min(window.innerHeight-45,top+e.clientY-y))+'px';
 });
 const end=e=>{if(drag?.pointerId===e.pointerId)drag=null;};
 root.addEventListener('pointerup',end);
 root.addEventListener('pointercancel',end);
}
