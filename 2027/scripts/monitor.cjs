const {readFile,writeFile} = require('node:fs/promises');
const {createHash} = require('node:crypto');
const path = require('node:path');
const {events,sources} = require('../data/catalog.json');
const baseline = path.resolve(process.argv[2] || 'source-baseline.json');

// Read structured Event objects from organizer and venue pages.
function structuredEvents(html, sourceUrl) {
  const found = [];
  const visit = value => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const types = [value['@type']].flat();
    const start = typeof value.startDate === 'string' ? value.startDate.slice(0,10) : '';
    if (types.some(type => typeof type === 'string' && /(?:^|\/)[A-Za-z]*Event$/.test(type)) &&
        typeof value.name === 'string' && /^2027-\d{2}-\d{2}$/.test(start)) {
      const name = value.name.trim();
      let eventUrl = sourceUrl;
      try {
        const candidateUrl = new URL(value.url || sourceUrl,sourceUrl);
        if (['https:','http:'].includes(candidateUrl.protocol)) eventUrl = candidateUrl.href;
      } catch {}
      if (name) found.push({name,start,url:eventUrl,source:sourceUrl});
    }
    for (const child of Object.values(value)) visit(child);
  };
  for (const match of html.matchAll(/<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { visit(JSON.parse(match[1])); } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
  }
  return found;
}
const keyName = name => name.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const coveredEvents = new Set(events.map(event => keyName(event.name)+'|'+event.start));

async function main() {
  let before = {};
  try { before = JSON.parse(await readFile(baseline,'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const targets = new Map();
  for (const entry of [...sources.map(s => [s.url,s.name]), ...events.flatMap(e => [e.website,e.source,e.registration,e.feeSource].filter(Boolean).map(url => [url,e.name]))]) {
    if (!targets.has(entry[0])) targets.set(entry[0],new Set());
    targets.get(entry[0]).add(entry[1]);
  }
  const after = {...before};
  const pending = [...targets];
  const results = [];
  const candidates = new Map();
  async function worker() {
    while (pending.length) {
      const [url,labels] = pending.shift();
      try {
        const response = await fetch(url,{signal:AbortSignal.timeout(18000),headers:{'User-Agent':'GazTakvimi/2027 source-monitor'}});
        if (!response.ok) throw new Error('HTTP '+response.status);
        const body = await response.text();
        const isHtml = (response.headers.get('content-type') || '').includes('html');
        if (isHtml) for (const candidate of structuredEvents(body,response.url || url)) {
          const key = keyName(candidate.name)+'|'+candidate.start;
          if (!coveredEvents.has(key)) candidates.set(key+'|'+candidate.url,candidate);
        }
        const content = isHtml
          ? body.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<!--[\s\S]*?-->/g,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()
          : body;
        const hash = createHash('sha256').update(content).digest('hex');
        const status = !before[url] ? 'baseline' : before[url] === hash ? 'unchanged' : 'changed';
        after[url] = hash;
        results.push({url,names:[...labels],status});
      } catch (error) {
        results.push({url,names:[...labels],status:'unavailable',error:error.message});
      }
    }
  }
  await Promise.all(Array.from({length:5},worker));
  results.sort((a,b) => a.url.localeCompare(b.url));
  const json = value => JSON.stringify(value,null,2)+'\n';
  await writeFile(baseline,json(after));
  const eventCandidates = [...candidates.values()].sort((a,b) => a.start.localeCompare(b.start) || a.name.localeCompare(b.name));
  await writeFile('source-report.json',json({checkedAt:new Date().toISOString(),results,eventCandidates}));
  const summary = ['### Kaynak kontrolü','',...['changed','unavailable','unchanged','baseline'].map(status => '- '+status+': '+results.filter(r => r.status === status).length),'- 2027 yapılandırılmış etkinlik adayı: '+eventCandidates.length,'','Değişen ve erişilemeyen sayfalar source-report.json dosyasında incelenebilir. Takvim verisi editör incelemesiyle güncellenir.'].join('\n');
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) await require('node:fs/promises').appendFile(process.env.GITHUB_STEP_SUMMARY,summary+'\n');
}
main().catch(error => { console.error(error); process.exitCode=1; });
