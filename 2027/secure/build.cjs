const fs=require('node:fs'),path=require('node:path');
const destination=path.join(__dirname,'assets');
fs.mkdirSync(destination,{recursive:true});
for(const name of ['index.html','style.css','app.js','atlas.js','atlas-data.js','core.js','multi-select.js','manual.js','event-editor.js']){
 fs.copyFileSync(path.join(__dirname,'../site',name),path.join(destination,name));
}
fs.copyFileSync(path.join(__dirname,'shared.js'),path.join(destination,'shared.js'));
console.log('Protected assets prepared; database, password records and credentials excluded.');
