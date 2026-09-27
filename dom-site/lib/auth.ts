import {cookies} from 'next/headers';
import {db} from './db';
export async function digest(s:string){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');}
export async function isAdmin(){const c=(await cookies()).get('dom_session')?.value;if(!c)return false;return !!await db().prepare('SELECT token FROM sessions WHERE token = ? AND expires > ?').bind(await digest(c),Date.now()).first();}
export function sameOrigin(r:Request){const o=r.headers.get('origin');return !!o&&o===new URL(r.url).origin;}
export async function rateLimit(key:string,max:number,minutes:number){const now=Date.now();await db().prepare('INSERT INTO attempts (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires < ? THEN 1 ELSE count+1 END, expires=CASE WHEN expires < ? THEN excluded.expires ELSE expires END').bind(key,now+minutes*60000,now,now).run();const r=await db().prepare('SELECT count FROM attempts WHERE key=?').bind(key).first<{count:number}>();return (r?.count||0)<=max;}
