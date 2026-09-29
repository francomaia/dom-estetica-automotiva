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
  const make=(service='manutencao',time='09:00')=>{
    const id=crypto.randomUUID();ids.push(id);
    return {id,name:'TESTE RESERVA DOM',phone:'64999990000',vehicle:'Carro de teste',category:'Compacto',services:[service],date,time,message:'Teste automático',consent:true,website:''};
  };
  const key=process.env.ADMIN_TEST_PASSWORD||readFileSync('../ACESSO-PAINEL-DOM.txt','utf8').match(/Senha: (.+)/)?.[1];
  assert.ok(key,'Set ADMIN_TEST_PASSWORD to run the admin checks');
  const login=await post('/api/admin/login',{username:'dom',password:key});assert.equal(login.status,200);
  const cookie=login.headers.get('set-cookie').split(';')[0];
  const confirm=async lead=>patch('/api/admin/leads',{id:lead.id,status:'Confirmado',notes:'',date:lead.date,time:lead.time},cookie);

  const first=make();
  const publicSave=await post('/api/leads',{...first,autoConfirm:true});
  assert.equal(publicSave.status,200,await publicSave.text());
  assert.equal(database.prepare('SELECT status FROM leads WHERE id=?').get(first.id).status,'Novo','A public request cannot confirm itself');
  assert.equal((await confirm(first)).status,200);
  const second=make();assert.equal((await post('/api/leads',second)).status,200);assert.equal((await confirm(second)).status,200);
  const third=make();assert.equal((await post('/api/leads',third)).status,200);
  assert.equal((await confirm(third)).status,409,'The team cannot exceed two simultaneous cars');
  assert.equal(database.prepare('SELECT status FROM leads WHERE id=?').get(third.id).status,'Novo');
  const adjacent=make('manutencao','12:30');assert.equal((await post('/api/leads',adjacent)).status,200);assert.equal((await confirm(adjacent)).status,200);
  const unknown=make('funilaria','14:00');assert.equal((await post('/api/leads',unknown)).status,200);
  assert.equal(database.prepare('SELECT status FROM leads WHERE id=?').get(unknown.id).status,'Novo');

  const sunday=new Date(date+'T12:00:00Z');sunday.setUTCDate(sunday.getUTCDate()+6);
  const closed=make();closed.date=sunday.toISOString().slice(0,10);
  assert.equal((await post('/api/leads',closed)).status,200);
  assert.equal((await confirm(closed)).status,409,'The admin schedule rejects closed hours');
  const friday=new Date(date+'T12:00:00Z');friday.setUTCDate(friday.getUTCDate()+4);
  const nextMonday=new Date(date+'T12:00:00Z');nextMonday.setUTCDate(nextMonday.getUTCDate()+7);
  const longA=make('polimento','17:00');longA.date=friday.toISOString().slice(0,10);
  const longB=make('polimento','17:00');longB.date=longA.date;
  for(const lead of [longA,longB]){assert.equal((await post('/api/leads',lead)).status,200);assert.equal((await confirm(lead)).status,200);}
  const mondayCandidate=make();mondayCandidate.date=nextMonday.toISOString().slice(0,10);
  assert.equal((await post('/api/leads',mondayCandidate)).status,200);
  assert.equal((await confirm(mondayCandidate)).status,409,'Friday work occupies Monday after the weekend');

  const push=await fetch(base+'/api/admin/push',{headers:{Cookie:cookie}});const config=await push.json();
  assert.equal(push.status,200);assert.equal(config.configured,true);assert.ok(config.publicKey.length>50);
  const endpoint='https://example.com/push/dom-test-'+crypto.randomUUID();
  const subscription={endpoint,keys:{p256dh:'A'.repeat(50),auth:'B'.repeat(22)}};
  const register=await post('/api/admin/push',subscription,{Cookie:cookie});assert.equal(register.status,200,await register.text());
  const remove=await fetch(base+'/api/admin/push',{method:'DELETE',headers:{...headers,Cookie:cookie},body:JSON.stringify({endpoint})});assert.equal(remove.status,200);
  for(const resource of ['/painel-admin.webmanifest','/admin-sw.js','/admin-icon-180.png','/admin-icon-192.png','/admin-icon-512.png'])assert.equal((await fetch(base+resource)).status,200,resource);
  assert.equal((await fetch(base+'/api/voice-booking')).status,404,'The voice API is gone');
  assert.equal((await fetch(base+'/assets/dom-assistente-chibi.webp')).status,404,'The character asset is gone');
  const homepage=await (await fetch(base)).text();assert.ok(!homepage.includes('Agendar por voz com o assistente DOM'));
  const badOrigin=await post('/api/admin/login',{username:'x',password:'x'},{Origin:'https://malicious.example','X-Real-IP':'192.0.2.100'});assert.equal(badOrigin.status,403);
  for(const origin of ['https://domautomotiva.com.br','https://www.domautomotiva.com.br']){
    const allowed=await post('/api/admin/login',{username:'x',password:'x'},{Origin:origin,'X-Real-IP':'192.0.2.100'});
    assert.equal(allowed.status,401,origin);
  }
  console.log('PASS: formulário envia pedidos pendentes, confirmação só no painel, capacidade/duração, PWA, push, origem DOM e remoção total do assistente.');
}finally{
  for(const id of ids)database.prepare('DELETE FROM leads WHERE id=?').run(id);
  database.prepare('DELETE FROM attempts WHERE key IN (?,?)').run('lead:'+ip,'login:'+ip);
  database.close();
}
