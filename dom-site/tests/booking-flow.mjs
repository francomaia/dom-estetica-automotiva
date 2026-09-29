import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';

const base='http://localhost:5180';
const database=new DatabaseSync('.data/dom.sqlite');
const ids=[];
const ip='192.0.2.99';
const headers={'Origin':process.env.DOM_TEST_ORIGIN||base,'Content-Type':'application/json','X-Real-IP':ip};
const post=(url,data,extra={})=>fetch(base+url,{method:'POST',headers:{...headers,...extra},body:JSON.stringify(data)});
const patch=(url,data,cookie)=>fetch(base+url,{method:'PATCH',headers:{...headers,Cookie:cookie},body:JSON.stringify(data)});
try{
  let date='';
  for(let offset=70;offset<120;offset++){
    const candidate=new Date(Date.now()+offset*86400000).toISOString().slice(0,10);
    if(new Date(candidate+'T12:00:00Z').getUTCDay()===1&&!database.prepare("SELECT id FROM leads WHERE date=? AND status='Confirmado'").get(candidate)){date=candidate;break;}
  }
  assert.ok(date,'No free Monday found for test');
  const make=(service='manutencao',time='09:00',autoConfirm=true)=>{
    const id=crypto.randomUUID();ids.push(id);
    return {id,name:'TESTE RESERVA DOM',phone:'64999990000',vehicle:'Carro de teste',category:'Compacto',services:[service],date,time,message:'Teste automático',consent:true,website:'',autoConfirm};
  };
  const first=make();const second=make();const third=make();
  const one=await post('/api/leads',first);assert.equal(one.status,200,await one.text());
  const two=await post('/api/leads',second);assert.equal(two.status,200,await two.text());
  assert.equal(database.prepare('SELECT status FROM leads WHERE id=?').get(first.id).status,'Confirmado');
  assert.equal(database.prepare('SELECT status FROM leads WHERE id=?').get(second.id).status,'Confirmado');
  const three=await post('/api/leads',third);assert.equal(three.status,409);assert.equal((await three.json()).code,'SLOT_UNAVAILABLE');
  assert.equal(database.prepare('SELECT id FROM leads WHERE id=?').get(third.id),undefined);
  const adjacent=make('manutencao','12:30');
  assert.equal((await post('/api/leads',adjacent)).status,200);
  const unknown=make('funilaria','14:00');
  assert.equal((await post('/api/leads',unknown)).status,200);
  assert.equal(database.prepare('SELECT status FROM leads WHERE id=?').get(unknown.id).status,'Novo');
  const sunday=new Date(date+'T12:00:00Z');sunday.setUTCDate(sunday.getUTCDate()+6);
  const closed=make('manutencao','09:00');closed.date=sunday.toISOString().slice(0,10);
  assert.equal((await post('/api/leads',closed)).status,409);
  const friday=new Date(date+'T12:00:00Z');friday.setUTCDate(friday.getUTCDate()+4);
  const nextMonday=new Date(date+'T12:00:00Z');nextMonday.setUTCDate(nextMonday.getUTCDate()+7);
  const longDate=friday.toISOString().slice(0,10);
  const longA=make('polimento','17:00');longA.date=longDate;
  const longB=make('polimento','17:00');longB.date=longDate;
  assert.equal((await post('/api/leads',longA)).status,200);
  assert.equal((await post('/api/leads',longB)).status,200);
  const mondayCandidate=make('manutencao','09:00');mondayCandidate.date=nextMonday.toISOString().slice(0,10);
  assert.equal((await post('/api/leads',mondayCandidate)).status,409,'Friday work must occupy Monday after Saturday and Sunday');
  const key=process.env.ADMIN_TEST_PASSWORD||readFileSync('../ACESSO-PAINEL-DOM.txt','utf8').match(/Senha: (.+)/)?.[1];
  assert.ok(key,'Set ADMIN_TEST_PASSWORD to run the admin checks');
  const login=await post('/api/admin/login',{username:'dom',password:key});assert.equal(login.status,200);
  const cookie=login.headers.get('set-cookie').split(';')[0];
  const manual=make('manutencao','09:00',false);
  assert.equal((await post('/api/leads',manual)).status,200);
  const update={id:manual.id,status:'Confirmado',notes:'',date,time:'09:00'};
  assert.equal((await patch('/api/admin/leads',update,cookie)).status,409);
  assert.equal((await patch('/api/admin/leads',{...update,id:second.id,status:'Cancelado'},cookie)).status,200);
  assert.equal((await patch('/api/admin/leads',update,cookie)).status,200);
  const push=await fetch(base+'/api/admin/push',{headers:{Cookie:cookie}});const config=await push.json();
  assert.equal(push.status,200);assert.equal(config.configured,true);assert.ok(config.publicKey.length>50);
  const endpoint='https://example.com/push/dom-test-'+crypto.randomUUID();
  const subscription={endpoint,keys:{p256dh:'A'.repeat(50),auth:'B'.repeat(22)}};
  const register=await post('/api/admin/push',subscription,{Cookie:cookie});assert.equal(register.status,200,await register.text());
  const remove=await fetch(base+'/api/admin/push',{method:'DELETE',headers:{...headers,Cookie:cookie},body:JSON.stringify({endpoint})});assert.equal(remove.status,200);
  for(const resource of ['/painel-admin.webmanifest','/admin-sw.js','/admin-icon-180.png','/admin-icon-192.png','/admin-icon-512.png','/assets/dom-assistente-chibi.webp'])assert.equal((await fetch(base+resource)).status,200,resource);
  assert.equal((await (await fetch(base+'/api/voice-booking')).json()).available,true);
  const badOrigin=await post('/api/admin/login',{username:'x',password:'x'},{Origin:'https://malicious.example','X-Real-IP':'192.0.2.100'});assert.equal(badOrigin.status,403);
  for(const origin of ['https://domautomotiva.com.br','https://www.domautomotiva.com.br']){
    const allowed=await post('/api/admin/login',{username:'x',password:'x'},{Origin:origin,'X-Real-IP':'192.0.2.100'});
    assert.equal(allowed.status,401,origin);
  }
  console.log('PASS: reserva de dois carros, duração, conflito, horário adjacente, avaliação manual, alteração no painel, inscrição push, PWA, mascote e origem DOM.');
}finally{
  for(const id of ids)database.prepare('DELETE FROM leads WHERE id=?').run(id);
  database.prepare('DELETE FROM attempts WHERE key IN (?,?)').run('lead:'+ip,'login:'+ip);
  database.close();
}
