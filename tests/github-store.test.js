import test from 'node:test';
import assert from 'node:assert/strict';
import {GitHubStore,encode,decode} from '../github-store.js';
test('Russian text and emoji survive Base64 roundtrip',()=>assert.equal(decode(encode('Задача №1 🧪')),'Задача №1 🧪'));
test('reject repository outside fixed GitHub API path',()=>assert.throws(()=>new GitHubStore('https://evil.example','secret')));
test('reject public data repositories',async()=>{const store=new GitHubStore('owner/data','test',async()=>({ok:true,json:async()=>({private:false})}));await assert.rejects(store.connect(),/закрытым/);});
test('save uses the loaded SHA and branch; conflicts do not retry',async()=>{
 let calls=0;
 const store=new GitHubStore('owner/data','test',async(url,options)=>{calls++;assert.ok(url.startsWith('https://api.github.com/repos/owner/data/contents/'));assert.equal(options.headers.Authorization,'Bearer test');const body=JSON.parse(options.body);assert.equal(body.sha,'old-sha');assert.equal(body.branch,'main');assert.equal(decode(body.content),'Тест');return {ok:false,status:409};});
 store.branch='main';await assert.rejects(store.write('workspace.json','Тест','old-sha'),/другом окне/);assert.equal(calls,1);
});
test('read UTF8 data through authenticated contents endpoint',async()=>{const store=new GitHubStore('owner/data','test',async()=>({ok:true,json:async()=>({type:'file',encoding:'base64',content:encode('Доход'),sha:'s'})}));store.branch='main';assert.deepEqual(await store.read('report.html'),{text:'Доход',sha:'s'});store.close();assert.equal(store.token,'');});
