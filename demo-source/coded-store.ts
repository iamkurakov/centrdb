import base from './coded-base.json';import {CloudClient} from './cloud-client';import {SharedCloud} from './shared-core';import {unseal} from './cloud-crypto';import type {Access} from './cloud-crypto';import {legacyRecords} from './legacy-import';
export {base};
const SESSION='centrdb-team-session-v1',CAPSULE='centrdb-personal-capsule-v1';let active:SharedCloud|null=null;let migrationMessage='';
export function actor(){return active?.actor||null}
export function cloud(){if(!active)throw Error('Для общей работы войдите по именной ссылке и паролю');return active}
export function capsule(){const fromUrl=new URLSearchParams(location.hash.slice(1)).get('access');if(fromUrl){localStorage.setItem(CAPSULE,fromUrl);return fromUrl}return localStorage.getItem(CAPSULE)||''}
export function currentAccess():Access|null{if(!active)return null;return {token:active.client.token,actor:active.actor}}
async function attach(access:Access,remember:boolean,encrypted=''){const client=await new CloudClient(access.token).connect(),next=new SharedCloud(client,access.actor,base);try{await next.snapshot();active?.close();active=next;if(remember)sessionStorage.setItem(SESSION,JSON.stringify({...access,capsule:encrypted}));else sessionStorage.removeItem(SESSION);const old=await legacyRecords().catch(()=>null);migrationMessage='';if(old){try{const result=await next.importLegacy(old,old.sourceId);migrationMessage='Прежние записи: перенесено '+result.imported+' карточек'+(result.conflicts.length?'; общая версия уже существует для '+result.conflicts.length+' ID. Локальные записи сохранены для сверки.':'.')}catch{migrationMessage='Общая работа подключена. Прежние локальные записи пока не перенесены; они сохранены на этом устройстве.'}}return next.actor}catch(e){next.close();throw e}}
export async function signIn(password:string,remember:boolean){const c=capsule();if(!c)throw Error('Нужна именная ссылка, которую выдаёт руководитель');const value=await unseal(c,password);return attach(value,remember,c)}
export async function restoreSession(){let value:any;try{value=JSON.parse(sessionStorage.getItem(SESSION)||'null')}catch{sessionStorage.removeItem(SESSION)}if(!value?.token||!value.actor)return null;const c=capsule();if(new URLSearchParams(location.hash.slice(1)).get('access')&&value.capsule!==c){sessionStorage.removeItem(SESSION);return null}return attach(value,true,value.capsule||'')}
export function signOut(){active?.close();active=null;sessionStorage.removeItem(SESSION);migrationMessage=''}
export function migrationStatus(){return migrationMessage}
export async function snapshot(){if(!active)return {storage:'readonly',actor:null,scripts:{},patients:base.patients.map(p=>({...p,work:{},version:0,assignment:null,nextAllowedAt:null})),contacts:[],feedback:[],events:[],managers:[]};return active.snapshot()}
export async function save(id:string,direction:number,version:number,entry:any){return (await cloud().save(id,direction,version,entry)).version}
export async function saveFeedback(direction:number,body:string,owner?:string){return cloud().feedback(direction,body)}
export const claim=(id:string)=>cloud().claim(id);export const release=(id:string)=>cloud().release(id);export const claimBatch=(direction:number,count=20)=>cloud().claimBatch(direction,count);export const transfer=(id:string,target:string)=>cloud().transfer(id,target);

export const saveScript=(direction:number,variant:number,version:number,text:string)=>cloud().saveScript(direction,variant,version,text);
