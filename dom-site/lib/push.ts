import {isIP} from 'node:net';
import webpush from 'web-push';
import {db} from './db';
import {digest} from './auth';

type SavedSubscription={id:string;endpoint:string;p256dh:string;auth:string};

export function pushConfigured(){return Boolean(process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY);}
export function pushPublicKey(){return pushConfigured()?process.env.VAPID_PUBLIC_KEY!:null;}

export function validPushEndpoint(endpoint:string){
  try{
    const url=new URL(endpoint);
    return url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&!isIP(url.hostname)&&url.hostname.includes('.')&&url.hostname!=='localhost';
  }catch{return false;}
}

export async function subscriptionId(endpoint:string){return digest(endpoint);}

export async function notifyNewLead(id:string){
  if(!pushConfigured())return;
  const rows=await db().prepare('SELECT id,endpoint,p256dh,auth FROM push_subscriptions LIMIT 20').all();
  if(!rows.results.length)return;
  const payload=JSON.stringify({title:'DOM • Novo agendamento',body:'Um novo pedido chegou. Abra o painel para conferir.',url:'/painel',tag:'dom-lead-'+id});
  const options={vapidDetails:{subject:'https://domautomotiva.com.br',publicKey:process.env.VAPID_PUBLIC_KEY!,privateKey:process.env.VAPID_PRIVATE_KEY!},TTL:3600,urgency:'high' as const,timeout:6000};
  await Promise.all(rows.results.map(async record=>{
    const row=record as SavedSubscription;
    try{
      await webpush.sendNotification({endpoint:row.endpoint,keys:{p256dh:row.p256dh,auth:row.auth}},payload,options);
    }catch(error){
      const status=typeof error==='object'&&error!==null&&'statusCode' in error?Number(error.statusCode):0;
      if(status===404||status===410)await db().prepare('DELETE FROM push_subscriptions WHERE id=?').bind(row.id).run();
      else console.warn('Falha ao enviar notificação do painel.',status||'sem status');
    }
  }));
}
