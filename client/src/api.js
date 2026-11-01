import {demoApi} from './demo.js';
class Offline extends Error{}
const real=async(u,o)=>{const r=await fetch('/api'+u,{...o,headers:{...(o.body&&!(o.body instanceof FormData)?{'Content-Type':'application/json'}:{}),...(localStorage.token?{Authorization:'Bearer '+localStorage.token}:{})}});
  let d;try{d=await r.json()}catch{throw new Offline()}
  if(!r.ok)throw new Error(d.error||'Error');return d};
export const api=(u,o={})=>real(u,o).catch(e=>{if(e instanceof Offline||e instanceof TypeError)return demoApi(u,o);throw e});