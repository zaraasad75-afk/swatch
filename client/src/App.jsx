import {createContext,useContext,useEffect,useRef,useState} from 'react';
import {Routes,Route,Link,NavLink,useLocation,useParams} from 'react-router-dom';
import {motion,AnimatePresence} from 'framer-motion';import gsap from 'gsap';
import {api} from './api';import {useLenis,Split,Magnetic,Cursor,HScroll} from './fx.jsx';import Admin from './Admin.jsx';import {About,Contact,fallbackWatch} from './sections.jsx';
const C=createContext(),useCart=()=>useContext(C),money=n=>'$'+Number(n).toFixed(2);
const Img=({p,className=''})=><img className={className} src={p.image||fallbackWatch(p)} alt={p.name} loading="lazy"/>;
function CartProvider({children}){const[items,set]=useState(()=>JSON.parse(localStorage.cart||'[]')),[bump,setB]=useState(0);
useEffect(()=>{localStorage.cart=JSON.stringify(items)},[items]);
const add=(p,q=1)=>{set(i=>i.find(x=>x.id===p.id)?i.map(x=>x.id===p.id?{...x,qty:Math.min(x.qty+q,p.stock)}:x):[...i,{id:p.id,name:p.name,price:p.price,image:p.image,stock:p.stock,qty:q}]);setB(b=>b+1)};
const upd=(id,d)=>set(i=>i.map(x=>x.id===id?{...x,qty:Math.max(1,Math.min(x.qty+d,x.stock))}:x)),rm=id=>set(i=>i.filter(x=>x.id!==id));
return <C.Provider value={{items,add,upd,rm,bump,clear:()=>set([]),total:items.reduce((s,x)=>s+x.price*x.qty,0),count:items.reduce((s,x)=>s+x.qty,0)}}>{children}</C.Provider>}
function Nav(){const{count,bump}=useCart(),[o,setO]=useState(false);return <header className="nav"><Link to="/" className="logo">S’WATCH</Link>
<button className="burger" aria-label="Menu" onClick={()=>setO(!o)}>☰</button>
<nav className={o?'open':''} onClick={()=>setO(false)}><NavLink to="/collection">Shop</NavLink><NavLink to="/about">About</NavLink><NavLink to="/contact">Contact</NavLink>
<NavLink to="/cart">Cart <motion.b key={bump} initial={{scale:1.8}} animate={{scale:1}}>({count})</motion.b></NavLink></nav></header>}
function Home(){const[ps,setPs]=useState([]),[cfg,setCfg]=useState({}),[i,setI]=useState(0),{add}=useCart(),img=useRef();
useEffect(()=>{api('/products').then(setPs);api('/settings').then(setCfg)},[]);
const f=ps.filter(p=>p.featured),list=f.length?f:ps.slice(0,4),p=list[i%Math.max(list.length,1)];
if(!p)return <main className="hero"/>;const[w1,...w2]=p.name.split(' ');
return <><main className="hero" onMouseMove={e=>gsap.to(img.current,{rotationY:(e.clientX/innerWidth-.5)*22,rotationX:-(e.clientY/innerHeight-.5)*14,duration:.6,transformPerspective:900})}>
{cfg.banner&&<div className="banner">{cfg.banner}</div>}
<div className="htext" key={p.id}><Split text={w1} className="big"/><Split text={w2.join(' ')||p.category||' '} className="big outline"/><p className="price">{money(p.price)}</p>
<Link to={'/product/'+p.id} className="link">Explore ↓</Link></div>
<motion.div key={'i'+p.id} className="himg" ref={img} initial={{clipPath:'inset(0 0 100% 0)'}} animate={{clipPath:'inset(0 0 0% 0)'}} transition={{duration:1.1,ease:[.77,0,.18,1]}}><Img p={p}/></motion.div>
<div className="hctl"><button aria-label="Previous" onClick={()=>setI(i-1+list.length)}>←</button><button aria-label="Next" onClick={()=>setI(i+1)}>→</button></div>
<Magnetic><motion.button whileHover={{scale:1.05}} whileTap={{scale:.92}} className="cta" disabled={!p.stock} onClick={()=>add(p)}>{p.stock?'Add to cart':'Sold out'}</motion.button></Magnetic></main>
<HScroll n={ps.length}><div className="hsintro"><Split text="The Collection" as="h2" className="big sm"/></div>{ps.map(x=><Link key={x.id} to={'/product/'+x.id} className="hcard hov"><Img p={x}/><h3>{x.name}</h3><span>{money(x.price)}</span></Link>)}</HScroll></>}
function Collection(){const[ps,setPs]=useState([]),[q,setQ]=useState(''),[cat,setCat]=useState('All');useEffect(()=>{api('/products').then(setPs)},[]);
const cats=['All',...new Set(ps.map(p=>p.category).filter(Boolean))],v=ps.filter(p=>(cat==='All'||p.category===cat)&&p.name.toLowerCase().includes(q.toLowerCase()));
return <main className="page"><Split text="Collection" as="h2" className="big sm"/><div className="filters"><input placeholder="Search watches…" value={q} onChange={e=>setQ(e.target.value)} aria-label="Search"/>{cats.map(c=><button key={c} className={c===cat?'on':''} onClick={()=>setCat(c)}>{c}</button>)}</div>
<div className="grid">{v.map((p,i)=><motion.div key={p.id} initial={{opacity:0,y:50}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:(i%3)*.1,duration:.6}} whileHover={{y:-8}}><Link to={'/product/'+p.id} className="card hov"><div className="zoom"><Img p={p}/></div><small>{p.category}</small><h3>{p.name}</h3><span>{money(p.price)}</span></Link></motion.div>)}</div>{!v.length&&<p>No watches found.</p>}</main>}
function Product(){const{id}=useParams(),[p,setP]=useState(),[q,setQ]=useState(1),{add}=useCart();useEffect(()=>{api('/products/'+id).then(setP).catch(()=>setP(false))},[id]);
if(p===false)return <main className="page">Not found.</main>;if(!p)return <main className="page"/>;
return <main className="page pdp"><motion.div initial={{clipPath:'inset(0 100% 0 0)'}} animate={{clipPath:'inset(0 0% 0 0)'}} transition={{duration:1}}><Img p={p}/></motion.div>
<div><small>{p.category}</small><h2 className="big sm">{p.name}</h2><p className="price">{money(p.price)}</p><p>{p.description}</p><p>{p.stock?p.stock+' in stock':'Sold out'}</p>
<div className="qty"><button onClick={()=>setQ(Math.max(1,q-1))}>−</button><span>{q}</span><button onClick={()=>setQ(Math.min(p.stock,q+1))}>+</button></div>
<Magnetic><motion.button whileTap={{scale:.92}} className="cta solid" disabled={!p.stock} onClick={()=>add(p,q)}>Add to cart</motion.button></Magnetic></div></main>}
function CartPage(){const{items,upd,rm,total,clear}=useCart(),[f,setF]=useState({name:'',email:'',phone:'',address:''}),[msg,setMsg]=useState('');
const go=async e=>{e.preventDefault();try{const r=await api('/orders',{method:'POST',body:JSON.stringify({...f,items:items.map(({id,qty})=>({id,qty}))})});clear();setMsg('Order #'+r.id+' received. Thank you!')}catch(x){setMsg(x.message)}};
return <main className="page"><h2 className="big sm">Cart</h2>{msg&&<p className="msg">{msg}</p>}{!items.length?<p>Your cart is empty.</p>:<>
{items.map(x=><div className="row" key={x.id}><b>{x.name}</b><div className="qty"><button onClick={()=>upd(x.id,-1)}>−</button><span>{x.qty}</span><button onClick={()=>upd(x.id,1)}>+</button></div><span>{money(x.price*x.qty)}</span><button onClick={()=>rm(x.id)} aria-label="Remove">✕</button></div>)}
<h3>Total: {money(total)}</h3>
<form onSubmit={go} className="form">{['name','email','phone','address'].map(k=><input key={k} required={k!=='phone'} type={k==='email'?'email':'text'} placeholder={k[0].toUpperCase()+k.slice(1)} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})}/>)}<button className="cta solid">Place order</button></form></>}</main>}
const Footer=()=><footer><b>S’WATCH</b><span>© {new Date().getFullYear()} All rights reserved.</span><Link to="/collection">Shop</Link><Link to="/about">About</Link><Link to="/contact">Contact</Link></footer>;
export default function App(){useLenis();const loc=useLocation();useEffect(()=>{scrollTo(0,0)},[loc.pathname]);
if(loc.pathname.startsWith('/admin'))return <Admin/>;
return <CartProvider><Cursor/><Nav/><AnimatePresence mode="wait"><motion.div key={loc.pathname} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.35}}>
<Routes location={loc}><Route path="/" element={<Home/>}/><Route path="/collection" element={<Collection/>}/><Route path="/product/:id" element={<Product/>}/><Route path="/cart" element={<CartPage/>}/><Route path="/about" element={<About/>}/><Route path="/contact" element={<Contact/>}/></Routes></motion.div></AnimatePresence><Footer/></CartProvider>}
