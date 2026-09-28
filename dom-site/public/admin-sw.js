self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?event.data.json():{};}catch{data={};}
  const title='DOM • Novo agendamento';
  const body='Um novo pedido chegou. Abra o painel para conferir.';
  event.waitUntil(self.registration.showNotification(title,{
    body,
    icon:'/admin-icon-192.png',
    badge:'/admin-icon-192.png',
    tag:typeof data.tag==='string'?data.tag:'dom-novo-lead',
    data:{url:'/painel'},
    vibrate:[160,80,160]
  }));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
    const pages=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const panel=pages.find(page=>new URL(page.url).origin===self.location.origin&&new URL(page.url).pathname.startsWith('/painel'));
    if(panel)return panel.focus();
    return self.clients.openWindow('/painel');
  })());
});
