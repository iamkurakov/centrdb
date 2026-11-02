/* Памятки для одного разговора. Никакой отправки или загрузки базы. */
(() => {
  document.querySelectorAll('.script').forEach(block => {
    const tabs=[...block.querySelectorAll('[role=tab]')];
    const panels=[...block.querySelectorAll('[role=tabpanel]')];
    const status=block.querySelector('.copy-status');
    function choose(index,focus=false){tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;panels[i].hidden=i!==index;});status.textContent='';if(focus)tabs[index].focus();}
    tabs.forEach((tab,index)=>{
      tab.addEventListener('click',()=>choose(index));
      tab.addEventListener('keydown',event=>{let next=index;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();choose(next,true);});
    });
    block.querySelector('[data-copy]').addEventListener('click',async()=>{
      const text=panels.find(panel=>!panel.hidden).querySelector('p').textContent;
      try{await navigator.clipboard.writeText(text);status.textContent='Скопировано. Замените данные в квадратных скобках.';}
      catch{
        const range=document.createRange();range.selectNodeContents(panels.find(panel=>!panel.hidden).querySelector('p'));
        const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
        let copied=false;try{copied=document.execCommand('copy');}catch{}
        if(copied){selection.removeAllRanges();status.textContent='Скопировано. Замените данные в квадратных скобках.';}
        else status.textContent='Текст выделен. Нажмите Ctrl+C, чтобы скопировать.';
      }
    });
  });
  document.querySelectorAll('[data-reset]').forEach(button=>button.addEventListener('click',()=>{button.closest('.conversation-check').querySelectorAll('input[type=checkbox]').forEach(input=>input.checked=false);}));
  function showTarget(){const id=decodeURIComponent(location.hash.slice(1));if(!id)return;const target=document.getElementById(id);if(!target)return;let parent=target.parentElement;while(parent){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}if(target.tagName==='DETAILS')target.open=true;requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));}
  window.addEventListener('hashchange',showTarget);showTarget();
})();
