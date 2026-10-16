export const KEY = 'leadership-mgt6702-v1';
export function shuffle(items, rng = Math.random) {
  const a = [...items];
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
export function makeSession(ids, mode, mixed=true) {
  const order=mixed?shuffle(ids):[...ids];
  return {version:1,mode,ids:order,pending:order.map(id=>({id,kind:'first',attempt:0})),current:null,history:[],first:{},retrySuccess:0,done:false};
}
export function advance(s, quizById, rng=Math.random) {
  if(s.current) return s;
  const next={...s,pending:[...s.pending]};
  if(!next.pending.length) return {...next,done:true};
  const eligible=item=>item.kind==='first'||s.history.slice(-2).every(h=>h.id!==item.id);
  const index=next.pending.findIndex(eligible);
  let item;
  if(index>=0) item=next.pending.splice(index,1)[0];
  else {
    const target=next.pending[0].id;
    const candidates=s.ids.filter(id=>id!==target);
    if(!candidates.length) return {...next,pending:[],done:true};
    const recent=s.history.map(h=>h.id);
    candidates.sort((a,b)=>recent.lastIndexOf(a)-recent.lastIndexOf(b));
    item={id:candidates[0],kind:'filler',attempt:0};
  }
  return {...next,current:{...item,optionIds:shuffle((quizById[item.id]?.options||[]).map(o=>o.id),rng),revealed:false,selected:null}};
}
export function submit(s, correct, selection=null) {
  const c=s.current;
  if(!c||c.selected!==null) return s;
  const next={...s,pending:[...s.pending],first:{...s.first},history:[...s.history,{id:c.id,correct,kind:c.kind,attempt:c.attempt}],current:{...c,selected:selection??(correct?'remember':'repeat'),correct}};
  if(c.kind==='first') next.first[c.id]=correct;
  if(c.kind==='retry'&&correct) next.retrySuccess++;
  if(!correct&&c.kind!=='filler'&&c.attempt<2&&s.ids.length>1) next.pending.push({id:c.id,kind:'retry',attempt:c.attempt+1});
  return next;
}
export function score(s) { const v=Object.values(s.first);return {correct:v.filter(Boolean).length,total:v.length,goal:s.ids.length,retrySuccess:s.retrySuccess}; }
export function loadState(storage) {
  try {
    const d=JSON.parse(storage.getItem(KEY)||'null');
    if(d?.version!==1||!d.progress||typeof d.progress!=='object'||Array.isArray(d.progress))return {version:1,progress:{},session:null};
    const p={};for(const [k,v] of Object.entries(d.progress))if(/^Q\d{2}$/.test(k)&&['known','repeat'].includes(v))p[k]=v;
    const s=d.session;
    const valid=s&&s.version===1&&['learn','quiz','oral'].includes(s.mode)&&Array.isArray(s.ids)&&s.ids.every(id=>/^Q\d{2}$/.test(id))&&Array.isArray(s.pending)&&Array.isArray(s.history)&&s.first&&typeof s.first==='object'&&(!s.current||Array.isArray(s.current.optionIds));
    return {version:1,progress:p,session:valid?s:null};
  } catch { return {version:1,progress:{},session:null}; }
}
export function saveState(storage,state) { try { storage.setItem(KEY,JSON.stringify(state));return true; } catch { return false; } }
