(() => {
'use strict';
let revision=window.GazCatalog.revision;
window.GazShared={
 error:'',
 async write(operation){
  this.error='';
  try{
   const response=await fetch('/api/catalog',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':window.GazCatalog.csrf},body:JSON.stringify({...operation,revision})});
   const result=await response.json();
   if(!response.ok)throw Error(result.error||'Ortak kayıt kaydedilemedi.');
   revision=result.revision;return true;
  }catch(error){this.error=error.message;return false;}
 },
 addRecord(kind,record){return this.write({type:kind==='event'?'add_event':'add_source',record});},
 updateEvent(id,changes){return this.write({type:'update_event',id,changes});}
};
document.addEventListener('DOMContentLoaded',()=>{
 const mast=document.querySelector('.mast');
 const scope=document.createElement('span');scope.textContent='Ortak çalışma alanı';scope.style.color='#d7edc0';mast.append(scope);
 const logout=document.createElement('button');logout.type='button';logout.textContent='Çıkış';
 logout.addEventListener('click',async()=>{
  logout.disabled=true;
  try{const response=await fetch('/api/logout',{method:'POST',credentials:'same-origin',headers:{'X-CSRF-Token':window.GazCatalog.csrf}});if(!response.ok)throw Error();location.replace('/');}
  catch{logout.disabled=false;scope.textContent='Çıkış yapılamadı. Tekrar deneyin.';}
 });mast.append(logout);
 const subscribe=document.getElementById('subscribe');
 subscribe.disabled=true;subscribe.textContent='Abonelik kapalı';subscribe.title='Parolalı takvim için Outlook · ICS dosyasını indirin.';
 const notice=document.createElement('div');notice.hidden=true;notice.setAttribute('role','status');notice.style.cssText='padding:12px;background:#e3f2f7;color:#163746';
 const text=document.createElement('span');text.textContent='Ortak takvim başka bir kullanıcı tarafından güncellendi. ';
 const refresh=document.createElement('button');refresh.type='button';refresh.textContent='Yeni veriyi yükle';refresh.addEventListener('click',()=>location.reload());notice.append(text,refresh);
 document.getElementById('takvim').prepend(notice);
 let pending=false;
 setInterval(async()=>{
  if(document.hidden||pending)return;pending=true;
  try{
   const response=await fetch('/api/revision',{credentials:'same-origin',cache:'no-store'});
   if(response.status===401){text.textContent='Oturumunuz sona erdi. ';refresh.textContent='Tekrar giriş yap';notice.hidden=false;return;}
   if(response.ok){const result=await response.json();notice.hidden=result.revision===revision;}
  }catch{}finally{pending=false;}
 },60000);
});
})();
