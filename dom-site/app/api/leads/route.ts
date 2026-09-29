import {db} from '@/lib/db';
import {rateLimit,sameOrigin,clientIp} from '@/lib/auth';
import {services,categories,wa} from '@/lib/catalog';
import {normalizePhone,phonePattern,validPreferredTime} from '@/lib/validation';
import {readJson,requestFailure} from '@/lib/http';
import {notifyNewLead} from '@/lib/push';
import {after} from 'next/server';
import {z} from 'zod';

const schema=z.object({id:z.string().uuid(),name:z.string().trim().min(2).max(100),phone:z.string().max(25).transform(normalizePhone).refine(v=>phonePattern.test(v)),vehicle:z.string().trim().min(2).max(100),category:z.string().refine(v=>categories.includes(v)),services:z.array(z.string().refine(id=>services.some(s=>s.id===id))).min(1).max(10),date:z.string(),time:z.string(),message:z.string().trim().max(1000),consent:z.literal(true),website:z.string().max(0)});
type Stored={id:string;name:string;phone:string;vehicle:string;category:string;services:string;date:string;time:string;message:string;status:string};
function reply(lead:Stored){
  const labels=JSON.parse(lead.services) as string[];
  const text=`Olá, DOM! Gostaria de solicitar um agendamento.\n\nNome: ${lead.name}\nWhatsApp: ${lead.phone}\nVeículo: ${lead.vehicle} (${lead.category})\nServiços: ${labels.join(', ')}\nPreferência: ${lead.date.split('-').reverse().join('/')} às ${lead.time}\n${lead.message?'Observações: '+lead.message+'\n':''}\nProtocolo: ${lead.id.slice(0,8).toUpperCase()}\nAguardo confirmação de disponibilidade e valores.`;
  return Response.json({id:lead.id,url:wa(text),status:lead.status},{headers:{'Cache-Control':'no-store'}});
}
export async function POST(request:Request){
  try{
    if(!sameOrigin(request))return Response.json({error:'Origem inválida.'},{status:403});
    const parsed=schema.safeParse(await readJson(request));
    if(!parsed.success)return Response.json({error:'Confira seus dados, o WhatsApp com DDD e os serviços selecionados.'},{status:400});
    const value=parsed.data;
    const labels=[...new Set(value.services)].map(id=>services.find(s=>s.id===id)!.name);
    const proposed:Stored={...value,services:JSON.stringify(labels),status:'Novo'};
    const existing=await db().prepare('SELECT id,name,phone,vehicle,category,services,date,time,message,status FROM leads WHERE id=?').bind(value.id).first<Stored>();
    const fields=['name','phone','vehicle','category','services','date','time','message'] as const;
    if(existing){
      if(fields.some(key=>existing[key]!==proposed[key]))return Response.json({error:'Este protocolo já pertence a outra solicitação. Recarregue a página para enviar um novo pedido.'},{status:409});
      return reply(existing);
    }
    if(!validPreferredTime(value.date,value.time))return Response.json({error:'Escolha uma data válida e futura, nos próximos 180 dias.'},{status:400});
    if(!await rateLimit('lead:'+clientIp(request),12,60))return Response.json({error:'Muitas solicitações. Fale diretamente pelo WhatsApp.'},{status:429});
    const now=new Date().toISOString();
    const inserted=await db().prepare('INSERT OR IGNORE INTO leads (id,name,phone,vehicle,category,services,date,time,message,status,notes,created_at,consented_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(value.id,value.name,value.phone,value.vehicle,value.category,proposed.services,value.date,value.time,value.message,'Novo','',now,now).run();
    const saved=await db().prepare('SELECT id,name,phone,vehicle,category,services,date,time,message,status FROM leads WHERE id=?').bind(value.id).first<Stored>();
    if(!saved)throw new Error('Lead persistence failed');
    if(fields.some(key=>saved[key]!==proposed[key]))return Response.json({error:'Este protocolo já foi utilizado. Recarregue a página para um novo pedido.'},{status:409});
    if(inserted.meta.changes===1)after(()=>notifyNewLead(value.id).catch(()=>console.warn('Não foi possível consultar inscrições de notificações.')));
    return reply(saved);
  }catch(error){return requestFailure(error,'Não conseguimos salvar agora. Seus dados continuam no formulário. Tente novamente ou fale pelo WhatsApp.');}
}
