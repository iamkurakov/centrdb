'use strict';
let me = null;
const $ = id => document.getElementById(id);
const names = {director:'Руководитель',administrator:'Администратор',manager:'Менеджер',contractor:'Подрядчик'};
async function api(path, body) {
  const options = body === undefined ? {} : {method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':me?.csrf || ''},body:JSON.stringify(body)};
  const res = await fetch('/api/'+path, options);
  const data = await res.json();
  if (!res.ok) { if (res.status === 401 && path !== 'login') signedOut(); throw new Error(data.error || 'Ошибка запроса'); }
  return data;
}
function error(e) { $('message').textContent=e.message; }
function signedOut() {me=null;$('workspace').hidden=true;$('login').hidden=false;$('identity').textContent='';$('report-frame').removeAttribute('src');$('academy').replaceChildren();$('task-list').replaceChildren();}
function tab(name) {
  for (const id of ['academy','tasks','report']) $(id).hidden=id!==name;
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
  if (name==='report' && me?.role==='director') $('report-frame').src='/api/report';
}
async function enter() {
  $('login').hidden=true;$('workspace').hidden=false;$('identity').textContent=me.login+' · '+names[me.role];
  $('report-tab').hidden=me.role!=='director';$('message').textContent='';
  const modules=await api('academy');$('academy').replaceChildren();
  for (const m of modules) {
    const a=document.createElement('article');
    for(const [tag,text,cls] of [['div',m.layer,'tag'],['h2',m.title,''],['p',m.goal,'']]) {const el=document.createElement(tag);el.textContent=text;el.className=cls;a.append(el);}
    const list=document.createElement('ol');m.steps.forEach(s=>{const li=document.createElement('li');li.textContent=s;list.append(li);});a.append(list);
    const p=document.createElement('p');p.className='measure';p.textContent='Контроль результата: '+m.measure;a.append(p);$('academy').append(a);
  }
  await tasks();tab('academy');
}
async function tasks() {
  const rows=await api('tasks');$('task-list').replaceChildren();
  if(!rows.length){$('task-list').textContent='Задач пока нет.';return;}
  for(const row of rows){
    const div=document.createElement('div');div.className='task';const title=document.createElement('span');title.textContent=row.title;
    const select=document.createElement('select');select.setAttribute('aria-label','Статус: '+row.title);
    for(const [value,text] of [['planned','Запланировано'],['doing','В работе'],['done','Готово']]){const o=document.createElement('option');o.value=value;o.textContent=text;select.append(o);}select.value=row.status;
    select.onchange=async()=>{try{await api('tasks',{...row,status:select.value});$('message').textContent='';}catch(e){select.value=row.status;error(e);}};
    div.append(title,select);$('task-list').append(div);
  }
}
$('login-form').onsubmit=async e=>{e.preventDefault();try{me=await api('login',{login:$('login-name').value.trim(),password:$('password').value});$('password').value='';await enter();}catch(err){error(err);}};
$('logout').onclick=async()=>{try{await api('logout',{});signedOut();}catch(e){error(e);}};
$('task-form').onsubmit=async e=>{e.preventDefault();try{await api('tasks',{title:$('task-title').value});$('task-title').value='';await tasks();$('message').textContent='';}catch(err){error(err);}};
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
(async()=>{try{me=await api('me');await enter();}catch(e){if(me)error(e);}})();
