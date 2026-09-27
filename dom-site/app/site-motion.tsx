'use client';
import {useEffect} from 'react';

// One-time reveals use browser observers; no animation library or scroll loop.
export default function SiteMotion(){
  const enabled=true;
  useEffect(()=>{
    const root=document.querySelector('.dom-site');
    if(!root)return;
    root.classList.toggle('motion-enabled',enabled);
    root.classList.toggle('motion-reduced',!enabled);
    const selectors='.intro>div,.section-top,.preview-services article,.booking-copy,.booking-panel,.quality>div:first-child,.benefits>div,.gallery figure,.testimonials>*,.location>div,.final-cta .wrap>div';
    let observer:IntersectionObserver|undefined;
    let frame=0;
    const showAll=()=>root.querySelectorAll<HTMLElement>('[data-reveal]').forEach(el=>{el.dataset.reveal='visible';});
    const scan=()=>{
      if(!enabled||!('IntersectionObserver' in window)){showAll();return;}
      observer??=new IntersectionObserver(entries=>entries.forEach(entry=>{
        if(entry.isIntersecting){(entry.target as HTMLElement).dataset.reveal='visible';observer?.unobserve(entry.target);}
      }),{threshold:0.07,rootMargin:'0px 0px -24px 0px'});
      root.querySelectorAll<HTMLElement>(selectors).forEach((el,i)=>{
        if(el.dataset.reveal)return;
        if(el.getBoundingClientRect().top<innerHeight-24){el.dataset.reveal='visible';return;}
        el.style.setProperty('--reveal-delay',`${Math.min(i%4*70,210)}ms`);
        el.dataset.reveal='pending';observer?.observe(el);
      });
    };
    scan();
    const changes=new MutationObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(scan);});
    changes.observe(root,{childList:true,subtree:true});
    let pointerFrame=0;
    const pointer=(event:Event)=>{if(!enabled||!matchMedia('(pointer:fine)').matches)return;const e=event as PointerEvent;const surface=(e.target as Element).closest<HTMLElement>('.brand-strip,.final-cta,.texture-sample,.booking-section');if(!surface)return;cancelAnimationFrame(pointerFrame);pointerFrame=requestAnimationFrame(()=>{const bounds=surface.getBoundingClientRect();surface.style.setProperty('--glow-x',`${((e.clientX-bounds.left)/bounds.width-.5)*-22}px`);surface.style.setProperty('--glow-y',`${((e.clientY-bounds.top)/bounds.height-.5)*-18}px`);});};
    root.addEventListener('pointermove',pointer,{passive:true});
    return()=>{observer?.disconnect();changes.disconnect();cancelAnimationFrame(frame);cancelAnimationFrame(pointerFrame);root.removeEventListener('pointermove',pointer);showAll();root.querySelectorAll('[data-reveal]').forEach(el=>el.removeAttribute('data-reveal'));};
  },[enabled]);
  return null;
}
