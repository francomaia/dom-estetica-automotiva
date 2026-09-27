export function normalizePhone(value:string){
  const digits=value.replace(/\D/g,'');
  return (digits.length===12||digits.length===13)&&digits.startsWith('55')?digits.slice(2):digits;
}
export const phonePattern=/^[1-9]\d\d{8,9}$/;
export function validDate(value:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const parsed=new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===value;
}
export function brazilDate(date=new Date()){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const get=(type:string)=>parts.find(p=>p.type===type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function validPreferredTime(date:string,time:string){
  if(!validDate(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))return false;
  const timestamp=new Date(`${date}T${time}:00-03:00`).getTime();
  return timestamp>Date.now()&&timestamp<=Date.now()+180*86400000;
}
