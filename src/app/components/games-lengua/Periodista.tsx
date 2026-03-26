const API = import.meta.env.VITE_API_URL ?? "https://finalproyect-production-3837.up.railway.app";

// Periodista.tsx — Lengua 4to-6to
// Lee una noticia y responde preguntas de comprensión lectora
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Play, X, Volume2, VolumeX, RotateCcw,
  Trophy, Star, CheckCircle2, XCircle, Settings,
  User, Users, LogOut, Clock
} from "lucide-react";
import { Link, useNavigate} from "react-router";
import logoImg from "../../../assets/logo.png";
import { useSocket } from "../../../lib/useSocket";
import { useAuth } from "../../AuthContext";
import { useMonedas } from "../../../hooks/useMonedas";
import { GameLobby, GameError, GameRankingFinal, MultiPanel, RankingPanel } from "../GameShared";
import { MiniJugadores } from "../MultiLobby";

type Screen="splash"|"config"|"juego"|"resultados";
type Modo="solo"|"multi";

interface Pregunta { id:string; texto:string; opciones:string[]; correcta:number; explicacion:string; }
interface Noticia  { id:string; titulo:string; cuerpo:string; emoji:string; preguntas:Pregunta[]; }

const NOTICIAS: Record<number, Noticia[]> = {
  4: [
    { id:"tortugas", emoji:"🐢", titulo:"Las tortugas marinas en peligro",
      cuerpo:"Las tortugas marinas son animales que viven en los océanos de todo el mundo. Desafortunadamente, estas hermosas criaturas están en peligro de extinción. Los científicos han descubierto que la contaminación de los océanos con plásticos es una de las principales causas de su muerte. Cada año, miles de tortugas mueren al confundir las bolsas plásticas con medusas, su alimento favorito. Organizaciones de conservación trabajan para proteger las playas donde las tortugas ponen sus huevos.",
      preguntas:[
        {id:"1",texto:"¿Cuál es el tema principal de la noticia?",opciones:["Los peces del océano","Las tortugas marinas en peligro","La contaminación del aire","Los científicos marinos"],correcta:1,explicacion:"La noticia trata sobre el peligro de extinción de las tortugas marinas."},
        {id:"2",texto:"¿Por qué mueren muchas tortugas?",opciones:["Por el frío del agua","Por otros peces","Por confundir plásticos con medusas","Por nadar muy rápido"],correcta:2,explicacion:"Las tortugas confunden las bolsas plásticas con medusas, su alimento."},
        {id:"3",texto:"¿Qué hacen las organizaciones de conservación?",opciones:["Venden tortugas","Protegen las playas de desove","Limpian los océanos de medusas","Estudian los peces"],correcta:1,explicacion:"Las organizaciones protegen las playas donde las tortugas ponen sus huevos."},
      ]
    },
    { id:"parque", emoji:"🌳", titulo:"Nuevo parque natural en el norte",
      cuerpo:"El Gobierno Dominicano anunció la creación de un nuevo parque natural en la región norte del país. El área, de más de cinco mil hectáreas, alberga especies únicas de flora y fauna que no se encuentran en ningún otro lugar del mundo. Los guardaparques ya están trabajando para proteger este hermoso ecosistema. Los estudiantes podrán visitar el parque en excursiones educativas a partir del próximo año escolar. La entrada será gratuita para todos los centros educativos del país.",
      preguntas:[
        {id:"1",texto:"¿Dónde se ubica el nuevo parque?",opciones:["Región sur","Región norte","Región este","La capital"],correcta:1,explicacion:"El parque está ubicado en la región norte del país."},
        {id:"2",texto:"¿Cuántas hectáreas tiene el parque?",opciones:["Más de mil","Más de tres mil","Más de cinco mil","Más de diez mil"],correcta:2,explicacion:"El área tiene más de cinco mil hectáreas."},
        {id:"3",texto:"¿Cómo será la entrada para los centros educativos?",opciones:["Cara","Con descuento","Gratuita","Solo para universidades"],correcta:2,explicacion:"La entrada será gratuita para todos los centros educativos."},
      ]
    },
  ],
  5: [
    { id:"app", emoji:"💻", titulo:"Estudiantes crean app educativa",
      cuerpo:"Un grupo de estudiantes de quinto grado de una escuela de Santo Domingo desarrolló una aplicación móvil que ayuda a los niños con dificultades de aprendizaje. El proyecto, titulado 'Aprende Fácil', utiliza juegos interactivos y animaciones para enseñar matemáticas y lectura. Los jóvenes programadores trabajaron durante seis meses con la guía de sus profesores de tecnología. La aplicación ya fue descargada más de dos mil veces en su primer mes de lanzamiento. El proyecto fue reconocido por el Ministerio de Educación como uno de los más innovadores del año.",
      preguntas:[
        {id:"1",texto:"¿Qué crearon los estudiantes?",opciones:["Un videojuego","Una aplicación educativa","Un robot","Una página web"],correcta:1,explicacion:"Los estudiantes desarrollaron una aplicación móvil educativa llamada 'Aprende Fácil'."},
        {id:"2",texto:"¿Cuánto tiempo tardaron en el proyecto?",opciones:["Un mes","Tres meses","Seis meses","Un año"],correcta:2,explicacion:"Los jóvenes trabajaron durante seis meses con sus profesores."},
        {id:"3",texto:"¿Cuántas descargas tuvo en el primer mes?",opciones:["Más de quinientas","Más de mil","Más de dos mil","Más de cinco mil"],correcta:2,explicacion:"La aplicación fue descargada más de dos mil veces en su primer mes."},
        {id:"4",texto:"¿Quién reconoció el proyecto?",opciones:["El presidente","La UNESCO","El Ministerio de Educación","Una universidad"],correcta:2,explicacion:"El Ministerio de Educación reconoció el proyecto como uno de los más innovadores."},
      ]
    },
    { id:"coral", emoji:"🐠", titulo:"Restauración del arrecife de coral",
      cuerpo:"Científicos dominicanos y voluntarios internacionales están trabajando juntos para restaurar los arrecifes de coral en las costas del país. Estos ecosistemas submarinos albergan el 25% de todas las especies marinas del mundo, aunque solo cubren el 1% de los océanos. El proyecto utiliza una técnica innovadora de trasplante de corales criados en laboratorios. En los últimos tres años, el equipo ha transplantado más de diez mil fragmentos de coral. Los expertos esperan que en cinco años los arrecifes estén completamente recuperados.",
      preguntas:[
        {id:"1",texto:"¿Qué porcentaje de especies marinas albergan los arrecifes?",opciones:["El 1%","El 10%","El 25%","El 50%"],correcta:2,explicacion:"Los arrecifes albergan el 25% de todas las especies marinas mundiales."},
        {id:"2",texto:"¿Qué técnica usa el proyecto?",opciones:["Buceo profundo","Trasplante de corales de laboratorio","Fotografía submarina","Limpieza manual"],correcta:1,explicacion:"El proyecto usa trasplante de corales criados en laboratorios."},
        {id:"3",texto:"¿Cuántos fragmentos se han transplantado?",opciones:["Más de mil","Más de cinco mil","Más de diez mil","Más de cien mil"],correcta:2,explicacion:"En tres años se han transplantado más de diez mil fragmentos de coral."},
        {id:"4",texto:"¿En cuántos años esperan recuperar los arrecifes?",opciones:["En un año","En dos años","En cinco años","En diez años"],correcta:2,explicacion:"Los expertos esperan recuperación completa en cinco años."},
      ]
    },
  ],
  6: [
    { id:"clima", emoji:"🌍", titulo:"Cambio climático: acción urgente",
      cuerpo:"Los científicos del Panel Intergubernamental sobre el Cambio Climático (IPCC) publicaron un informe que señala que el planeta podría superar el umbral de 1.5°C de calentamiento global antes del año 2030 si no se toman medidas inmediatas. El calentamiento global está provocando fenómenos meteorológicos extremos como huracanes más intensos, sequías prolongadas e inundaciones devastadoras. Los países del Caribe, incluida la República Dominicana, son especialmente vulnerables debido a su posición geográfica y a su dependencia económica del turismo costero. La transición hacia energías renovables y la reducción de emisiones de carbono son fundamentales para mitigar estos efectos.",
      preguntas:[
        {id:"1",texto:"¿Qué organización publicó el informe?",opciones:["ONU","IPCC","NASA","UNESCO"],correcta:1,explicacion:"El informe fue publicado por el IPCC (Panel Intergubernamental sobre Cambio Climático)."},
        {id:"2",texto:"¿Cuándo podría superarse el umbral de 1.5°C?",opciones:["Antes de 2025","Antes de 2030","Antes de 2050","Antes de 2100"],correcta:1,explicacion:"El informe advierte que podría superarse antes del año 2030."},
        {id:"3",texto:"¿Por qué el Caribe es especialmente vulnerable?",opciones:["Por tener más fábricas","Por su posición y economía turística costera","Por consumir más energía","Por tener más población"],correcta:1,explicacion:"El Caribe es vulnerable por su posición geográfica y dependencia del turismo costero."},
        {id:"4",texto:"¿Qué solución se menciona en el texto?",opciones:["Construir más fábricas","Aumentar el turismo","Transición a energías renovables","Prohibir los autos"],correcta:2,explicacion:"La transición hacia energías renovables es una de las soluciones mencionadas."},
      ]
    },
  ],
};

// ── MÚSICA ──
class MusicEngine {
  private ac:AudioContext|null=null;private mg:GainNode|null=null;private mug:GainNode|null=null;private running=false;
  start(){if(this.running)return;try{this.ac=new(window.AudioContext||(window as any).webkitAudioContext)();this.mg=this.ac.createGain();this.mug=this.ac.createGain();this.mg.gain.value=0.08;this.mug.gain.value=1;this.mg.connect(this.mug);this.mug.connect(this.ac.destination);this.running=true;this.loop();}catch(_){}}
  stop(){this.running=false;try{this.ac?.close();}catch(_){}this.ac=null;this.mg=null;this.mug=null;}
  setMuted(m:boolean){if(!this.mug||!this.ac)return;this.mug.gain.linearRampToValueAtTime(m?0:1,this.ac.currentTime+0.3);}
  private loop(){
    const s=[[440,523.3,659.3],[493.9,587.3,698.5],[523.3,440,523.3]];let ci=0;
    const play=()=>{if(!this.running||!this.ac||!this.mg)return;s[ci%s.length].forEach((f,vi)=>{if(!this.ac||!this.mg)return;const o=this.ac.createOscillator(),e=this.ac.createGain();o.type="triangle";o.frequency.value=f;o.connect(e);e.connect(this.mg);const t=this.ac.currentTime+vi*0.18,d=0.14;e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(0.28,t+0.02);e.gain.exponentialRampToValueAtTime(0.001,t+d);o.start(t);o.stop(t+d+0.05);});ci++;setTimeout(play,2500);};play();
  }
}
function useMusic(){const e=useRef(new MusicEngine());const [muted,setMuted]=useState(false);useEffect(()=>()=>e.current.stop(),[]);const start=useCallback(()=>e.current.start(),[]);const stop=useCallback(()=>{e.current.stop();setMuted(false);},[]);const toggleMute=useCallback(()=>setMuted(m=>{const n=!m;e.current.setMuted(n);return n;}),[]);return{start,stop,toggleMute,muted};}

function SplashScreen({pct,done}:{pct:number;done:boolean}){
  return(
    <motion.div initial={{opacity:1}} exit={{opacity:0}} transition={{duration:0.9}}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{background:"radial-gradient(ellipse 100% 80% at 50% 0%,#0e082a 0%,#07091a 55%,#000 100%)"}}>
      {[...Array(7)].map((_,i)=>(<motion.div key={i} className="absolute rounded-full pointer-events-none"
        style={{width:2+(i%3)*2,height:2+(i%3)*2,left:`${8+i*13}%`,top:`${15+(i%4)*17}%`,background:["#DAA520","#ff9800","#00e5ff","#9b44ff","#00ff88","#ffd700","#ff4757"][i]}}
        animate={{y:[0,-28,0],opacity:[0.2,0.7,0.2]}} transition={{duration:2.8+i*0.4,repeat:Infinity,delay:i*0.35,ease:"easeInOut"}}/>))}
      <motion.div animate={{opacity:[0.3,0.65,0.3],scale:[1,1.08,1]}} transition={{duration:4,repeat:Infinity}}
        className="absolute pointer-events-none"
        style={{width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(155,68,255,0.12) 0%,rgba(218,165,32,0.07) 40%,transparent 70%)",top:"50%",left:"50%",transform:"translate(-50%,-52%)"}}/>
      <AnimatePresence mode="wait">
        {!done?(
          <motion.div key="in" initial={{scale:1.5,opacity:0}} animate={{scale:1,opacity:1}} transition={{duration:0.85,ease:[0.16,1,0.3,1]}} className="flex flex-col items-center">
            <motion.div className="relative mb-2" animate={{y:[0,-7,0]}} transition={{duration:3.5,repeat:Infinity,ease:"easeInOut"}}>
              <motion.div animate={{scale:[1,1.3,1],opacity:[0.5,0.9,0.5]}} transition={{duration:2.5,repeat:Infinity}}
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{background:"radial-gradient(circle,rgba(218,165,32,0.25) 0%,rgba(155,68,255,0.12) 50%,transparent 70%)",transform:"scale(1.8)"}}/>
              <img src={logoImg} alt="Saberix" className="w-36 h-36 md:w-44 md:h-44 object-contain relative z-10"
                style={{filter:"drop-shadow(0 0 28px rgba(218,165,32,0.65)) drop-shadow(0 0 55px rgba(155,68,255,0.3))"}}/>
            </motion.div>
            <div className="flex items-center gap-0.5 mt-1 mb-2">
              {["S","A","B","E","R","I","X"].map((l,i)=>{const c=["#ff4757","#ff9800","#ffd700","#00ff88","#00e5ff","#a78bfa","#ff4757"][i];return(
                <motion.span key={i} initial={{opacity:0,y:-18,scale:0.6}} animate={{opacity:1,y:0,scale:1}} transition={{delay:0.5+i*0.07,type:"spring",stiffness:280,damping:17}}
                  className="font-['Press_Start_2P'] text-3xl md:text-4xl font-black leading-none" style={{color:c,textShadow:`0 0 20px ${c}bb,0 0 40px ${c}44`}}>{l}</motion.span>
              );})}
            </div>
            <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:1.3}} className="flex items-center gap-2 mb-8">
              <div className="h-px w-10 rounded-full" style={{background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.2))"}}/>
              <p className="text-xs md:text-sm font-bold tracking-[0.25em] uppercase" style={{color:"rgba(255,255,255,0.3)"}}>Aprende Jugando</p>
              <div className="h-px w-10 rounded-full" style={{background:"linear-gradient(90deg,rgba(255,255,255,0.2),transparent)"}}/>
            </motion.div>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.6}} className="w-48 md:w-64">
              <div className="flex justify-between mb-1.5">
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{color:"rgba(255,255,255,0.15)"}}>Cargando</span>
                <span className="text-[10px] font-bold" style={{color:"rgba(218,165,32,0.5)"}}>{Math.round(pct)}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.05)"}}>
                <div className="h-full rounded-full" style={{width:`${pct}%`,background:"linear-gradient(90deg,#ff4757,#ff9800,#ffd700,#00ff88,#00e5ff,#a78bfa)",boxShadow:"0 0 10px rgba(0,229,255,0.4)",transition:"width 0.04s linear"}}/>
              </div>
            </motion.div>
          </motion.div>
        ):(
          <motion.div key="out" initial={{scale:1,opacity:1}} animate={{scale:0.2,opacity:0,y:-90}} transition={{duration:0.65,ease:[0.4,0,1,1]}} className="flex flex-col items-center">
            <img src={logoImg} alt="" className="w-36 h-36 object-contain" style={{filter:"drop-shadow(0 0 25px rgba(218,165,32,0.5))"}}/>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Recompensas({puntos}:{puntos:number}){
  return(
    <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} transition={{delay:0.7}}
      className="rounded-2xl border-2 p-6 mb-6"
      style={{background:"linear-gradient(135deg,rgba(218,165,32,0.08),rgba(255,152,0,0.04))",borderColor:"rgba(218,165,32,0.3)"}}>
      <div className="flex items-center justify-center gap-2 mb-5">
        <Trophy size={15} className="text-[#ffd700]"/>
        <p className="text-sm font-extrabold text-[#ffd700] tracking-widest uppercase">Recompensas</p>
      </div>
      <div className="flex justify-center gap-10">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl mx-auto mb-2" style={{background:"linear-gradient(135deg,#ffd700,#ff9800)",boxShadow:"0 0 16px rgba(255,215,0,0.5)"}}>🪙</div>
          <div className="font-['Press_Start_2P'] text-2xl text-[#ff9800]">+{puntos}</div>
          <div className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">Monedas</div>
        </div>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl mx-auto mb-2" style={{background:"linear-gradient(135deg,#a78bfa,#7c3aed)",boxShadow:"0 0 16px rgba(167,139,250,0.5)"}}>⚡</div>
          <div className="font-['Press_Start_2P'] text-2xl text-[#a78bfa]">+{Math.round(puntos*1.5)}</div>
          <div className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">Experiencia</div>
        </div>
      </div>
    </motion.div>
  );
}

async function guardarResultado(data: { jugador: string; grado: number; puntos: number; correctas: number; incorrectas: number; tiempo_seg: number; modo: string; }) {
  try { await fetch(`${API}/api/resultados_juegos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, juego: "periodista", materia: "lengua" }) }); } catch (_) {}
}

export function Periodista(){
  const { user } = useAuth();
  const { agregarMonedas } = useMonedas();
  const navigate = useNavigate();
  const music=useMusic(); const socket=useSocket();
  const [screen,setScreen]=useState<Screen>("splash");
  const [splashPct,setSplashPct]=useState(0); const [splashDone,setSplashDone]=useState(false);
  const [grado,setGrado]=useState(4); const [modo,setModo]=useState<Modo>("solo");
  const [playerName,setPlayerName]=useState("");
  // Prellenar nombre con el de la cuenta
  useEffect(() => { if (user?.nombre) setPlayerName(user.nombre); }, [user]);
  const [settOpen,setSettOpen]=useState(false); const [showRanking,setShowRanking]=useState(false);

  const [noticiaIdx,setNoticiaIdx]=useState(0);
  const [noticia,setNoticia]=useState<Noticia|null>(null);
  const [pregIdx,setPregIdx]=useState(0);
  const [seleccionada,setSeleccionada]=useState<number|null>(null);
  const [mostrarFeedback,setMostrarFeedback]=useState(false);
  const [puntos,setPuntos]=useState(0); const [puntosMulti,setPuntosMulti]=useState<Record<string,number>>({});
  const [correctas,setCorrectas]=useState(0); const [incorrectas,setIncorrectas]=useState(0);
  const [tiempoSeg,setTiempoSeg]=useState(0);
  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null);

  const multiState=socket.state;
  if (!user) { navigate("/login"); return null; }

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
  useEffect(()=>{
    if(screen==="juego"){
      timerRef.current=setInterval(()=>setTiempoSeg(t=>t+1),1000);
    }
    return()=>{if(timerRef.current)clearInterval(timerRef.current);};
  },[screen]);

  function iniciarJuego(g:number){
    const noticias=NOTICIAS[g]??NOTICIAS[4];
    const n=noticias[0]; setNoticia(n); setNoticiaIdx(0);
    setPregIdx(0); setSeleccionada(null); setMostrarFeedback(false);
    setPuntos(0); setCorrectas(0); setIncorrectas(0); setTiempoSeg(0);
    setScreen("juego"); music.start();
  }

  function responder(opcion:number){
    if(seleccionada!==null||!noticia)return;
    const preg=noticia.preguntas[pregIdx];
    setSeleccionada(opcion); setMostrarFeedback(true);
    if(opcion===preg.correcta){
      const pts=Math.max(20,100-tiempoSeg*2);
      setPuntos(p=>p+pts); setCorrectas(c=>c+1);
      if(modo==="multi")setPuntosMulti(pm=>({...pm,[playerName]:(pm[playerName]??0)+pts}));
    }else{setIncorrectas(i=>i+1);}
    setTimeout(()=>{
      const nextPreg=pregIdx+1;
      if(nextPreg>=noticia.preguntas.length){
        // siguiente noticia o fin
        const noticias=NOTICIAS[grado]??NOTICIAS[4];
        const nextNoticia=noticiaIdx+1;
        if(nextNoticia>=noticias.length){
          if(timerRef.current)clearInterval(timerRef.current);
          music.stop(); agregarMonedas(puntos); guardarResultado({jugador:playerName||"Anónimo",grado,puntos,correctas,incorrectas,tiempo_seg:tiempoSeg,modo}); setScreen("resultados");
        }else{
          const n=noticias[nextNoticia]; setNoticia(n); setNoticiaIdx(nextNoticia);
          setPregIdx(0); setSeleccionada(null); setMostrarFeedback(false);
        }
      }else{setPregIdx(nextPreg); setSeleccionada(null); setMostrarFeedback(false);}
    },1800);
  }

  function fmtT(s:number){return`${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;}

  if(estaEnLobby&&multiState.sala)return(
    <GameLobby state={multiState} nombrePropio={playerName}
      onIniciar={()=>{socket.iniciarJuego(multiState.sala!.codigo);iniciarJuego(grado);}}
      onSalir={()=>{socket.salirSala();setModo("solo");}} colorAccent="#DAA520"/>
  );
  if(hayError)return<GameError mensaje={multiState.errorMsg} onReset={socket.resetError} colorAccent="#DAA520"/>;
  if(screen==="splash")return<SplashScreen pct={splashPct} done={splashDone}/>;

  // ── RESULTADOS ──
  if(screen==="resultados"){
    const pct=Math.round((correctas/Math.max(1,correctas+incorrectas))*100);
    const stars=pct>=90?3:pct>=70?2:1;
    return(
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="w-full min-h-screen flex flex-col items-center px-4 py-10 overflow-y-auto"
        style={{background:"linear-gradient(135deg,#06091a 0%,#1a1206 50%,#06091a 100%)"}}>
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {["#DAA520","#ffd700","#ff9800","#00e5ff","#a78bfa","#00ff88"].map((c,i)=>(
            <motion.div key={i} className="absolute rounded-full" style={{width:5,height:5,left:`${10+i*15}%`,top:`${5+(i%3)*15}%`,background:c}}
              animate={{y:[0,80,0],opacity:[0,1,0],scale:[0.5,1.5,0.5]}} transition={{duration:3+i*0.4,repeat:Infinity,delay:i*0.3}}/>
          ))}
        </div>
        <div className="relative z-10 w-full max-w-lg">
          <motion.div initial={{scale:0,rotate:-15}} animate={{scale:1,rotate:0}} transition={{type:"spring",delay:0.1}} className="flex justify-center mb-5">
            <motion.span className="text-7xl" animate={{rotate:[0,10,-10,8,-8,0]}} transition={{delay:0.4,duration:0.6}}>📰</motion.span>
          </motion.div>
          <motion.h2 initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
            className="font-['Press_Start_2P'] text-3xl mb-4 text-center"
            style={{background:"linear-gradient(135deg,#DAA520,#ff9800)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            ¡Gran Periodista!
          </motion.h2>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}} className="flex justify-center gap-2 mb-8">
            {[1,2,3].map(s=>(<motion.div key={s} initial={{scale:0}} animate={{scale:1}} transition={{delay:0.3+s*0.12,type:"spring",stiffness:300}}>
              <Star size={36} className={s<=stars?"text-[#ffd700]":"text-gray-700"} fill={s<=stars?"#ffd700":"none"} style={s<=stars?{filter:"drop-shadow(0 0 8px rgba(255,215,0,0.6))"}:{}}/>
            </motion.div>))}
          </motion.div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              {label:"Correctas", val:correctas,      color:"#00ff88",bg:"rgba(0,255,136,0.06)",  border:"rgba(0,255,136,0.25)",  icon:<CheckCircle2 size={20}/>},
              {label:"Tiempo",    val:fmtT(tiempoSeg),color:"#00e5ff",bg:"rgba(0,229,255,0.06)", border:"rgba(0,229,255,0.25)",  icon:<Clock size={20}/>},
              {label:"Puntos",    val:puntos,          color:"#ffd700",bg:"rgba(255,215,0,0.06)", border:"rgba(255,215,0,0.25)",  icon:<Star size={20}/>},
            ].map((s,i)=>(
              <motion.div key={s.label} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.4+i*0.1,type:"spring"}}
                className="rounded-2xl border-2 p-4 text-center" style={{background:s.bg,borderColor:s.border}}>
                <div className="flex justify-center mb-2" style={{color:s.color}}>{s.icon}</div>
                <div className="font-['Press_Start_2P'] text-xl mb-1" style={{color:s.color}}>{s.val}</div>
                <div className="text-xs font-extrabold text-gray-500 tracking-widest uppercase">{s.label}</div>
              </motion.div>
            ))}
          </div>
          <Recompensas puntos={puntos}/>
          <motion.button whileHover={{scale:1.02,y:-2}} whileTap={{scale:0.98}} onClick={()=>{music.stop();setScreen("config");}}
            className="w-full py-5 rounded-2xl font-['Press_Start_2P'] text-base text-white mb-3 flex items-center justify-center gap-3"
            style={{background:"linear-gradient(135deg,#DAA520,#ff9800)",boxShadow:"0 4px 22px rgba(218,165,32,0.4)"}}>
            <RotateCcw size={18}/> Jugar de nuevo
          </motion.button>
          <Link to="/games/language" className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-base text-gray-400 border-2 border-white/10 hover:border-white/25 hover:text-white transition-all">
            <ArrowLeft size={18}/> Menú principal
          </Link>
        </div>
      </motion.div>
    );
  }

  // ── CONFIG ──
  if(screen==="config")return(
    <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} className="w-full max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/games/language" className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"><ArrowLeft size={22}/></Link>
        <div><h1 className="font-['Press_Start_2P'] text-xl text-[#DAA520]">EL PERIODISTA</h1><p className="text-gray-400 text-sm font-bold mt-1">Comprensión Lectora</p></div>
      </div>
      <div className="relative overflow-hidden rounded-2xl border-2 border-[#DAA520]/30 bg-[#0f1425] p-6 mb-5" style={{boxShadow:"0 4px 28px rgba(218,165,32,0.1)"}}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20" style={{background:"radial-gradient(circle,#DAA520,transparent)",transform:"translate(30%,-30%)"}}/>
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl" style={{background:"rgba(218,165,32,0.15)",border:"1.5px solid rgba(218,165,32,0.35)"}}>📰</div>
          <div>
            <p className="font-['Press_Start_2P'] text-xs text-[#DAA520] mb-2">El Periodista</p>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">Lee la noticia con atención y responde las preguntas de comprensión. ¡Demuestra que entiendes lo que lees!</p>
            <div className="flex gap-2 flex-wrap">
              {["Comprensión","Lectura","Análisis"].map(t=>(
                <span key={t} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{background:"rgba(218,165,32,0.1)",color:"#DAA520",border:"1px solid rgba(218,165,32,0.25)"}}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-4">
        <p className="text-xs font-extrabold text-[#DAA520] tracking-widest uppercase mb-3">Grado</p>
        <div className="grid grid-cols-3 gap-2">
          {[4,5,6].map(g=>(
            <button key={g} onClick={()=>setGrado(g)} className="py-3 rounded-xl border-2 font-bold text-sm transition-all"
              style={{borderColor:grado===g?"#DAA520":"rgba(255,255,255,0.1)",background:grado===g?"rgba(218,165,32,0.1)":"rgba(255,255,255,0.03)",color:grado===g?"#DAA520":"#6b7280"}}>
              {g}to Grado</button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-4">
        <p className="text-xs font-extrabold text-[#DAA520] tracking-widest uppercase mb-3 flex items-center gap-2"><User size={13}/> Tu nombre</p>
        <input className="w-full bg-white/4 border-2 border-white/10 rounded-xl px-4 py-3 text-white font-semibold outline-none focus:border-[#DAA520]/60 transition-all placeholder:text-gray-600"
          disabled={!!user} placeholder="Escribe tu nombre..." value={playerName} onChange={e=>setPlayerName(e.target.value)} maxLength={20}/>
      </div>
      <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-6">
        <p className="text-xs font-extrabold text-[#00ff88] tracking-widest uppercase mb-3 flex items-center gap-2"><Play size={13}/> Modo de juego</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={()=>setModo("solo")} className={`py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${modo==="solo"?"border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]":"border-white/10 bg-white/3 text-gray-400 hover:border-white/25"}`}><User size={15}/> Solitario</button>
          <button onClick={()=>setModo("multi")} className={`py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${modo==="multi"?"border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa]":"border-white/10 bg-white/3 text-gray-400 hover:border-white/25"}`}><Users size={15}/> Multijugador</button>
        </div>
        {modo==="multi"&&(
          <MultiPanel nombreJugador={playerName} onNombreChange={setPlayerName} juego="periodista" grado={grado}
            jugadoresConectados={multiState.sala?.jugadores??[]} nombrePropio={playerName}
            onCrear={(n,j)=>{setPlayerName(j);socket.crearSala({nombre:n,nombreJugador:j,materia:"lengua",grado,tiempoPorPregunta:9999,cantPreguntas:5});}}
            onUnirse={(c,j)=>{setPlayerName(j);socket.unirseASala(c,j);}}
            conectando={multiState.estado==="conectando"} colorAccent="#DAA520"/>
        )}
      </div>
      <motion.button whileHover={{scale:1.02,y:-2}} whileTap={{scale:0.98}}
        onClick={()=>modo==="solo"&&iniciarJuego(grado)} disabled={!playerName.trim()||(modo==="multi")}
        className="w-full py-5 rounded-2xl font-['Press_Start_2P'] text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed"
        style={{background:modo==="solo"?"linear-gradient(135deg,#DAA520,#ff9800)":"linear-gradient(135deg,#a78bfa,#7c3aed)",boxShadow:modo==="solo"?"0 4px 24px rgba(218,165,32,0.4)":"0 4px 24px rgba(167,139,250,0.35)"}}>
        {modo==="solo"?"Comenzar":"Crea o únete a una sala arriba"}
      </motion.button>
    </motion.div>
  );

  // ── JUEGO ──
  if(!noticia)return null;
  const pregActual=noticia.preguntas[pregIdx];
  const totalPregs=(NOTICIAS[grado]??NOTICIAS[4]).reduce((a,n)=>a+n.preguntas.length,0);
  const pregRespondidas=(NOTICIAS[grado]??NOTICIAS[4]).slice(0,noticiaIdx).reduce((a,n)=>a+n.preguntas.length,0)+pregIdx;

  return(
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="w-full min-h-screen flex flex-col relative overflow-hidden"
      style={{background:"linear-gradient(135deg,#06091a 0%,#1a1206 50%,#06091a 100%)"}}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{x:[0,40,0],y:[0,-30,0]}} transition={{duration:14,repeat:Infinity,ease:"easeInOut"}}
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-3xl opacity-30"
          style={{background:"radial-gradient(circle,rgba(218,165,32,0.15),transparent)"}}/>
      </div>

      {/* Settings */}
      <AnimatePresence>
        {settOpen&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center px-4" onClick={()=>setSettOpen(false)}>
            <motion.div initial={{scale:0.88,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}} transition={{type:"spring",stiffness:300,damping:25}}
              className="w-full max-w-sm rounded-2xl overflow-hidden" style={{background:"#12111e",border:"2px solid rgba(218,165,32,0.3)"}} onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
                <p className="font-['Press_Start_2P'] text-xs text-white">Configuración</p>
                <button onClick={()=>setSettOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-gray-400"><X size={14}/></button>
              </div>
              <div className="px-5 py-4 space-y-3">
                {[
                  {label:music.muted?"Activar música":"Silenciar música",icon:music.muted?<Volume2 size={14}/>:<VolumeX size={14}/>,action:music.toggleMute},
                  {label:"Salir del juego",icon:<LogOut size={14}/>,action:()=>{music.stop();if(timerRef.current)clearInterval(timerRef.current);setScreen("config");setSettOpen(false);},danger:true},
                ].map((a,i)=>(
                  <button key={i} onClick={a.action} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold border ${(a as any).danger?"text-[#ff4757] border-[#ff4757]/20 bg-[#ff4757]/5":"text-gray-300 border-white/7 bg-white/3 hover:text-[#DAA520] hover:border-[#DAA520]/25"}`}>{a.icon}{a.label}</button>
                ))}
                <button onClick={()=>setSettOpen(false)} className="w-full py-3 rounded-xl font-bold text-sm text-white" style={{background:"linear-gradient(135deg,#DAA520,#ff9800)"}}>Cerrar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRanking&&modo==="multi"&&(
          <RankingPanel
            jugadores={(multiState.sala?.jugadores??[]).map(j=>({...j,puntos:j.nombre===playerName?puntos:(puntosMulti[j.nombre]??0),correctas:j.nombre===playerName?correctas:0}))}
            nombrePropio={playerName} onClose={()=>setShowRanking(false)}/>
        )}
      </AnimatePresence>

      {/* TOPBAR */}
      <div className="relative z-10 flex items-center gap-2 px-3 md:px-4 py-2 border-b border-white/5" style={{background:"rgba(6,9,26,0.95)",backdropFilter:"blur(16px)"}}>
        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
          {modo==="multi"&&multiState.sala&&multiState.sala.jugadores.length>0?(
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 flex-1"><MiniJugadores jugadores={multiState.sala.jugadores} nombrePropio={playerName}/></div>
          ):(
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:"rgba(218,165,32,0.18)",border:"1.5px solid rgba(218,165,32,0.4)"}}><User size={14} style={{color:"#DAA520"}}/></div>
              <div className="min-w-0"><p className="text-xs font-extrabold text-white truncate leading-tight">{playerName}</p><p className="text-[10px] text-gray-500 font-bold leading-tight">Periodista · {grado}to</p></div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-center"><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Pregunta</p><p className="font-['Press_Start_2P'] text-sm text-[#DAA520] leading-tight">{pregRespondidas+1}<span className="text-gray-600 text-xs">/{totalPregs}</span></p></div>
          <div className="w-px h-6 bg-white/10"/>
          <div className="text-center"><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Tiempo</p><p className="font-['Press_Start_2P'] text-sm text-[#00e5ff] leading-tight">{fmtT(tiempoSeg)}</p></div>
          <div className="w-px h-6 bg-white/10"/>
          <div className="text-center"><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Pts</p><p className="font-['Press_Start_2P'] text-sm text-[#ffd700] leading-tight">{puntos}</p></div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0 ml-2">
          {modo==="multi"?(
            <>
              <button onClick={music.toggleMute} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{background:"rgba(218,165,32,0.08)",borderColor:"rgba(218,165,32,0.22)",color:"#DAA520"}}>{music.muted?<Volume2 size={14}/>:<VolumeX size={14}/>}</button>
              <button onClick={()=>setShowRanking(r=>!r)} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{background:showRanking?"rgba(255,215,0,0.2)":"rgba(255,215,0,0.08)",borderColor:"rgba(255,215,0,0.4)",color:"#ffd700"}}><Trophy size={14}/></button>
              <button onClick={()=>{socket.salirSala();music.stop();setModo("solo");setScreen("config");}} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{background:"rgba(255,71,87,0.08)",borderColor:"rgba(255,71,87,0.3)",color:"#ff4757"}}><LogOut size={14}/></button>
            </>
          ):(
            <button onClick={()=>setSettOpen(true)} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{background:"rgba(218,165,32,0.08)",borderColor:"rgba(218,165,32,0.22)",color:"#DAA520"}}><Settings size={14}/></button>
          )}
        </div>
      </div>

      {/* Barra progreso */}
      <div className="relative z-10 w-full h-1.5" style={{background:"rgba(255,255,255,0.04)"}}>
        <div className="h-full transition-all duration-500"
          style={{width:`${(pregRespondidas/Math.max(1,totalPregs))*100}%`,background:"linear-gradient(90deg,#DAA520,#ff9800)",boxShadow:"0 0 10px rgba(218,165,32,0.6)"}}/>
      </div>

      {/* CONTENIDO */}
      <div className="relative z-10 flex-1 flex flex-col gap-4 px-4 py-5 max-w-3xl mx-auto w-full overflow-y-auto">
        {/* Noticia */}
        <motion.div key={noticia.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
          className="rounded-2xl border-2 p-5" style={{background:"rgba(218,165,32,0.06)",borderColor:"rgba(218,165,32,0.25)"}}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{noticia.emoji}</span>
            <h2 className="font-['Press_Start_2P'] text-xs text-[#DAA520]">{noticia.titulo}</h2>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{noticia.cuerpo}</p>
        </motion.div>

        {/* Pregunta */}
        <AnimatePresence mode="wait">
          <motion.div key={`${noticiaIdx}-${pregIdx}`} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}
            className="rounded-2xl border-2 p-5" style={{background:"rgba(255,255,255,0.04)",borderColor:"rgba(255,255,255,0.1)"}}>
            <p className="text-[10px] font-extrabold text-gray-500 tracking-widest uppercase mb-3">
              Pregunta {pregIdx+1} de {noticia.preguntas.length}
            </p>
            <p className="text-sm font-semibold text-white mb-4 leading-relaxed">{pregActual.texto}</p>
            <div className="flex flex-col gap-2">
              {pregActual.opciones.map((op,i)=>{
                const esSel=seleccionada===i;
                const esCorr=mostrarFeedback&&i===pregActual.correcta;
                const esWrong=mostrarFeedback&&esSel&&i!==pregActual.correcta;
                return(
                  <motion.button key={i} whileHover={seleccionada===null?{x:4}:{}} onClick={()=>responder(i)}
                    disabled={seleccionada!==null}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all"
                    style={{
                      background:esCorr?"rgba(0,255,136,0.1)":esWrong?"rgba(255,71,87,0.1)":esSel?"rgba(218,165,32,0.1)":"rgba(255,255,255,0.03)",
                      borderColor:esCorr?"#00ff88":esWrong?"#ff4757":esSel?"#DAA520":"rgba(255,255,255,0.1)",
                    }}>
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={{background:esCorr?"rgba(0,255,136,0.2)":esWrong?"rgba(255,71,87,0.2)":esSel?"rgba(218,165,32,0.2)":"rgba(255,255,255,0.08)",
                        color:esCorr?"#00ff88":esWrong?"#ff4757":esSel?"#DAA520":"white"}}>
                      {["A","B","C","D"][i]}
                    </span>
                    <span className="text-sm text-white flex-1">{op}</span>
                    {esCorr&&<CheckCircle2 size={16} className="text-[#00ff88] flex-shrink-0"/>}
                    {esWrong&&<XCircle size={16} className="text-[#ff4757] flex-shrink-0"/>}
                  </motion.button>
                );
              })}
            </div>
            {mostrarFeedback&&(
              <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
                className={`mt-3 p-3 rounded-xl text-xs font-bold ${seleccionada===pregActual.correcta?"text-[#00ff88] bg-[#00ff88]/8 border border-[#00ff88]/20":"text-[#ff9800] bg-[#ff9800]/8 border border-[#ff9800]/20"}`}>
                💡 {pregActual.explicacion}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

