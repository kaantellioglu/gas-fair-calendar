const {readFile,writeFile} = require('node:fs/promises');
const {createHash} = require('node:crypto');
const path = require('node:path');
const {events,sources} = require('../data/catalog.json');
const baseline = path.resolve(process.argv[2] || 'source-baseline.json');

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
  async function worker() {
    while (pending.length) {
      const [url,labels] = pending.shift();
      try {
        const response = await fetch(url,{signal:AbortSignal.timeout(18000),headers:{'User-Agent':'GazTakvimi/2027 source-monitor'}});
        if (!response.ok) throw new Error('HTTP '+response.status);
        const body = await response.text();
        const content = (response.headers.get('content-type') || '').includes('html')
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
  await writeFile('source-report.json',json({checkedAt:new Date().toISOString(),results}));
  const summary = ['### Kaynak kontrolü','',...['changed','unavailable','unchanged','baseline'].map(status => '- '+status+': '+results.filter(r => r.status === status).length),'','Değişen ve erişilemeyen sayfalar source-report.json dosyasında incelenebilir. Takvim verisi editör incelemesiyle güncellenir.'].join('\n');
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) await require('node:fs/promises').appendFile(process.env.GITHUB_STEP_SUMMARY,summary+'\n');
}
main().catch(error => { console.error(error); process.exitCode=1; });
