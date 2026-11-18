'use strict';
const {StoreError}=require('./github-store.cjs');
const eventFields={name:180,topic:100,type:60,country:100,countryCode:2,city:100,venue:160,start:10,end:10,website:600,registration:600,source:600,feeSource:600,visitor:160,delegate:160,attendance:160,note:500};
const editable=['city','venue','start','end','website','registration','source','feeSource','visitor','delegate','attendance','note'];
const validURL=s=>{try{const u=new URL(s);return /^https?:$/.test(u.protocol)&&!u.username&&!u.password;}catch{return false;}};
const validDate=s=>/^2027-\d\d-\d\d$/.test(s)&&Number.isFinite(+new Date(s+'T00:00Z'))&&new Date(s+'T00:00Z').toISOString().slice(0,10)===s;
function fields(input,schema){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new StoreError(400,'Kayıt bilgisi eksik.');
 return Object.fromEntries(Object.entries(schema).map(([key,max])=>{
  const value=input[key]??null;
  if(value!==null&&(typeof value!=='string'||value.length>max))throw new StoreError(400,'Geçersiz alan: '+key);
  return [key,typeof value==='string'?value.trim()||null:null];
 }));
}
function validateEvent(record){
 for(const key of ['name','topic','type','country','countryCode','website','source'])if(!record[key])throw new StoreError(400,'Zorunlu alan eksik: '+key);
 if(!/^[A-Z]{2}$/.test(record.countryCode))throw new StoreError(400,'Ülke kodu geçersiz.');
 try{new Intl.DisplayNames(['tr'],{type:'region'}).of(record.countryCode);}catch{throw new StoreError(400,'Ülke kodu geçersiz.');}
 for(const key of ['website','source','registration','feeSource'])if(record[key]&&!validURL(record[key]))throw new StoreError(400,'Geçersiz bağlantı: '+key);
 if(!!record.start!==!!record.end||record.start&&(!validDate(record.start)||!validDate(record.end)||record.start>record.end))throw new StoreError(400,'Etkinlik tarihleri 2027 içinde geçerli bir aralık olmalıdır.');
}
const signature=e=>[e.name.trim().toLocaleLowerCase('tr'),e.countryCode,e.start||''].join('|');
const canonical=s=>{const u=new URL(s);u.hash='';return u.href.replace(/\/$/,'');};
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Istanbul'}).format(new Date());
function mutateCatalog(catalog,operation,uuid){
 const next=structuredClone(catalog);
 if(next.year!==2027||!Array.isArray(next.events)||!Array.isArray(next.sources))throw new StoreError(503,'Katalog biçimi doğrulanamadı.');
 if(operation.type==='add_event'){
  const record=fields(operation.record,eventFields);validateEvent(record);
  if(next.events.some(e=>signature(e)===signature(record)))throw new StoreError(409,'Bu etkinlik zaten ortak takvimde bulunuyor.');
  record.id='manual-'+uuid();record.checked=today();record.status=record.start?'Manuel kayıt':'Takipte';next.events.push(record);
 }else if(operation.type==='add_source'){
  const record=fields(operation.record,{name:180,url:600,note:500});
  if(!record.name||!validURL(record.url))throw new StoreError(400,'Kaynak adı ve geçerli bağlantı gereklidir.');
  if(next.sources.some(s=>canonical(s.url)===canonical(record.url)))throw new StoreError(409,'Bu kaynak zaten ortak listede bulunuyor.');
  record.id='manual-'+uuid();record.checked=today();next.sources.push(record);
 }else if(operation.type==='update_event'){
  const index=next.events.findIndex(e=>e.id===operation.id);if(index<0)throw new StoreError(404,'Etkinlik bulunamadı.');
  const input=operation.changes;
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!editable.includes(k)))throw new StoreError(400,'Geçersiz düzenleme alanı.');
  const record={...next.events[index],...fields({...next.events[index],...input},eventFields),checked:today()};
  validateEvent(record);
  if(['start','end','source'].some(k=>Object.hasOwn(input,k)))record.status=record.start?'Manuel kayıt':'Takipte';
  next.events[index]=record;
 }else throw new StoreError(400,'Desteklenmeyen kayıt işlemi.');
 next.checked=today();return next;
}
module.exports={mutateCatalog,validateEvent};
