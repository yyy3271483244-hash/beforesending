import {useEffect} from 'react';

// One-time object reveals never translate, fade, pin or scroll a scene wrapper.
export function useSceneReveal(track) {
  useEffect(()=>{
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const animations=new Set(), seen=new WeakSet();
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(!entry.isIntersecting)continue;
        observer.unobserve(entry.target);
        const animal=entry.target.classList.contains('keeper-arrival');
        const animation=entry.target.animate([{opacity:0,transform:`translateY(${animal?20:16}px)`},{opacity:1,transform:'translateY(0)'}],{
          duration:650,delay:animal?Number(entry.target.closest('[data-keeper]')?.dataset.revealOrder||0)*110:0,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'
        });
        animations.add(animation);animation.onfinish=()=>animations.delete(animation);
      }
    },{threshold:.15});
    const selector='[data-scene-reveal], .keeper-arrival, .home-selection-heading, .ritual-copy > h2';
    function observeContent() {
      track.current.querySelectorAll(selector).forEach(node=>{
        if(seen.has(node))return;
        seen.add(node);observer.observe(node);
      });
    }
    observeContent();
    // Later workflow stages may be mounted after their prerequisites are completed.
    const additions=new MutationObserver(observeContent);
    additions.observe(track.current,{childList:true,subtree:true});
    return ()=>{observer.disconnect();additions.disconnect();animations.forEach(a=>a.cancel());};
  },[track]);
}
