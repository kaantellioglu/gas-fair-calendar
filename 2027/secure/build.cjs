const fs=require('node:fs'),path=require('node:path');
const destination=path.join(__dirname,'assets');
fs.mkdirSync(destination,{recursive:true});
for(const name of ['index.html','style.css','app.js','atlas.js','atlas-data.js','core.js','multi-select.js','manual.js','event-editor.js']){
 fs.copyFileSync(path.join(__dirname,'../site',name),path.join(destination,name));
}
fs.copyFileSync(path.join(__dirname,'shared.js'),path.join(destination,'shared.js'));
for(const name of ['manifest.webmanifest','sw.js','pwa-install.js','pwa.css']){
 fs.copyFileSync(path.join(__dirname,'public',name),path.join(destination,name));
}
const icons=path.join(destination,'icons');
fs.mkdirSync(icons,{recursive:true});
for(const name of ['icon.svg','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png']){
 fs.copyFileSync(path.join(__dirname,'public/icons',name),path.join(icons,name));
}
console.log('Protected assets prepared; database, password records and credentials excluded.');
