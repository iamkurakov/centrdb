import {analysisMarkup} from './center-analysis';
document.querySelectorAll('[data-center-analysis]').forEach(node=>{node.innerHTML=analysisMarkup()});
