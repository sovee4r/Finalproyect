// ArmarCelula.tsx — Ciencias 4to-6to
// Identifica si cada organelo pertenece a la célula animal, vegetal o ambas
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Play, X, Volume2, VolumeX, RotateCcw,
  Trophy, Star, CheckCircle2, XCircle, Settings,
  User, Users, LogOut, AlertTriangle
} from "lucide-react";
import { Link } from "react-router";
import logoImg from "../../../assets/logo.png";
import { useSocket } from "../../../lib/useSocket";
import { GameLobby, GameError, GameRankingFinal, MultiPanel, RankingPanel } from "../GameShared";
import { MiniJugadores } from "../MultiLobby";

type Screen = "splash"|"config"|"juego"|"resultados";
type Modo   = "solo"|"multi";
type TipoCelula = "animal"|"vegetal"|"ambas";

interface Organelo {
  id: string; nombre: string; emoji: string;
  funcion: string; tipo: TipoCelula;
  dato: string;
}

const TODOS_ORGANELOS: Organelo[] = [
  {id:"nucleo",     nombre:"Núcleo",           emoji:"🔵", tipo:"ambas",   funcion:"Centro de control de la célula",           dato:"Contiene el ADN con la información genética"},
  {id:"membrana",   nombre:"Membrana Celular",  emoji:"🟡", tipo:"ambas",   funcion:"Regula lo que entra y sale",               dato:"Presente en TODAS las células"},
  {id:"mitocond",   nombre:"Mitocondria",       emoji:"🔴", tipo:"ambas",   funcion:"Produce energía (ATP)",                    dato:"La central eléctrica de la célula"},
  {id:"ribosom",    nombre:"Ribosoma",          emoji:"🟠", tipo:"ambas",   funcion:"Sintetiza proteínas",                      dato:"Puede estar libre o unido al retículo"},
  {id:"reticulo",   nombre:"Retículo Endop.",   emoji:"🌀", tipo:"ambas",   funcion:"Transporta proteínas y lípidos",           dato:"Rugoso (con ribosomas) o liso"},
  {id:"golgi",      nombre:"Aparato de Golgi",  emoji:"📦", tipo:"ambas",   funcion:"Empaqueta y envía proteínas",              dato:"El 'correo postal' de la célula"},
  {id:"pared",      nombre:"Pared Celular",     emoji:"🟩", tipo:"vegetal", funcion:"Da rigidez y forma a la célula",           dato:"Compuesta de celulosa — SOLO vegetal"},
  {id:"cloroplast", nombre:"Cloroplasto",       emoji:"🌿", tipo:"vegetal", funcion:"Realiza la fotosíntesis",                  dato:"Contiene clorofila — SOLO vegetal"},
  {id:"vacuola_g",  nombre:"Vacuola Central",   emoji:"💧", tipo:"vegetal", funcion:"Almacena agua y mantiene la turgencia",    dato:"Grande en plantas — SOLO vegetal"},
  {id:"centrosoma", nombre:"Centrosoma",        emoji:"⭐", tipo:"animal",  funcion:"Organiza la división celular",             dato:"SOLO en células animales"},
  {id:"lisosoma",   nombre:"Lisosoma",          emoji:"💊", tipo:"animal",  funcion:"Digiere sustancias y orgánulos dañados",   dato:"'Estómago' celular — SOLO animal"},
];

const PREGUNTAS_POR_GRADO: Record<number, string[]> = {
  4: ["nucleo","membrana","mitocond","pared","cloroplast","vacuola_g","centrosoma","ribosom"],
  5: ["nucleo","membrana","mitocond","pared","cloroplast","vacuola_g","centrosoma","ribosom","reticulo","lisosoma"],
  6: ["nucleo","membrana","mitocond","pared","cloroplast","vacuola_g","centrosoma","ribosom","reticulo","golgi","lisosoma"],
};

const TIPO_CFG: Record<TipoCelula,{label:string;color:string;emoji:string;desc:string}> = {
  animal:  {label:"Solo Animal",  color:"#ff9800", emoji:"🐾", desc:"Solo en células animales"},
  vegetal: {label:"Solo Vegetal", color:"#228B22", emoji:"🌿", desc:"Solo en células vegetales"},
  ambas:   {label:"Ambas",        color:"#00e5ff", emoji:"🔵", desc:"Presente en ambos tipos"},
};

// ── MÚSICA ──
class MusicEngine {
  private ac:AudioContext|null=null;private mg:GainNode|null=null;private mug:GainNode|null=null;private running=false;
  start(){if(this.running)return;try{this.ac=new(window.AudioContext||(window as any).webkitAudioContext)();this.mg=this.ac.createGain();this.mug=this.ac.createGain();this.mg.gain.value=0.08;this.mug.gain.value=1;this.mg.connect(this.mug);this.mug.connect(this.ac.destination);this.running=true;this.loop();}catch(_){}}
  stop(){this.running=false;try{this.ac?.close();}catch(_){}this.ac=null;this.mg=null;this.mug=null;}
  setMuted(m:boolean){if(!this.mug||!this.ac)return;this.mug.gain.linearRampToValueAtTime(m?0:1,this.ac.currentTime+0.3);}
  private loop(){
    const prog=[[261.6,329.6,392.0,329.6],[293.7,369.99,440.0,369.99],[220.0,277.2,329.6,277.2]];
    let ci=0;const play=()=>{if(!this.running||!this.ac||!this.mg)return;prog[ci%prog.length].forEach((f,vi)=>{if(!this.ac||!this.mg)return;const o=this.ac.createOscillator(),e=this.ac.createGain();o.type="sine";o.frequency.value=f;o.connect(e);e.connect(this.mg);const t=this.ac.currentTime+vi*0.25,d=3.5;e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(0.28,t+0.3);e.gain.setValueAtTime(0.2,t+d-0.4);e.gain.linearRampToValueAtTime(0,t+d);o.start(t);o.stop(t+d+0.1);});ci++;setTimeout(play,4500);};play();
  }
}
function useMusic(){const e=useRef(new MusicEngine());const [muted,setMuted]=useState(false);useEffect(()=>()=>e.current.stop(),[]);const start=useCallback(()=>e.current.start(),[]);const stop=useCallback(()=>{e.current.stop();setMuted(false);},[]);const toggleMute=useCallback(()=>setMuted(m=>{const n=!m;e.current.setMuted(n);return n;}),[]);return{start,stop,toggleMute,muted};}
function shuffle<T>(arr:T[]):T[]{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function SplashScreen({pct,done}:{pct:number;done:boolean}){
  return(
    <motion.div initial={{opacity:1}} exit={{opacity:0}} transition={{duration:0.9}} className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden" style={{background:"radial-gradient(ellipse 100% 80% at 50% 0%,#0e082a 0%,#07091a 55%,#000 100%)"}}>
      {[...Array(7)].map((_,i)=>(<motion.div key={i} className="absolute rounded-full pointer-events-none" style={{width:2+(i%3)*2,height:2+(i%3)*2,left:`${8+i*13}%`,top:`${15+(i%4)*17}%`,background:["#DAA520","#ff9800","#00e5ff","#9b44ff","#00ff88","#ffd700","#ff4757"][i]}} animate={{y:[0,-28,0],opacity:[0.2,0.7,0.2]}} transition={{duration:2.8+i*0.4,repeat:Infinity,delay:i*0.35,ease:"easeInOut"}}/>))}
      <motion.div animate={{opacity:[0.3,0.65,0.3],scale:[1,1.08,1]}} transition={{duration:4,repeat:Infinity}} className="absolute pointer-events-none" style={{width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(155,68,255,0.12) 0%,rgba(218,165,32,0.07) 40%,transparent 70%)",top:"50%",left:"50%",transform:"translate(-50%,-52%)"}}/>
      <AnimatePresence mode="wait">
        {!done?(
          <motion.div key="in" initial={{scale:1.5,opacity:0}} animate={{scale:1,opacity:1}} transition={{duration:0.85,ease:[0.16,1,0.3,1]}} className="flex flex-col items-center">
            <motion.div className="relative mb-2" animate={{y:[0,-7,0]}} transition={{duration:3.5,repeat:Infinity,ease:"easeInOut"}}>
              <motion.div animate={{scale:[1,1.3,1],opacity:[0.5,0.9,0.5]}} transition={{duration:2.5,repeat:Infinity}} className="absolute inset-0 rounded-full pointer-events-none" style={{background:"radial-gradient(circle,rgba(218,165,32,0.25) 0%,rgba(155,68,255,0.12) 50%,transparent 70%)",transform:"scale(1.8)"}}/>
              <img src={logoImg} alt="Saberix" className="w-36 h-36 md:w-44 md:h-44 object-contain relative z-10" style={{filter:"drop-shadow(0 0 28px rgba(218,165,32,0.65)) drop-shadow(0 0 55px rgba(155,68,255,0.3))"}}/>
            </motion.div>
            <div className="flex items-center gap-0.5 mt-1 mb-2">{["S","A","B","E","R","I","X"].map((l,i)=>{const c=["#ff4757","#ff9800","#ffd700","#00ff88","#00e5ff","#a78bfa","#ff4757"][i];return(<motion.span key={i} initial={{opacity:0,y:-18,scale:0.6}} animate={{opacity:1,y:0,scale:1}} transition={{delay:0.5+i*0.07,type:"spring",stiffness:280,damping:17}} className="font-['Press_Start_2P'] text-3xl md:text-4xl font-black leading-none" style={{color:c,textShadow:`0 0 20px ${c}bb,0 0 40px ${c}44`}}>{l}</motion.span>);})}</div>
            <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:1.3}} className="flex items-center gap-2 mb-8"><div className="h-px w-10 rounded-full" style={{background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.2))"}}/><p className="text-xs md:text-sm font-bold tracking-[0.25em] uppercase" style={{color:"rgba(255,255,255,0.3)"}}>Aprende Jugando</p><div className="h-px w-10 rounded-full" style={{background:"linear-gradient(90deg,rgba(255,255,255,0.2),transparent)"}}/></motion.div>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.6}} className="w-48 md:w-64">
              <div className="flex justify-between mb-1.5"><span className="text-[10px] font-bold tracking-widest uppercase" style={{color:"rgba(255,255,255,0.15)"}}>Cargando</span><span className="text-[10px] font-bold" style={{color:"rgba(218,165,32,0.5)"}}>{Math.round(pct)}%</span></div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.05)"}}><div className="h-full rounded-full" style={{width:`${pct}%`,background:"linear-gradient(90deg,#ff4757,#ff9800,#ffd700,#00ff88,#00e5ff,#a78bfa)",boxShadow:"0 0 10px rgba(0,229,255,0.4)",transition:"width 0.04s linear"}}/></div>
            </motion.div>
          </motion.div>
        ):(
          <motion.div key="out" initial={{scale:1,opacity:1}} animate={{scale:0.2,opacity:0,y:-90}} transition={{duration:0.65,ease:[0.4,0,1,1]}} className="flex flex-col items-center"><img src={logoImg} alt="" className="w-36 h-36 object-contain" style={{filter:"drop-shadow(0 0 25px rgba(218,165,32,0.5))"}}/></motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Recompensas({puntos,color="#228B22"}:{puntos:number;color?:string}){
  return(
    <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} transition={{delay:0.7}} className="rounded-2xl border-2 p-6 mb-6" style={{background:`linear-gradient(135deg,${color}12,rgba(255,215,0,0.04))`,borderColor:`${color}44`}}>
      <div className="flex items-center justify-center gap-2 mb-5"><Trophy size={15} className="text-[#ffd700]"/><p className="text-sm font-extrabold text-[#ffd700] tracking-widest uppercase">Recompensas</p></div>
      <div className="flex justify-center gap-10">
        <div className="text-center"><div className="w-10 h-10 rounded-full flex items-center justify-center text-xl mx-auto mb-2" style={{background:"linear-gradient(135deg,#ffd700,#ff9800)",boxShadow:"0 0 16px rgba(255,215,0,0.5)"}}>🪙</div><div className="font-['Press_Start_2P'] text-2xl text-[#ff9800]">+{puntos}</div><div className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">Monedas</div></div>
        <div className="text-center"><div className="w-10 h-10 rounded-full flex items-center justify-center text-xl mx-auto mb-2" style={{background:"linear-gradient(135deg,#a78bfa,#7c3aed)",boxShadow:"0 0 16px rgba(167,139,250,0.5)"}}>⚡</div><div className="font-['Press_Start_2P'] text-2xl text-[#a78bfa]">+{Math.round(puntos*1.5)}</div><div className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">Experiencia</div></div>
      </div>
    </motion.div>
  );
}

export function ArmarCelula(){
  const music=useMusic(); const socket=useSocket();
  const [screen,setScreen]=useState<Screen>("splash");
  const [splashPct,setSplashPct]=useState(0); const [splashDone,setSplashDone]=useState(false);
  const [grado,setGrado]=useState(4); const [modo,setModo]=useState<Modo>("solo");
  const [playerName,setPlayerName]=useState("");
  const [settOpen,setSettOpen]=useState(false); const [exitConfirm,setExitConfirm]=useState(false);
  const [showRanking,setShowRanking]=useState(false);

  const [organelos,setOrganelos]=useState<Organelo[]>([]);
  const [actualIdx,setActualIdx]=useState(0);
  const [seleccionada,setSeleccionada]=useState<TipoCelula|null>(null);
  const [mostrarFeedback,setMostrarFeedback]=useState(false);
  const [puntos,setPuntos]=useState(0); const [puntosMulti,setPuntosMulti]=useState<Record<string,number>>({});
  const [correctas,setCorrectas]=useState(0); const [incorrectas,setIncorrectas]=useState(0);

  const multiState=socket.state;
  const estaEnLobby=modo==="multi"&&multiState.estado==="lobby";
  const hayError=modo==="multi"&&multiState.estado==="error";
  const modoRef=useRef(modo); const gradoRef=useRef(grado); const nameRef=useRef(playerName);
  modoRef.current=modo; gradoRef.current=grado; nameRef.current=playerName;

  useEffect(()=>{
    if(screen!=="splash")return;
    const dur=4000,t0=Date.now();
    const iv=setInterval(()=>{const p=Math.min(100,((Date.now()-t0)/dur)*100);setSplashPct(p);if(p>=100){clearInterval(iv);setSplashDone(true);setTimeout(()=>setScreen("config"),800);}},30);
    return()=>clearInterval(iv);
  },[screen]);
  useEffect(()=>{if(modoRef.current==="multi"&&multiState.estado==="jugando"&&screen!=="juego"&&nameRef.current.trim())iniciarJuego(gradoRef.current);},[multiState.estado]); // eslint-disable-line

  function iniciarJuego(g:number){
    const ids=PREGUNTAS_POR_GRADO[g]??PREGUNTAS_POR_GRADO[4];
    const qs=shuffle(ids.map(id=>TODOS_ORGANELOS.find(o=>o.id===id)!).filter(Boolean));
    setOrganelos(qs); setActualIdx(0); setSeleccionada(null); setMostrarFeedback(false);
    setPuntos(0); setCorrectas(0); setIncorrectas(0); setExitConfirm(false);
    setScreen("juego"); music.start();
  }

  function responder(tipo:TipoCelula){
    if(seleccionada||!organelos[actualIdx])return;
    const organelo=organelos[actualIdx];
    setSeleccionada(tipo); setMostrarFeedback(true);
    if(tipo===organelo.tipo){
      const pts=80; setPuntos(p=>p+pts); setCorrectas(c=>c+1);
      if(modo==="multi")setPuntosMulti(pm=>({...pm,[playerName]:(pm[playerName]??0)+pts}));
    }else{setIncorrectas(i=>i+1);}
    setTimeout(()=>{
      const next=actualIdx+1;
      if(next>=organelos.length){music.stop();setScreen("resultados");}
      else{setActualIdx(next);setSeleccionada(null);setMostrarFeedback(false);}
    },1800);
  }

  const organelo=organelos[actualIdx];
  const total=organelos.length;

  if(estaEnLobby&&multiState.sala)return<GameLobby state={multiState} nombrePropio={playerName} onIniciar={()=>{socket.iniciarJuego(multiState.sala!.codigo);iniciarJuego(grado);}} onSalir={()=>{socket.salirSala();setModo("solo");}} colorAccent="#228B22"/>;
  if(hayError)return<GameError mensaje={multiState.errorMsg} onReset={socket.resetError} colorAccent="#228B22"/>;
  if(screen==="splash")return<SplashScreen pct={splashPct} done={splashDone}/>;

  // ── RESULTADOS ──
  if(screen==="resultados"){
    const stars=incorrectas===0?3:incorrectas<=2?2:1;
    return(
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="w-full min-h-screen flex flex-col items-center px-4 py-10 overflow-y-auto" style={{background:"linear-gradient(135deg,#06091a 0%,#0a1a0a 50%,#06091a 100%)"}}>
        <div className="relative z-10 w-full max-w-lg">
          <motion.div initial={{scale:0,rotate:-15}} animate={{scale:1,rotate:0}} transition={{type:"spring",delay:0.1}} className="flex justify-center mb-5"><motion.span className="text-7xl" animate={{rotate:[0,10,-10,8,-8,0]}} transition={{delay:0.4,duration:0.6}}>🔬</motion.span></motion.div>
          <motion.h2 initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="font-['Press_Start_2P'] text-3xl mb-4 text-center" style={{background:"linear-gradient(135deg,#228B22,#00ff88)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>¡Biólogo!</motion.h2>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}} className="flex justify-center gap-2 mb-8">{[1,2,3].map(s=>(<motion.div key={s} initial={{scale:0}} animate={{scale:1}} transition={{delay:0.3+s*0.12,type:"spring",stiffness:300}}><Star size={36} className={s<=stars?"text-[#ffd700]":"text-gray-700"} fill={s<=stars?"#ffd700":"none"} style={s<=stars?{filter:"drop-shadow(0 0 8px rgba(255,215,0,0.6))"}:{}}/></motion.div>))}</motion.div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              {label:"Correctas",  val:correctas,  color:"#00ff88",bg:"rgba(0,255,136,0.06)",  border:"rgba(0,255,136,0.25)",  icon:<CheckCircle2 size={20}/>},
              {label:"Incorrectas",val:incorrectas, color:"#ff4757",bg:"rgba(255,71,87,0.06)",  border:"rgba(255,71,87,0.25)",  icon:<XCircle size={20}/>},
              {label:"Puntos",     val:puntos,      color:"#ffd700",bg:"rgba(255,215,0,0.06)",  border:"rgba(255,215,0,0.25)",  icon:<Star size={20}/>},
            ].map((s,i)=>(<motion.div key={s.label} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.4+i*0.1,type:"spring"}} className="rounded-2xl border-2 p-4 text-center" style={{background:s.bg,borderColor:s.border}}><div className="flex justify-center mb-2" style={{color:s.color}}>{s.icon}</div><div className="font-['Press_Start_2P'] text-xl mb-1" style={{color:s.color}}>{s.val}</div><div className="text-xs font-extrabold text-gray-500 tracking-widest uppercase">{s.label}</div></motion.div>))}
          </div>
          <Recompensas puntos={puntos} color="#228B22"/>
          <motion.button whileHover={{scale:1.02,y:-2}} whileTap={{scale:0.98}} onClick={()=>{music.stop();setScreen("config");}} className="w-full py-5 rounded-2xl font-['Press_Start_2P'] text-base text-white mb-3 flex items-center justify-center gap-3" style={{background:"linear-gradient(135deg,#228B22,#00ff88)",boxShadow:"0 4px 22px rgba(34,139,34,0.4)"}}><RotateCcw size={18}/> Jugar de nuevo</motion.button>
          <Link to="/games/science" className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-base text-gray-400 border-2 border-white/10 hover:border-white/25 hover:text-white transition-all"><ArrowLeft size={18}/> Menú principal</Link>
        </div>
      </motion.div>
    );
  }

  // ── CONFIG ──
  if(screen==="config")return(
    <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} className="w-full max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8"><Link to="/games/science" className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"><ArrowLeft size={22}/></Link><div><h1 className="font-['Press_Start_2P'] text-xl text-[#228B22]">ARMAR LA CÉLULA</h1><p className="text-gray-400 text-sm font-bold mt-1">Ciencias Naturales</p></div></div>
      <div className="relative overflow-hidden rounded-2xl border-2 border-[#228B22]/30 bg-[#0f1425] p-6 mb-5" style={{boxShadow:"0 4px 28px rgba(34,139,34,0.1)"}}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20" style={{background:"radial-gradient(circle,#228B22,transparent)",transform:"translate(30%,-30%)"}}/>
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl" style={{background:"rgba(34,139,34,0.15)",border:"1.5px solid rgba(34,139,34,0.35)"}}>🔬</div>
          <div>
            <p className="font-['Press_Start_2P'] text-xs text-[#228B22] mb-2">Armar la Célula</p>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">Se mostrará un organelo celular. ¡Decide si pertenece a la célula animal, vegetal, o a ambas!</p>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{background:"rgba(255,152,0,0.1)",color:"#ff9800",border:"1px solid rgba(255,152,0,0.25)"}}>🐾 Animal</span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{background:"rgba(34,139,34,0.1)",color:"#228B22",border:"1px solid rgba(34,139,34,0.25)"}}>🌿 Vegetal</span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{background:"rgba(0,229,255,0.1)",color:"#00e5ff",border:"1px solid rgba(0,229,255,0.25)"}}>🔵 Ambas</span>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-4"><p className="text-xs font-extrabold text-[#228B22] tracking-widest uppercase mb-3">Grado</p><div className="grid grid-cols-3 gap-2">{[4,5,6].map(g=>(<button key={g} onClick={()=>setGrado(g)} className="py-3 rounded-xl border-2 font-bold text-sm transition-all" style={{borderColor:grado===g?"#228B22":"rgba(255,255,255,0.1)",background:grado===g?"rgba(34,139,34,0.1)":"rgba(255,255,255,0.03)",color:grado===g?"#228B22":"#6b7280"}}>{g}to Grado</button>))}</div></div>
      <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-4"><p className="text-xs font-extrabold text-[#228B22] tracking-widest uppercase mb-3 flex items-center gap-2"><User size={13}/> Tu nombre</p><input className="w-full bg-white/4 border-2 border-white/10 rounded-xl px-4 py-3 text-white font-semibold outline-none focus:border-[#228B22]/60 transition-all placeholder:text-gray-600" placeholder="Escribe tu nombre..." value={playerName} onChange={e=>setPlayerName(e.target.value)} maxLength={20}/></div>
      <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-6">
        <p className="text-xs font-extrabold text-[#00ff88] tracking-widest uppercase mb-3 flex items-center gap-2"><Play size={13}/> Modo de juego</p>
        <div className="grid grid-cols-2 gap-2 mb-4"><button onClick={()=>setModo("solo")} className={`py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${modo==="solo"?"border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]":"border-white/10 bg-white/3 text-gray-400 hover:border-white/25"}`}><User size={15}/> Solitario</button><button onClick={()=>setModo("multi")} className={`py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${modo==="multi"?"border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa]":"border-white/10 bg-white/3 text-gray-400 hover:border-white/25"}`}><Users size={15}/> Multijugador</button></div>
        {modo==="multi"&&<MultiPanel nombreJugador={playerName} onNombreChange={setPlayerName} juego="armar_celula" grado={grado} jugadoresConectados={multiState.sala?.jugadores??[]} nombrePropio={playerName} onCrear={(n,j)=>{setPlayerName(j);socket.crearSala({nombre:n,nombreJugador:j,materia:"ciencias",grado,tiempoPorPregunta:9999,cantPreguntas:5});}} onUnirse={(c,j)=>{setPlayerName(j);socket.unirseASala(c,j);}} conectando={multiState.estado==="conectando"} colorAccent="#228B22"/>}
      </div>
      <motion.button whileHover={{scale:1.02,y:-2}} whileTap={{scale:0.98}} onClick={()=>modo==="solo"&&iniciarJuego(grado)} disabled={!playerName.trim()||(modo==="multi")} className="w-full py-5 rounded-2xl font-['Press_Start_2P'] text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed" style={{background:modo==="solo"?"linear-gradient(135deg,#228B22,#00ff88)":"linear-gradient(135deg,#a78bfa,#7c3aed)",boxShadow:modo==="solo"?"0 4px 24px rgba(34,139,34,0.4)":"0 4px 24px rgba(167,139,250,0.35)"}}>{modo==="solo"?"Comenzar":"Crea o únete a una sala arriba"}</motion.button>
    </motion.div>
  );

  // ── JUEGO ──
  if(!organelo)return null;
  return(
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="w-full min-h-screen flex flex-col relative overflow-hidden" style={{background:"linear-gradient(135deg,#06091a 0%,#0a1a0a 50%,#06091a 100%)"}}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden"><motion.div animate={{x:[0,40,0],y:[0,-30,0]}} transition={{duration:14,repeat:Infinity,ease:"easeInOut"}} className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-3xl opacity-30" style={{background:"radial-gradient(circle,rgba(34,139,34,0.15),transparent)"}}/></div>

      {/* Exit */}
      <AnimatePresence>{exitConfirm&&(<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{background:"rgba(0,0,0,0.88)",backdropFilter:"blur(12px)"}}><motion.div initial={{scale:0.82,opacity:0,y:24}} animate={{scale:1,opacity:1,y:0}} className="w-full max-w-xs rounded-3xl overflow-hidden" style={{background:"linear-gradient(145deg,#16111f,#0e0c1a)",border:"2px solid rgba(255,71,87,0.4)"}}><div className="px-7 pt-6 pb-7 flex flex-col items-center text-center gap-5"><div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background:"rgba(255,71,87,0.1)",border:"1.5px solid rgba(255,71,87,0.35)"}}><AlertTriangle size={30} className="text-[#ff4757]"/></div><div><h3 className="font-['Press_Start_2P'] text-sm text-white mb-2">Salir del juego</h3><p className="text-gray-500 text-xs">Tu progreso se perderá.</p></div><div className="w-full flex flex-col gap-2.5"><button onClick={()=>{music.stop();setExitConfirm(false);setScreen("config");}} className="w-full py-3.5 rounded-2xl font-['Press_Start_2P'] text-xs text-white" style={{background:"linear-gradient(135deg,#ff4757,#c0392b)"}}>Sí, salir</button><button onClick={()=>setExitConfirm(false)} className="w-full py-3.5 rounded-2xl font-bold text-sm text-gray-400" style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)"}}>Continuar</button></div></div></motion.div></motion.div>)}</AnimatePresence>
      {/* Settings */}
      <AnimatePresence>{settOpen&&(<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center px-4" onClick={()=>setSettOpen(false)}><motion.div initial={{scale:0.88,opacity:0}} animate={{scale:1,opacity:1}} className="w-full max-w-sm rounded-2xl overflow-hidden" style={{background:"#12111e",border:"2px solid rgba(34,139,34,0.3)"}} onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5"><p className="font-['Press_Start_2P'] text-xs text-white">Configuración</p><button onClick={()=>setSettOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-gray-400"><X size={14}/></button></div><div className="px-5 py-4 space-y-3">{[{label:music.muted?"Activar música":"Silenciar música",icon:music.muted?<Volume2 size={14}/>:<VolumeX size={14}/>,action:music.toggleMute},{label:"Salir del juego",icon:<LogOut size={14}/>,action:()=>{setSettOpen(false);setExitConfirm(true);},danger:true}].map((a,i)=>(<button key={i} onClick={a.action} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold border ${(a as any).danger?"text-[#ff4757] border-[#ff4757]/20 bg-[#ff4757]/5":"text-gray-300 border-white/7 bg-white/3"}`}>{a.icon}{a.label}</button>))}<button onClick={()=>setSettOpen(false)} className="w-full py-3 rounded-xl font-bold text-sm text-white" style={{background:"linear-gradient(135deg,#228B22,#00ff88)"}}>Cerrar</button></div></motion.div></motion.div>)}</AnimatePresence>
      <AnimatePresence>{showRanking&&modo==="multi"&&<RankingPanel jugadores={(multiState.sala?.jugadores??[]).map(j=>({...j,puntos:j.nombre===playerName?puntos:(puntosMulti[j.nombre]??0),correctas:j.nombre===playerName?correctas:0}))} nombrePropio={playerName} onClose={()=>setShowRanking(false)}/>}</AnimatePresence>

      {/* TOPBAR */}
      <div className="relative z-10 flex items-center gap-2 px-3 md:px-4 py-2 border-b border-white/5" style={{background:"rgba(6,9,26,0.95)",backdropFilter:"blur(16px)"}}>
        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">{modo==="multi"&&multiState.sala&&multiState.sala.jugadores.length>0?(<div className="flex items-center gap-2 overflow-x-auto pb-0.5 flex-1"><MiniJugadores jugadores={multiState.sala.jugadores} nombrePropio={playerName}/></div>):(<div className="flex items-center gap-2 min-w-0"><div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:"rgba(34,139,34,0.18)",border:"1.5px solid rgba(34,139,34,0.4)"}}><User size={14} style={{color:"#228B22"}}/></div><div className="min-w-0"><p className="text-xs font-extrabold text-white truncate leading-tight">{playerName}</p><p className="text-[10px] text-gray-500 font-bold leading-tight">Célula · {grado}to</p></div></div>)}</div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-center"><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Organelo</p><p className="font-['Press_Start_2P'] text-sm text-[#228B22] leading-tight">{actualIdx+1}<span className="text-gray-600 text-xs">/{total}</span></p></div>
          <div className="w-px h-6 bg-white/10"/>
          <div className="text-center"><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Pts</p><p className="font-['Press_Start_2P'] text-sm text-[#ffd700] leading-tight">{puntos}</p></div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0 ml-2">{modo==="multi"?(<><button onClick={music.toggleMute} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{background:"rgba(34,139,34,0.08)",borderColor:"rgba(34,139,34,0.22)",color:"#228B22"}}>{music.muted?<Volume2 size={14}/>:<VolumeX size={14}/>}</button><button onClick={()=>setShowRanking(r=>!r)} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{background:"rgba(255,215,0,0.08)",borderColor:"rgba(255,215,0,0.4)",color:"#ffd700"}}><Trophy size={14}/></button><button onClick={()=>{socket.salirSala();music.stop();setModo("solo");setScreen("config");}} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{background:"rgba(255,71,87,0.08)",borderColor:"rgba(255,71,87,0.3)",color:"#ff4757"}}><LogOut size={14}/></button></>):(<button onClick={()=>setSettOpen(true)} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{background:"rgba(34,139,34,0.08)",borderColor:"rgba(34,139,34,0.22)",color:"#228B22"}}><Settings size={14}/></button>)}</div>
      </div>
      <div className="relative z-10 w-full h-1.5" style={{background:"rgba(255,255,255,0.04)"}}><div className="h-full transition-all duration-500" style={{width:`${(actualIdx/Math.max(1,total))*100}%`,background:"linear-gradient(90deg,#228B22,#00ff88)",boxShadow:"0 0 10px rgba(34,139,34,0.6)"}}/></div>

      {/* CONTENIDO */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-xl mx-auto w-full gap-6">
        {/* Card organelo */}
        <AnimatePresence mode="wait">
          <motion.div key={organelo.id} initial={{opacity:0,scale:0.8,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.8,y:-20}} transition={{type:"spring",stiffness:300,damping:25}}
            className="w-full rounded-3xl border-2 p-8 text-center"
            style={{background:"linear-gradient(135deg,rgba(34,139,34,0.1),rgba(0,229,255,0.05))",borderColor:"rgba(34,139,34,0.35)",boxShadow:"0 8px 40px rgba(34,139,34,0.15)"}}>
            <motion.div className="text-6xl mb-5" animate={{scale:[1,1.12,1]}} transition={{duration:2,repeat:Infinity,ease:"easeInOut"}}>{organelo.emoji}</motion.div>
            <h2 className="font-['Press_Start_2P'] text-xl text-[#228B22] mb-3">{organelo.nombre}</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">{organelo.funcion}</p>
            <p className="text-gray-500 text-xs italic">{organelo.dato}</p>
          </motion.div>
        </AnimatePresence>

        <p className="text-gray-400 font-bold text-sm text-center">Este organelo pertenece a la célula...</p>

        {/* Opciones */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {(Object.entries(TIPO_CFG) as [TipoCelula,typeof TIPO_CFG[TipoCelula]][]).map(([tipo,cfg])=>{
            const esSel=seleccionada===tipo;
            const esCorr=mostrarFeedback&&tipo===organelo.tipo;
            const esWrong=mostrarFeedback&&esSel&&tipo!==organelo.tipo;
            return(
              <motion.button key={tipo} whileHover={!seleccionada?{scale:1.05,y:-3}:{}} whileTap={!seleccionada?{scale:0.95}:{}}
                onClick={()=>responder(tipo)} disabled={!!seleccionada}
                className="flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all"
                style={{
                  background:esCorr?"rgba(0,255,136,0.12)":esWrong?"rgba(255,71,87,0.12)":esSel?`${cfg.color}18`:`${cfg.color}08`,
                  borderColor:esCorr?"#00ff88":esWrong?"#ff4757":esSel?cfg.color:`${cfg.color}44`,
                  boxShadow:esCorr?"0 0 20px rgba(0,255,136,0.3)":esWrong?"0 0 20px rgba(255,71,87,0.3)":esSel?`0 0 20px ${cfg.color}44`:"none",
                }}>
                <span className="text-3xl">{cfg.emoji}</span>
                <span className="font-['Press_Start_2P'] text-[10px] text-center" style={{color:esCorr?"#00ff88":esWrong?"#ff4757":cfg.color}}>{cfg.label}</span>
                {esCorr&&<CheckCircle2 size={16} className="text-[#00ff88]"/>}
                {esWrong&&<XCircle size={16} className="text-[#ff4757]"/>}
              </motion.button>
            );
          })}
        </div>

        {/* Feedback explicación */}
        <AnimatePresence>
          {mostrarFeedback&&(
            <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              className={`w-full p-4 rounded-2xl border-2 text-sm font-bold text-center ${seleccionada===organelo.tipo?"bg-[#00ff88]/8 border-[#00ff88]/30 text-[#00ff88]":"bg-[#ff9800]/8 border-[#ff9800]/30 text-[#ff9800]"}`}>
              {seleccionada===organelo.tipo?"✓ ¡Correcto!":"✗ Incorrecto"} — {TIPO_CFG[organelo.tipo].emoji} {organelo.nombre} es de célula <strong>{TIPO_CFG[organelo.tipo].label}</strong>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
