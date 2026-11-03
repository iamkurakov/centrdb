(()=>{const fmt=(v,d=1)=>v.toLocaleString('ru-RU',{minimumFractionDigits:d,maximumFractionDigits:d});
/* калькулятор выручки */
(function(){
  const FACT=26.628e6, OLDPP=36553, OLDCOURSE=0.76, RETC=16110, LOST=212, CV=1338;
  const C1=20104,C2=18687,C3=17871,C4=16540,K4=1.86;
  /* рычаги: ключ, подпись, единица, ползунок min/max/шаг, допустимый ввод min/max, факт, подсказка */
  const GROUPS=[
    ['Привлечение',[
      ['new','Новых пациентов в месяц','чел.',20,120,1,0,500,47,'Каждый новый приносит ≈ 23 тыс ₽ при текущих показателях'],
      ['cac','Маркетинг на одного нового пациента','₽',1000,15000,100,0,100000,3200,'150 тыс ₽ в месяц / 47 новых']]],
    ['Помочь начать назначенные занятия',[
      ['p1','Покупают курс после консультации','%',20,80,1,0,100,44,'Из всех новых пациентов'],
      ['ex','Доп. услуги на одного нового пациента','₽',2000,15000,100,0,100000,6000,'Консультации, УВТ, массаж, стельки']]],
    ['Переход между курсами',[
      ['p2','Покупают 2-й курс после 1-го','%',20,90,1,0,100,47,''],
      ['p3','Покупают 3-й курс после 2-го','%',20,95,1,0,100,63,''],
      ['p4','Идут на 4-й и далее после 3-го','%',20,95,1,0,100,55,'В среднем 1,86 курса на такого пациента']]],
    ['Возврат и удержание',[
      ['ret','Возвращаем ушедших с курсом (из 212)','%',0,50,1,0,100,0,'Из 212 человек; вернувшийся покупает курс ≈ 16 100 ₽'],
      ['old','Постоянных покупают за год (из 395)','чел.',250,395,1,0,395,373,'Из 395; один приносит ≈ 36 600 ₽ в год']]],
    ['Цена',[
      ['pr','Средний чек курса','%',-20,20,1,-50,50,0,'Меньше скидок — плюс. Отток из-за цены не учтён']]]
  ];
  const CFG={};GROUPS.forEach(g=>g[1].forEach(l=>CFG[l[0]]={lab:l[1],u:l[2],min:l[3],max:l[4],step:l[5],hmin:l[6],hmax:l[7],base:l[8],hint:l[9]}));
  const IDS=Object.keys(CFG);
  const BASE=Object.fromEntries(IDS.map(k=>[k,CFG[k].base]));
  const NAMES={new:'Новые пациенты',p1:'Покупка курса после консультации',ex:'Доп. услуги',p2:'Переход на 2-й курс',p3:'Переход на 3-й курс',p4:'Переход на 4-й и далее',ret:'Возврат ушедших',old:'Постоянные пациенты',pr:'Цена курса'};
  const nf=v=>Math.round(v).toLocaleString('ru-RU');
  const show=(k,v)=>(k==='pr'&&v>0?'+':'')+nf(v);
  const S={...BASE};
  /* разметка рычагов */
  const host=document.getElementById('levers');
  host.innerHTML=GROUPS.map(([t,ls])=>ls.map(l=>{const c=CFG[l[0]];return `
    <div class="lever" id="lv-${l[0]}">
      <div class="lv-top"><label for="n-${l[0]}" title="${t}${c.hint?': '+c.hint:''}">${c.lab}</label><button type="button" class="fact" data-k="${l[0]}" title="Вернуть фактическое значение">факт ${show(l[0],c.base)}${c.u==='%'?'%':''}</button></div>
      <div class="lv-ctrl">
        <div class="num"><input type="text" inputmode="numeric" id="n-${l[0]}" autocomplete="off"><span>${c.u}</span></div>
        <div class="rng"><input type="range" id="m-${l[0]}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.base}" aria-label="${c.lab}"><span class="tick" style="left:${(c.base-c.min)/(c.max-c.min)*100}%"></span></div>
      </div>
    </div>`}).join('')).join('');
  function setVal(k,v,from){
    const c=CFG[k];v=Math.min(c.hmax,Math.max(c.hmin,v));S[k]=v;
    const r=document.getElementById('m-'+k),n=document.getElementById('n-'+k);
    const rv=Math.min(c.max,Math.max(c.min,v));
    if(from!=='range')r.value=rv;
    r.style.setProperty('--p',((rv-c.min)/(c.max-c.min)*100)+'%');
    if(from!=='num')n.value=show(k,v);
    document.getElementById('lv-'+k).classList.toggle('chg',v!==c.base);
  }
  IDS.forEach(k=>{
    const r=document.getElementById('m-'+k),n=document.getElementById('n-'+k);
    r.addEventListener('input',()=>{setVal(k,+r.value,'range');render()});
    n.addEventListener('input',()=>{const v=parseFloat(n.value.replace(/\s/g,'').replace(',','.'));if(!isNaN(v)){setVal(k,v,'num');render()}});
    n.addEventListener('blur',()=>setVal(k,S[k]));
    n.addEventListener('focus',()=>n.select());
    n.addEventListener('keydown',e=>{
      if(e.key==='Enter'){n.blur()}
      if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();const st=CFG[k].step*(e.shiftKey?10:1);setVal(k,S[k]+(e.key==='ArrowUp'?st:-st));render()}
    });
  });
  host.addEventListener('click',e=>{const b=e.target.closest('.fact');if(b){setVal(b.dataset.k,CFG[b.dataset.k].base);render()}});
  const g=()=>({...S});
  function model(s){
    const pf=1+s.pr/100,a=s.p1/100,b=s.p2/100,c=s.p3/100,d=s.p4/100;
    const coursesPer=a*(1+b*(1+c*(1+d*K4)));
    const courseRev=a*(C1+b*(C2+c*(C3+d*K4*C4)))*pf;
    const n=s.new*12;
    const newCourse=n*courseRev, newExtra=n*s.ex;
    const old=s.old*OLDPP*(1-OLDCOURSE+OLDCOURSE*pf);
    const back=LOST*s.ret/100*RETC*pf;
    return {newCourse,newExtra,old,back,sum:newCourse+newExtra+old+back,courses:n*coursesPer+LOST*s.ret/100,mkt:n*s.cac};
  }
  const B0=model(BASE);
  const mln=v=>(v/1e6).toLocaleString('ru-RU',{minimumFractionDigits:1,maximumFractionDigits:1})+' млн ₽';
  const sgn=v=>(v>=0?'+':'−')+mln(Math.abs(v));
  const COLS=[['newCourse','новые: курсы','var(--accent)'],['newExtra','новые: доп. услуги','var(--sand)'],['old','постоянные пациенты','#8FA89A'],['back','вернувшиеся','#7A5A22']];
  function render(){
    const s=g(),M=model(s),delta=M.sum-B0.sum,total=FACT+delta,flat=Math.abs(delta)<5e3;
    const pct=(delta>=0?'+':'−')+Math.abs(delta/FACT*100).toLocaleString('ru-RU',{maximumFractionDigits:1})+'%';
    document.getElementById('r-total').textContent=mln(total);
    const rd=document.getElementById('r-delta');
    rd.textContent=flat?'как сейчас':sgn(delta)+' · '+pct;
    rd.className='pill'+(flat?'':(delta>0?' up':' down'));

    const dc=M.courses-B0.courses,load=dc/CV*100,dm=M.mkt-B0.mkt,net=delta-dm;
    const cls=v=>Math.abs(v)<1?'':(v>0?'up':'down');
    const k=(t,v,sub,c)=>`<div class="kg"><span>${t}</span><b>${v}</b>${sub?`<em class="${c||''}">${sub}</em>`:''}</div>`;
    document.getElementById('r-out').innerHTML=
      k('В среднем в месяц',mln(total/12),flat?'':sgn(delta/12),cls(delta))+
      k('Курсов в год от новых',nf(M.courses),Math.abs(dc)<1?'':(dc>0?'+':'−')+nf(Math.abs(dc)),cls(dc))+
      k('Посещений зала в месяц',Math.abs(dc)<1?'как сейчас':(dc>0?'+':'−')+nf(Math.abs(dc)),Math.abs(load)<.5?'≈ 1 340 по курсам':(load>0?'+':'−')+Math.abs(load).toFixed(0)+'% к текущей нагрузке',load>25?'down':'')+
      k('Прирост за вычетом маркетинга',flat&&Math.abs(dm)<1e3?'—':sgn(net),'маркетинг '+mln(M.mkt)+' в год','');
    const w=document.getElementById('r-warn');
    w.hidden=!(load>25);w.textContent='Нагрузка по курсам растёт больше чем на четверть. Комфортная вместимость зала — 10–12 человек. Длительность пребывания и смены инструкторов не подтверждены. Резерв есть во вторник, четверг, субботу и с 13 до 16.';
  }
  IDS.forEach(k=>setVal(k,BASE[k]));
  document.getElementById('m-reset').addEventListener('click',()=>{IDS.forEach(k=>setVal(k,BASE[k]));render()});
  render();
})();

/* калькулятор */
const LB={1:26.842,2:34.778,3:38.968,6:49.951,9:55.453,12:61.529},LN={1:4.743,2:5.726,3:5.930,6:6.671,9:7.730,12:7.730};
function lvAt(tab,m){const k=[1,2,3,6,9,12];if(m<=1)return tab[1]*m;for(let i=1;i<k.length;i++){if(m<=k[i]){const a=k[i-1],b=k[i];return tab[a]+(tab[b]-tab[a])*(m-a)/(b-a)}}return tab[12]}
const rub=v=>Math.round(v).toLocaleString('ru-RU')+' ₽';
function calc(){
  const g=id=>Math.max(0,parseFloat(document.getElementById(id).value)||0);
  const bud=g('i-budget'),cac=Math.max(1,g('i-cac')),cv=Math.min(100,g('i-conv'))/100,mg=Math.min(100,g('i-margin'))/100;
  const n=bud/cac,buy=n*cv;
  const rev=m=>n*(cv*lvAt(LB,m)+(1-cv)*lvAt(LN,m))*1000;
  let pb=null;for(let m=0.25;m<=12;m+=0.25){if(rev(m)*mg>=bud){pb=m;break}}
  const res=rev(12)*mg-bud;
  const rows=[
    ['Новых пациентов',Math.round(n)+' чел.'],
    ['Из них купят курс',Math.round(buy)+' чел.'],
    ['Выручка в 1-й месяц',rub(rev(1))],
    ['Выручка за 3 месяца',rub(rev(3))],
    ['Выручка за 6 месяцев',rub(rev(6))],
    ['Выручка за 12 месяцев',rub(rev(12)),'big'],
    ['Маржа за 12 месяцев',rub(rev(12)*mg)],
    ['Итог после рекламы, 12 мес.',rub(res),res<0?'neg':'big'],
    ['Сценарная окупаемость',pb===null?'не окупается за год':(pb<=1?'в первый месяц':'≈ '+fmt(pb,1)+' мес.'),pb===null?'neg':''],
    ['Посещений зала на первых курсах','+'+Math.round(buy*12)+' в месяц']
  ];
  document.getElementById('calc-out').innerHTML=rows.map(r=>`<div class="${r[2]||''}"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');
}
['i-budget','i-cac','i-conv','i-margin'].forEach(id=>document.getElementById(id).addEventListener('input',calc));
calc();


})();