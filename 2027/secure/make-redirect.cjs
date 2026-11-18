'use strict';
const fs=require('node:fs'),path=require('node:path');
const out=path.resolve(__dirname,'../../secure-pages');
const target='https://eska-gaz-takvimi-2027.vercel.app/';
const html='<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gaz Takvimi 2027 · Güvenli giriş</title><script>const target=new URL('+JSON.stringify(target)+');target.search=location.search;target.hash=location.hash;location.replace(target.href);</script><meta http-equiv="refresh" content="0;url='+target+'"><h1>Gaz Takvimi 2027</h1><p>Takvim ortak ve parolalı çalışma alanına taşındı.</p><a href="'+target+'">Güvenli takvimi aç</a></html>';
for(const dir of ['', '2027', '2027/site']){
 const destination=path.join(out,dir);fs.mkdirSync(destination,{recursive:true});fs.writeFileSync(path.join(destination,'index.html'),html);
}
fs.writeFileSync(path.join(out,'404.html'),html);fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log('Redirect-only Pages artifact created; catalog and exports are excluded.');
