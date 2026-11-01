export function encode(text) {
  const bytes = new TextEncoder().encode(text);
  let binary=''; for (const byte of bytes) binary+=String.fromCharCode(byte);
  return btoa(binary);
}
export function decode(base64) {
  return new TextDecoder().decode(Uint8Array.from(atob(base64.replace(/\s/g,'')), c=>c.charCodeAt(0)));
}
export class GitHubStore {
  constructor(repository, token, request=fetch) {
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error('Укажите репозиторий в формате владелец/имя');
    this.repository=repository; this.token=token; this.request=request;
  }
  async api(path, options={}) {
    const response=await this.request('https://api.github.com/'+path, {...options,cache:'no-store',redirect:'error',headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+this.token,'X-GitHub-Api-Version':'2026-03-10',...(options.headers||{})}});
    if (!response.ok) {
      const error=new Error(response.status===409 || response.status===422 ? 'Данные изменены в другом окне. Обновите список и повторите изменение.' : response.status===401 ? 'Токен недействителен или истёк.' : response.status===404 ? 'Репозиторий или файл недоступен. Проверьте имя и права токена.' : response.status===403 ? 'Недостаточно прав либо достигнут лимит GitHub API.' : 'Ошибка GitHub API: '+response.status);
      error.status=response.status; throw error;
    }
    return response.json();
  }
  async connect() {
    const repo=await this.api('repos/'+this.repository);
    if (!repo.private) throw new Error('Хранилище должно быть закрытым репозиторием.');
    this.branch=repo.default_branch;
    return repo;
  }
  async read(path) {
    const entry=await this.api('repos/'+this.repository+'/contents/'+path.split('/').map(encodeURIComponent).join('/')+'?ref='+encodeURIComponent(this.branch));
    if (entry.type!=='file' || entry.encoding!=='base64') throw new Error('Нужен текстовый файл размером до 1 МБ.');
    return {text:decode(entry.content),sha:entry.sha};
  }
  async write(path,text,sha) {
    return this.api('repos/'+this.repository+'/contents/'+path.split('/').map(encodeURIComponent).join('/'), {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Update CDB workspace',content:encode(text),sha,branch:this.branch})});
  }
  close() {this.token='';}
}
