import {db} from '@/lib/db';
import {isAdmin,sameOrigin} from '@/lib/auth';
import {statuses} from '@/lib/catalog';
import {validDate} from '@/lib/validation';
import {readJson,requestFailure} from '@/lib/http';
import {z} from 'zod';

export async function GET(request:Request){
  try{
    if(!await isAdmin())return Response.json({error:'Entre para acessar o painel.'},{status:401,headers:{'Cache-Control':'no-store'}});
    const params=new URL(request.url).searchParams;
    const query=z.object({page:z.coerce.number().int().min(1).max(100000).default(1),q:z.string().max(100).default(''),status:z.enum(['Todos',...statuses]).default('Todos'),view:z.enum(['leads','agenda']).default('leads')}).safeParse(Object.fromEntries(params));
    if(!query.success)return Response.json({error:'Filtro inválido.'},{status:400});
    const conditions:string[]=[];const args:(string|number)[]=[];const {q,status,view}=query.data;
    if(q){conditions.push("(name LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\' OR vehicle LIKE ? ESCAPE '\\' OR services LIKE ? ESCAPE '\\')");const pattern='%'+q.replace(/[\\%_]/g,'\\$&')+'%';args.push(pattern,pattern,pattern,pattern);}
    if(status!=='Todos'){conditions.push('status=?');args.push(status);}
    if(view==='agenda')conditions.push("status NOT IN ('Cancelado','Concluído')");
    const where=conditions.length?' WHERE '+conditions.join(' AND '):'';
    const counts=await db().batch([
      db().prepare('SELECT count(*) AS count FROM leads'+where).bind(...args),
      db().prepare("SELECT count(*) AS total,coalesce(sum(status='Novo'),0) AS new,coalesce(sum(status='Confirmado'),0) AS confirmed,coalesce(sum(status='Concluído'),0) AS done FROM leads"),
    ]);
    const total=Number((counts[0].results[0] as {count:number}).count);const pageSize=50;const pages=Math.max(1,Math.ceil(total/pageSize));const page=Math.min(query.data.page,pages);
    const order=view==='agenda'?'date ASC,time ASC,id ASC':'created_at DESC,id DESC';
    const rows=await db().prepare('SELECT * FROM leads'+where+' ORDER BY '+order+' LIMIT ? OFFSET ?').bind(...args,pageSize,(page-1)*pageSize).all();
    return Response.json({leads:rows.results,total,page,pageSize,pages,summary:counts[1].results[0]},{headers:{'Cache-Control':'no-store'}});
  }catch(error){return requestFailure(error,'Não foi possível carregar os leads.');}
}
export async function PATCH(request:Request){
  try{
    if(!sameOrigin(request)||!await isAdmin())return Response.json({error:'Entre para atualizar o atendimento.'},{status:403});
    const parsed=z.object({id:z.string().uuid(),status:z.enum(statuses),notes:z.string().max(5000),date:z.string().refine(validDate),time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)}).safeParse(await readJson(request,12000));
    if(!parsed.success)return Response.json({error:'Confira os dados, a data e o horário.'},{status:400});
    const value=parsed.data;
    const result=await db().prepare('UPDATE leads SET status=?,notes=?,date=?,time=? WHERE id=?').bind(value.status,value.notes,value.date,value.time,value.id).run();
    if(!result.meta.changes)return Response.json({error:'Lead não encontrado.'},{status:404});
    return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  }catch(error){return requestFailure(error,'Não foi possível salvar as alterações.');}
}
