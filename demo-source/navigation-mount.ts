import {navigationMarkup,observeHeader} from './site-navigation';
document.querySelectorAll('[data-site-header]').forEach(node=>{node.outerHTML=navigationMarkup(node.getAttribute('data-site-header')||'')});
observeHeader();
function alignInitialAnchor(){if(!location.hash)return;let id;try{id=decodeURIComponent(location.hash.slice(1))}catch{return}document.getElementById(id)?.scrollIntoView({block:'start'})}
if(document.readyState==='complete')alignInitialAnchor();else addEventListener('load',alignInitialAnchor,{once:true});
