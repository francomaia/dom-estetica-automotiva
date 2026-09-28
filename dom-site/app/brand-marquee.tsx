'use client';

const words=['ESTÉTICA','PROTEÇÃO','PERFORMANCE VISUAL','CUIDADO DOM'];
export default function BrandMarquee(){
  return <div className="brand-strip">
    <div className="marquee-window" aria-label={words.join(' · ')}>
      <div className="marquee-track" aria-hidden="true">{[0,1,2,3].map(copy=><div className="marquee-group" key={copy}>{words.map(word=><span className="marquee-item" key={word}>{word}<span className="neon-arrows">{[0,1,2].map(i=><svg key={i} viewBox="0 0 28 36" fill="none" style={{animationDelay:`${i*.18}s`}}><path d="M3 3h10l12 15-12 15H3l12-15L3 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>)}</span></span>)}</div>)}</div>
    </div>
  </div>;
}
