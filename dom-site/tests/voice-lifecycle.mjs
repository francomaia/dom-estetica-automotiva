import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Exercise the actual component with controlled audio/network lifetimes.
const compiled=ts.transpileModule(readFileSync('app/voice-booking.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const flush=async()=>{for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve));};
const response=(body,status=200)=>({ok:status<400,status,json:async()=>body});
const draft={name:'Cliente de teste',phone:'64999990000',vehicle:'Carro de teste',category:'Compacto',services:['manutencao'],date:'2026-12-07',time:'09:00',message:''};

function harness(){
  const hooks=[];let cursor=0;const cleanups=[];const timers=new Map();let timerId=0;
  const speech=[];const requests=[];const microphones=[];
  const stream=()=>{const track={stopped:false,stop(){this.stopped=true;}};const value={getTracks:()=>[track],track};microphones.push(value);return value;};
  const media=deferred();const processors=[];const samples=new Float32Array(4096).fill(.1);
  class AudioContext{
    sampleRate=16000;
    destination={};
    async resume(){}
    async close(){this.closed=true;}
    createMediaStreamSource(){return {connect(){},disconnect(){}};}
    createScriptProcessor(){const processor={connect(){},disconnect(){},onaudioprocess:null};processors.push(processor);return processor;}
  }
  const react={
    useState(initial){const index=cursor++;hooks[index]??={value:initial};return [hooks[index].value,next=>{hooks[index].value=typeof next==='function'?next(hooks[index].value):next;}];},
    useRef(initial){const index=cursor++;hooks[index]??={current:initial};return hooks[index];},
    useEffect(callback){const index=cursor++;if(!hooks[index]){hooks[index]={};const cleanup=callback();if(cleanup)cleanups.push(cleanup);}},
  };
  const speechSynthesis={cancel(){},getVoices:()=>[],speak(utterance){speech.push(utterance);}};
  const exports={};
  const context=vm.createContext({exports,require(name){
    if(name==='react')return react;
    if(name==='react/jsx-runtime')return {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
    if(name==='lucide-react')return Object.fromEntries(['Mic','MicOff','Send','X','Volume2'].map(name=>[name,name]));
    if(name==='@/lib/catalog')return {categories:['Compacto'],services:[{id:'manutencao',name:'Manutenção estética'}]};
    throw Error(name);
  },window:{AudioContext,speechSynthesis,setTimeout(callback,delay){const id=++timerId;timers.set(id,{callback,delay});return id;}},
  clearTimeout:id=>timers.delete(id),navigator:{mediaDevices:{getUserMedia:()=>media.promise}},SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},
  AudioContext,Date,Blob,FormData,AbortController,crypto,
  fetch(url,options){const pending=deferred();requests.push({url,options,...pending});return pending.promise;}});
  vm.runInContext(compiled,context);
  const render=()=>{cursor=0;return exports.default();};
  const elements=(node)=>!node||typeof node!=='object'?[]:[node,...[node.props?.children].flat(Infinity).flatMap(elements)];
  const button=name=>elements(render()).find(node=>node.type==='button'&&(node.props['aria-label']===name||elements(node).map(child=>child.props?.children).flat(Infinity).some(value=>typeof value==='string'&&value.trim()===name)));
  const text=()=>elements(render()).flatMap(node=>[node.props?.children].flat(Infinity).filter(value=>typeof value==='string')).join(' ');
  const start=async()=>{button('Agendar por voz com o assistente DOM').props.onClick();await flush();};
  const close=()=>button('Encerrar conversa').props.onClick();
  const ready=async()=>{requests.at(-1).resolve(response({available:true}));media.resolve(stream());await flush();speech.at(-1).onend();await flush();};
  const record=async()=>{processors.at(-1).onaudioprocess({inputBuffer:{getChannelData:()=>samples}});button('Terminei').props.onClick();await flush();};
  return {start,close,ready,record,requests,microphones,media,stream,speech,timers,button,text,cleanup:()=>cleanups.forEach(fn=>fn())};
}

{
  const h=harness();await h.start();h.close();const secondStart=h.start();await secondStart;
  h.requests[0].resolve(response({available:false,error:'STALE ERROR'},503));h.requests[1].resolve(response({available:true}));
  h.media.resolve(h.stream());await flush();h.speech.at(-1).onend();await flush();
  assert.ok(!h.text().includes('STALE ERROR'),'Old conversation must not show its delayed error');
  assert.equal(h.microphones[0].track.stopped,true,'Old permission result must stop its track');h.cleanup();
}
{
  const h=harness();await h.start();h.requests[0].resolve(response({available:false,error:'Agendamento indisponível'},503));await flush();
  h.media.resolve(h.stream());await flush();
  assert.ok(h.text().includes('Agendamento indisponível'));
  assert.equal(h.microphones[0].track.stopped,true,'Unavailable booking must release a late microphone grant');h.cleanup();
}
{
  const h=harness();await h.start();await h.ready();await h.record();
  const interpretation=h.requests.at(-1);assert.equal(interpretation.url,'/api/voice-booking');
  h.close();assert.equal(interpretation.options.signal.aborted,true,'Closing must abort the audio request');
  interpretation.resolve(response({heard:'teste',reply:'STALE REPLY',draft,awaitingConfirmation:false,confirmed:false}));await flush();
  assert.ok(!h.text().includes('STALE REPLY'));assert.equal(h.microphones[0].track.stopped,true);h.cleanup();
}
{
  const h=harness();await h.start();await h.ready();await h.record();
  h.requests.at(-1).resolve(response({heard:'Sim, autorizo',reply:'Verificando',draft,awaitingConfirmation:false,confirmed:true}));await flush();
  const save=h.requests.at(-1);assert.equal(save.url,'/api/leads');const id=JSON.parse(save.options.body).id;
  save.reject(Error('Conexão interrompida'));await flush();
  h.button('Tentar salvar').props.onClick();await flush();const retry=h.requests.at(-1);
  assert.equal(JSON.parse(retry.options.body).id,id,'Retry must reuse the booking protocol');
  retry.resolve(response({status:'Confirmado'}));await flush();
  assert.equal(h.microphones[0].track.stopped,true,'Persisted booking must release the microphone before farewell');
  assert.equal(h.speech.at(-1).text,'Está agendado, ok! Te esperamos lá!');
  assert.ok(h.text().includes(draft.phone),'Review must display the WhatsApp number');
  h.speech.at(-1).onend();await flush();const timer=[...h.timers.values()].find(timer=>timer.delay===750);assert.ok(timer);timer.callback();
  assert.ok(h.button('Agendar por voz com o assistente DOM'),'Conversation must close automatically');h.cleanup();
}
console.log('PASS: conversa isolada, permissão tardia, cancelamento, telefone no resumo, salvamento sem duplicação, microfone desligado e despedida automática.');
