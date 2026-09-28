'use client';

import {useEffect,useRef,useState} from 'react';
import {Mic,MicOff,Send,X,Volume2} from 'lucide-react';
import {categories,services} from '@/lib/catalog';

type Draft={name:string;phone:string;vehicle:string;category:string;services:string[];date:string;time:string;message:string};
type VoiceReply={heard:string;reply:string;draft:Draft;awaitingConfirmation:boolean;confirmed:boolean;error?:string};
type Message={from:'dom'|'visitor';text:string};
type Recording={context:AudioContext;source:MediaStreamAudioSourceNode;processor:ScriptProcessorNode;chunks:Float32Array[];started:number;lastVoice:number;voiceStarted:boolean;timeout:number};
const emptyDraft:Draft={name:'',phone:'',vehicle:'',category:'',services:[],date:'',time:'',message:''};

function wav(chunks:Float32Array[],sampleRate:number){
  const length=chunks.reduce((sum,chunk)=>sum+chunk.length,0);
  const buffer=new ArrayBuffer(44+length*2);
  const view=new DataView(buffer);
  const word=(offset:number,value:string)=>{for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i));};
  word(0,'RIFF');view.setUint32(4,36+length*2,true);word(8,'WAVE');word(12,'fmt ');
  view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
  view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);
  word(36,'data');view.setUint32(40,length*2,true);
  let offset=44;
  for(const chunk of chunks)for(const value of chunk){const sample=Math.max(-1,Math.min(1,value));view.setInt16(offset,sample<0?sample*0x8000:sample*0x7fff,true);offset+=2;}
  return new Blob([buffer],{type:'audio/wav'});
}

export default function VoiceBooking(){
  const [open,setOpen]=useState(false);
  const [status,setStatus]=useState<'idle'|'speaking'|'listening'|'processing'|'error'>('idle');
  const [messages,setMessages]=useState<Message[]>([]);
  const [draft,setDraft]=useState<Draft>(emptyDraft);
  const [error,setError]=useState('');
  const active=useRef(false);
  const stream=useRef<MediaStream|null>(null);
  const recording=useRef<Recording|null>(null);
  const currentDraft=useRef<Draft>(emptyDraft);
  const awaiting=useRef(false);
  const turn=useRef(0);
  const requestId=useRef('');

  useEffect(()=>()=>{
    active.current=false;
    window.speechSynthesis?.cancel();
    if(recording.current){clearTimeout(recording.current.timeout);recording.current.processor.disconnect();recording.current.source.disconnect();void recording.current.context.close();recording.current=null;}
    stream.current?.getTracks().forEach(track=>track.stop());
  },[]);

  function close(){
    active.current=false;
    window.speechSynthesis?.cancel();
    if(recording.current){clearTimeout(recording.current.timeout);recording.current.processor.disconnect();recording.current.source.disconnect();void recording.current.context.close();recording.current=null;}
    stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;
    setOpen(false);setStatus('idle');
  }

  function say(text:string,celebrate=false):Promise<void>{
    if(!active.current||!('speechSynthesis' in window))return Promise.resolve();
    setStatus('speaking');
    return new Promise(resolve=>{
      window.speechSynthesis.cancel();
      const utterance=new SpeechSynthesisUtterance(text);
      utterance.lang='pt-BR';utterance.rate=celebrate?1.12:.98;utterance.pitch=celebrate?1.25:1.08;
      const voice=window.speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('pt-br'));
      if(voice)utterance.voice=voice;
      let completed=false;
      const done=()=>{if(completed)return;completed=true;clearTimeout(timer);resolve();};
      const timer=window.setTimeout(done,Math.max(9000,text.length*100));
      utterance.onend=done;utterance.onerror=done;
      window.speechSynthesis.speak(utterance);
    });
  }

  async function listen(){
    if(!active.current||!stream.current)return;
    try{
      const context=new AudioContext();
      await context.resume();
      if(!active.current){void context.close();return;}
      const source=context.createMediaStreamSource(stream.current);
      const processor=context.createScriptProcessor(4096,1,1);
      const data:Recording={context,source,processor,chunks:[],started:Date.now(),lastVoice:0,voiceStarted:false,timeout:0};
      recording.current=data;
      processor.onaudioprocess=event=>{
        if(recording.current!==data)return;
        const sample=event.inputBuffer.getChannelData(0);
        data.chunks.push(new Float32Array(sample));
        let sum=0;for(let i=0;i<sample.length;i++)sum+=sample[i]*sample[i];
        const loud=Math.sqrt(sum/sample.length)>.012;
        if(loud){data.voiceStarted=true;data.lastVoice=Date.now();}
        if(data.voiceStarted&&Date.now()-data.lastVoice>1700&&Date.now()-data.started>1800)void finishRecording();
      };
      source.connect(processor);processor.connect(context.destination);
      data.timeout=window.setTimeout(()=>void finishRecording(),32000);
      setStatus('listening');
    }catch{setError('Não foi possível iniciar o microfone. Tente novamente.');setStatus('error');}
  }

  async function finishRecording(){
    const data=recording.current;
    if(!data)return;
    recording.current=null;
    clearTimeout(data.timeout);data.processor.disconnect();data.source.disconnect();
    const sampleRate=data.context.sampleRate;
    void data.context.close();
    if(!data.voiceStarted){setError('Não ouvi sua voz. Toque em “Falar novamente”.');setStatus('error');return;}
    const audio=wav(data.chunks,sampleRate);
    if(audio.size>5_500_000){setError('A fala ficou longa. Tente frases mais curtas.');setStatus('error');return;}
    await send(audio);
  }

  async function send(audio:Blob){
    if(!active.current)return;
    setStatus('processing');setError('');
    try{
      const form=new FormData();
      form.append('audio',audio,'fala.wav');
      form.append('state',JSON.stringify({draft:currentDraft.current,awaitingConfirmation:awaiting.current,turn:turn.current}));
      const response=await fetch('/api/voice-booking',{method:'POST',body:form});
      const result=await response.json() as VoiceReply;
      if(!response.ok)throw new Error(result.error||'Não consegui entender o áudio.');
      if(!active.current)return;
      turn.current++;
      currentDraft.current=result.draft;awaiting.current=result.awaitingConfirmation;setDraft(result.draft);
      if(result.confirmed){
        setMessages(previous=>[...previous,{from:'visitor',text:result.heard||'Confirmo e autorizo'}]);
        requestId.current ||=crypto.randomUUID();
        const saved=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...result.draft,id:requestId.current,consent:true,website:'',autoConfirm:true})});
        const savedResult=await saved.json() as {error?:string;code?:string;status?:string};
        if(saved.status===409&&savedResult.code==='SLOT_UNAVAILABLE'){
          const revised={...result.draft,time:''};currentDraft.current=revised;setDraft(revised);awaiting.current=false;requestId.current='';
          const retry=(savedResult.error||'Esse horário não está disponível.')+' Diga outro dia e horário.';
          setMessages(previous=>[...previous,{from:'dom',text:retry}]);
          await say(retry);if(active.current)void listen();return;
        }
        if(!saved.ok)throw new Error(savedResult.error||'Não foi possível registrar o pedido.');
        const last=savedResult.status==='Confirmado'?'Está agendado, ok! Te esperamos lá!':'Pedido recebido, ok! A equipe confirmará o horário pelo WhatsApp. Te esperamos lá!';
        setMessages(previous=>[...previous,{from:'dom',text:last}]);
        await say(last,true);
        if(active.current)window.setTimeout(close,750);
      }else{
        setMessages(previous=>[...previous,{from:'visitor',text:result.heard||'Áudio enviado'},{from:'dom',text:result.reply}]);
        await say(result.reply);
        if(active.current)void listen();
      }
    }catch(cause){
      if(!active.current)return;
      setError(cause instanceof Error?cause.message:'Não foi possível continuar a conversa.');setStatus('error');
    }
  }

  async function begin(){
    if(!navigator.mediaDevices?.getUserMedia||!('AudioContext' in window)||!('speechSynthesis' in window)){
      setOpen(true);setError('Este navegador não oferece áudio completo. Use o formulário de agendamento abaixo.');setStatus('error');return;
    }
    active.current=true;turn.current=0;awaiting.current=false;currentDraft.current=emptyDraft;requestId.current='';
    setDraft(emptyDraft);setMessages([]);setError('');setOpen(true);
    const media=navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
    const greeting='Oi! Eu sou o assistente da DOM. Qual é o seu nome e que serviço seu carro precisa?';
    setMessages([{from:'dom',text:greeting}]);
    const speech=say(greeting);
    try{
      const granted=await media;
      if(!active.current){granted.getTracks().forEach(track=>track.stop());return;}
      stream.current=granted;
      await speech;
      if(active.current)void listen();
    }catch{
      window.speechSynthesis.cancel();setError('Autorize o microfone para agendar por voz. Você também pode usar o formulário.');setStatus('error');
    }
  }

  return <div className="voice-assistant">
    {!open&&<button className="voice-launch" type="button" onClick={()=>void begin()} aria-label="Agendar por voz com o assistente DOM">
      <span className="voice-teaser"><strong>OI! VAMOS AGENDAR?</strong><small>É só falar comigo 🎙</small></span>
      <img src="/assets/dom-assistente-chibi.webp" width="112" height="108" alt="Assistente chibi da DOM"/>
    </button>}
    {open&&<section className="voice-dialog" role="dialog" aria-modal="false" aria-label="Agendamento por voz com a DOM">
      <header><img src="/assets/dom-assistente-chibi.webp" width="52" height="52" alt=""/><div><strong>Assistente DOM</strong><span>{status==='listening'?'Ouvindo você...':status==='speaking'?'Falando...':status==='processing'?'Entendendo seu pedido...':status==='error'?'Precisa de ajuda':'Vamos cuidar do seu carro'}</span></div><button type="button" aria-label="Encerrar conversa" onClick={close}><X size={20}/></button></header>
      <div className="voice-messages" aria-live="polite">{messages.map((message,index)=><p className={'voice-message '+message.from} key={index}>{message.from==='dom'&&<Volume2 size={15}/>} {message.text}</p>)}{status==='processing'&&<p className="voice-thinking">Organizando seus dados...</p>}</div>
      {draft.name&&<div className="voice-draft"><strong>SEU PEDIDO</strong><span>{draft.name}{draft.vehicle?' · '+draft.vehicle:''}</span>{draft.services.length>0&&<span>{services.filter(service=>draft.services.includes(service.id)).map(service=>service.name).join(', ')}</span>}{draft.date&&draft.time&&<span>{draft.date.split('-').reverse().join('/')} às {draft.time}</span>}{draft.category&&categories.includes(draft.category)&&<span>{draft.category}</span>}</div>}
      {error&&<p className="voice-error" role="alert">{error}</p>}
      <footer><span>{status==='listening'?<><Mic size={16}/> Pode falar</>:status==='speaking'?<><Volume2 size={16}/> Assistente falando</>:status==='processing'?'Aguarde um instante':'A conversa é por voz'}</span>{status==='listening'&&<button type="button" onClick={()=>void finishRecording()}><Send size={16}/> Terminei</button>}{status==='error'&&stream.current&&<button type="button" onClick={()=>{setError('');void listen();}}><Mic size={16}/> Falar novamente</button>}{status==='error'&&!stream.current&&<a href="#agendar" onClick={close}><MicOff size={16}/> Usar formulário</a>}</footer>
      <p className="voice-privacy">O áudio é enviado ao Gemini para entender o pedido e não é guardado pela DOM. A disponibilidade é verificada antes da confirmação. <a href="/privacidade" target="_blank">Privacidade</a></p>
    </section>}
  </div>;
}
