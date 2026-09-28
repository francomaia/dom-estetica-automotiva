import {cookies} from 'next/headers';
import {isIP} from 'node:net';
import {db,databaseDriver} from './db';
export async function digest(s:string){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');}
export async function isAdmin(){const c=(await cookies()).get('dom_session')?.value;if(!c)return false;return !!await db().prepare('SELECT token FROM sessions WHERE token = ? AND expires > ?').bind(await digest(c),Date.now()).first();}
export function sameOrigin(r:Request){const origin=r.headers.get('origin');if(!origin)return false;if(process.env.APP_ORIGIN){try{return origin===new URL(process.env.APP_ORIGIN).origin;}catch{return false;}}return origin===new URL(r.url).origin;}
export function secureCookie(r:Request){return process.env.NODE_ENV==='production'||new URL(r.url).protocol==='https:';}
export function clientIp(r:Request){
  const candidates=[r.headers.get('cf-connecting-ip'),r.headers.get('x-real-ip'),r.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()];
  return candidates.find(value=>value&&isIP(value))||'local';
}
export async function rateLimit(key:string,max:number,minutes:number){
  const now=Date.now();
  const sql=databaseDriver()==='mysql'?
    'INSERT INTO attempts (`key`,`count`,expires) VALUES (?,1,?) ON DUPLICATE KEY UPDATE `count`=IF(expires < ?,1,`count`+1),expires=IF(expires < ?,VALUES(expires),expires)':
    'INSERT INTO attempts (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires < ? THEN 1 ELSE count+1 END,expires=CASE WHEN expires < ? THEN excluded.expires ELSE expires END';
  await db().prepare(sql).bind(key,now+minutes*60000,now,now).run();
  const result=await db().prepare('SELECT `count` FROM attempts WHERE `key`=?').bind(key).first<{count:number}>();return (result?.count||0)<=max;
}
