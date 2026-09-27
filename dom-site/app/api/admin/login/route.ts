import {env} from 'cloudflare:workers';
import {db} from '@/lib/db';
import {digest,rateLimit,sameOrigin} from '@/lib/auth';
import {readJson,requestFailure} from '@/lib/http';
import {z} from 'zod';
export async function POST(request:Request){
  try{
    if(!sameOrigin(request))return Response.json({error:'Origem inválida.'},{status:403});
    const parsed=z.object({username:z.string().min(1).max(100),password:z.string().min(1).max(200)}).safeParse(await readJson(request,3000));
    if(!parsed.success)return Response.json({error:'Informe usuário e senha.'},{status:400});
    if(!await rateLimit('login:'+(request.headers.get('cf-connecting-ip')||'local'),8,15))return Response.json({error:'Muitas tentativas. Aguarde 15 minutos.'},{status:429});
    const settings=env as unknown as Record<string,string>;
    if(!settings.ADMIN_PASSWORD_HASH)return Response.json({error:'Acesso administrativo ainda não configurado.'},{status:503});
    const hash=await digest(settings.ADMIN_SALT+parsed.data.password);
    let difference=hash.length^settings.ADMIN_PASSWORD_HASH.length;
    for(let i=0;i<hash.length;i++)difference|=hash.charCodeAt(i)^(settings.ADMIN_PASSWORD_HASH.charCodeAt(i)||0);
    if(difference||parsed.data.username!==settings.ADMIN_USERNAME)return Response.json({error:'Usuário ou senha incorretos.'},{status:401});
    const token=crypto.randomUUID()+crypto.randomUUID();
    await db().batch([db().prepare('DELETE FROM sessions WHERE expires <= ?').bind(Date.now()),db().prepare('INSERT INTO sessions (token,expires) VALUES (?,?)').bind(await digest(token),Date.now()+8*3600000)]);
    const cookie='dom_session='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800'+(new URL(request.url).protocol==='https:'?'; Secure':'');
    return Response.json({ok:true},{headers:{'Cache-Control':'no-store','Set-Cookie':cookie}});
  }catch(error){return requestFailure(error,'Não foi possível entrar. Tente novamente.');}
}
