import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import gsap from 'gsap';import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {api} from './api';import {Split,Magnetic} from './fx.jsx';
gsap.registerPlugin(ScrollTrigger);

export const WATCHES={gold:'/watches/gold-classic.jpg',steel:'/watches/steel-noir.jpg',rose:'/watches/rose-cream.jpg',chrono:'/watches/black-chrono.jpg',twotone:'/watches/two-tone.jpg',diver:'/watches/diver-blue.jpg'};
const CYCLE=Object.values(WATCHES);
// Product photo fallback: used only when a product has no uploaded image.
export const fallbackWatch=p=>{const c=(p.category||'').toLowerCase();
  if(c==='gold')return WATCHES.gold;if(c==='black')return WATCHES.chrono;if(c==='classic')return WATCHES.twotone;
  return CYCLE[(Number(p.id)||0)%CYCLE.length]};

const calm=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

// Layers carrying data-speed drift at different rates while the section scrolls past.
function useParallax(root){useLayoutEffect(()=>{if(calm())return;
  const ctx=gsap.context(()=>{root.current.querySelectorAll('[data-speed]').forEach(el=>{const s=parseFloat(el.dataset.speed);
    gsap.fromTo(el,{y:-s*140},{y:s*140,ease:'none',scrollTrigger:{trigger:root.current,start:'top bottom',end:'bottom top',scrub:.6}})})},root);
  return()=>ctx.revert()},[])}

// Elements marked data-fade rise into place, one after another, as they enter the viewport.
function useFadeUp(root,dep){useLayoutEffect(()=>{if(calm())return;
  const ctx=gsap.context(()=>{gsap.set('[data-fade]',{opacity:0,y:36});
    ScrollTrigger.batch('[data-fade]',{start:'top 90%',once:true,onEnter:b=>gsap.to(b,{opacity:1,y:0,duration:.9,ease:'power3.out',stagger:.12})})},root);
  return()=>ctx.revert()},[dep])}

function useSettings(){const[c,setC]=useState({});useEffect(()=>{api('/settings').then(setC).catch(()=>{})},[]);return c}

export function About(){const c=useSettings(),root=useRef();useParallax(root);
  const title=c.about_title||'Time, Crafted.',text=c.about_text||'Every S’WATCH timepiece is assembled by hand from sapphire crystal, surgical steel and precious metals.';
  return <main className="about" ref={root}>
    <div className="ab-bg" data-speed="-.35" aria-hidden>Craft</div>
    <div className="ab-grid">
      <div className="ab-copy">
        <Split text={title} as="h2" className="big sm"/>
        <p className="lead" data-speed="0">{text}</p>
        <ul className="ab-facts">
          <li><b>Sapphire crystal</b><span>Scratch-proof glass over every dial.</span></li>
          <li><b>Surgical steel</b><span>Cases and bracelets that outlast the strap.</span></li>
          <li><b>Assembled by hand</b><span>One watchmaker follows each piece from movement to final polish.</span></li>
        </ul>
      </div>
      <figure className="ab-img a1" data-speed=".25"><img src={WATCHES.gold} alt="Gold dress watch with cream dial on a brown leather strap" loading="lazy"/></figure>
      <figure className="ab-img a2" data-speed=".85"><img src={WATCHES.diver} alt="Steel diver watch with blue dial and bezel" loading="lazy"/></figure>
      <figure className="ab-img a3" data-speed="-.15"><img src={WATCHES.twotone} alt="Two-tone steel and gold watch with champagne dial" loading="lazy"/></figure>
    </div>
  </main>}

export function Contact(){const c=useSettings(),root=useRef(),[sent,setSent]=useState(false);
  useFadeUp(root,c.email);
  const submit=e=>{e.preventDefault();const f=e.target;
    location.href=`mailto:${c.email}?subject=${encodeURIComponent('Enquiry from '+f.n.value)}&body=${encodeURIComponent(f.m.value)}`;setSent(true)};
  const rows=[['Write',c.email,c.email&&'mailto:'+c.email],['Call',c.phone,c.phone&&'tel:'+c.phone.replace(/[^\d+]/g,'')],['Visit',c.address],['Follow',c.social&&c.social.replace(/^https?:\/\/(www\.)?/,''),c.social]].filter(r=>r[1]);
  return <main className="contact" ref={root}>
    <div className="ct-left">
      <Split text="Let’s talk." as="h2" className="big sm"/>
      <p className="lead" data-fade>Questions about a piece, sizing, or a gift? We answer every message within a day.</p>
      <dl className="ct-list">{rows.map(([k,v,h])=><div key={k} data-fade><dt>{k}</dt><dd>{h?<a className="hov" href={h}>{v}</a>:v}</dd></div>)}</dl>
    </div>
    <div className="ct-right"><form className="ct-form" onSubmit={submit} data-fade>
      <label>Your name<input name="n" required autoComplete="name"/></label>
      <label>Message<textarea name="m" rows="6" required/></label>
      <Magnetic><button className="cta solid">{sent?'Opening your email…':'Send message'}</button></Magnetic>
    </form>
    <figure className="ct-img" data-fade><img src={WATCHES.rose} alt="Rose gold watch with cream dial on a tan leather strap" loading="lazy"/></figure>
    </div>
  </main>}
