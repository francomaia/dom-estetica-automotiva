import {cookies} from 'next/headers';
import {digest,sameOrigin} from '@/lib/auth';
import {db} from '@/lib/db';
import {requestFailure} from '@/lib/http';
export async function POST(request:Request){
  try{
    if(!sameOrigin(request))return Response.json({error:'Origem inválida.'},{status:403});
    const token=(await cookies()).get('dom_session')?.value;
    if(token)await db().prepare('DELETE FROM sessions WHERE token=?').bind(await digest(token)).run();
    const cookie='dom_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'+(new URL(request.url).protocol==='https:'?'; Secure':'');
    return Response.json({ok:true},{headers:{'Cache-Control':'no-store','Set-Cookie':cookie}});
  }catch(error){return requestFailure(error,'Não foi possível encerrar o acesso. Tente novamente.');}
}
