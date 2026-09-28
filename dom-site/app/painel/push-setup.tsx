'use client';

import {useEffect,useState} from 'react';
import {Bell,BellOff,CheckCircle2,Smartphone} from 'lucide-react';

type PushState='loading'|'ready'|'enabled'|'unsupported'|'install-first'|'blocked'|'unconfigured'|'error';
type PushSettings={configured:boolean;publicKey:string|null;error?:string};

function keyBytes(value:string){
  const padded=(value+'==='.slice((value.length+3)%4)).replace(/-/g,'+').replace(/_/g,'/');
  const bytes=atob(padded);
  return Uint8Array.from(bytes,char=>char.charCodeAt(0));
}

function installed(){return window.matchMedia('(display-mode: standalone)').matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone);}
function isAppleMobile(){return /iPhone|iPad|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;}

export default function PushSetup(){
  const [state,setState]=useState<PushState>('loading');
  const [registration,setRegistration]=useState<ServiceWorkerRegistration|null>(null);
  const [publicKey,setPublicKey]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    let cancelled=false;
    async function prepare(){
      if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window)||!window.isSecureContext){setState('unsupported');return;}
      try{
        const response=await fetch('/api/admin/push',{cache:'no-store'});
        const settings=await response.json() as PushSettings;
        if(!response.ok)throw new Error(settings.error||'Não foi possível carregar os avisos.');
        if(!settings.configured||!settings.publicKey){setState('unconfigured');return;}
        const worker=await navigator.serviceWorker.register('/admin-sw.js',{scope:'/painel'});
        if(cancelled)return;
        setPublicKey(settings.publicKey);
        setRegistration(worker);
        const existing=await worker.pushManager.getSubscription();
        if(existing){
          const sync=await fetch('/api/admin/push',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(existing.toJSON())});
          if(!sync.ok)throw new Error('Não foi possível sincronizar os avisos deste aparelho.');
        }
        if(cancelled)return;
        if(isAppleMobile()&&!installed())setState('install-first');
        else if(Notification.permission==='denied')setState('blocked');
        else setState(existing?'enabled':'ready');
      }catch(error){if(!cancelled){setMessage(error instanceof Error?error.message:'Falha ao configurar os avisos.');setState('error');}}
    }
    void prepare();
    return()=>{cancelled=true;};
  },[]);

  async function enable(){
    if(!registration||!publicKey)return;
    // Permission must be requested directly from this tap, especially on iPhone.
    const permissionRequest=Notification.requestPermission();
    setBusy(true);setMessage('');
    try{
      const permission=await permissionRequest;
      if(permission!=='granted'){setState(permission==='denied'?'blocked':'ready');return;}
      const subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:keyBytes(publicKey)});
      const response=await fetch('/api/admin/push',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(subscription.toJSON())});
      const result=await response.json() as {error?:string};
      if(!response.ok)throw new Error(result.error||'Não foi possível salvar este aparelho.');
      setState('enabled');
    }catch(error){setMessage(error instanceof Error?error.message:'Não foi possível ativar os avisos.');setState('error');}
    finally{setBusy(false);}
  }

  async function disable(){
    if(!registration)return;
    setBusy(true);setMessage('');
    try{
      const subscription=await registration.pushManager.getSubscription();
      if(subscription){
        const response=await fetch('/api/admin/push',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint:subscription.endpoint})});
        if(!response.ok)throw new Error('Não foi possível desativar este aparelho.');
        await subscription.unsubscribe();
      }
      setState('ready');
    }catch(error){setMessage(error instanceof Error?error.message:'Não foi possível desativar os avisos.');}
    finally{setBusy(false);}
  }

  const active=state==='enabled';
  return <section className="push-card" aria-label="Avisos de novos agendamentos">
    <div className="push-card-icon" aria-hidden="true">{active?<CheckCircle2 size={25}/>:<Bell size={25}/>}</div>
    <div className="push-card-copy">
      <span className="eyebrow">APP DA EQUIPE / AVISOS</span>
      <h2>{active?'Você recebe novos leads neste aparelho.':'Novos leads, direto no seu celular.'}</h2>
      <p>Instale o painel na tela inicial e receba um aviso quando chegar um pedido. Os dados do cliente ficam protegidos dentro do painel.</p>
      {state==='install-first'&&<p className="push-help"><Smartphone size={16}/> No iPhone: abra no Safari, toque em Compartilhar e em “Adicionar à Tela de Início”. Depois abra o ícone DOM e ative os avisos.</p>}
      {state==='blocked'&&<p className="push-help">As notificações estão bloqueadas nas configurações deste navegador. Libere as permissões para o site e abra o painel novamente.</p>}
      {state==='unsupported'&&<p className="push-help">Para receber avisos, abra o site por HTTPS em um navegador compatível e instale na tela inicial. No iPhone, use o Safari.</p>}
      {state==='unconfigured'&&<p className="push-help">A ativação dos avisos depende da configuração do servidor. O painel continua disponível normalmente.</p>}
      {state==='loading'&&<p className="push-help">Verificando avisos neste aparelho...</p>}
      {message&&<p className="push-help push-error" role="alert">{message}</p>}
      {state==='ready'&&<p className="push-install-tip">Android: menu do navegador → Instalar app. iPhone: Safari → Compartilhar → Adicionar à Tela de Início.</p>}
    </div>
    {(state==='ready'||state==='enabled'||state==='error')&&<button className="push-card-action" type="button" disabled={busy||!registration} onClick={active?()=>void disable():()=>void enable()}>{active?<BellOff size={17}/>:<Bell size={17}/>} {busy?'Aguarde...':active?'Desativar avisos':'Ativar avisos'}</button>}
  </section>;
}
