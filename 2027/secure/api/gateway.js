'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const security=require('../lib/security.cjs');
const {createStore,StoreError}=require('../lib/github-store.cjs');
const {mutateCatalog}=require('../lib/catalog.cjs');
const loginHTML='<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ESKA · Gaz Takvimi 2027</title><link rel="stylesheet" href="/login.css"><main><p class="brand">ESKA · GAZ TAKVİMİ 2027</p><h1>Ortak takvime giriş</h1><p>Fuarları ve kaynakları ekip olarak tek bir yerde yönetin.</p><form id="login"><label>Parola<input type="password" name="password" autocomplete="current-password" required maxlength="256" autofocus></label><button>Takvimi aç</button><p id="message" role="status"></p></form></main><script src="/login.js"></script></html>';
const loginCSS='*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#024660;color:#163746;font:16px/1.55 "Segoe UI",sans-serif;padding:24px}main{width:min(460px,100%);background:#f5f9fb;padding:36px;border-radius:8px}.brand{font-size:.8rem;font-weight:750;color:#006985}h1{font-size:1.8rem;line-height:1.2;letter-spacing:-.025em}p{color:#526b76}label{display:grid;gap:8px;font-weight:650}input,button{font:inherit;min-height:48px;border-radius:4px}input{border:1px solid #7198a9;padding:10px;width:100%}button{background:#024660;color:#fff;border:0;margin-top:16px;width:100%;font-weight:700;cursor:pointer}button:disabled{opacity:.65;cursor:wait}:focus-visible{outline:3px solid #009fd6;outline-offset:3px}#message{min-height:24px;margin-bottom:0}';
const loginJS="document.getElementById('login').addEventListener('submit',async event=>{event.preventDefault();const form=event.currentTarget,button=form.querySelector('button'),message=document.getElementById('message');button.disabled=true;message.textContent='Giriş kontrol ediliyor…';try{const response=await fetch('/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:form.elements.password.value}),credentials:'same-origin'});form.elements.password.value='';const result=await response.json();if(!response.ok)throw Error(result.error||'Giriş yapılamadı.');location.replace('/');}catch(error){message.textContent=error.message;button.disabled=false;form.elements.password.focus();}});";
const allowed=new Set(['index.html','style.css','app.js','atlas.js','atlas-data.js','core.js','multi-select.js','manual.js','event-editor.js','shared.js']);
const dynamic=new Set(['catalog.js','events.json','events.csv','calendar.ics','report.json']);
async function bodyJSON(req){
 if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw new StoreError(415,'JSON biçiminde veri gönderin.');
 if(req.body!==undefined){
  const text=typeof req.body==='string'?req.body:JSON.stringify(req.body);
  if(Buffer.byteLength(text)>16000)throw new StoreError(413,'İstek çok büyük.');
  try{return JSON.parse(text);}catch{throw new StoreError(400,'JSON biçimi geçersiz.');}
 }
 let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>16000)throw new StoreError(413,'İstek çok büyük.');}
 try{return JSON.parse(text);}catch{throw new StoreError(400,'JSON biçimi geçersiz.');}
}
function createHandler({env=process.env,store:providedStore,readAsset,core}={}){
 let store=providedStore,authCache;
 const asset=readAsset||((name)=>fs.readFile(path.join(__dirname,'../assets',name),'utf8'));
 function database(){return store||(store=createStore(env));}
 async function authRecord(){
  if(authCache?.until>Date.now())return authCache.record;
  const {value}=await database().read('auth/password.json');
  authCache={record:value,until:Date.now()+5000};return value;
 }
 function origin(){
  const u=new URL(env.APP_ORIGIN);
  if(u.protocol!=='https:'||u.origin!==env.APP_ORIGIN)throw new StoreError(503,'Yayın adresi yapılandırılmamış.');
  return u.origin;
 }
 return async function handler(req,res){
  const common={
   'Cache-Control':'private, no-store, max-age=0','CDN-Cache-Control':'no-store','Vercel-CDN-Cache-Control':'no-store',
   'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY',
   'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
   'Strict-Transport-Security':'max-age=31536000'
  };
  const send=(status,data,type='application/json; charset=utf-8',extra={})=>{
   res.writeHead(status,{...common,'Content-Type':type,...extra});
   res.end(req.method==='HEAD'?'':typeof data==='string'?data:JSON.stringify(data));
  };
  try{
   const requestURL=new URL(req.url,'https://gateway.invalid');
   let route=requestURL.searchParams.get('route');
   if(route===null)route=requestURL.pathname.slice(1);
   route=route.replace(/^\/+/,'');
   const api=route.startsWith('api/');
   if(['GET','HEAD'].includes(req.method)&&route==='login.css')return send(200,loginCSS,'text/css; charset=utf-8');
   if(['GET','HEAD'].includes(req.method)&&route==='login.js')return send(200,loginJS,'text/javascript; charset=utf-8');
   const post=req.method==='POST';
   if(post&&req.headers.origin!==origin())throw new StoreError(403,'İstek kaynağı doğrulanamadı.');
   if(route==='login'&&post){
    const input=await bodyJSON(req);
    if(typeof input.password!=='string'||input.password.length>256)throw new StoreError(400,'Parolayı kontrol edin.');
    await database().consumeLoginBudget();
    const auth=await authRecord();
    if(!await security.verifyPassword(input.password,auth))throw new StoreError(401,'Parola hatalı.');
    const token=security.issueSession(env.SESSION_SECRET,auth.version);
    return send(200,{ok:true},undefined,{'Set-Cookie':security.sessionCookie(token)});
   }
   const token=security.cookies(req.headers.cookie)[security.cookieName];
   if(!token){
    if(!api&&['GET','HEAD'].includes(req.method)&&(route===''||route==='index.html'||route==='login'))return send(200,loginHTML,'text/html; charset=utf-8');
    throw new StoreError(401,'Takvimi açmak için giriş yapın.');
   }
   const auth=await authRecord();
   if(!security.verifySession(token,env.SESSION_SECRET,auth.version)){
    if(!api&&['GET','HEAD'].includes(req.method)&&(route===''||route==='index.html'))return send(200,loginHTML,'text/html; charset=utf-8',{'Set-Cookie':security.clearCookie()});
    return send(401,{error:'Oturum süresi doldu. Tekrar giriş yapın.'},undefined,{'Set-Cookie':security.clearCookie()});
   }
   if(post&&!security.same(req.headers['x-csrf-token']||'',security.csrf(token,env.SESSION_SECRET)))throw new StoreError(403,'Oturum doğrulaması başarısız. Sayfayı yenileyin.');
   if(route==='api/logout'&&post)return send(200,{ok:true},undefined,{'Set-Cookie':security.clearCookie()});
   if(route==='api/catalog'&&post){
    const operation=await bodyJSON(req);
    const {value,sha}=await database().read('data/catalog.json');
    if(operation.revision!==sha)throw new StoreError(409,'Ortak veri başka bir kullanıcı tarafından güncellendi. Sayfayı yenileyip tekrar kaydedin.');
    const next=mutateCatalog(value,operation,randomUUID);
    const revision=await database().write('data/catalog.json',next,sha,'Shared calendar: '+operation.type);
    return send(200,{ok:true,revision});
   }
   if(!['GET','HEAD'].includes(req.method))throw new StoreError(405,'Bu işlem desteklenmiyor.');
   if(route==='api/revision'){
    const {sha}=await database().read('data/catalog.json');return send(200,{revision:sha});
   }
   if(dynamic.has(route)||route==='api/catalog'){
    const {value,sha}=await database().read('data/catalog.json');
    if(route==='catalog.js'){
     const text=JSON.stringify({...value,revision:sha,csrf:security.csrf(token,env.SESSION_SECRET),shared:true}).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
     return send(200,'window.GazCatalog = '+text+';\n','text/javascript; charset=utf-8');
    }
    if(route==='events.json'||route==='api/catalog')return send(200,value);
    const exports=core||require('../assets/core.js');
    if(route==='events.csv')return send(200,exports.csv(value.events),'text/csv; charset=utf-8',{'Content-Disposition':'attachment; filename="gaz-takvimi-2027.csv"'});
    if(route==='calendar.ics')return send(200,exports.calendar(value.events,value.checked),'text/calendar; charset=utf-8',{'Content-Disposition':'attachment; filename="gaz-takvimi-2027.ics"'});
    return send(200,{year:value.year,checked:value.checked,sourceCalendars:value.sources.length,...exports.report(value.events)});
   }
   if(route==='')route='index.html';
   if(!allowed.has(route))throw new StoreError(404,'Sayfa bulunamadı.');
   let content=await asset(route);
   if(route==='index.html'){
    content=content.replace(/<script defer src="manual\.js[^"]*"><\/script>/,match=>'<script defer src="/shared.js"></script>'+match)
     .replace('Manuel ekledikleriniz bu tarayıcıda saklanır. Ortak takvime eklemek için GitHub önerisi açın.','Fuar ve kaynak kayıtları ortak GitHub veritabanına kaydedilir. Tüm kullanıcılar aynı veri üzerinde çalışır.');
   }
   return send(200,content,route.endsWith('.css')?'text/css; charset=utf-8':route.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8');
  }catch(error){
   const status=error instanceof StoreError?error.status:503;
   send(status,{error:error instanceof StoreError?error.message:'Servis şu anda kullanılamıyor. Yapılandırmayı kontrol edin.'},undefined,status===429?{'Retry-After':'300'}:{});
  }
 };
}
module.exports=createHandler();
module.exports.createHandler=createHandler;
