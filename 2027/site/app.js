const {events:published,sources,checked} = window.GazCatalog;
const editor = window.GazEventEditor;
const events = editor.init(published);
let atlas;
const {csv,calendar,report} = window.GazCore;
const get = id => document.getElementById(id);
const make = (tag,value) => {
  const node = document.createElement(tag);
  if (value != null) node.textContent = value;
  return node;
};
const link = (label,url) => {
  const node = make('a',label);
  node.href = url;
  node.target = '_blank';
  node.rel = 'noopener noreferrer';
  return node;
};
const dateFmt = new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'short',timeZone:'UTC'});
const monthFmt = new Intl.DateTimeFormat('tr-TR',{month:'long',timeZone:'UTC'});
const monthName = month => monthFmt.format(Date.UTC(2027,Number(month)-1,1));
const dateLabel = event => {
  if (!event.start) return 'Açıklanmadı';
  const first = new Date(event.start), last = new Date(event.end);
  return event.start === event.end ? dateFmt.format(first) : dateFmt.formatRange(first,last);
};
const normal = value => value.toLocaleLowerCase('tr').normalize('NFD').replace(/\p{Diacritic}/gu,'').replaceAll('ı','i');
const saved = new Set();
try {
  for (const id of JSON.parse(localStorage.getItem('gaz-2027-saved') || '[]')) saved.add(id);
} catch {}
function options(id,values) {
  get(id).append(new Option('Tümü',''), ...values.map(([value,label]) => new Option(label,value)));
}
for (const field of ['topic','country','status']) {
  const values = [...new Set(events.map(e => e[field]).filter(Boolean))].sort((a,b) => a.localeCompare(b,'tr'));
  options(field,values.map(value => [value,value]));
}
const months = Array.from({length:12},(_,i) => String(i+1).padStart(2,'0'));
options('month',[...months.map(month => [month,monthName(month)]),['none','Tarih bekleniyor']]);
get('checked').textContent = new Intl.DateTimeFormat('tr-TR',{dateStyle:'long',timeZone:'UTC'}).format(new Date(checked));
get('sources').replaceChildren(...sources.map(source => {
  const item = make('li');
  item.append(link(source.name,source.url),source.note ? ' · ' + source.note : '');
  return item;
}));
function download(content,type,name) {
  const url = URL.createObjectURL(new Blob([content],{type}));
  const anchor = make('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url),1000);
}
function ics(list,name) {
  download(calendar(list,checked),'text/calendar;charset=utf-8',name+'.ics');
}
function makeRow(event) {
  const row = make('tr');
  row.id = event.id;
  const date = make('td',dateLabel(event));
  date.append(make('small',event.status));
  const name = make('td');
  name.append(make('strong',event.name),make('small',event.topic+' · '+event.type));
  const details = make('button','Ayrıntılar');
  details.className = 'event-detail';
  details.type = 'button';
  details.setAttribute('aria-label','Ayrıntılar · '+event.name);
  details.addEventListener('click',() => showEventDetails(event,details));
  name.append(details);
  if (editor.changed(event)) name.append(make('small','Bu tarayıcıda düzenlendi'));
  const place = make('td');
  place.append(make('strong',[event.city,event.country].filter(Boolean).join(', ')));
  place.append(event.venue ? link(event.venue,'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent([event.venue,event.city,event.country].join(', '))) : make('small','Mekân bilgisi yok'));
  const fee = make('td');
  fee.append(make('strong',event.visitor || 'Ziyaretçi ücreti bilinmiyor'),make('small','Delege · '+(event.delegate || 'Bilgi yok')));
  const actions = make('td');
  actions.append(link('Site ↗',event.website));
  actions.append(event.registration ? link('Kayıt ↗',event.registration) : make('small','2027 kayıt bağlantısı yok'));
  const save = make('button',saved.has(event.id) ? 'Takipte' : 'Takibe al');
  save.setAttribute('aria-pressed',saved.has(event.id));
  save.setAttribute('aria-label','Takip listesi · '+event.name);
  save.addEventListener('click',() => {
    if (saved.has(event.id)) saved.delete(event.id);
    else saved.add(event.id);
    try { localStorage.setItem('gaz-2027-saved',JSON.stringify([...saved])); } catch {}
    if (get('saved').checked) render();
    else {
      save.textContent = saved.has(event.id) ? 'Takipte' : 'Takibe al';
      save.setAttribute('aria-pressed',saved.has(event.id));
      showConflicts();
    }
  });
  actions.append(save);
  if (event.start) {
    const button = make('button','ICS');
    button.setAttribute('aria-label','Outlook dosyası · '+event.name);
    button.addEventListener('click',() => ics([event],event.id+'-2027'));
    actions.append(button);
  }
  row.append(date,name,place,fee,actions);
  return row;
}
function showConflicts() {
  const selected = events.filter(e => saved.has(e.id) && e.start);
  const conflicts = [];
  selected.forEach((first,i) => {
    for (const second of selected.slice(i+1)) {
      if (first.start <= second.end && second.start <= first.end) conflicts.push(first.name+' / '+second.name);
    }
  });
  const output = get('conflicts');
  if (!conflicts.length) output.replaceChildren(make('p','Takip listesinde tarih çakışması yok.'));
  else {
    const list = make('ul');
    list.append(...conflicts.map(value => make('li',value)));
    output.replaceChildren(list);
  }
}
function showReport(active) {
  const summary = report(active);
  const metrics = [['Etkinlik',summary.total],['Ülke',summary.countries],['Birincil tarih kaynağı',summary.primary],['Ücret bilgisi bulunan',summary.priced]];
  get('metrics').replaceChildren(...metrics.map(([label,value]) => {
    const node = make('div');
    node.className = 'metric';
    node.append(make('strong',value),make('span',label));
    return node;
  }));
  const max = Math.max(1,...Object.values(summary.byMonth));
  get('hist').replaceChildren(...months.map(month => {
    const row = make('div');
    row.className = 'bar';
    const bar = make('meter');
    bar.max = max;
    bar.value = summary.byMonth[month] || 0;
    bar.setAttribute('aria-label',monthName(month));
    row.append(make('span',monthName(month)),bar,make('span',bar.value));
    return row;
  }));
  showConflicts();
}
let active = [];
function render() {
  const query = normal(get('q').value.trim());
  const month = get('month').value;
  for (const cell of yearStrip.children) cell.setAttribute('aria-pressed',String(cell.dataset.month === month));
  const fee = get('fee').value;
  const filters = ['topic','status'].map(key => [key,get(key).value]);
  active = events.filter(event => {
    if (!atlas.includes(event)) return false;
    if (get('saved').checked && !saved.has(event.id)) return false;
    if (filters.some(([key,value]) => value && event[key] !== value)) return false;
    if (month && (event.start?.slice(5,7) || 'none') !== month) return false;
    const hasFee = event.visitor || event.delegate;
    if (fee === 'known' && !hasFee || fee === 'unknown' && hasFee || fee === 'free' && !event.visitor?.startsWith('Ücretsiz')) return false;
    return !query || normal([event.name,event.topic,event.type,event.city,event.country,event.venue,event.note].join(' ')).includes(query);
  }).sort((a,b) => {
    const key = get('sort').value;
    if (key !== 'date') {
      const order = (a[key] || '').localeCompare(b[key] || '','tr');
      if (order) return order;
    }
    return (a.start || '9999').localeCompare(b.start || '9999') || a.name.localeCompare(b.name,'tr');
  });
  get('rows').replaceChildren(...active.map(makeRow));
  get('results').textContent = active.length+' / '+events.length+' etkinlik · '+active.filter(e => e.start).length+' tarihli';
  get('empty').hidden = active.length > 0;
  get('csv').disabled = !active.length;
  get('ics').disabled = !active.some(e => e.start);
  showReport(active);
}
get('filters').addEventListener('submit',event => event.preventDefault());
get('filters').addEventListener('input',event => {
  if (event.target === get('country')) atlas.selectCountry(published.find(e=>e.country===event.target.value)?.countryCode || '',false);
  render();
});
get('filters').addEventListener('reset',() => setTimeout(() => {atlas.reset();render();},0));
get('sort').addEventListener('change',render);
get('csv').addEventListener('click',() => download(csv(active),'text/csv;charset=utf-8','gaz-takvimi-2027.csv'));
get('ics').addEventListener('click',() => ics(active,'gaz-takvimi-2027'));
get('print').addEventListener('click',() => window.print());
get('subscribe').addEventListener('click',() => {
  const publicFeed = location.protocol === 'https:' && !['localhost','127.0.0.1'].includes(location.hostname);
  get('feed').value = publicFeed ? new URL('calendar.ics',location.href).href : '';
  get('copy').disabled = !publicFeed;
  get('feed-note').textContent = publicFeed ? '' : 'Abonelik adresi HTTPS yayınıyla kullanılabilir. Yerel kopyada ICS dosyasını Outlook’a aktarabilirsiniz.';
  get('dialog').showModal();
});
get('copy').addEventListener('click',async () => {
  try {
    await navigator.clipboard.writeText(get('feed').value);
    get('feed-note').textContent = 'Adres kopyalandı.';
  } catch {
    get('feed').select();
    get('feed-note').textContent = 'Seçili adresi kopyalayın.';
  }
});
function showEventDetails(event, trigger) {
  fillEventDetails(event);
  panel.addEventListener('close',() => {
    const target = get(event.id)?.querySelector('.event-detail') || (trigger.isConnected ? trigger : get('q'));
    target.focus({preventScroll:true});
  },{once:true});
  panel.showModal();
}
function fillEventDetails(event,message='') {
  const fields = make('dl');
  const location = [event.city,event.country].filter(Boolean).join(', ');
  const venue = event.venue
    ? link(event.venue, 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent([event.venue,location].join(', ')))
    : 'Mekân bilgisi yok';
  for (const [label,value] of [
    ['Tarih', dateLabel(event)], ['Tarih kaynağı', event.status],
    ['Yer', location], ['Mekân', venue],
    ['Ziyaretçi ücreti', event.visitor || 'Bilgi yok'],
    ['Delege ücreti', event.delegate || 'Bilgi yok'],
    ['Kayıt', event.registration ? link('Kayıt sayfasını aç',event.registration) : '2027 kayıt bağlantısı yok'],
    ['Etkinlik sitesi', link('Resmî siteyi aç',event.website)]
  ]) {
    const field = make('dd');
    field.append(value);
    fields.append(make('dt',label),field);
  }
  get('event-title').textContent = event.name;
  const references = make('div');
  references.className = 'event-references';
  references.append(link('Tarih kaynağını aç',event.source));
  if (event.feeSource && event.feeSource !== event.source) references.append(link('Ücret kaynağını aç',event.feeSource));
  if (event.attendance) references.append(make('p','Katılım · '+event.attendance));
  if (event.note) references.append(make('p',event.note));
  references.append(make('p','Son inceleme · '+event.checked));
  const controls = editor.controls(event, (updated,notice) => {
    events[events.findIndex(e=>e.id===event.id)] = updated;
    updateYearStrip();
    render();
    fillEventDetails(updated,notice);
    get('event-title').focus();
  }, message);
  get('event-content').replaceChildren(make('p',event.topic+' · '+event.type),fields,references,controls);
}

const panel = make('dialog');
panel.id = 'event-panel';
panel.setAttribute('aria-labelledby','event-title');
const closePanel = make('button','Kapat');
closePanel.type = 'button';
closePanel.autofocus = true;
closePanel.addEventListener('click',() => panel.close());
const panelTitle = make('h2');
panelTitle.id = 'event-title';
panelTitle.tabIndex = -1;
const panelContent = make('div');
panelContent.id = 'event-content';
panel.append(closePanel,panelTitle,panelContent);
document.body.append(panel);

const exportMenu = make('details');
exportMenu.className = 'export-menu';
const exportChoices = make('div');
exportChoices.append(get('csv'),get('ics'),get('subscribe'),get('print'));
exportMenu.append(make('summary','Dışa aktar'),exportChoices);
document.querySelector('#takvim .actions').append(exportMenu);
exportChoices.addEventListener('click',event => {
  if (!event.target.closest('button:not(:disabled)')) return;
  exportMenu.open = false;
  const trigger = exportMenu.querySelector('summary');
  if (event.target.id === 'subscribe') get('dialog').addEventListener('close',() => trigger.focus(),{once:true});
  else trigger.focus();
});

const yearStrip = make('div');
yearStrip.className = 'year-strip';
yearStrip.setAttribute('role','group');
yearStrip.setAttribute('aria-label','Aya göre filtrele · Etkinliklerin başlangıç ayı');
function updateYearStrip() {
  const counts = report(events).byMonth;
  const peak = Math.max(1,...Object.values(counts));
  for (const cell of yearStrip.children) {
    const count = counts[cell.dataset.month] || 0;
    cell.querySelector('strong').textContent = count;
    cell.setAttribute('aria-label',monthName(cell.dataset.month)+' · '+count+' etkinlik');
    cell.style.setProperty('--month-share',(count/peak*100)+'%');
  }
}
for (const month of months) {
  const cell = make('button');
  cell.type = 'button';
  cell.dataset.month = month;
  cell.append(make('span',monthName(month)),make('strong'));
  cell.addEventListener('click',() => {
    get('month').value = get('month').value === month ? '' : month;
    render();
  });
  yearStrip.append(cell);
}
get('filters').before(yearStrip);
updateYearStrip();
atlas = window.GazAtlas(get('atlas'),events,code => {
  get('country').value = published.find(e=>e.countryCode===code)?.country || '';
  render();
});
render();

const updateButton = make('button', 'Takvimi güncelle');
updateButton.type = 'button';
updateButton.title = 'GitHub Actions → Run workflow ile kaynak kontrolünü başlat';
updateButton.addEventListener('click', () => {
  window.open('https://github.com/kaantellioglu/gas-fair-calendar/actions/workflows/gaz-2027-sources.yml', '_blank', 'noopener,noreferrer');
});
document.querySelector('.mast').append(updateButton);
