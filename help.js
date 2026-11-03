/* Подсказки только у явно отмеченных сложных расчётов. */
(() => {
  const notes={
    'ltv-forecast':['Почему прогноз может не сбыться','Расчёт предполагает, что доля вернувшихся пациентов останется такой же каждый следующий год. За один год наблюдения это проверить нельзя. Завершённое лечение, переезд и неудобное расписание дают одинаковую паузу в оплатах, но означают разные ситуации. Поэтому прогноз нельзя считать уже полученными деньгами.'],
    'cohort-window':['Пустая клетка — не ноль','Пустая клетка означает, что нужный срок после первого обращения ещё не прошёл. Ноль означал бы, что срок прошёл, но покупок не было. Сравнивайте группы в одном столбце: например, обе через три месяца, а не одну через месяц, другую через полгода.'],
    'sales-chain':['Почему проценты не складываются','Этапы связаны друг с другом. Из 100 новых пациентов при 44% на первый курс придут 44. При переходе на второй курс 47% это около 21 человека, а не 47. Поэтому изменение одного этапа влияет на следующие. Модель не учитывает все возможные причины отказа.'],
    'marketing-payback':['Как считается срок окупаемости','Калькулятор рассматривает людей, привлечённых за один месяц, и их последующие покупки. На каждом сроке предполагаемая выручка умножается на выбранную долю после затрат. Первый срок, когда эта сумма покрывает рекламный бюджет, показывается как сценарная окупаемость. Это не фактическая прибыль центра.']
  };
  const targets=[...document.querySelectorAll('[data-help-key]')].filter(n=>notes[n.dataset.helpKey]);
  if(!targets.length)return;
  const panel=document.createElement('aside');panel.id='cdb-help-panel';panel.className='cdb-help-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-labelledby','cdb-help-title');
  const close=document.createElement('button');close.type='button';close.className='cdb-help-close';close.textContent='×';close.setAttribute('aria-label','Закрыть пояснение');
  const title=document.createElement('h2');title.id='cdb-help-title';const text=document.createElement('p');panel.append(close,title,text);document.body.append(panel);let active;
  function hide(focus=false){panel.hidden=true;if(active){active.setAttribute('aria-expanded','false');if(focus)active.focus()}active=null}
  function show(button,key){if(active===button&&!panel.hidden){hide(true);return}hide();active=button;[title.textContent,text.textContent]=notes[key];panel.hidden=false;button.setAttribute('aria-expanded','true');const r=button.getBoundingClientRect(),p=panel.getBoundingClientRect();panel.style.left=Math.max(12,Math.min(r.left,innerWidth-p.width-12))+'px';panel.style.top=Math.max(12,Math.min(r.bottom+8,innerHeight-p.height-12))+'px';close.focus()}
  for(const target of targets){const button=document.createElement('button');button.type='button';button.className='cdb-help-button';button.textContent='?';button.setAttribute('aria-label',notes[target.dataset.helpKey][0]);button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',panel.id);button.addEventListener('click',()=>show(button,target.dataset.helpKey));target.append(button)}
  close.addEventListener('click',()=>hide(true));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();hide(true)}});document.addEventListener('pointerdown',e=>{if(active&&!panel.contains(e.target)&&e.target!==active)hide()});window.addEventListener('resize',()=>hide());document.addEventListener('scroll',e=>{if(active&&!panel.contains(e.target))hide()},true);
})();
