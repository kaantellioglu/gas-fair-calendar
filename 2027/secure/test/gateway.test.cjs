'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {randomUUID}=require('node:crypto');
const security=require('../lib/security.cjs');
const {createHandler}=require('../api/gateway.js');
const {createStore,StoreError}=require('../lib/github-store.cjs');
const {mutateCatalog}=require('../lib/catalog.cjs');
const catalog=JSON.parse(fs.readFileSync(require.resolve('../../data/catalog.json'),'utf8'));
const secret='session-secret-used-only-in-automated-tests-0123456789';
let auth;
test.before(async()=>{auth=await security.hashPassword('automated-test-password');});
function fixture(){
 let value=structuredClone(catalog),revision='a'.repeat(40),writes=0;
 const store={
  async read(path){return path==='auth/password.json'?{value:auth,sha:'b'.repeat(40)}:{value:structuredClone(value),sha:revision};},
  async write(path,next,sha){
   if(sha!==revision)throw new StoreError(409,'conflict');
   value=structuredClone(next);revision='c'.repeat(40);writes++;return revision;
  },async consumeLoginBudget(){}
 };
 const handler=createHandler({env:{APP_ORIGIN:'https://calendar.example',SESSION_SECRET:secret},store,readAsset:async name=>name==='index.html'?'<script defer src="manual.js"></script>':'asset',core:require('../../site/core.js')});
 const token=()=>security.issueSession(secret,auth.version);
 async function call(route,{method='GET',body,cookie,csrf,origin='https://calendar.example'}={}){
  let result;
  const req={url:'/'+route,method,body,headers:{origin,'content-type':'application/json',...(cookie?{cookie:security.cookieName+'='+cookie}:{}),...(csrf?{'x-csrf-token':csrf}:{})}};
  const res={writeHead(status,headers){result={status,headers};},end(body){result.body=body;}};
  await handler(req,res);return result;
 }
 return {call,token,store,get writes(){return writes;}};
}
test('password record uses salted PBKDF2 and rejects a wrong password',async()=>{
 assert.equal(auth.iterations,600000);assert.equal(auth.algorithm,'pbkdf2-sha256');
 assert.equal(await security.verifyPassword('automated-test-password',auth),true);
 assert.equal(await security.verifyPassword('incorrect',auth),false);
 assert(!JSON.stringify(auth).includes('automated-test-password'));
});
test('sessions reject tampering, expiry and a password-version change',()=>{
 const now=Date.now(),token=security.issueSession(secret,auth.version,now);
 assert(security.verifySession(token,secret,auth.version,now+1000));
 assert(!security.verifySession(token+'x',secret,auth.version,now));
 assert(!security.verifySession(token,secret,'new-password-version',now));
 assert(!security.verifySession(token,secret,auth.version,now+9*3600000));
 assert.match(security.sessionCookie(token),/HttpOnly; Secure; SameSite=Strict/);
});
test('unauthenticated visits show login; data and auth records are not exposed',async()=>{
 const f=fixture();const page=await f.call('');
 assert.equal(page.status,200);assert.match(page.body,/Ortak takvime giriş/);assert(!page.body.includes(catalog.events[0].name));
 for(const route of ['catalog.js','events.csv','events.json','calendar.ics','report.json','data/catalog.json','auth/password.json','assets/app.js','api/catalog']){
  const response=await f.call(route);assert.equal(response.status,401,route);assert.equal(response.headers['Cache-Control'],'private, no-store, max-age=0');
 }
});
test('login rejects wrong credentials and cross-origin requests',async()=>{
 const f=fixture();
 assert.equal((await f.call('login',{method:'POST',body:{password:'incorrect'}})).status,401);
 assert.equal((await f.call('login',{method:'POST',body:{password:'automated-test-password'},origin:'https://attacker.example'})).status,403);
 const success=await f.call('login',{method:'POST',body:{password:'automated-test-password'}});
 assert.equal(success.status,200);assert.match(success.headers['Set-Cookie'],/__Host-gaz_session=/);
});
test('authenticated users get the same live GitHub catalog; mutations require CSRF',async()=>{
 const f=fixture(),one=f.token(),two=f.token();
 const operation={type:'add_source',record:{name:'Shared source test',url:'https://example.com/source'},revision:'a'.repeat(40)};
 assert.equal((await f.call('api/catalog',{method:'POST',body:operation,cookie:one})).status,403);
 assert.equal(f.writes,0);
 const saved=await f.call('api/catalog',{method:'POST',body:operation,cookie:one,csrf:security.csrf(one,secret)});
 assert.equal(saved.status,200);assert.equal(f.writes,1);
 const secondBrowser=await f.call('api/catalog',{cookie:two});
 assert(JSON.parse(secondBrowser.body).sources.some(s=>s.name==='Shared source test'));
 assert.equal((await f.call('api/catalog',{method:'POST',body:operation,cookie:two,csrf:security.csrf(two,secret)})).status,409);
 assert.equal(f.writes,1);
});
test('protected assets are allowlisted, and signout clears the cookie',async()=>{
 const f=fixture(),cookie=f.token();
 for(const route of ['auth/password.json','.env','lib/security.cjs','assets/app.js'])assert.equal((await f.call(route,{cookie})).status,404,route);
 const html=await f.call('',{cookie});assert.match(html.body,/shared\.js/);
 const catalogJS=await f.call('catalog.js',{cookie});assert.match(catalogJS.body,/"shared":true/);assert(!catalogJS.body.includes(auth.digest));
 const logout=await f.call('api/logout',{method:'POST',cookie,csrf:security.csrf(cookie,secret)});
 assert.equal(logout.status,200);assert.match(logout.headers['Set-Cookie'],/Max-Age=0/);
});
test('GitHub store refuses a public database repository',async()=>{
 const store=createStore({GITHUB_DATA_REPOSITORY:'example/repo',GITHUB_DATA_TOKEN:'test-token'},async()=>({ok:true,json:async()=>({private:false})}));
 await assert.rejects(store.read('data/catalog.json'),error=>error.status===503);
});
test('catalog validation rejects bad URLs, dates, duplicate sources and prohibited edit fields',()=>{
 assert.throws(()=>mutateCatalog(catalog,{type:'add_source',record:{name:'Bad',url:'javascript:alert(1)'}},randomUUID),{status:400});
 assert.throws(()=>mutateCatalog(catalog,{type:'add_source',record:catalog.sources[0]},randomUUID),{status:409});
 assert.throws(()=>mutateCatalog(catalog,{type:'update_event',id:catalog.events[0].id,changes:{start:'2027-02-30',end:'2027-03-01'}},randomUUID),{status:400});
 assert.throws(()=>mutateCatalog(catalog,{type:'update_event',id:catalog.events[0].id,changes:{id:'overwrite'}},randomUUID),{status:400});
});
test('shared mode ignores all browser-local events, sources and edits',()=>{
 let reads=0;
 const context={window:{GazShared:{},GazAtlasGeometry:[]},Intl,URL,localStorage:{getItem(){reads++;throw Error('Old browser data must not be read');}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../../site/manual.js'),'utf8'),context);
 vm.runInNewContext(fs.readFileSync(require.resolve('../../site/event-editor.js'),'utf8'),context);
 const shared=context.window.GazManual.init(catalog.events,catalog.sources);
 const edited=context.window.GazEventEditor.init(shared.events);
 assert.equal(edited.length,309);assert.equal(shared.sources.length,catalog.sources.length);assert.equal(reads,0);
});
