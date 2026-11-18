'use strict';
class StoreError extends Error{constructor(status,message){super(message);this.status=status;}}
function createStore(env,fetcher=fetch){
 const repo=env.GITHUB_DATA_REPOSITORY;
 if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo||'')||!env.GITHUB_DATA_TOKEN)throw new StoreError(503,'Ortak veri bağlantısı yapılandırılmamış.');
 const branch=env.GITHUB_DATA_BRANCH||'main';
 const headers={Authorization:'Bearer '+env.GITHUB_DATA_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'ESKA-Gas-Calendar'};
 const root='https://api.github.com/repos/'+repo;
 async function request(url,options={}){
  let result;try{result=await fetcher(url,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(12000)});}catch{throw new StoreError(503,'GitHub veri bağlantısına ulaşılamadı. Tekrar deneyin.');}
  if(result.status===409||result.status===422)throw new StoreError(409,'Veri başka bir kullanıcı tarafından değiştirildi. Sayfayı yenileyip tekrar kaydedin.');
  if(!result.ok)throw new StoreError(503,'GitHub veri işlemi tamamlanamadı.');
  return result.json();
 }
 let privateUntil=0;
 async function ensurePrivate(){
  if(privateUntil>Date.now())return;
  const metadata=await request(root);
  if(metadata.private!==true)throw new StoreError(503,'Ortak veritabanı özel bir GitHub deposunda bulunmalıdır.');
  privateUntil=Date.now()+60000;
 }
 async function read(path){
  await ensurePrivate();
  const result=await request(root+'/contents/'+path+'?ref='+encodeURIComponent(branch));
  if(result.encoding!=='base64'||typeof result.content!=='string'||!result.sha)throw new StoreError(503,'Veri biçimi doğrulanamadı.');
  try{return {value:JSON.parse(Buffer.from(result.content,'base64').toString('utf8')),sha:result.sha};}catch{throw new StoreError(503,'Veri dosyası okunamadı.');}
 }
 async function write(path,value,sha,message){
  await ensurePrivate();
  if(!/^[a-f0-9]{40}$/.test(sha||''))throw new StoreError(409,'Veri sürümü eksik. Sayfayı yenileyin.');
  const result=await request(root+'/contents/'+path,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({branch,sha,message,content:Buffer.from(JSON.stringify(value,null,2)+'\n').toString('base64')})});
  return result.content.sha;
 }
 async function consumeLoginBudget(now=Date.now()){
  const {value,sha}=await read('auth/login-budget.json');
  const slot=Math.floor(now/300000);
  const count=value.slot===slot?Number(value.count)||0:0;
  if(count>=20)throw new StoreError(429,'Çok fazla giriş denemesi. Beş dakika sonra tekrar deneyin.');
  try{await write('auth/login-budget.json',{slot,count:count+1},sha,'Reserve a shared login attempt');}catch(error){if(error.status===409)throw new StoreError(429,'Eş zamanlı giriş isteği var. Biraz sonra tekrar deneyin.');throw error;}
 }
 return {read,write,consumeLoginBudget};
}
module.exports={createStore,StoreError};
