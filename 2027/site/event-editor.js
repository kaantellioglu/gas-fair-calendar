(function () {
  'use strict';
  const key = 'gaz-2027-event-edits-v1';
  const issueBase = 'https://github.com/kaantellioglu/gas-fair-calendar/issues/new';
  const fields = [
    ['city','Şehir','text',100], ['venue','Mekân','text',160],
    ['start','Başlangıç tarihi','date'], ['end','Bitiş tarihi','date'],
    ['visitor','Ziyaretçi ücreti','text',160], ['delegate','Delege ücreti','text',160],
    ['website','Etkinlik sitesi','url',600], ['registration','Kayıt bağlantısı','url',600],
    ['source','Bilgi / tarih kaynağı','url',600], ['feeSource','Ücret kaynağı','url',600],
    ['attendance','Katılım bilgisi','text',160], ['note','Not','textarea',500]
  ];
  const allowed = new Set(fields.map(([name])=>name));
  const value = (obj,k) => obj?.[k] ?? null;
  let patches = Object.create(null);
  const revisions = new Map();
  function node(tag,text) {
    const n = document.createElement(tag);
    if (text != null) n.textContent=text;
    return n;
  }
  const validURL = s => {
    try {const u=new URL(s);return /^https?:$/.test(u.protocol)&&!u.username&&!u.password;}
    catch {return false;}
  };
  const validDate = s => {
    if (!/^2027-\d\d-\d\d$/.test(s)) return false;
    const date=new Date(s+'T00:00:00Z');
    return Number.isFinite(+date)&&date.toISOString().slice(0,10)===s;
  };
  function validate(data) {
    if (!!data.start !== !!data.end) return ['start','Başlangıç ve bitiş tarihlerini birlikte girin. Tek günlük etkinlikte aynı tarihi seçin.'];
    if (data.start && (!validDate(data.start) || !validDate(data.end) || data.start > data.end)) return ['end','2027 içinde, başlangıca eşit veya daha geç bir bitiş tarihi seçin.'];
    for (const [name,,type] of fields) {
      if (type!=='url') continue;
      if ((name==='website'||name==='source') && !data[name]) return [name,'Bu bağlantıyı boş bırakmayın.'];
      if (data[name] && !validURL(data[name])) return [name,'https:// veya http:// ile başlayan bir web adresi girin.'];
    }
    return null;
  }
  function applyPatch(event) {
    const p = patches[event.id];
    const updated = {...event};
    if (!p?.values || !p.base) return updated;
    const datesUnchanged = ['start','end'].every(k => value(p.base,k)===value(event,k));
    for (const [k,v] of Object.entries(p.values)) {
      if (!allowed.has(k) || (v!==null && typeof v!=='string') || (v?.length||0)>600) continue;
      if (['start','end'].includes(k) && !datesUnchanged) continue;
      if (value(p.base,k)===value(event,k)) updated[k]=v;
    }
    return validate(updated) ? {...event} : updated;
  }
  function save(id,patch) {
    const next = {...patches};
    if (patch) next[id]=patch; else delete next[id];
    try {
      localStorage.setItem(key,JSON.stringify(next));
      patches=next;return true;
    } catch {return false;}
  }
  function currentChanges(original,event) {
    return Object.fromEntries(fields.map(([key])=>key).filter(k=>value(event,k)!==value(original,k)).map(k=>[k,value(event,k)]));
  }
  function proposal(original,event,changes) {
    const title = '2027 veri düzeltmesi: '+event.name;
    const lines = fields.filter(([k])=>Object.hasOwn(changes,k)).map(([k,label])=>{
      const clean = v => String(v??'—').replace(/[\r\n]+/g,' ').replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
      return '- **'+label+':** '+clean(original[k])+' → '+clean(changes[k]);
    });
    const payload = JSON.stringify({eventId:event.id,changes},null,2).replaceAll('`','\\u0060');
    const body = [
      '**Etkinlik kimliği:** '+event.id,'','**Önerilen düzeltmeler**','',...lines,'',
      '**Bilgi kaynağı:** '+event.source,
      ...(event.feeSource ? ['**Ücret kaynağı:** '+event.feeSource] : []),
      '','Düzeltme yayınlanmadan önce kaynakları kontrol edin.','','```json',payload,'```'
    ].join('\n');
    const url = new URL(issueBase);
    url.searchParams.set('title',title);url.searchParams.set('body',body);
    return {url,body};
  }
  window.GazEventEditor = {
    init(originals) {
      try {
        const raw=JSON.parse(localStorage.getItem(key)||'{}');
        if (raw && typeof raw==='object' && !Array.isArray(raw)) patches=Object.assign(Object.create(null),raw);
      } catch {}
      for (const item of originals) revisions.set(item.id,item);
      return originals.map(applyPatch);
    },
    changed(event) {
      return Object.keys(currentChanges(revisions.get(event.id),event)).length>0;
    },
    controls(event,update,notice='') {
      const original=revisions.get(event.id);
      const container=node('section');
      container.className='editor-block';
      const area=node('div');
      const actions=node('div');
      actions.className='editor-actions';
      const message=node('p',notice);
      message.setAttribute('role','status');
      message.className='editor-message';
      const edit=node('button','Bilgileri düzenle');
      edit.type='button';
      edit.className='editor-primary';
      edit.setAttribute('aria-expanded','false');
      actions.append(edit);
      const changes=currentChanges(original,event);
      if (Object.keys(changes).length) {
        const info=node('p','Değişiklikler bu tarayıcıda kayıtlı.');
        info.className='editor-scope';
        container.append(info);
        const draft=proposal(original,event,changes);
        const send=node('a','GitHub’da öneri aç');
        send.href=draft.url.href.length<=7500?draft.url.href:issueBase;
        send.target='_blank';send.rel='noopener noreferrer';
        actions.append(send);
        const reset=node('button','Yayımlanan bilgilere dön');
        reset.type='button';
        reset.addEventListener('click',()=>{
          if (!save(event.id,null)) {message.textContent='Yerel düzeltme silinemedi. Tarayıcınızın depolama ayarlarını kontrol edin.';return;}
          update({...original},'Yerel düzeltme kaldırıldı.');
        });
        actions.append(reset);
        if (draft.url.href.length>7500) {
          const fallback=node('label','GitHub öneri metni · kopyalayıp GitHub’a yapıştırın');
          const copy=node('textarea');copy.value=draft.body;copy.readOnly=true;copy.rows=5;
          fallback.append(copy);container.append(fallback);
        }
        const hint=node('p','Öneri, GitHub’da siz gönderince herkese açık olur. Ortak takvim incelemeden sonra güncellenir.');
        hint.className='editor-scope';container.append(hint);
      }
      edit.addEventListener('click',()=>{
        if (edit.getAttribute('aria-expanded')==='true') {area.replaceChildren();edit.setAttribute('aria-expanded','false');return;}
        edit.setAttribute('aria-expanded','true');
        const form=node('form');
        form.className='event-editor';
        const summary=node('p','Eksik alanları doldurun veya mevcut değerleri düzeltin. Boş isteğe bağlı alanlar takvimde bilinmiyor olarak kalır.');
        const group=node('div');group.className='editor-fields';
        const inputs={};
        for (const [name,label,type,max] of fields) {
          const wrapper=node('label',label);
          const field=node(type==='textarea'?'textarea':'input');
          field.name=name;
          if (type!=='textarea') field.type=type;
          else {wrapper.className='editor-wide';field.rows=3;}
          if (max) field.maxLength=max;
          if (type==='date') {field.min='2027-01-01';field.max='2027-12-31';}
          if (name==='website'||name==='source') field.required=true;
          field.value=event[name]??'';
          wrapper.append(field);group.append(wrapper);inputs[name]=field;
          field.addEventListener('input',()=>Object.values(inputs).forEach(i=>i.setCustomValidity('')));
        }
        const saveButton=node('button','Tarayıcıya kaydet');saveButton.type='submit';saveButton.className='editor-primary';
        const cancel=node('button','Vazgeç');cancel.type='button';
        cancel.addEventListener('click',()=>{area.replaceChildren();edit.setAttribute('aria-expanded','false');edit.focus();});
        const formActions=node('div');formActions.className='editor-actions';formActions.append(saveButton,cancel);
        form.append(summary,group,formActions);
        form.addEventListener('submit',e=>{
          e.preventDefault();
          const candidate={...event};
          for (const [name] of fields) candidate[name]=inputs[name].value.trim()||null;
          const error=validate(candidate);
          if (error) {const field=inputs[error[0]];field.setCustomValidity(error[1]);field.reportValidity();return;}
          const values=currentChanges(original,candidate);
          const datesTouched=Object.hasOwn(values,'start')||Object.hasOwn(values,'end');
          const base=Object.fromEntries(Object.keys(values).map(k=>[k,value(original,k)]));
          if(datesTouched){base.start=original.start;base.end=original.end;}
          if (!save(event.id,Object.keys(values).length?{base,values}:null)) {
            message.textContent='Değişiklikler kaydedilemedi. Tarayıcınızın depolama ayarlarını kontrol edin.';return;
          }
          update(candidate,'Bu tarayıcıya kaydedildi.');
        });
        area.replaceChildren(form);
        const firstMissing=fields.find(([k])=>!event[k]);
        inputs[firstMissing?.[0]||'city'].focus();
      });
      container.append(actions,area,message);
      return container;
    }
  };
})();
