// src/app/components/games-lengua/ConectaSinonimos.tsx
// Conecta Sinónimos/Antónimos — Lengua Española 4to-6to grado

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Play, Pause, X, Volume2, VolumeX,
  RotateCcw, Trophy, Star, CheckCircle2, XCircle,
  Settings, User, Users, LogOut, Link2, Clock, AlertTriangle
} from "lucide-react";
import { Link, useNavigate} from "react-router";
import { useSocket } from "../../../lib/useSocket";
import { useAuth } from "../../AuthContext";
import { useMonedas } from "../../../hooks/useMonedas";
import { GameLobby, GameError, GameRankingFinal, MultiPanel, RankingPanel } from "../GameShared";
import { MiniJugadores } from "../MultiLobby";
import logoImg from "../../../assets/logo.png";

const API   = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
type Screen    = "splash" | "config" | "juego" | "resultados";
type Modo      = "solo" | "multi";
type TipoJuego = "sinonimos" | "antonimos";

interface Par { izq: string; der: string; }

const PARES: Record<TipoJuego, Record<number, Par[]>> = {
  sinonimos: {
    4: [
      {izq:"FELIZ",    der:"CONTENTO"   },{izq:"GRANDE",   der:"ENORME"     },
      {izq:"RAPIDO",   der:"VELOZ"      },{izq:"BONITO",   der:"HERMOSO"    },
      {izq:"TRISTE",   der:"MELANCOLICO"},{izq:"HABLAR",   der:"CONVERSAR"  },
      {izq:"CAMINAR",  der:"ANDAR"      },{izq:"CASA",     der:"HOGAR"      },
      {izq:"AMIGO",    der:"COMPAÑERO"  },{izq:"MIEDO",    der:"TEMOR"      },
    ],
    5: [
      {izq:"VALIENTE",  der:"AUDAZ"         },{izq:"SABIO",     der:"INTELIGENTE"},
      {izq:"COMIENZO",  der:"INICIO"        },{izq:"DESTRUIR",  der:"DEMOLER"    },
      {izq:"SILENCIO",  der:"QUIETUD"       },{izq:"MENTIRA",   der:"FALSEDAD"   },
      {izq:"GENEROSO",  der:"DADIVOSO"      },{izq:"OSCURO",    der:"TENEBROSO"  },
      {izq:"AYUDAR",    der:"COLABORAR"     },{izq:"BRILLANTE", der:"RESPLANDECIENTE"},
    ],
    6: [
      {izq:"EFIMERO",   der:"PASAJERO"  },{izq:"ARDUO",    der:"DIFICIL"    },
      {izq:"AUDAZ",     der:"TEMERARIO" },{izq:"ESCASO",   der:"EXIGUO"     },
      {izq:"COLOSAL",   der:"DESCOMUNAL"},{izq:"FUGAZ",    der:"BREVE"      },
      {izq:"OCIOSO",    der:"HOLGAZAN"  },{izq:"PROLIJO",  der:"METICULOSO" },
      {izq:"DIAFANO",   der:"TRANSPARENTE"},{izq:"PRESCINDIR",der:"OMITIR"  },
    ],
  },
  antonimos: {
    4: [
      {izq:"FELIZ",    der:"TRISTE"   },{izq:"GRANDE",   der:"PEQUEÑO"  },
      {izq:"CALIENTE", der:"FRIO"     },{izq:"DIA",      der:"NOCHE"    },
      {izq:"AMOR",     der:"ODIO"     },{izq:"RAPIDO",   der:"LENTO"    },
      {izq:"RICO",     der:"POBRE"    },{izq:"VERDAD",   der:"MENTIRA"  },
      {izq:"BONITO",   der:"FEO"      },{izq:"ARRIBA",   der:"ABAJO"    },
    ],
    5: [
      {izq:"AMABLE",   der:"GROSERO"   },{izq:"FACIL",    der:"DIFICIL"  },
      {izq:"INICIO",   der:"FIN"       },{izq:"VALIENTE", der:"COBARDE"  },
      {izq:"BRILLANTE",der:"OPACO"     },{izq:"AVANZAR",  der:"RETROCEDER"},
      {izq:"UNIR",     der:"SEPARAR"   },{izq:"CRECER",   der:"DECRECER" },
      {izq:"PERMITIR", der:"PROHIBIR"  },{izq:"OLVIDAR",  der:"RECORDAR" },
    ],
    6: [
      {izq:"VIRTUD",   der:"VICIO"     },{izq:"SABIDURIA",der:"IGNORANCIA"},
      {izq:"CERTEZA",  der:"DUDA"      },{izq:"CONSTRUIR",der:"DEMOLER"  },
      {izq:"GENEROSO", der:"AVARO"     },{izq:"ABUNDANTE",der:"ESCASO"   },
      {izq:"REAL",     der:"FICTICIO"  },{izq:"PUBLICO",  der:"PRIVADO"  },
      {izq:"ALEGRIA",  der:"CONGOJA"   },{izq:"EFICAZ",   der:"INEFICAZ" },
    ],
  },
};

const COLORES_PAR=["#00ff88","#00e5ff","#ffd700","#ff9800","#a78bfa","#ff64c8","#64c8ff","#ff4757"];

/* ─── MÚSICA ─── */
class MusicEngine {
  private ac:AudioContext|null=null;private mg:GainNode|null=null;
  private mug:GainNode|null=null;private running=false;
  start(){
    if(this.running)return;
    try{
      this.ac=new(window.AudioContext||(window as any).webkitAudioContext)();
      this.mg=this.ac.createGain();this.mug=this.ac.createGain();
      this.mg.gain.value=0.08;this.mug.gain.value=1;
      this.mg.connect(this.mug);this.mug.connect(this.ac.destination);
      this.running=true;this.loop();
    }catch(_){}
  }
  stop(){this.running=false;try{this.ac?.close();}catch(_){}this.ac=null;this.mg=null;this.mug=null;}
  setMuted(m:boolean){if(!this.mug||!this.ac)return;this.mug.gain.linearRampToValueAtTime(m?0:1,this.ac.currentTime+0.3);}
  setVolume(v:number){if(this.mg&&this.ac)this.mg.gain.linearRampToValueAtTime((v/100)*0.12,this.ac.currentTime+0.1);}
  private loop(){
    // Melodía tipo puzzle alegre con triángulos
    const seqs=[[523.3,659.3,783.9,659.3],[587.3,698.5,783.9,880.0],[523.3,587.3,659.3,698.5],[783.9,659.3,523.3,587.3]];
    let ci=0;
    const play=()=>{
      if(!this.running||!this.ac||!this.mg)return;
      seqs[ci%seqs.length].forEach((freq,vi)=>{
        if(!this.ac||!this.mg)return;
        const osc=this.ac.createOscillator(),env=this.ac.createGain();
        osc.type="triangle";osc.frequency.value=freq;
        osc.connect(env);env.connect(this.mg);
        const t=this.ac.currentTime+vi*0.18,dur=0.15;
        env.gain.setValueAtTime(0,t);env.gain.linearRampToValueAtTime(0.35,t+0.02);
        env.gain.exponentialRampToValueAtTime(0.001,t+dur);
        osc.start(t);osc.stop(t+dur+0.05);
      });
      ci++;setTimeout(play,2000);
    };
    play();
  }
}
function useMusic(){
  const engine=useRef(new MusicEngine());
  const [muted,setMuted]=useState(false);const [vol,setVolS]=useState(60);
  useEffect(()=>()=>engine.current.stop(),[]);
  const start=useCallback(()=>engine.current.start(),[]);
  const stop=useCallback(()=>{engine.current.stop();setMuted(false);},[]);
  const toggleMute=useCallback(()=>setMuted(m=>{const n=!m;engine.current.setMuted(n);return n;}),[]);
  const setVolume=useCallback((v:number)=>{setVolS(v);engine.current.setVolume(v);},[]);
  return{start,stop,toggleMute,setVolume,muted,vol};
}

function shuffle<T>(arr:T[]):T[]{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

/* ─── COMPONENTE PRINCIPAL ─── */
export function ConectaSinonimos(){
  const { user } = useAuth();
  const { agregarMonedas } = useMonedas();
  const navigate = useNavigate();
  const music=useMusic();
  const socket=useSocket();

  const [screen,      setScreen]      = useState<Screen>("splash");
  const [splashPct,   setSplashPct]   = useState(0);
  const [splashDone,  setSplashDone]  = useState(false);
  const [grado,       setGrado]       = useState(4);
  const [tipoJuego,   setTipoJuego]   = useState<TipoJuego>("sinonimos");
  const [modo,        setModo]        = useState<Modo>("solo");
  const [playerName,  setPlayerName]  = useState("");
  // Prellenar nombre con el de la cuenta
  useEffect(() => { if (user?.nombre) setPlayerName(user.nombre); }, [user]);
  const [paused,      setPaused]      = useState(false);
  const [settOpen,    setSettOpen]    = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [showRank,    setShowRank]    = useState(false);

  const [pares,        setPares]        = useState<Par[]>([]);
  const [izqShuffle,   setIzqShuffle]   = useState<string[]>([]);
  const [derShuffle,   setDerShuffle]   = useState<string[]>([]);
  const [conexiones,   setConexiones]   = useState<{izq:string;der:string;correcto:boolean;color:string}[]>([]);
  const [selIzq,       setSelIzq]       = useState<string|null>(null);
  const [feedback,     setFeedback]     = useState<{msg:string;ok:boolean}|null>(null);
  const [tiempoSeg,    setTiempoSeg]    = useState(0);
  const [puntos,       setPuntos]       = useState(0);
  const [correctas,    setCorrectas]    = useState(0);
  const [incorrectas,  setIncorrectas]  = useState(0);

  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null);
  const pauseRef=useRef(false);

  const multiState  =socket.state;
  if (!user) { navigate("/login"); return null; }

  const estaEnLobby =modo==="multi"&&multiState.estado==="lobby";
  const estaEnRanking=false;
  const hayError    =modo==="multi"&&multiState.estado==="error";

  const modoRef=useRef(modo);const gradoRef=useRef(grado);const playerNameRef=useRef(playerName);
  modoRef.current=modo;gradoRef.current=grado;playerNameRef.current=playerName;

  /* SPLASH — idéntico al Ahorcado */
  useEffect(()=>{
    if(screen!=="splash")return;
    const dur=4000,t0=Date.now();
    const iv=setInterval(()=>{
      const pct=Math.min(100,((Date.now()-t0)/dur)*100);
      setSplashPct(pct);
      if(pct>=100){clearInterval(iv);setSplashDone(true);setTimeout(()=>setScreen("config"),800);}
    },30);
    return()=>clearInterval(iv);
  },[screen]);

  /* Non-host fix */
  useEffect(()=>{
    if(modoRef.current==="multi"&&multiState.estado==="jugando"&&screen!=="juego"&&playerNameRef.current.trim()){
      iniciarJuego(gradoRef.current);
    }
  },[multiState.estado]); // eslint-disable-line

  function startTimer(){
    if(timerRef.current)clearInterval(timerRef.current);
    timerRef.current=setInterval(()=>{if(!pauseRef.current)setTiempoSeg(t=>t+1);},1000);
  }
  function stopTimer(){if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null;}}

  function iniciarJuego(g:number){
    const banco=PARES[tipoJuego][g]??PARES[tipoJuego][4];
    const sel=shuffle(banco).slice(0,8);
    setPares(sel);setIzqShuffle(shuffle(sel.map(p=>p.izq)));setDerShuffle(shuffle(sel.map(p=>p.der)));
    setConexiones([]);setSelIzq(null);setFeedback(null);
    setTiempoSeg(0);setPuntos(0);setCorrectas(0);setIncorrectas(0);
    setPaused(false);pauseRef.current=false;
    setScreen("juego");music.start();startTimer();
  }

  function seleccionarIzq(palabra:string){
    if(paused||conexiones.some(c=>c.izq===palabra&&c.correcto))return;
    setSelIzq(palabra);setFeedback(null);
  }

  function seleccionarDer(palabra:string){
    if(paused||!selIzq||conexiones.some(c=>c.der===palabra&&c.correcto))return;
    const par=pares.find(p=>p.izq===selIzq);
    const correcto=par?.der===palabra;
    const color=correcto?COLORES_PAR[correctas%COLORES_PAR.length]:"#ff4757";
    const nuevas=[...conexiones,{izq:selIzq,der:palabra,correcto,color}];
    setConexiones(nuevas);setSelIzq(null);
    if(correcto){
      const pts=Math.max(10,100-tiempoSeg);
      setPuntos(p=>p+pts);setCorrectas(c=>c+1);
      setFeedback({msg:`¡Correcto! +${pts} pts`,ok:true});
      const totalCorrectas=nuevas.filter(c=>c.correcto).length;
      if(totalCorrectas===pares.length){stopTimer();music.stop();agregarMonedas(puntos);setTimeout(()=>setScreen("resultados"),800);}
    }else{
      setIncorrectas(i=>i+1);
      setFeedback({msg:"Incorrecto, intenta de nuevo",ok:false});
      setTimeout(()=>{setConexiones(cs=>cs.filter(c=>!(c.izq===selIzq&&c.der===palabra)));setFeedback(null);},1000);
    }
  }

  function togglePause(){const n=!paused;setPaused(n);pauseRef.current=n;}
  function openSettings(){if(!paused){setPaused(true);pauseRef.current=true;}setSettOpen(true);}
  function requestExit(){setSettOpen(false);setExitConfirm(true);}
  function confirmExit(){music.stop();stopTimer();setPaused(false);pauseRef.current=false;setExitConfirm(false);setScreen("config");}
  function cancelExit(){setExitConfirm(false);}
  function fmtTiempo(s:number){return`${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;}

  const totalCorrectas=conexiones.filter(c=>c.correcto).length;
  const CA="#a78bfa"; // color accent

  if(estaEnLobby&&multiState.sala) return(
    <GameLobby state={multiState} nombrePropio={playerName}
      onIniciar={()=>{socket.iniciarJuego(multiState.sala!.codigo);iniciarJuego(grado);}}
      onSalir={()=>{socket.salirSala();setModo("solo");}} colorAccent={CA}/>
  );
  if(estaEnRanking) return(
    <GameRankingFinal ranking={multiState.rankingFinal} nombrePropio={playerName}
      onJugarDeNuevo={()=>{socket.salirSala();setScreen("config");}} onSalir={()=>{socket.salirSala();setScreen("config");}} colorAccent={CA}/>
  );
  if(hayError) return <GameError mensaje={multiState.errorMsg} onReset={socket.resetError} colorAccent={CA}/>;

  /* ─── MODALES ─── */
  const ExitModal=(
    <AnimatePresence>
      {exitConfirm&&(
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{background:"rgba(0,0,0,0.88)",backdropFilter:"blur(12px)"}}>
          <motion.div initial={{scale:0.82,opacity:0,y:24}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.9,opacity:0}}
            transition={{type:"spring",stiffness:340,damping:28}}
            className="w-full max-w-xs rounded-3xl overflow-hidden"
            style={{background:"linear-gradient(145deg,#16111f,#0e0c1a)",border:"2px solid rgba(255,71,87,0.4)",boxShadow:"0 30px 80px rgba(0,0,0,0.9)"}}>
            <div className="h-1 w-full" style={{background:"linear-gradient(90deg,transparent,#ff4757 40%,#ff6b7a 60%,transparent)"}}/>
            <div className="px-7 pt-6 pb-7 flex flex-col items-center text-center gap-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background:"rgba(255,71,87,0.1)",border:"1.5px solid rgba(255,71,87,0.35)"}}>
                <AlertTriangle size={30} className="text-[#ff4757]"/>
              </div>
              <div><h3 className="font-['Press_Start_2P'] text-sm text-white mb-2">Salir del juego</h3><p className="text-gray-500 text-xs leading-relaxed">Tu progreso actual se perderá.</p></div>
              <div className="w-full flex flex-col gap-2.5">
                <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={confirmExit}
                  className="w-full py-3.5 rounded-2xl font-['Press_Start_2P'] text-xs text-white"
                  style={{background:"linear-gradient(135deg,#ff4757,#c0392b)"}}>Sí, salir</motion.button>
                <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.98}} onClick={cancelExit}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm text-gray-400"
                  style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)"}}>Continuar jugando</motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const SettingsModal=(
    <AnimatePresence>
      {settOpen&&(
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center px-4"
          onClick={()=>setSettOpen(false)}>
          <motion.div initial={{scale:0.88,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
            transition={{type:"spring",stiffness:300,damping:25}}
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{background:"#12111e",border:`2px solid ${CA}33`,boxShadow:"0 20px 60px rgba(0,0,0,0.8)"}}
            onClick={e=>e.stopPropagation()}>
            <div className="h-0.5" style={{background:`linear-gradient(90deg,transparent,${CA},transparent)`}}/>
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
              <p className="font-['Press_Start_2P'] text-xs text-white">Configuración</p>
              <button onClick={()=>setSettOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all"><X size={14}/></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-sm font-bold text-gray-300">Volumen</span>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={100} value={music.vol} onChange={e=>music.setVolume(Number(e.target.value))} className="w-24 accent-[#a78bfa]"/>
                  <span className="text-sm font-bold w-9" style={{color:CA}}>{music.vol}%</span>
                </div>
              </div>
              {[
                {label:paused?"Reanudar":"Pausar juego",icon:paused?<Play size={14}/>:<Pause size={14}/>,action:()=>{togglePause();setSettOpen(false);}},
                {label:music.muted?"Activar música":"Silenciar música",icon:music.muted?<Volume2 size={14}/>:<VolumeX size={14}/>,action:music.toggleMute},
                {label:"Salir del juego",icon:<LogOut size={14}/>,action:requestExit,danger:true},
              ].map((a,i)=>(
                <button key={i} onClick={a.action}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${(a as any).danger?"text-[#ff4757] border-[#ff4757]/20 bg-[#ff4757]/5 hover:bg-[#ff4757]/10":"text-gray-300 border-white/7 bg-white/3 hover:border-[#a78bfa]/25"}`}>
                  {a.icon}{a.label}
                </button>
              ))}
              <button onClick={()=>setSettOpen(false)} className="w-full py-3 rounded-xl font-bold text-sm text-white" style={{background:`linear-gradient(135deg,${CA},#7c3aed)`}}>Cerrar</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return(
    <div className="flex flex-col items-center w-full min-h-screen text-white relative">
      {ExitModal}{SettingsModal}

      {/* ══════════ SPLASH — idéntico al Ahorcado ══════════ */}
      <AnimatePresence>
        {screen==="splash"&&(
          <motion.div initial={{opacity:1}} exit={{opacity:0}} transition={{duration:0.9}}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
            style={{background:"radial-gradient(ellipse 100% 80% at 50% 0%, #0e082a 0%, #07091a 55%, #000 100%)"}}>
            {[...Array(7)].map((_,i)=>(
              <motion.div key={i} className="absolute rounded-full pointer-events-none"
                style={{width:2+(i%3)*2,height:2+(i%3)*2,left:`${8+i*13}%`,top:`${15+(i%4)*17}%`,background:["#a78bfa","#ff9800","#ffd700","#00ff88","#00e5ff","#a78bfa","#ff4757"][i]}}
                animate={{y:[0,-28,0],opacity:[0.2,0.7,0.2]}} transition={{duration:2.8+i*0.4,repeat:Infinity,delay:i*0.35,ease:"easeInOut"}}/>
            ))}
            <motion.div animate={{opacity:[0.3,0.65,0.3],scale:[1,1.08,1]}} transition={{duration:4,repeat:Infinity}}
              className="absolute pointer-events-none"
              style={{width:500,height:500,borderRadius:"50%",background:`radial-gradient(circle,${CA}18 0%,${CA}08 40%,transparent 70%)`,top:"50%",left:"50%",transform:"translate(-50%,-52%)"}}/>
            <AnimatePresence mode="wait">
              {!splashDone?(
                <motion.div key="in" initial={{scale:1.5,opacity:0}} animate={{scale:1,opacity:1}} transition={{duration:0.85,ease:[0.16,1,0.3,1]}} className="flex flex-col items-center gap-0">
                  <motion.div className="relative mb-2" animate={{y:[0,-7,0]}} transition={{duration:3.5,repeat:Infinity,ease:"easeInOut"}}>
                    <motion.div animate={{scale:[1,1.3,1],opacity:[0.5,0.9,0.5]}} transition={{duration:2.5,repeat:Infinity}}
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{background:`radial-gradient(circle,${CA}30 0%,rgba(155,68,255,0.12) 50%,transparent 70%)`,transform:"scale(1.8)"}}/>
                    <img src={logoImg} alt="Saberix" className="w-36 h-36 md:w-44 md:h-44 object-contain relative z-10"
                      style={{filter:`drop-shadow(0 0 28px ${CA}90) drop-shadow(0 0 55px rgba(155,68,255,0.3))`}}/>
                  </motion.div>
                  <div className="flex items-center gap-0.5 mt-1 mb-2">
                    {["S","A","B","E","R","I","X"].map((l,i)=>{
                      const cols=["#ff4757","#ff9800","#ffd700","#00ff88","#00e5ff","#a78bfa","#ff4757"];
                      return(
                        <motion.span key={i} initial={{opacity:0,y:-18,scale:0.6}} animate={{opacity:1,y:0,scale:1}}
                          transition={{delay:0.5+i*0.07,type:"spring",stiffness:280,damping:17}}
                          className="font-['Press_Start_2P'] text-3xl md:text-4xl font-black leading-none"
                          style={{color:cols[i],textShadow:`0 0 20px ${cols[i]}bb,0 0 40px ${cols[i]}44`}}>{l}</motion.span>
                      );
                    })}
                  </div>
                  <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:1.3}} className="flex items-center gap-2 mb-8">
                    <div className="h-px w-10 rounded-full" style={{background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.2))"}}/>
                    <p className="text-xs md:text-sm font-bold tracking-[0.25em] uppercase" style={{color:"rgba(255,255,255,0.3)"}}>Aprende Jugando</p>
                    <div className="h-px w-10 rounded-full" style={{background:"linear-gradient(90deg,rgba(255,255,255,0.2),transparent)"}}/>
                  </motion.div>
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.6}} className="w-48 md:w-64">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[10px] font-bold tracking-widest uppercase" style={{color:"rgba(255,255,255,0.15)"}}>Cargando</span>
                      <span className="text-[10px] font-bold" style={{color:`${CA}80`}}>{Math.round(splashPct)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.05)"}}>
                      <div className="h-full rounded-full" style={{width:`${splashPct}%`,background:"linear-gradient(90deg,#ff4757,#ff9800,#ffd700,#00ff88,#00e5ff,#a78bfa)",boxShadow:"0 0 10px rgba(167,139,250,0.4)",transition:"width 0.04s linear"}}/>
                    </div>
                  </motion.div>
                </motion.div>
              ):(
                <motion.div key="out" initial={{scale:1,opacity:1}} animate={{scale:0.2,opacity:0,y:-90}} transition={{duration:0.65,ease:[0.4,0,1,1]}} className="flex flex-col items-center">
                  <img src={logoImg} alt="" className="w-36 h-36 object-contain" style={{filter:`drop-shadow(0 0 25px ${CA}80)`}}/>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ CONFIG ══════════ */}
      {screen==="config"&&(
        <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} className="w-full max-w-xl px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/games/language" className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"><ArrowLeft size={22}/></Link>
            <div>
              <h1 className="font-['Press_Start_2P'] text-xl" style={{color:CA}}>CONECTA PALABRAS</h1>
              <p className="text-gray-400 text-sm font-bold mt-1">Sinónimos y Antónimos</p>
            </div>
          </div>

          {/* Info card */}
          <div className="relative overflow-hidden rounded-2xl border-2 bg-[#0f1425] p-6 mb-5"
            style={{borderColor:`${CA}44`,boxShadow:`0 4px 28px ${CA}12`}}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20"
              style={{background:`radial-gradient(circle,${CA},transparent)`,transform:"translate(30%,-30%)"}}/>
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{background:`${CA}18`,border:`1.5px solid ${CA}44`}}>
                <Link2 size={26} style={{color:CA}}/>
              </div>
              <div>
                <p className="font-['Press_Start_2P'] text-xs mb-2" style={{color:CA}}>Conecta Palabras</p>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">
                  Une cada palabra de la izquierda con su <strong style={{color:CA}}>sinónimo o antónimo</strong> en la derecha.
                </p>
                <div className="flex gap-2 flex-wrap">
                  {["Sinónimos","Antónimos","Vocabulario"].map(t=>(
                    <span key={t} className="text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{background:`${CA}15`,color:CA,border:`1px solid ${CA}30`}}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tipo */}
          <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-4">
            <p className="text-xs font-extrabold tracking-widest uppercase mb-3" style={{color:CA}}>Tipo de juego</p>
            <div className="grid grid-cols-2 gap-2">
              {(["sinonimos","antonimos"] as TipoJuego[]).map(t=>(
                <button key={t} onClick={()=>setTipoJuego(t)}
                  className="py-3 rounded-xl border-2 font-bold text-sm transition-all"
                  style={{borderColor:tipoJuego===t?CA:"rgba(255,255,255,0.1)",background:tipoJuego===t?`${CA}15`:"rgba(255,255,255,0.03)",color:tipoJuego===t?CA:"#6b7280"}}>
                  {t==="sinonimos"?"📖 Sinónimos":"↔️ Antónimos"}
                </button>
              ))}
            </div>
          </div>

          {/* Grado */}
          <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-4">
            <p className="text-xs font-extrabold tracking-widest uppercase mb-3" style={{color:CA}}>Grado</p>
            <div className="grid grid-cols-3 gap-2">
              {[4,5,6].map(g=>(
                <button key={g} onClick={()=>setGrado(g)}
                  className="py-3 rounded-xl border-2 font-bold text-sm transition-all"
                  style={{borderColor:grado===g?CA:"rgba(255,255,255,0.1)",background:grado===g?`${CA}15`:"rgba(255,255,255,0.03)",color:grado===g?CA:"#6b7280"}}>
                  {g}to Grado
                </button>
              ))}
            </div>
          </div>

          {/* Nombre */}
          <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-4">
            <p className="text-xs font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2" style={{color:CA}}><User size={13}/> Tu nombre</p>
            <input className="w-full bg-white/4 border-2 border-white/10 rounded-xl px-4 py-3 text-white font-semibold outline-none transition-all placeholder:text-gray-600"
              disabled={!!user} placeholder="Escribe tu nombre..." value={playerName} onChange={e=>setPlayerName(e.target.value)} maxLength={20}/>
          </div>

          {/* Modo */}
          <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-4">
            <p className="text-xs font-extrabold text-[#00ff88] tracking-widest uppercase mb-3 flex items-center gap-2"><Play size={13}/> Modo de juego</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button onClick={()=>setModo("solo")}
                className={`py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${modo==="solo"?"border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]":"border-white/10 bg-white/3 text-gray-400 hover:border-white/25"}`}>
                <User size={15}/> Solitario
              </button>
              <button onClick={()=>setModo("multi")}
                className="py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all"
                style={modo==="multi"?{borderColor:CA,background:`${CA}15`,color:CA}:{borderColor:"rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.03)",color:"#6b7280"}}>
                <Users size={15}/> Multijugador
              </button>
            </div>
            <AnimatePresence>
              {modo==="multi"&&(
                <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} className="overflow-hidden">
                  <MultiPanel nombreJugador={playerName} onNombreChange={setPlayerName} juego="conecta_sinonimos" grado={grado}
                    onCrear={(nombre,jugador)=>{setPlayerName(jugador);socket.crearSala({nombre,nombreJugador:jugador,materia:"lengua",grado,tiempoPorPregunta:9999,cantPreguntas:5});}}
                    onUnirse={(codigo,jugador)=>{setPlayerName(jugador);socket.unirseASala(codigo,jugador);}}
                    conectando={multiState.estado==="conectando"} colorAccent={CA}
                    jugadoresConectados={multiState.sala?.jugadores??[]} nombrePropio={playerName}/>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button whileHover={{scale:1.02,y:-2}} whileTap={{scale:0.98}}
            onClick={()=>modo==="solo"&&iniciarJuego(grado)}
            disabled={!playerName.trim()||(modo==="multi")}
            className="w-full py-5 rounded-2xl font-['Press_Start_2P'] text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            style={{background:`linear-gradient(135deg,${CA},#7c3aed)`,boxShadow:`0 4px 24px ${CA}44`}}>
            <Link2 size={18}/> {modo==="solo"?"Comenzar":"Crear/Unirse primero"}
          </motion.button>
        </motion.div>
      )}

      {/* ══════════ RESULTADOS ══════════ */}
      {screen==="resultados"&&(
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-lg px-4 py-10 text-center">
          <motion.div initial={{scale:0,rotate:-15}} animate={{scale:1,rotate:0}} transition={{type:"spring",delay:0.1}} className="flex justify-center mb-6">
            <Link2 size={56} style={{color:CA,filter:`drop-shadow(0 0 20px ${CA}80)`}}/>
          </motion.div>
          <h2 className="font-['Press_Start_2P'] text-3xl mb-3"
            style={{background:`linear-gradient(135deg,${CA},#00e5ff)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            {totalCorrectas===pares.length?"¡Perfecto!":"¡Bien hecho!"}
          </h2>
          <p className="text-gray-300 font-bold text-base mb-8">
            {totalCorrectas===pares.length?"¡Conectaste todos los pares!":"Sigue practicando tu vocabulario"}
          </p>

          {/* Estrellas */}
          <div className="flex justify-center gap-3 mb-8">
            {[1,2,3].map(s=>{
              const stars=totalCorrectas===pares.length?3:totalCorrectas>=pares.length*0.75?2:1;
              return(
                <motion.div key={s} initial={{scale:0}} animate={{scale:1}} transition={{delay:0.3+s*0.1,type:"spring"}}>
                  <Star size={40} className={s<=stars?"text-[#ffd700]":"text-gray-700"} fill={s<=stars?"#ffd700":"none"}
                    style={s<=stars?{filter:"drop-shadow(0 0 8px rgba(255,215,0,0.6))"}:{}}/>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              {label:"Correctas",  val:correctas,    color:"#00ff88",bg:"rgba(0,255,136,0.06)",  border:"rgba(0,255,136,0.25)",  icon:<CheckCircle2 size={20}/>},
              {label:"Incorrectas",val:incorrectas,   color:"#ff4757",bg:"rgba(255,71,87,0.06)",  border:"rgba(255,71,87,0.25)",  icon:<XCircle size={20}/>},
              {label:"Puntos",     val:puntos,        color:"#ffd700",bg:"rgba(255,215,0,0.06)", border:"rgba(255,215,0,0.25)", icon:<Star size={20}/>},
            ].map(s=>(
              <div key={s.label} className="rounded-2xl border-2 p-5" style={{background:s.bg,borderColor:s.border}}>
                <div className="flex justify-center mb-2" style={{color:s.color}}>{s.icon}</div>
                <div className="font-['Press_Start_2P'] text-2xl mb-1" style={{color:s.color}}>{s.val}</div>
                <div className="text-xs font-extrabold text-gray-500 tracking-widest uppercase">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Recompensas */}
          <div className="rounded-2xl border-2 p-6 mb-8"
            style={{background:`linear-gradient(135deg,${CA}0a,rgba(0,229,255,0.03))`,borderColor:`${CA}33`}}>
            <div className="flex items-center justify-center gap-2 mb-5">
              <Trophy size={16} className="text-[#ffd700]"/>
              <p className="text-sm font-extrabold text-[#ffd700] tracking-widest uppercase">Recompensas</p>
            </div>
            <div className="flex justify-center gap-12">
              <div>
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                    style={{background:"linear-gradient(135deg,#ffd700,#ff9800)",boxShadow:"0 0 16px rgba(255,215,0,0.5)"}}>🪙</div>
                </div>
                <div className="font-['Press_Start_2P'] text-2xl text-[#ff9800]">+{puntos}</div>
                <div className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest">Monedas</div>
              </div>
              <div>
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                    style={{background:`linear-gradient(135deg,${CA},#7c3aed)`,boxShadow:`0 0 16px ${CA}55`}}>⚡</div>
                </div>
                <div className="font-['Press_Start_2P'] text-2xl" style={{color:CA}}>+{Math.round(puntos*1.5)}</div>
                <div className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest">Experiencia</div>
              </div>
            </div>
          </div>

          <motion.button whileHover={{scale:1.02,y:-2}} whileTap={{scale:0.98}}
            onClick={()=>{setScreen("splash");setSplashDone(false);setSplashPct(0);}}
            className="w-full py-5 rounded-2xl font-['Press_Start_2P'] text-base text-white mb-4 flex items-center justify-center gap-3"
            style={{background:`linear-gradient(135deg,${CA},#7c3aed)`,boxShadow:`0 4px 22px ${CA}44`}}>
            <RotateCcw size={18}/> Jugar de nuevo
          </motion.button>
          <Link to="/games/language" className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-base text-gray-400 border-2 border-white/10 hover:border-white/25 hover:text-white transition-all">
            <ArrowLeft size={18}/> Menú principal
          </Link>
        </motion.div>
      )}

      {/* ══════════ JUEGO ══════════ */}
      {screen==="juego"&&(
        <motion.div initial={{opacity:0}} animate={{opacity:1}}
          className="w-full min-h-screen flex flex-col relative overflow-hidden"
          style={{background:"linear-gradient(135deg,#06091a 0%,#120928 50%,#06091a 100%)"}}>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div animate={{x:[0,40,0],y:[0,-30,0]}} transition={{duration:14,repeat:Infinity,ease:"easeInOut"}}
              className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-3xl opacity-30"
              style={{background:`radial-gradient(circle,${CA}18,transparent)`}}/>
          </div>

          {/* Ranking panel */}
          <AnimatePresence>
            {showRank&&modo==="multi"&&(
              <RankingPanel jugadores={multiState.sala?.jugadores??[]} nombrePropio={playerName} onClose={()=>setShowRank(false)}/>
            )}
          </AnimatePresence>

          {/* TOPBAR */}
          <div className="relative z-10 flex items-center gap-2 px-3 md:px-4 py-2 border-b border-white/5"
            style={{background:"rgba(6,9,26,0.95)",backdropFilter:"blur(16px)"}}>
            <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
              {modo==="multi"&&multiState.sala&&multiState.sala.jugadores.length>0?(
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5 flex-1">
                  <MiniJugadores jugadores={multiState.sala.jugadores} nombrePropio={playerName}/>
                </div>
              ):(
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${CA}22`,border:`1.5px solid ${CA}55`}}>
                    <User size={14} style={{color:CA}}/>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-white truncate leading-tight">{playerName}</p>
                    <p className="text-[10px] text-gray-500 font-bold leading-tight">Conecta {tipoJuego==="sinonimos"?"Sinónimos":"Antónimos"} · {grado}to</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-center">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Pares</p>
                <p className="font-['Press_Start_2P'] text-sm text-[#00ff88] leading-tight">{totalCorrectas}<span className="text-gray-600 text-xs">/{pares.length}</span></p>
              </div>
              <div className="w-px h-6 bg-white/10"/>
              <div className="text-center">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Pts</p>
                <p className="font-['Press_Start_2P'] text-sm text-[#ffd700] leading-tight">{puntos}</p>
              </div>
            </div>
            <div className="flex gap-1.5 flex-shrink-0 ml-2">
              {modo==="multi"?(
                <>
                  <button onClick={music.toggleMute} className="w-8 h-8 rounded-xl border flex items-center justify-center transition-all" style={{background:`${CA}12`,borderColor:`${CA}33`,color:CA}}>
                    {music.muted?<Volume2 size={14}/>:<VolumeX size={14}/>}
                  </button>
                  <button onClick={()=>setShowRank(r=>!r)} className="w-8 h-8 rounded-xl border flex items-center justify-center transition-all" style={{background:showRank?"rgba(255,215,0,0.2)":"rgba(255,215,0,0.08)",borderColor:"rgba(255,215,0,0.4)",color:"#ffd700"}}>
                    <Trophy size={14}/>
                  </button>
                  <button onClick={()=>{socket.salirSala();music.stop();stopTimer();setModo("solo");setScreen("config");}} className="w-8 h-8 rounded-xl border flex items-center justify-center transition-all" style={{background:"rgba(255,71,87,0.08)",borderColor:"rgba(255,71,87,0.3)",color:"#ff4757"}}>
                    <LogOut size={14}/>
                  </button>
                </>
              ):(
                <>
                  <button onClick={togglePause} className="w-8 h-8 rounded-xl border flex items-center justify-center transition-all" style={{background:"rgba(255,215,0,0.08)",borderColor:"rgba(255,215,0,0.22)",color:"#ffd700"}}>
                    {paused?<Play size={14}/>:<Pause size={14}/>}
                  </button>
                  <button onClick={openSettings} className="w-8 h-8 rounded-xl border flex items-center justify-center transition-all" style={{background:`${CA}12`,borderColor:`${CA}33`,color:CA}}>
                    <Settings size={14}/>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Barra progreso */}
          <div className="relative z-10 w-full h-1.5" style={{background:"rgba(255,255,255,0.04)"}}>
            <motion.div className="h-full" animate={{width:`${(totalCorrectas/Math.max(1,pares.length))*100}%`}}
              transition={{duration:0.4}} style={{background:`linear-gradient(90deg,${CA},#00e5ff)`,boxShadow:`0 0 10px ${CA}80`}}/>
          </div>

          {/* Pausa */}
          <AnimatePresence>
            {paused&&!settOpen&&!exitConfirm&&(
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center" onClick={togglePause}>
                <motion.div initial={{scale:0.8}} animate={{scale:1}} className="text-center bg-[#111428] border-2 border-[#ffd700]/30 rounded-3xl px-12 py-10">
                  <Pause size={48} className="text-[#ffd700] mx-auto mb-4"/>
                  <p className="font-['Press_Start_2P'] text-xl text-[#ffd700] mb-2">PAUSADO</p>
                  <p className="text-gray-400 text-sm font-bold">Toca para continuar</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CONTENIDO JUEGO */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-4 max-w-2xl mx-auto w-full gap-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Conecta cada palabra con su {tipoJuego==="sinonimos"?"sinónimo":"antónimo"}
            </p>

            {/* Feedback */}
            <AnimatePresence>
              {feedback&&(
                <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}
                  className={`w-full flex items-center justify-center gap-3 text-sm font-bold px-5 py-3 rounded-2xl border-2 ${feedback.ok?"bg-[#00ff88]/8 border-[#00ff88]/30 text-[#00ff88]":"bg-[#ff4757]/8 border-[#ff4757]/30 text-[#ff4757]"}`}>
                  {feedback.ok?<CheckCircle2 size={18}/>:<XCircle size={18}/>}
                  {feedback.msg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Columnas */}
            <div className="w-full flex gap-3 md:gap-6">
              {/* Izquierda */}
              <div className="flex-1 flex flex-col gap-2">
                <p className="text-xs font-extrabold text-gray-500 tracking-widest uppercase text-center mb-1">Palabra</p>
                {izqShuffle.map(palabra=>{
                  const enc=conexiones.find(c=>c.izq===palabra&&c.correcto);
                  const sel=selIzq===palabra;
                  return(
                    <motion.button key={palabra} whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={()=>!enc&&seleccionarIzq(palabra)}
                      className="w-full py-2.5 px-3 rounded-2xl font-bold text-sm text-center transition-all"
                      style={{
                        background:enc?`${enc.color}18`:sel?`${CA}22`:"rgba(255,255,255,0.05)",
                        border:`2px solid ${enc?enc.color:sel?CA:"rgba(255,255,255,0.1)"}`,
                        color:enc?enc.color:sel?CA:"white",
                        opacity:enc?0.7:1,cursor:enc?"default":"pointer",
                        boxShadow:sel?`0 0 12px ${CA}55`:enc?`0 0 10px ${enc.color}44`:"none",
                        fontSize:"clamp(9px,2vw,13px)",
                      }}>
                      {enc&&<span className="mr-1 text-xs">✓</span>}{palabra}
                    </motion.button>
                  );
                })}
              </div>

              {/* Separador */}
              <div className="flex flex-col items-center justify-center gap-2 py-8">
                {pares.map((_,i)=>(
                  <div key={i} className="w-6 h-px" style={{background:"rgba(255,255,255,0.08)"}}/>
                ))}
              </div>

              {/* Derecha */}
              <div className="flex-1 flex flex-col gap-2">
                <p className="text-xs font-extrabold text-gray-500 tracking-widest uppercase text-center mb-1">
                  {tipoJuego==="sinonimos"?"Sinónimo":"Antónimo"}
                </p>
                {derShuffle.map(palabra=>{
                  const enc=conexiones.find(c=>c.der===palabra&&c.correcto);
                  return(
                    <motion.button key={palabra} whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={()=>!enc&&seleccionarDer(palabra)}
                      className="w-full py-2.5 px-3 rounded-2xl font-bold text-sm text-center transition-all"
                      style={{
                        background:enc?`${enc.color}18`:selIzq?"rgba(0,229,255,0.06)":"rgba(255,255,255,0.05)",
                        border:`2px solid ${enc?enc.color:selIzq?"rgba(0,229,255,0.25)":"rgba(255,255,255,0.1)"}`,
                        color:enc?enc.color:selIzq?"#00e5ff":"white",
                        opacity:enc?0.7:1,cursor:enc?"default":"pointer",
                        boxShadow:enc?`0 0 10px ${enc.color}44`:"none",
                        fontSize:"clamp(9px,2vw,13px)",
                      }}>
                      {enc&&<span className="mr-1 text-xs">✓</span>}{palabra}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Tiempo */}
            <div className="flex items-center gap-2 text-xs text-gray-600 font-bold mt-1">
              <Clock size={12}/> {fmtTiempo(tiempoSeg)}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
