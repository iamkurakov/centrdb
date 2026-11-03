(function(){
const NS='http://www.w3.org/2000/svg';
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const C={acc:css('--accent'),sand:css('--sand'),muted:css('--muted'),line:css('--line'),ink:css('--ink')};
function el(t,a,p){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
const fmt=(v,d=1)=>v.toLocaleString('ru-RU',{minimumFractionDigits:d,maximumFractionDigits:d});

/* выручка по месяцам, стек */
(function(){
  const L=['окт','ноя','дек','янв','фев','мар','апр','май','июн','июл','авг','сен','окт*'];
  const Y=['25','','','26','','','','','','','','',''];
  const old=[1.538,1.444,1.322,0.938,1.401,1.169,1.164,0.782,0.786,0.879,0.828,1.385,1.389];
  const nw=[0.526,1.103,0.725,0.923,1.203,1.310,1.368,1.090,0.787,0.961,1.246,1.529,1.143];
  const W=760,H=260,pl=34,pb=40,pt=18,max=3.2,bw=(W-pl)/L.length;
  const s=el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':'Выручка по месяцам'});
  const y=v=>pt+(H-pt-pb)*(1-v/max);
  [0,1,2,3].forEach(t=>{el('line',{x1:pl,x2:W,y1:y(t),y2:y(t),stroke:C.line,'stroke-width':1},s);const tx=el('text',{x:pl-6,y:y(t)+4,'text-anchor':'end'},s);tx.textContent=t});
  const u=el('text',{x:0,y:10},s);u.textContent='млн ₽';
  L.forEach((m,i)=>{
    const x=pl+i*bw+bw*.18,w=bw*.64;
    el('rect',{x,y:y(old[i]),width:w,height:y(0)-y(old[i]),fill:C.sand},s);
    el('rect',{x,y:y(old[i]+nw[i]),width:w,height:y(old[i])-y(old[i]+nw[i]),fill:C.acc},s);
    const v=el('text',{x:x+w/2,y:y(old[i]+nw[i])-5,'text-anchor':'middle',class:'vl'},s);v.textContent=fmt(old[i]+nw[i]);
    const t=el('text',{x:x+w/2,y:H-pb+16,'text-anchor':'middle'},s);t.textContent=m;
    if(Y[i]){const t2=el('text',{x:x+w/2,y:H-pb+30,'text-anchor':'middle'},s);t2.textContent='20'+Y[i]}
  });
  document.getElementById('ch-month').appendChild(s);
})();

function hbars(id,rows,opt={}){
  const box=document.getElementById(id),max=opt.max||Math.max(...rows.map(r=>r[1]));
  rows.forEach(r=>{
    const d=document.createElement('div');d.className='hb';
    d.innerHTML=`<div class="lbl">${r[0]}</div><div class="tr"><div class="fl${r[3]?' s':''}" style="width:${(r[1]/max*100).toFixed(1)}%"></div></div><div class="v">${r[2]}</div>`;
    box.appendChild(d);
  });
}
hbars('hb-cat',[
  ['Курсы кинезитерапии',18.48,'18,5 млн · 63%'],
  ['Абонементы 6–12 мес.',4.12,'4,1 млн · 14%'],
  ['Массаж',1.90,'1,9 млн · 7%',1],
  ['УВТ',1.77,'1,8 млн · 6%',1],
  ['Консультации',1.51,'1,5 млн · 5%',1],
  ['Разовые сеансы',0.53,'0,5 млн · 2%',1],
  ['Стельки',0.43,'0,4 млн · 1%',1],
  ['Товары, книги, прочее',0.44,'0,4 млн · 2%',1]
]);
/* аудитория: доля пациентов vs доля выручки */
(function(){
  const rows=[['35–44',17,18],['45–54',21,27],['55–69',20,23],['70+',8,9],['до 18',8,9],['18–34',15,10],['не указан',13,5]];
  const box=document.getElementById('ta-pair');
  rows.forEach(r=>{const d=document.createElement('div');d.className='pr';
    d.innerHTML=`<div>${r[0]}</div><div class="bars"><div class="bar"><i style="width:${r[1]*1.4}%;background:var(--sand)"></i>${r[1]}% пациентов</div><div class="bar"><i style="width:${r[2]*1.4}%;background:var(--accent)"></i>${r[2]}% выручки</div></div>`;box.appendChild(d)});
})();

/* когорты */
(function(){
  const M=['Окт 2025','Ноя 2025','Дек 2025','Янв 2026','Фев 2026','Мар 2026','Апр 2026','Май 2026','Июн 2026','Июл 2026','Авг 2026','Сен 2026*','Окт 2026*'];
  const N=[56,59,33,44,56,53,54,33,40,37,52,50,32];
  const B=[29,54,27,57,38,34,39,36,40,41,44,48,47];
  const T=[18,32,18,32,14,15,22,15,20,22,33,16,0];
  const R=[1.42,2.00,0.69,1.66,1.13,0.97,1.36,0.64,0.82,0.83,1.15,0.85,0.40];
  const L=[
    [11.5,14.2,16.3,17.9,20.7,21.3,22.5,23.0,23.3,24.1,24.6],
    [18.4,22.3,24.3,27.0,28.9,29.8,30.9,31.6,32.0,32.4],
    [8.5,12.7,14.7,16.5,18.8,19.0,19.0,20.1,20.1],
    [17.5,22.8,27.9,31.4,34.8,35.4,36.8,37.2],
    [10.9,14.5,15.4,16.6,18.5,18.9,19.4],
    [13.3,16.2,16.6,17.0,17.6,17.6],
    [12.9,17.5,18.7,20.5,22.4],
    [12.5,13.2,15.9,16.7],
    [12.2,15.8,17.4],
    [15.2,19.6],
    [14.1],[],[]
  ];
  const RT=[
    [12,14,11,12,5,9,5,4,5,4],[31,15,17,14,5,8,7,5,5],[30,12,15,12,3,0,9,3],[32,25,18,14,5,9,7],[18,11,9,5,4,2],[15,2,4,4,0],[26,7,13,9],[6,9,3],[20,10],[22],[],[],[]
  ];
  const tb=document.getElementById('coh-sum');
  M.forEach((m,i)=>{const tr=document.createElement('tr');
    tr.innerHTML=`<td style="white-space:nowrap">${m}</td><td class="n">${N[i]}</td><td><div class="cbar"><i style="width:${B[i]*1.3}px"></i>${B[i]}%</div></td><td class="n">${T[i]?T[i]+'%':'—'}</td><td class="n">${L[i][0]!=null?fmt(L[i][0])+' тыс':'—'}</td><td class="n">${L[i][5]!=null?fmt(L[i][5])+' тыс':'—'}</td><td class="n">${fmt(R[i],2)} млн</td>`;tb.appendChild(tr)});
  function heat(id,data,from,cols,maxv,dec){
    const t=document.getElementById(id);
    let h='<tr><th>Группа по месяцу прихода</th>'+Array.from({length:cols},(_,k)=>`<th>${k+from}</th>`).join('')+'</tr>';
    data.forEach((row,i)=>{if(!row.length)return;
      h+=`<tr><td>${M[i]}</td>`+Array.from({length:cols},(_,k)=>{const v=row[k];
        if(v==null)return '<td class="h"></td>';
        const a=Math.min(1,v/maxv),bg=`color-mix(in srgb, var(--accent) ${Math.round(8+a*82)}%, var(--paper))`,fg=a>.5?'var(--paper)':'var(--ink)';
        return `<td class="h" style="background:${bg};color:${fg}">${dec?fmt(v):v}</td>`}).join('')+'</tr>'});
    t.innerHTML=h;
  }
  heat('heat-ltv',L,1,11,37,true);
  heat('heat-ret',RT,2,10,32,false);
  /* квартальные кривые */
  const X=[1,2,3,4,6,9],Q=[[13.6,17.1,19.2,21.2,24.1,26.1],[13.6,17.5,19.4,21.0,23.2],[12.6,15.9,17.5]],CL=[C.acc,C.sand,C.muted];
  const W=760,H=230,pl=34,pr=50,pt=14,pb=30,mx=9,my=30;
  const s=el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':'Пациенты, пришедшие в одном квартале'});
  const x=v=>pl+(W-pl-pr)*(v-1)/(mx-1),y=v=>pt+(H-pt-pb)*(1-v/my);
  [0,10,20,30].forEach(t=>{el('line',{x1:pl,x2:W-pr,y1:y(t),y2:y(t),stroke:C.line},s);const tx=el('text',{x:pl-6,y:y(t)+4,'text-anchor':'end'},s);tx.textContent=t});
  const u=el('text',{x:0,y:10},s);u.textContent='тыс ₽';
  X.forEach(v=>{const t=el('text',{x:x(v),y:H-8,'text-anchor':'middle'},s);t.textContent=v+'-й мес.'});
  Q.forEach((d,j)=>{el('polyline',{points:d.map((v,i)=>x(X[i])+','+y(v)).join(' '),fill:'none',stroke:CL[j],'stroke-width':3,'stroke-linejoin':'round'},s);
    d.forEach((v,i)=>el('circle',{cx:x(X[i]),cy:y(v),r:3.5,fill:CL[j]},s));
    const t=el('text',{x:x(X[d.length-1])+8,y:y(d[d.length-1])+4,class:'vl'},s);t.textContent=fmt(d[d.length-1])});
  document.getElementById('ch-q').appendChild(s);
})();
hbars('hb-funnel',[
  ['Новые пациенты',599,'599'],
  ['Купили курс',263,'263 · 44%'],
  ['Второй курс',123,'123 · 47%'],
  ['Третий курс',78,'78 · 63%'],
  ['Четвёртый и далее',43,'43 · 55%']
],{max:599});
hbars('hb-when',[['в день консультации',64,'24%'],['через 1–7 дней',141,'54%'],['через 8–30 дней',42,'16%'],['позже 30 дней',16,'6%',1]]);
hbars('hb-chain',[['1-й цикл',100,'100 из 100'],['2-й цикл',42,'42'],['3-й цикл',31,'31'],['4-й цикл или абонемент',22,'22']],{max:100});
hbars('hb-course',[
  ['Индивидуальные циклы',6.65,'6,6 млн'],
  ['1-й цикл',4.37,'4,4 млн'],
  ['Абонементы 6–12 мес.',4.12,'4,1 млн'],
  ['4-й цикл (поддерживающий)',4.12,'4,1 млн'],
  ['2-й цикл',1.85,'1,9 млн'],
  ['3-й цикл',1.09,'1,1 млн'],
  ['Пакет 1–3 и детские',0.40,'0,4 млн']
]);

function vbars(id,labels,vals,fmtv,hl){
  const W=360,H=200,pt=18,pb=24,max=Math.max(...vals)*1.1,bw=W/labels.length;
  const s=el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img'});
  const y=v=>pt+(H-pt-pb)*(1-v/max);
  el('line',{x1:0,x2:W,y1:y(0),y2:y(0),stroke:C.line},s);
  labels.forEach((l,i)=>{
    const x=i*bw+bw*.15,w=bw*.7,on=hl(vals[i]);
    el('rect',{x,y:y(vals[i]),width:w,height:y(0)-y(vals[i]),fill:on?C.acc:C.sand},s);
    if(fmtv){const v=el('text',{x:x+w/2,y:y(vals[i])-5,'text-anchor':'middle',class:'vl'},s);v.textContent=fmtv(vals[i])}
    const t=el('text',{x:x+w/2,y:H-8,'text-anchor':'middle'},s);t.textContent=l;
  });
  document.getElementById(id).appendChild(s);
}
vbars('ch-wd',['пн','вт','ср','чт','пт','сб'],[84,54,74,47,76,29],v=>v,v=>v>=70);
vbars('ch-hr',['7','8','9','10','11','12','13','14','15','16','17','18','19'],[192,623,543,516,654,464,351,288,300,256,465,460,51],null,v=>v>=450);

const links=[...document.querySelectorAll('nav.toc a[href^="#"]')],map=new Map(links.map(a=>[a.getAttribute('href').slice(1),a]));
const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){links.forEach(a=>a.classList.remove('on'));const a=map.get(e.target.id);if(a){a.classList.add('on')}}})},{rootMargin:'-45% 0px -50% 0px'});
document.querySelectorAll('section[id]').forEach(s=>io.observe(s));
/* высота меню для точного перехода к разделам */
const nav=document.querySelector('nav.toc'),setH=()=>document.documentElement.style.setProperty('--navh',nav.offsetHeight+'px');
setH();addEventListener('resize',setH);
})();
