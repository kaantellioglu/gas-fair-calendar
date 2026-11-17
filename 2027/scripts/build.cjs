const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname,'..');
const site = fs.existsSync(path.join(root,'site','core.js')) ? path.join(root,'site') : root;
const {calendar,csv,report} = require(path.join(site,'core.js'));
const data = JSON.parse(fs.readFileSync(path.join(root,'data','catalog.json'),'utf8'));
const url = value => typeof value === 'string' && /^https?:$/.test(new URL(value).protocol) && !/[\r\n]/.test(value);
const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value+'T00:00Z').toISOString().slice(0,10) === value;
assert.equal(data.year,2027);
assert(date(data.checked));
const ids = new Set();
const identity = new Set();
for (const e of data.events) {
  assert(/^[a-z0-9-]+$/.test(e.id) && !ids.has(e.id),e.id);
  ids.add(e.id);
  for (const field of ['name','topic','type','country','countryCode']) assert(e[field],e.id+' '+field);
  const key = [e.name.toLowerCase(),e.countryCode,e.start].join('|');
  assert(!identity.has(key),'Duplicate: '+key);
  identity.add(key);
  assert(date(e.checked),e.id+' checked');
  assert(['Birincil kaynak','Takvim kaynağı','Tarih uyuşmazlığı','Takipte'].includes(e.status),e.id+' status');
  for (const field of ['website','source']) assert(url(e[field]),e.id+' '+field);
  for (const field of ['registration','feeSource']) if (e[field]) assert(url(e[field]),e.id+' '+field);
  if (e.visitor || e.delegate) assert(e.feeSource,e.id+' price source');
  if (e.start || e.end) assert(e.start && e.end && date(e.start) && date(e.end) && e.start.startsWith('2027-') && e.end.startsWith('2027-') && e.end >= e.start,e.id+' date');
  else assert.equal(e.status,'Takipte',e.id+' status');
}
for (const s of data.sources) assert(s.name && url(s.url));
data.events.sort((a,b) => (a.start || '9999').localeCompare(b.start || '9999') || a.name.localeCompare(b.name,'tr'));
const json = value => JSON.stringify(value,null,2)+'\n';
const metrics = report(data.events);
const feed = calendar(data.events,data.checked);
assert.equal((feed.match(/^BEGIN:VEVENT\r$/gm)||[]).length,data.events.length-metrics.undated);
assert(feed.includes('DTEND;VALUE=DATE:20270918'));
for (const line of feed.split('\r\n')) assert(Buffer.byteLength(line,'utf8')<=75);
assert(csv(data.events).startsWith('\ufeff'));
const outputs = {
  'catalog.js':'window.GazCatalog = '+json(data).trimEnd()+';\n',
  'events.json':json(data),
  'events.csv':csv(data.events),
  'calendar.ics':feed,
  'report.json':json({year:data.year,checked:data.checked,sourceCalendars:data.sources.length,...metrics}),
  '.nojekyll':''
};
for (const [name,content] of Object.entries(outputs)) fs.writeFileSync(path.join(site,name),content);
console.log(JSON.stringify(metrics,null,2));
