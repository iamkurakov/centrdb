import fs from 'node:fs';
export const segments=[
{id:'champions',title:'Высокая активность и ценность',rule:'R3 F3 M3',action:'Поддерживать удобство обслуживания; рекомендации и отзывы — после проверки готовности.'},
{id:'loyal',title:'Недавние повторные оплаты',rule:'R3, F ≥ 2, M ≥ 2, кроме 333',action:'Поддерживать регулярную организационную связь и удобное расписание.'},
{id:'new',title:'Один недавний день с оплатой',rule:'R3 F1, любое M',action:'Проверить, понятен ли следующий шаг. Это первая оплата в выгрузке, не обязательно первый визит за всё время.'},
{id:'active',title:'Остальные недавние оплаты',rule:'Остальные сочетания с R3',action:'Уточнить организационные вопросы и дальнейший согласованный шаг.'},
{id:'attention',title:'Повторные оплаты 31–90 дней назад',rule:'R2, F ≥ 2, M ≥ 2',action:'Проверить текущие записи и причину паузы в оплатах.'},
{id:'cooling',title:'Остальные оплаты 31–90 дней назад',rule:'Остальные сочетания с R2',action:'Уточнить, завершён ли план или нужна организационная помощь.'},
{id:'valuable',title:'Повторные оплаты более 90 дней назад',rule:'R1, F ≥ 2, M ≥ 2',action:'Сначала проверить завершение обращения. Не считать давность оплаты доказательством ухода.'},
{id:'sleeping',title:'Остальные давние оплаты',rule:'Остальные сочетания с R1',action:'Проверить актуальность потребности до любых предложений.'},
{id:'no-payment',title:'Без зарегистрированных оплат',rule:'Нет положительных оплат в выгрузке',action:'Сверить первичные данные. RFM не назначается; нулевая частота не равна редким покупкам.'}
];
export function score(p,at){if(!p.lastPayment||!(p.purchases>0)||!(p.paid>0))return {r:null,f:null,m:null,rfm:null,segment:'no-payment'};
const days=Math.floor((Date.parse(at+'T00:00:00Z')-Date.parse(p.lastPayment+'T00:00:00Z'))/86400000);
if(!Number.isFinite(days)||days<0)throw Error('Invalid payment date');
const r=days<=30?3:days<=90?2:1,f=p.purchases>=5?3:p.purchases>=2?2:1,m=p.net>=30000?3:p.net>=10000?2:1;
const segment=r===3?(f===3&&m===3?'champions':f>=2&&m>=2?'loyal':f===1?'new':'active'):r===2?(f>=2&&m>=2?'attention':'cooling'):(f>=2&&m>=2?'valuable':'sleeping');return {r,f,m,rfm:''+r+f+m,segment};}
export function groups(p,at){const gap=p.lastVisit?Math.floor((Date.parse(at+'T00:00:00Z')-Date.parse(p.lastVisit+'T00:00:00Z'))/86400000):null;const g=[];if(p.consultations>0&&p.training===0)g.push(1);if(gap!==null&&gap>=8&&gap<=30)g.push(2);if(p.packageLeft!==null&&p.packageLeft!==undefined&&p.packageLeft>=0&&p.packageLeft<=2)g.push(3);if(gap!==null&&gap>30)g.push(4);if(gap!==null&&gap<=30){g.push(5,8);if(p.visits>=5)g.push(6,9)}if(p.refund>0)g.push(7);return g.sort((a,b)=>a-b)}
export function prepare(source){const ids=new Set();const full=source.patients.map(p=>{if(!/^\d{5}$/.test(p.id)||ids.has(p.id))throw Error('Invalid or duplicate ID');ids.add(p.id);if(!Number.isFinite(p.net)||!Number.isFinite(p.purchases))throw Error('Missing monetary/frequency input');return {...p,...score(p,source.asOf),groups:groups(p,source.asOf)}});
const sum=(rows,k)=>Math.round(rows.reduce((a,p)=>a+p[k],0)*100)/100;
const summary=segments.map(s=>{const list=full.filter(p=>p.segment===s.id);return {...s,count:list.length,net:sum(list,'net')}});
return {format:'centrdb-coded-base',version:1,asOf:source.asOf,periodStart:'2025-10-01',lastPayment:source.lastPayment,lastVisit:source.lastVisit,method:{r:[30,90],f:[2,5],m:[10000,30000],frequency:'Число разных календарных дней с положительной оплатой; несколько оплат в один день считаются одним днём.',money:'Поступления минус возвраты за период 01.10.2025–21.10.2026.'},totals:{patients:full.length,eligible:full.filter(p=>p.rfm).length,paid:sum(full,'paid'),refund:sum(full,'refund'),net:sum(full,'net')},segments:summary,patients:full.map(p=>({id:p.id,r:p.r,f:p.f,m:p.m,rfm:p.rfm,segment:p.segment,groups:p.groups})).sort((a,b)=>a.id.localeCompare(b.id))};}
if(process.argv[2]){const output=prepare(JSON.parse(fs.readFileSync(process.argv[2],'utf8')));fs.writeFileSync(process.argv[3]||'work/public-demo/coded-base.json',JSON.stringify(output));console.log(JSON.stringify({totals:output.totals,segments:output.segments.map(x=>({id:x.id,count:x.count,net:x.net}))}));}
