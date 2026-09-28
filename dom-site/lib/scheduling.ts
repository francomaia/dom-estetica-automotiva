import {services} from './catalog';
import {db} from './db';

type Slot={starts:string;ends:string};
type Booking={id:string;date:string;time:string;services:string[]};
type Existing={id:string;date:string;time:string;services:string};
type Store=Pick<ReturnType<typeof db>,'prepare'>;
export type BookingAssessment='available'|'closed'|'occupied'|'unknown-duration';

function addDays(date:string,days:number){const value=new Date(date+'T12:00:00Z');value.setUTCDate(value.getUTCDate()+days);return value.toISOString().slice(0,10);}
function minutes(time:string){const [hour,minute]=time.split(':').map(Number);return hour*60+minute;}
function clock(value:number){return String(Math.floor(value/60)).padStart(2,'0')+':'+String(value%60).padStart(2,'0');}
function closing(date:string){const day=new Date(date+'T12:00:00Z').getUTCDay();return day===0?null:day===6?12*60:18*60;}

function duration(text:string){
  const end=text.split(' a ').at(-1)!.toLowerCase();
  const days=end.match(/(\d+)\s*dias?/);
  if(days)return Number(days[1])*600;
  const hours=end.match(/(\d+)h(?:(\d{1,2}))?/);
  if(hours)return Number(hours[1])*60+Number(hours[2]||0);
  const mins=end.match(/(\d+)min/);
  return mins?Number(mins[1]):null;
}

export function serviceDuration(ids:string[]){
  let total=0;
  for(const id of ids){const service=services.find(item=>item.id===id);if(!service)return null;const amount=duration(service.duration);if(!amount)return null;total+=amount;}
  return total||null;
}

function slots(date:string,time:string,workMinutes:number):Slot[]|null{
  let day=date;let start=minutes(time);let remaining=workMinutes;
  const result:Slot[]=[];
  if(!Number.isFinite(start))return null;
  for(let attempts=0;attempts<90&&remaining>0;attempts++){
    const end=closing(day);
    if(attempts===0&&(!end||start<480||start>=end))return null;
    if(end){
      start=Math.max(480,start);
      const used=Math.min(remaining,end-start);
      if(used>0){result.push({starts:day+'T'+clock(start),ends:day+'T'+clock(start+used)});remaining-=used;}
    }
    day=addDays(day,1);start=480;
  }
  return remaining===0?result:null;
}

export function serviceIdsFromLabels(labels:string[]){return labels.map(label=>services.find(service=>service.name===label)?.id).filter((id):id is string=>Boolean(id));}

export async function assessBooking(store:Store,booking:Booking,fallbackMinutes=0):Promise<BookingAssessment>{
  const workMinutes=serviceDuration(booking.services)||fallbackMinutes;
  if(!workMinutes)return 'unknown-duration';
  const requested=slots(booking.date,booking.time,workMinutes);
  if(!requested)return 'closed';
  const earliest=addDays(booking.date,-90);
  const last=requested.at(-1)!.ends.slice(0,10);
  const rows=await store.prepare("SELECT id,date,time,services FROM leads WHERE status='Confirmado' AND date BETWEEN ? AND ? AND id<>?").bind(earliest,last,booking.id).all();
  const confirmed=(rows.results as Existing[]).flatMap(row=>{
    try{
      const names=JSON.parse(row.services) as string[];
      const ids=serviceIdsFromLabels(names);
      return slots(row.date,row.time,ids.length===names.length?serviceDuration(ids)||600:600)||[];
    }catch{return slots(row.date,row.time,600)||[];}
  });
  for(const candidate of requested){
    const events:{time:string;delta:number}[]=[];
    for(const slot of confirmed){
      if(slot.starts<candidate.ends&&slot.ends>candidate.starts){
        events.push({time:slot.starts<candidate.starts?candidate.starts:slot.starts,delta:1});
        events.push({time:slot.ends>candidate.ends?candidate.ends:slot.ends,delta:-1});
      }
    }
    events.sort((a,b)=>a.time.localeCompare(b.time)||a.delta-b.delta);
    let occupied=0;
    for(const event of events){occupied+=event.delta;if(occupied>=2)return 'occupied';}
  }
  return 'available';
}
