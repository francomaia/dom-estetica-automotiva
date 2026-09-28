import {db} from '@/lib/db';
import {rateLimit,sameOrigin,clientIp} from '@/lib/auth';
import {services,categories,wa} from '@/lib/catalog';
import {normalizePhone,phonePattern,validPreferredTime} from '@/lib/validation';
import {readJson,requestFailure} from '@/lib/http';
import {notifyNewLead} from '@/lib/push';
import {assessBooking,serviceDuration} from '@/lib/scheduling';
import {after} from 'next/server';
import {z} from 'zod';

const schema=z.object({id:z.string().uuid(),name:z.string().trim().min(2).max(100),phone:z.string().max(25).transform(normalizePhone).refine(v=>phonePattern.test(v)),vehicle:z.string().trim().min(2).max(100),category:z.string().refine(v=>categories.includes(v)),services:z.array(z.string().refine(id=>services.some(s=>s.id===id))).min(1).max(10),date:z.string(),time:z.string(),message:z.string().trim().max(1000),consent:z.literal(true),website:z.string().max(0),autoConfirm:z.boolean().optional()});
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
    const autoBook=value.autoConfirm===true&&serviceDuration(value.services)!==null;
    const save=async(store:Pick<ReturnType<typeof db>,'prepare'>,status:'Novo'|'Confirmado')=>store.prepare('INSERT OR IGNORE INTO leads (id,name,phone,vehicle,category,services,date,time,message,status,notes,created_at,consented_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(value.id,value.name,value.phone,value.vehicle,value.category,proposed.services,value.date,value.time,value.message,status,'',now,now).run();
    let inserted;
    if(autoBook){
      const result=await db().exclusive(async transaction=>{
        if(await transaction.prepare('SELECT id FROM leads WHERE id=?').bind(value.id).first())return {changes:0,assessment:'available' as const};
        const assessment=await assessBooking(transaction,{id:value.id,date:value.date,time:value.time,services:value.services});
        if(assessment!=='available')return {changes:0,assessment};
        const result=await save(transaction,'Confirmado');
        return {changes:result.meta.changes,assessment};
      });
      if(result.assessment==='closed')return Response.json({error:'Esse horário está fora do atendimento da DOM. Escolha outro dia ou horário.',code:'SLOT_UNAVAILABLE'},{status:409});
      if(result.assessment==='occupied')return Response.json({error:'Nesse horário os dois espaços já estão ocupados. Escolha outro horário.',code:'SLOT_UNAVAILABLE'},{status:409});
      inserted={meta:{changes:result.changes}};
    }else inserted=await save(db(),'Novo');
    const saved=await db().prepare('SELECT id,name,phone,vehicle,category,services,date,time,message,status FROM leads WHERE id=?').bind(value.id).first<Stored>();
    if(!saved)throw new Error('Lead persistence failed');
    if(fields.some(key=>saved[key]!==proposed[key]))return Response.json({error:'Este protocolo já foi utilizado. Recarregue a página para um novo pedido.'},{status:409});
    if(inserted.meta.changes===1)after(()=>notifyNewLead(value.id).catch(()=>console.warn('Não foi possível consultar inscrições de notificações.')));
    return reply(saved);
  }catch(error){return requestFailure(error,'Não conseguimos salvar agora. Seus dados continuam no formulário. Tente novamente ou fale pelo WhatsApp.');}
}
