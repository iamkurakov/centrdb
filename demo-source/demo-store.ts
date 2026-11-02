const KEY='centrdb-demonstration-v1';
const uid=()=>globalThis.crypto?.randomUUID?.()||'demo-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
const names=['Анна','Михаил','Елена','Сергей','Ольга','Алексей','Мария','Андрей','Наталья'];
function initial(){return {lastVisit:'2026-10-28',lastPayment:'2026-10-21',feedback:[],logs:[],patients:Array.from({length:36},(_,i)=>{
const id='ДЕМО-'+String(i+1).padStart(3,'0'),g=i%9+1;
return {id,name:`Пример ${names[i%9]} ${String(i+1).padStart(2,'0')}`,phone:`+7 (000) 000-${String(i+1).padStart(4,'0').slice(0,2)}-${String(i+1).padStart(4,'0').slice(2)}`,visits:3+i*2,purchases:1+i%6,net:4000+i*1250,paid:4000+i*1250,refund:0,lastVisit:g===4?'2026-08-12':g===2?'2026-10-18':'2026-10-28',lastPayment:g===4?'2026-08-12':'2026-10-21',groups:[g],days:g===4?82:g===2?15:5,rfm:String(g===4?1:3)+String((1+i%6)>=5?3:(1+i%6)>=2?2:1)+String((4000+i*1250)>=30000?3:(4000+i*1250)>=10000?2:1),work:{},version:0};
})};}
function read(){const raw=localStorage.getItem(KEY);if(!raw)return initial();let d;try{d=JSON.parse(raw)}catch{throw Error('Не удалось прочитать сохранённую демонстрацию. Записи не перезаписаны.')};if(!Array.isArray(d.patients)||!Array.isArray(d.logs)||!Array.isArray(d.feedback))throw Error('Сохранённые данные повреждены. Записи не перезаписаны.');return d;}
function write(d:any){try{localStorage.setItem(KEY,JSON.stringify(d))}catch{throw Error('Браузер не разрешил сохранение. Не закрывайте карточку.') }}
function reply(d:any,status=200){return Response.json(d,{status});}
export async function demoFetch(path:string,options:any={}){
try{const data=read();if(!options.method||options.method==='GET')return reply(data);
const b=JSON.parse(options.body);
if(path==='/api/feedback'){
 if(typeof b.body!=='string'||!b.body.trim()||b.body.length>2000||!Number.isInteger(b.direction)||b.direction<1||b.direction>9)return reply({error:'Проверьте текст замечания'},400);
 data.feedback.unshift({id:uid(),direction:b.direction,actor:'Демонстрационный менеджер',created_at:new Date().toISOString(),body:b.body.trim()});write(data);return reply({ok:true});
}
const p=data.patients.find((p:any)=>p.id===b.id);if(!p)return reply({error:'Карточка не найдена'},404);
if(p.version!==b.version)return reply({error:'Карточку изменили в другой вкладке. Сравните изменения и сохраните снова.'},409);
if(!Number.isInteger(b.direction)||b.direction<1||b.direction>9||!Array.isArray(b.checks)||b.checks.length!==3||!b.owner?.trim())return reply({error:'Проверьте заполненные поля'},400);
const at=new Date().toISOString();const entry={outcome:b.outcome,note:b.note.trim(),reason:b.reason.trim(),nextStep:b.nextStep.trim(),nextDate:b.nextDate,owner:b.owner.trim(),checks:b.checks,verified:b.verified};
p.work={...p.work,doNotContact:b.doNotContact||b.outcome==='Не связываться',verified:b.verified,owner:b.owner,byDirection:{...(p.work.byDirection||{}),[b.direction]:entry},updatedAt:at};p.version++;
data.logs.unshift({id:uid(),patient_id:p.id,direction:b.direction,actor:'Демонстрационный менеджер',created_at:at,...entry});write(data);return reply({ok:true,version:p.version});
}catch(e:any){return reply({error:e.message||'Сохранение не подтверждено'},503)}
}
