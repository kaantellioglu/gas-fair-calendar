'use strict';
const {pbkdf2,randomBytes,createHmac,timingSafeEqual}=require('node:crypto');
const {promisify}=require('node:util');
const derive=promisify(pbkdf2);
const cookieName='__Host-gaz_session';
const same=(a,b)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);};
async function hashPassword(password){
 const salt=randomBytes(32);
 return {algorithm:'pbkdf2-sha256',iterations:600000,salt:salt.toString('base64'),digest:(await derive(password,salt,600000,32,'sha256')).toString('base64'),version:randomBytes(16).toString('hex')};
}
async function verifyPassword(password,record){
 if(typeof password!=='string'||password.length<1||password.length>256)return false;
 if(record?.algorithm!=='pbkdf2-sha256'||record.iterations!==600000||!/[a-f0-9]{32}/.test(record.version||''))throw Error('Invalid password configuration');
 const salt=Buffer.from(record.salt,'base64'),digest=Buffer.from(record.digest,'base64');
 if(salt.length!==32||digest.length!==32)throw Error('Invalid password configuration');
 return same(await derive(password,salt,record.iterations,32,'sha256'),digest);
}
function signingKey(secret){if(typeof secret!=='string'||Buffer.byteLength(secret)<32)throw Error('Session secret is not configured');return secret;}
function mac(value,secret){return createHmac('sha256',signingKey(secret)).update(value).digest('base64url');}
function issueSession(secret,version,now=Date.now()){
 const payload=Buffer.from(JSON.stringify({version,expires:now+8*3600000,nonce:randomBytes(24).toString('base64url')})).toString('base64url');
 return payload+'.'+mac(payload,secret);
}
function verifySession(token,secret,version,now=Date.now()){
 if(typeof token!=='string'||token.length>1024)return false;
 const [payload,signature,...rest]=token.split('.');
 if(rest.length||!payload||!signature||!same(mac(payload,secret),signature))return false;
 try{const data=JSON.parse(Buffer.from(payload,'base64url'));return data.version===version&&Number.isFinite(data.expires)&&data.expires>now&&data.expires<=now+8*3600000&&typeof data.nonce==='string'&&data.nonce.length>=32;}catch{return false;}
}
const csrf=(token,secret)=>mac('csrf:'+token,secret);
function cookies(header){return Object.fromEntries(String(header||'').split(';').map(pair=>{const i=pair.indexOf('=');return [pair.slice(0,i).trim(),pair.slice(i+1).trim()];}).filter(([key])=>key));}
const sessionCookie=token=>cookieName+'='+token+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800';
const clearCookie=()=>cookieName+'=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';
module.exports={hashPassword,verifyPassword,issueSession,verifySession,csrf,same,cookies,cookieName,sessionCookie,clearCookie};
