(() => {
'use strict';
const keys=['country','topic','month','status','fee'];
const values=id=>Array.from(document.getElementById(id).selectedOptions,o=>o.value).filter(Boolean);
const normal=s=>s.toLocaleLowerCase('tr').normalize('NFD').replace(/\p{Diacritic}/gu,'').replaceAll('ı','i');
function matches(event,filters){
 for(const key of ['country','topic','status'])if(filters[key]?.length&&!filters[key].includes(event[key]))return false;
 if(filters.month?.length&&!filters.month.includes(event.start?.slice(5,7)||'none'))return false;
 if(filters.fee?.length){
  const hasFee=!!(event.visitor||event.delegate);
  if(!filters.fee.some(value=>value==='known'?hasFee:value==='unknown'?!hasFee:value==='free'&&String(event.visitor||'').toLocaleLowerCase('tr').includes('ücretsiz')))return false;
 }
 return true;
}
function mount(select,label){
 const field=document.createElement('div');field.className='filter-field';
 const caption=document.createElement('span');caption.id=select.id+'-caption';caption.textContent=label;
 select.parentElement.replaceWith(field);field.append(caption,select);select.multiple=true;select.hidden=true;
 select.setAttribute('aria-labelledby',caption.id);
 const details=document.createElement('details');details.className='multi-select';
 const summary=document.createElement('summary');summary.setAttribute('aria-label',label+' seçimi');
 const panel=document.createElement('div');panel.className='multi-panel';
 const search=document.createElement('input');search.type='search';search.placeholder=label+' içinde ara';search.setAttribute('aria-label',label+' seçeneklerinde ara');search.autocomplete='off';
 const list=document.createElement('div');list.className='multi-options';list.setAttribute('role','group');list.setAttribute('aria-label',label+' seçenekleri');
 const empty=document.createElement('p');empty.className='multi-no-match';empty.textContent='Eşleşen seçenek yok.';empty.hidden=true;
 const actions=document.createElement('div');actions.className='multi-actions';
 const clear=document.createElement('button');clear.type='button';clear.textContent='Seçimleri kaldır';
 const close=document.createElement('button');close.type='button';close.textContent='Tamam';
 actions.append(clear,close);panel.append(search,list,empty,actions);details.append(summary,panel);field.append(details);
 const boxes=new Map();
 for(const option of select.options){
  if(!option.value)continue;
  const row=document.createElement('label');const input=document.createElement('input');input.type='checkbox';input.value=option.value;
  const text=document.createElement('span');text.textContent=option.textContent;row.append(input,text);list.append(row);
  boxes.set(option.value,{input,row,option});
  input.addEventListener('input',event=>event.stopPropagation());
  input.addEventListener('change',()=>{option.selected=input.checked;sync();select.dispatchEvent(new Event('input',{bubbles:true}));});
 }
 function sync(){
  const chosen=values(select.id);
  summary.textContent=chosen.length===0?'Tümü':chosen.length===1?select.selectedOptions[0].textContent:chosen.length+' seçili';
  summary.title=chosen.join(', ');
  details.classList.toggle('has-selection',chosen.length>0);
  for(const {input,option} of boxes.values())input.checked=option.selected;
  clear.disabled=!chosen.length;
 }
 function set(next){
  const selected=new Set(next);
  for(const option of select.options)option.selected=!!option.value&&selected.has(option.value);
  sync();
 }
 search.addEventListener('input',event=>{
  event.stopPropagation();
  const query=normal(search.value.trim());let count=0;
  for(const {row,option} of boxes.values()){row.hidden=!!query&&!normal(option.textContent).includes(query);if(!row.hidden)count++;}
  empty.hidden=count>0;
 });
 clear.addEventListener('click',()=>{set([]);select.dispatchEvent(new Event('input',{bubbles:true}));});
 close.addEventListener('click',()=>{details.open=false;summary.focus();});
 details.addEventListener('toggle',()=>{
  if(!details.open)return;
  document.querySelectorAll('.multi-select[open]').forEach(other=>{if(other!==details)other.open=false;});
  const rect=summary.getBoundingClientRect();
  const width=Math.min(320,innerWidth-32);
  const below=innerHeight-rect.bottom-12,above=rect.top-12;
  const useBelow=below>=240||below>=above;
  panel.style.width=width+'px';
  panel.style.left=Math.max(16,Math.min(rect.left,innerWidth-width-16))+'px';
  panel.style.maxHeight=Math.max(120,Math.min(370,useBelow?below:above))+'px';
  panel.style.top=useBelow?rect.bottom+5+'px':'auto';
  panel.style.bottom=useBelow?'auto':innerHeight-rect.top+5+'px';
  search.focus({preventScroll:true});
 });
 details.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();details.open=false;summary.focus();}});
 window.addEventListener('resize',()=>{details.open=false;});
 window.addEventListener('scroll',()=>{details.open=false;},{passive:true});
 set([]);
 return {set,sync};
}
if(typeof module!=='undefined')module.exports={matches};
else {
 document.addEventListener('pointerdown',event=>document.querySelectorAll('.multi-select[open]').forEach(el=>{if(!el.contains(event.target))el.open=false;}));
 window.GazMulti={keys,values,matches,mount};
}
})();
