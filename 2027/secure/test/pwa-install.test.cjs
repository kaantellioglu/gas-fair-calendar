'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const script=fs.readFileSync(path.join(__dirname,'../public/pwa-install.js'),'utf8');

function browser(userAgent){
 const events={};
 const nodes=[];
 const element=tag=>({
  tag,children:[],attributes:{},hidden:false,listeners:{},textContent:'',
  setAttribute(name,value){this.attributes[name]=value;},
  addEventListener(name,listener){this.listeners[name]=listener;},
  append(...children){this.children.push(...children);},
  appendChild(child){this.children.push(child);nodes.push(child);},
  focus(){this.focused=true;},
  click(){return this.listeners.click();}
 });
 const mast=element('header');
 const document={
  readyState:'complete',
  querySelector(selector){return selector==='.mast'?mast:null;},
  createElement:element,
  getElementById(id){return nodes.find(node=>node.id===id)||null;},
  body:{appendChild(child){nodes.push(child);}}
 };
 const window={
  matchMedia(){return {matches:false};},
  addEventListener(name,listener){events[name]=listener;}
 };
 const navigator={userAgent,platform:'',maxTouchPoints:1};
 vm.runInNewContext(script,{window,document,navigator});
 return {mast,nodes,events};
}

test('Android visitors can trigger the native install prompt',async()=>{
 const b=browser('Mozilla/5.0 (Linux; Android 15; Pixel 9) Chrome/131.0 Mobile');
 const button=b.mast.children[0];
 assert.match(button.textContent,/Uygulamayı yükle/);
 let prompted=0;
 b.events.beforeinstallprompt({preventDefault(){},prompt(){prompted++;return Promise.resolve();},userChoice:Promise.resolve({outcome:'accepted'})});
 await button.click();
 assert.equal(prompted,1);
 b.events.appinstalled();
 assert.equal(button.hidden,true);
});

test('iPhone visitors receive Safari Add to Home Screen instructions',async()=>{
 const b=browser('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1');
 const button=b.mast.children[0];
 assert(button);
 await button.click();
 const help=b.nodes.find(node=>node.id==='pwa-install-help');
 assert(help);
 assert.match(help.children[1].textContent,/Safari/);
 assert.match(help.children[1].textContent,/Ana Ekrana Ekle/);
 help.children[2].click();
 assert.equal(help.hidden,true);
});

test('desktop browsers do not show a mobile install button',()=>{
 const b=browser('Mozilla/5.0 (X11; Linux x86_64) Chrome/131.0');
 assert.equal(b.mast.children.length,0);
});
