(function () {
'use strict';
const key='gaz-2027-manual-v1';
const node=(tag,text)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;return e;};
const validURL=s=>{try{const u=new URL(s);return /^https?:$/.test(u.protocol)&&!u.username&&!u.password;}catch{return false;}};
const validDate=s=>/^2027-\d\d-\d\d$/.test(s)&&Number.isFinite(+new Date(s+'T00:00Z'))&&new Date(s+'T00:00Z').toISOString().slice(0,10)===s;
const signature=e=>[String(e.name||'').trim().toLocaleLowerCase('tr'),e.countryCode,e.start||''].join('|');
const canonical=s=>{try{const u=new URL(s);u.hash='';return u.href.replace(/\/$/,'');}catch{return s;}};
const fields=[
['name','Fuar / etkinlik adı','text',180,true],
['topic','Konu','topic',null,true],['type','Etkinlik türü','type',null,true],
['countryCode','Ülke','country',null,true],['city','Şehir','text',100],['venue','Mekân','text',160],
['start','Başlangıç tarihi','date'],['end','Bitiş tarihi','date'],
['website','Etkinlik sitesi','url',600,true],['source','Bilgi / tarih kaynağı','url',600,true],
['registration','Kayıt bağlantısı','url',600],['visitor','Ziyaretçi ücreti','text',160],
['delegate','Delege ücreti','text',160],['feeSource','Ücret kaynağı','url',600],
['attendance','Katılım bilgisi','text',160],['note','Not','textarea',500]];
const sourceFields=[['name','Kaynak adı','text',180,true],['url','Kaynak bağlantısı','url',600,true],['note','İçerik / kapsam notu','textarea',500]];
let state={events:[],sources:[]},baseEvents=[],baseSources=[],localEvents=[],localSources=[],countries=new Map();
function validate(item,kind){
 if(!item||typeof item!=='object'||Array.isArray(item))return ['name','Bilgileri kontrol edin.'];
 for(const [key,,type,max,required] of kind==='event'?fields:sourceFields){
  const v=item[key];
  if(required&&(!v||typeof v!=='string'))return [key,'Bu alanı doldurun.'];
  if(v!=null&&(typeof v!=='string'||(max&&v.length>max)))return [key,'Alan uzunluğunu kontrol edin.'];
  if(type==='url'&&v&&!validURL(v))return [key,'http:// veya https:// ile başlayan bir web adresi girin.'];
 }
 if(kind==='event'){
  if(!countries.has(item.countryCode))return ['countryCode','Listeden bir ülke seçin.'];
  if(!!item.start!==!!item.end)return ['start','İki tarihi birlikte girin. Tek günlük fuarda aynı tarihi seçin.'];
  if(item.start&&(!validDate(item.start)||!validDate(item.end)||item.end<item.start))return ['end','2027 içinde, başlangıçtan önce olmayan bir bitiş tarihi girin.'];
 }
 return null;
}
function write(next){try{localStorage.setItem(key,JSON.stringify(next));state=next;return true;}catch{return false;}}
function link(text,url){const e=node('a',text);e.href=url;e.target='_blank';e.rel='noopener noreferrer';return e;}
function proposal(item,kind){
 const fence=String.fromCharCode(96).repeat(3);
 const body=['2027 takvimine '+(kind==='event'?'yeni etkinlik':'yeni kaynak')+' önerisi.','','Bilgi kaynağı: '+(item.source||item.url),'','Yayımlamadan önce kaynak ve 2027 edisyonunu doğrulayın.','',fence+'json',JSON.stringify({action:kind==='event'?'add_event':'add_source',record:item},null,2).replaceAll(String.fromCharCode(96),'\\u0060'),fence].join('\n');
 const url=new URL('https://github.com/kaantellioglu/gas-fair-calendar/issues/new');
 url.searchParams.set('title','2027 '+(kind==='event'?'fuar':'kaynak')+' önerisi: '+item.name);url.searchParams.set('body',body);
 return {body,url};
}
window.GazManual={
 init(events,sources){
  baseEvents=events;baseSources=sources;
  const names=new Intl.DisplayNames(['tr'],{type:'region'});
  for(const [code] of window.GazAtlasGeometry||[])if(/^[A-Z]{2}$/.test(code))countries.set(code,names.of(code));
  for(const code of ['BH','SG','MT','AD','LI','MC','SM','VA','MU','SC','KM','ST','CV','MV'])countries.set(code,names.of(code));
  for(const e of events)countries.set(e.countryCode,e.country);
  try{
   const raw=JSON.parse(localStorage.getItem(key)||'{}');
   const clean=(list,kind)=>Array.isArray(list)?list.slice(0,1000).filter(e=>!validate(e,kind)&&typeof e.id==='string'&&/^manual-[a-z0-9-]+$/.test(e.id)):[];
   state={events:clean(raw?.events,'event'),sources:clean(raw?.sources,'source')};
  }catch{}
  const seen=new Set(events.map(signature)),ids=new Set(events.map(e=>e.id)),urls=new Set(sources.map(s=>canonical(s.url)));
  localEvents=state.events.filter(e=>{if(ids.has(e.id)||seen.has(signature(e)))return false;ids.add(e.id);seen.add(signature(e));return true;}).map(e=>({...e,country:countries.get(e.countryCode),status:e.start?'Manuel kayıt':'Takipte'}));
  localSources=state.sources.filter(s=>{const url=canonical(s.url);if(urls.has(url))return false;urls.add(url);return true;});
  return {events:[...events,...localEvents],sources:[...sources,...localSources.map(s=>({...s,note:[s.note,'Bu tarayıcıda manuel eklendi'].filter(Boolean).join(' · ')}))]};
 },
 isLocal:id=>localEvents.some(e=>e.id===id),
 mount(effectiveEvents){
  const panel=node('dialog');panel.id='manual-panel';panel.setAttribute('aria-labelledby','manual-title');
  const close=node('button','Kapat');close.type='button';close.className='manual-close';close.autofocus=true;close.addEventListener('click',()=>panel.close());
  const title=node('h2');title.id='manual-title';
  const intro=node('p','Kayıt bu tarayıcıda saklanır. Ortak takvime eklemek için kaydettikten sonra GitHub önerisi açabilirsiniz.');
  const content=node('div');panel.append(close,title,intro,content);document.body.append(panel);
  function open(kind,trigger){
   title.textContent=kind==='event'?'Manuel fuar ekle':'Manuel kaynak ekle';
   const form=node('form');form.className='event-editor';
   const group=node('div');group.className='editor-fields';const inputs={};
   for(const [key,label,type,max,required] of kind==='event'?fields:sourceFields){
    const wrapper=node('label',label+(required?' *':''));
    const control=node(['country','topic','type'].includes(type)?'select':type==='textarea'?'textarea':'input');
    control.name=key;control.required=!!required;if(control.tagName==='INPUT')control.type=type;if(max)control.maxLength=max;
    if(type==='date'){control.min='2027-01-01';control.max='2027-12-31';}
    if(type==='textarea'){control.rows=3;wrapper.className='editor-wide';}
    if(control.tagName==='SELECT'){
     control.append(new Option('Seçin',''));
     const choices=type==='country'?[...countries].sort((a,b)=>a[1].localeCompare(b[1],'tr')):type==='topic'?[...new Set(baseEvents.map(e=>e.topic))].sort((a,b)=>a.localeCompare(b,'tr')).map(x=>[x,x]):['Fuar','Konferans','Fuar + konferans','Zirve / forum'].map(x=>[x,x]);
     control.append(...choices.map(([v,label])=>new Option(label,v)));
    }
    wrapper.append(control);group.append(wrapper);inputs[key]=control;
    control.addEventListener('input',()=>Object.values(inputs).forEach(e=>e.setCustomValidity('')));
   }
   const hint=node('p',kind==='event'?'* Zorunlu alan. Tarih açıklanmadıysa iki tarihi de boş bırakın; kayıt “Takipte” görünür.':'* Zorunlu alan. Kaynak eklemek tarama başlatmaz. Ortak kaynak listesine alınması için öneri gönderin.');hint.className='editor-scope';
   const message=node('p');message.className='editor-message';message.setAttribute('role','status');
   const actions=node('div');actions.className='editor-actions';
   const save=node('button','Tarayıcıya kaydet');save.type='submit';save.className='editor-primary';
   const cancel=node('button','Vazgeç');cancel.type='button';cancel.addEventListener('click',()=>panel.close());
   actions.append(save,cancel);form.append(hint,group,message,actions);
   form.addEventListener('submit',event=>{
    event.preventDefault();
    const record=Object.fromEntries(Object.entries(inputs).map(([k,e])=>[k,e.value.trim()||null]));
    const error=validate(record,kind);if(error){inputs[error[0]].setCustomValidity(error[1]);inputs[error[0]].reportValidity();return;}
    const duplicate=kind==='event'?[...baseEvents,...localEvents].some(e=>signature(e)===signature(record)):[...baseSources,...localSources].some(s=>canonical(s.url)===canonical(record.url));
    if(duplicate){message.textContent='Bu kayıt zaten listede. Mevcut kaydı kullanın veya ayrıntılarını düzenleyin.';return;}
    record.id='manual-'+crypto.randomUUID();record.checked=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Istanbul'}).format(new Date());
    if(kind==='event'){record.country=countries.get(record.countryCode);record.status=record.start?'Manuel kayıt':'Takipte';}
    const bucket=kind==='event'?'events':'sources';
    if(!write({...state,[bucket]:[...state[bucket],record]})){message.textContent='Kayıt saklanamadı. Tarayıcınızın depolama ayarlarını kontrol edin.';return;}
    const target=new URL(location.href);
    if(kind==='event'){
     for(const key of ['q','topic','country','countryCode','region','month','status','fee','sort','saved','page','size'])target.searchParams.delete(key);
     target.searchParams.set('q',record.name);target.hash='takvim';
    }else target.hash='kaynaklar';
    history.replaceState(null,'',target);location.reload();
   });
   content.replaceChildren(form);panel.addEventListener('close',()=>trigger.focus(),{once:true});panel.showModal();inputs.name.focus();
  }
  for(const kind of ['event','source'])document.querySelectorAll('[data-manual-add="'+kind+'"]').forEach(b=>b.addEventListener('click',()=>open(kind,b)));
  const host=document.getElementById('manual-manager');
  const all=[...localEvents.map(item=>[effectiveEvents.find(e=>e.id===item.id)||item,'event']),...localSources.map(item=>[item,'source'])];
  host.hidden=!all.length;if(!all.length)return;
  const details=node('details');details.className='manual-library';details.open=true;details.append(node('summary','Manuel kayıtlarım · '+all.length));
  const scope=node('p','Bu kayıtlar bu tarayıcıda saklanır. GitHub önerisi, GitHub’da siz gönderince herkese açık olur; kaynak kontrolünden sonra ortak takvime eklenir.');scope.className='editor-scope';details.append(scope);
  const list=node('ul');
  for(const [item,kind] of all){
   const row=node('li');row.append(node('strong',item.name),node('small',kind==='event'?'Fuar / etkinlik':'Takip kaynağı'));
   const actions=node('div');actions.className='editor-actions';const draft=proposal(item,kind);
   actions.append(link('GitHub’da öneri aç',draft.url.href.length<=7500?draft.url.href:'https://github.com/kaantellioglu/gas-fair-calendar/issues/new'));
   if(kind==='event'){const target=new URL(location.href);target.search='';target.searchParams.set('q',item.name);target.hash='takvim';const show=node('a','Takvimde göster');show.href=target;actions.append(show);}else actions.append(link('Kaynağı aç',item.url));
   const remove=node('button','Yerel kaydı kaldır');remove.type='button';remove.setAttribute('aria-label','Yerel kaydı kaldır · '+item.name);
   remove.addEventListener('click',()=>{const bucket=kind==='event'?'events':'sources';if(write({...state,[bucket]:state[bucket].filter(e=>e.id!==item.id)}))location.reload();else{const message=node('p','Kayıt kaldırılamadı. Depolama ayarlarını kontrol edin.');message.setAttribute('role','alert');row.append(message);}});
   row.append(actions);
   if(draft.url.href.length>7500){const label=node('label','Öneri metnini GitHub’a kopyalayın');const text=node('textarea');text.value=draft.body;text.readOnly=true;text.rows=4;label.append(text);row.append(label);}
   list.append(row);
  }
  details.append(list);host.replaceChildren(details);
 }
};
})();
