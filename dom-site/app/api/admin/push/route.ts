import {isAdmin,sameOrigin} from '@/lib/auth';
import {db} from '@/lib/db';
import {pushConfigured,pushPublicKey,subscriptionId,validPushEndpoint} from '@/lib/push';
import {readJson,requestFailure} from '@/lib/http';
import {z} from 'zod';

const endpoint=z.string().min(20).max(2048).refine(validPushEndpoint);
const subscription=z.object({endpoint,keys:z.object({p256dh:z.string().regex(/^[A-Za-z0-9_-]+$/).min(40).max(256),auth:z.string().regex(/^[A-Za-z0-9_-]+$/).min(16).max(128)})});

export async function GET(){
  try{
    if(!await isAdmin())return Response.json({error:'Entre no painel para configurar avisos.'},{status:401});
    const count=await db().prepare('SELECT count(*) AS total FROM push_subscriptions').first<{total:number}>();
    return Response.json({configured:pushConfigured(),publicKey:pushPublicKey(),devices:Number(count?.total||0)},{headers:{'Cache-Control':'no-store'}});
  }catch(error){return requestFailure(error,'Não foi possível consultar as notificações.');}
}

export async function POST(request:Request){
  try{
    if(!sameOrigin(request)||!await isAdmin())return Response.json({error:'Entre no painel para ativar avisos.'},{status:403});
    if(!pushConfigured())return Response.json({error:'As notificações ainda não estão disponíveis.'},{status:503});
    const parsed=subscription.safeParse(await readJson(request,12000));
    if(!parsed.success)return Response.json({error:'Inscrição de notificações inválida.'},{status:400});
    const {endpoint,keys}=parsed.data;const id=await subscriptionId(endpoint);
    const existing=await db().prepare('SELECT id FROM push_subscriptions WHERE id=?').bind(id).first();
    if(!existing){
      const total=await db().prepare('SELECT count(*) AS total FROM push_subscriptions').first<{total:number}>();
      if(Number(total?.total||0)>=20)return Response.json({error:'Limite de aparelhos atingido. Desative um aparelho antigo.'},{status:429});
    }
    const now=new Date().toISOString();
    await db().prepare('INSERT OR IGNORE INTO push_subscriptions (id,endpoint,p256dh,auth,created_at) VALUES (?,?,?,?,?)').bind(id,endpoint,keys.p256dh,keys.auth,now).run();
    await db().prepare('UPDATE push_subscriptions SET endpoint=?,p256dh=?,auth=?,created_at=? WHERE id=?').bind(endpoint,keys.p256dh,keys.auth,now,id).run();
    return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  }catch(error){return requestFailure(error,'Não foi possível ativar avisos neste aparelho.');}
}

export async function DELETE(request:Request){
  try{
    if(!sameOrigin(request)||!await isAdmin())return Response.json({error:'Entre no painel para desativar avisos.'},{status:403});
    const parsed=z.object({endpoint}).safeParse(await readJson(request,3000));
    if(!parsed.success)return Response.json({error:'Inscrição inválida.'},{status:400});
    await db().prepare('DELETE FROM push_subscriptions WHERE id=?').bind(await subscriptionId(parsed.data.endpoint)).run();
    return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  }catch(error){return requestFailure(error,'Não foi possível desativar avisos neste aparelho.');}
}
