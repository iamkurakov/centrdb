import {GitHubStore} from './github-store.js?v=20261101-2';
let store=null, snapshot=null, reportURL=null, busy=false, generation=0;
const $=id=>document.getElementById(id);
function error(e){$('message').textContent=e.message;}
function clearReport(){if(reportURL)URL.revokeObjectURL(reportURL);reportURL=null;$('report-frame').removeAttribute('src');}
function disconnect(){generation++;store?.close();store=null;snapshot=null;clearReport();$('task-list').replaceChildren();$('academy').replaceChildren();$('identity').textContent='';$('workspace').hidden=true;$('login').hidden=false;$('message').textContent='';}
async function guide(){
 const r=await fetch('./academy.json');if(!r.ok)throw new Error('Не удалось загрузить инструкции');
 const modules=await r.json();$('academy').replaceChildren();
 for(const m of modules){const a=document.createElement('article');for(const [tag,text,cls] of [['div',m.layer,'tag'],['h2',m.title,''],['p',m.goal,'']]){const e=document.createElement(tag);e.textContent=text;e.className=cls;a.append(e);}const list=document.createElement('ol');for(const s of m.steps){const li=document.createElement('li');li.textContent=s;list.append(li);}const p=document.createElement('p');p.textContent='Контроль результата: '+m.measure;p.className='measure';a.append(list,p);$('academy').append(a);}
}
async function tab(name){
 if(name!=='academy'&&!store)return;
 $('message').textContent='';
 for(const id of ['academy','tasks','report'])$(id).hidden=id!==name;
 document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
 try{if(name==='tasks')await tasks();if(name==='report'&&!reportURL){const current=store,run=generation;$('report-loading').textContent='Загрузка отчёта…';const file=await current.read('reports/working-report.html');if(run!==generation)return;reportURL=URL.createObjectURL(new Blob([file.text],{type:'text/html;charset=utf-8'}));$('report-frame').src=reportURL;$('report-loading').textContent='';}}catch(e){$('report-loading').textContent='';error(e);}
}
async function enter(){ $('login').hidden=true;$('workspace').hidden=false;$('tasks-tab').hidden=!store;$('report-tab').hidden=!store;await guide();await tab('academy'); }
async function tasks(){
 const current=store,run=generation;const file=await current.read('workspace.json');if(run!==generation)return;
 const value=JSON.parse(file.text);if(value.schemaVersion!==1||!Array.isArray(value.tasks))throw new Error('Формат workspace.json не поддерживается');
 snapshot={sha:file.sha,value};renderTasks();
}
function renderTasks(){
 $('task-list').replaceChildren();if(!snapshot.value.tasks.length){$('task-list').textContent='Задач пока нет.';return;}
 for(const row of snapshot.value.tasks){const div=document.createElement('div');div.className='task';const title=document.createElement('span');title.textContent=row.title;const select=document.createElement('select');select.setAttribute('aria-label','Статус: '+row.title);for(const [value,text]of [['planned','Запланировано'],['doing','В работе'],['done','Готово']]){const o=document.createElement('option');o.value=value;o.textContent=text;select.append(o);}select.value=row.status;
 select.onchange=async()=>{const status=select.value;try{await mutate(value=>{const task=value.tasks.find(t=>t.id===row.id);if(!task)throw new Error('Задача удалена');task.status=status;task.updatedAt=new Date().toISOString();});}catch(e){select.value=row.status;error(e);}};div.append(title,select);$('task-list').append(div);}
}
async function mutate(change){
 if(busy)throw new Error('Дождитесь завершения сохранения');
 if(!store||!snapshot)throw new Error('Сначала загрузите задачи');
 const current=store,run=generation,next=structuredClone(snapshot.value),sha=snapshot.sha;
 change(next);next.updatedAt=new Date().toISOString();busy=true;$('add-task').disabled=true;
 try{const saved=await current.write('workspace.json',JSON.stringify(next,null,2)+'\n',sha);if(run!==generation)return;snapshot={sha:saved.content.sha,value:next};renderTasks();$('message').textContent='Сохранено в GitHub';}
 finally{busy=false;$('add-task').disabled=false;}
}
$('login-form').onsubmit=async e=>{e.preventDefault();$('message').textContent='';const button=e.submitter;button.disabled=true;const token=$('token').value.trim();$('token').value='';try{const next=new GitHubStore($('repository').value.trim(),token);await next.connect();generation++;store=next;$('identity').textContent=next.repository;await enter();}catch(err){store?.close();store=null;error(err);}finally{button.disabled=false;}};
$('public-guide').onclick=()=>enter().catch(error);
$('logout').onclick=disconnect;
$('refresh').onclick=()=>{if(!busy)tasks().catch(error);};
$('task-form').onsubmit=async e=>{e.preventDefault();const title=$('task-title').value.trim();if(!title)return;try{await mutate(v=>v.tasks.push({id:crypto.randomUUID(),title,status:'planned',updatedAt:new Date().toISOString()}));$('task-title').value='';}catch(err){error(err);}};
 document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
