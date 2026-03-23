// Laberinto.tsx — Todas las materias 4to-6to
// Navega por el laberinto respondiendo preguntas para abrir puertas
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Play, X, Volume2, VolumeX, RotateCcw,
  Trophy, Star, CheckCircle2, XCircle, Settings,
  User, Users, LogOut, AlertTriangle,
  ArrowUp, ArrowDown, ArrowLeft as AL, ArrowRight
} from "lucide-react";
import { Link } from "react-router";
import logoImg from "../../../assets/logo.png";
import { useSocket } from "../../../lib/useSocket";
import { GameLobby, GameError, MultiPanel, RankingPanel } from "../GameShared";
import { MiniJugadores } from "../MultiLobby";

type Screen = "splash"|"config"|"juego"|"pregunta"|"resultados";
type Modo   = "solo"|"multi";
type Dir    = "up"|"down"|"left"|"right";

interface Celda  { x:number; y:number; }
interface Puerta { from:Celda; to:Celda; respondida:boolean; correcta:boolean; }
interface Pregunta{ id:string; texto:string; opciones:string[]; correcta:number; materia:string; }

const PREGUNTAS_BANCO: Record<number,Pregunta[]> = {
  4:[
    {id:"1",texto:"¿Cuánto es 7 × 8?",                                         opciones:["54","56","48","64"],  correcta:1,materia:"Mates"},
    {id:"2",texto:"¿Qué es un sustantivo?",                                     opciones:["Una acción","Un nombre","Un adjetivo","Un verbo"], correcta:1,materia:"Lengua"},
    {id:"3",texto:"¿Cuántos lados tiene un triángulo?",                         opciones:["4","2","3","5"],      correcta:2,materia:"Mates"},
    {id:"4",texto:"¿Qué animal realiza la fotosíntesis?",                       opciones:["El perro","La vaca","Las plantas","El pez"], correcta:2,materia:"Ciencias"},
    {id:"5",texto:"¿En qué año se independizó la República Dominicana?",        opciones:["1492","1776","1844","1898"], correcta:2,materia:"Sociales"},
    {id:"6",texto:"¿Cuánto es 15 + 28?",                                        opciones:["41","43","45","42"],  correcta:1,materia:"Mates"},
    {id:"7",texto:"¿Qué es un verbo?",                                          opciones:["Un objeto","Una acción o estado","Un lugar","Un color"], correcta:1,materia:"Lengua"},
    {id:"8",texto:"¿Cuál es el planeta más cercano al Sol?",                    opciones:["Venus","Marte","Mercurio","Júpiter"], correcta:2,materia:"Ciencias"},
    {id:"9",texto:"¿Qué continente es el más grande?",                          opciones:["América","Europa","África","Asia"], correcta:3,materia:"Sociales"},
    {id:"10",texto:"¿Cuánto es la mitad de 100?",                               opciones:["25","75","50","40"],  correcta:2,materia:"Mates"},
    {id:"11",texto:"La palabra 'CASA' tiene cuántas letras?",                   opciones:["3","5","4","6"],      correcta:2,materia:"Lengua"},
    {id:"12",texto:"¿Qué órgano bombea la sangre?",                             opciones:["El pulmón","El hígado","El estómago","El corazón"], correcta:3,materia:"Ciencias"},
  ],
  5:[
    {id:"1",texto:"¿Cuánto es 125 ÷ 5?",                                        opciones:["20","25","30","15"],  correcta:1,materia:"Mates"},
    {id:"2",texto:"¿Qué es una metáfora?",                                      opciones:["Una rima","Una comparación sin nexo","Un sustantivo","Un verbo"], correcta:1,materia:"Lengua"},
    {id:"3",texto:"¿Cuántos grados tiene un triángulo rectángulo?",             opciones:["360°","90°","180°","270°"], correcta:2,materia:"Mates"},
    {id:"4",texto:"¿Qué proceso realizan las plantas para alimentarse?",        opciones:["Respiración","Digestión","Fotosíntesis","Reproducción"], correcta:2,materia:"Ciencias"},
    {id:"5",texto:"¿Dónde fue fundada la primera ciudad europea de América?",   opciones:["Cuba","México","Santo Domingo","Puerto Rico"], correcta:2,materia:"Sociales"},
    {id:"6",texto:"¿Cuál es el 30% de 200?",                                    opciones:["30","50","70","60"],  correcta:3,materia:"Mates"},
    {id:"7",texto:"¿Qué tipo de texto cuenta una historia?",                    opciones:["Descriptivo","Argumentativo","Narrativo","Expositivo"], correcta:2,materia:"Lengua"},
    {id:"8",texto:"¿Cuántos planetas tiene nuestro sistema solar?",             opciones:["7","8","9","10"],     correcta:1,materia:"Ciencias"},
    {id:"9",texto:"¿Qué río es el más largo del mundo?",                        opciones:["Amazonas","Nilo","Mississippi","Congo"], correcta:1,materia:"Sociales"},
    {id:"10",texto:"¿Cuánto es 2³?",                                            opciones:["6","9","8","4"],      correcta:2,materia:"Mates"},
    {id:"11",texto:"¿Qué es un antónimo?",                                      opciones:["Palabra igual","Palabra contraria","Palabra similar","Palabra compuesta"], correcta:1,materia:"Lengua"},
    {id:"12",texto:"¿Cuál es la célula más grande del cuerpo humano?",          opciones:["Neurona","Glóbulo rojo","Óvulo","Espermatozoide"], correcta:2,materia:"Ciencias"},
  ],
  6:[
    {id:"1",texto:"¿Cuál es la raíz cuadrada de 144?",                          opciones:["11","12","13","14"],  correcta:1,materia:"Mates"},
    {id:"2",texto:"¿Qué figura retórica es 'Sus ojos son dos soles'?",          opciones:["Hipérbole","Símil","Metáfora","Ironía"], correcta:2,materia:"Lengua"},
    {id:"3",texto:"¿Cuánto es el área de un rectángulo de 6×8?",               opciones:["28","48","40","36"],  correcta:1,materia:"Mates"},
    {id:"4",texto:"¿Qué organelo realiza la fotosíntesis?",                     opciones:["Mitocondria","Ribosoma","Cloroplasto","Núcleo"], correcta:2,materia:"Ciencias"},
    {id:"5",texto:"¿En qué año comenzó la Primera Guerra Mundial?",            opciones:["1905","1914","1918","1939"], correcta:1,materia:"Sociales"},
    {id:"6",texto:"¿Cuál es el valor de π (pi) aproximado?",                   opciones:["3.14","2.71","1.41","3.41"], correcta:0,materia:"Mates"},
    {id:"7",texto:"¿Qué tipo de oración tiene sujeto y predicado?",            opciones:["Impersonal","Bimembre","Unimembre","Nominal"], correcta:1,materia:"Lengua"},
    {id:"8",texto:"¿Qué gas expulsan las plantas en la fotosíntesis?",         opciones:["CO₂","Nitrógeno","Oxígeno","Hidrógeno"], correcta:2,materia:"Ciencias"},
    {id:"9",texto:"¿Cuál fue el primer país latinoamericano independiente?",    opciones:["México","Cuba","Colombia","Haití"], correcta:3,materia:"Sociales"},
    {id:"10",texto:"¿Cuánto es 15% de 400?",                                   opciones:["45","50","60","75"],  correcta:2,materia:"Mates"},
    {id:"11",texto:"¿Qué es un párrafo?",                                      opciones:["Una oración","Un texto completo","Un conjunto de oraciones sobre una idea","Una palabra"], correcta:2,materia:"Lengua"},
    {id:"12",texto:"¿Cuál es la velocidad de la luz (aprox.)?",                opciones:["300 km/s","300.000 km/s","3.000 km/s","30.000 km/s"], correcta:1,materia:"Ciencias"},
  ],
};

// ── LABERINTO GENERACIÓN ──
const COLS=9, ROWS=9;
type Walls = {N:boolean;S:boolean;E:boolean;W:boolean};
type Maze  = Walls[][];

function generarLaberinto():Maze{
  const maze:Maze=Array.from({length:ROWS},()=>Array.from({length:COLS},()=>({N:true,S:true,E:true,W:true})));
  const visited:boolean[][]=Array.from({length:ROWS},()=>Array(COLS).fill(false));
  function carve(x:number,y:number){
    visited[y][x]=true;
    const dirs:Dir[]=["up","down","left","right"];
    for(let i=dirs.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[dirs[i],dirs[j]]=[dirs[j],dirs[i]];}
    for(const d of dirs){
      const nx=d==="left"?x-1:d==="right"?x+1:x;
      const ny=d==="up"?y-1:d==="down"?y+1:y;
      if(nx>=0&&nx<COLS&&ny>=0&&ny<ROWS&&!visited[ny][nx]){
        if(d==="up"){maze[y][x].N=false;maze[ny][nx].S=false;}
        else if(d==="down"){maze[y][x].S=false;maze[ny][nx].N=false;}
        else if(d==="left"){maze[y][x].W=false;maze[ny][nx].E=false;}
        else{maze[y][x].E=false;maze[ny][nx].W=false;}
        carve(nx,ny);
      }
    }
  }
  carve(0,0); return maze;
}

// ── MÚSICA ──
class MusicEngine{
  private ac:AudioContext|null=null;private mg:GainNode|null=null;private mug:GainNode|null=null;private running=false;
  start(){if(this.running)return;try{this.ac=new(window.AudioContext||(window as any).webkitAudioContext)();this.mg=this.ac.createGain();this.mug=this.ac.createGain();this.mg.gain.value=0.07;this.mug.gain.value=1;this.mg.connect(this.mug);this.mug.connect(this.ac.destination);this.running=true;this.loop();}catch(_){}}
  stop(){this.running=false;try{this.ac?.close();}catch(_){}this.ac=null;this.mg=null;this.mug=null;}
  setMuted(m:boolean){if(!this.mug||!this.ac)return;this.mug.gain.linearRampToValueAtTime(m?0:1,this.ac.currentTime+0.3);}
  private loop(){
    const notes=[196,220,246.9,261.6,220,196,174.6,196];let ni=0;
    const play=()=>{if(!this.running||!this.ac||!this.mg)return;const o=this.ac.createOscillator(),e=this.ac.createGain();o.type="square";o.frequency.value=notes[ni%notes.length];o.connect(e);e.connect(this.mg);const t=this.ac.currentTime,d=0.18;e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(0.25,t+0.02);e.gain.setValueAtTime(0.15,t+d-0.04);e.gain.linearRampToValueAtTime(0,t+d);o.start(t);o.stop(t+d+0.05);ni++;setTimeout(play,280);};play();
  }
}
function useMusic(){const e=useRef(new MusicEngine());const [muted,setMuted]=useState(false);useEffect(()=>()=>e.current.stop(),[]);const start=useCallback(()=>e.current.start(),[]);const stop=useCallback(()=>{e.current.stop();setMuted(false);},[]);const toggleMute=useCallback(()=>setMuted(m=>{const n=!m;e.current.setMuted(n);return n;}),[]);return{start,stop,toggleMute,muted};}

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

export function Laberinto(){
  const music=useMusic(); const socket=useSocket();
  const [screen,setScreen]=useState<Screen>("splash");
  const [splashPct,setSplashPct]=useState(0); const [splashDone,setSplashDone]=useState(false);
  const [grado,setGrado]=useState(4); const [modo,setModo]=useState<Modo>("solo");
  const [playerName,setPlayerName]=useState("");
  const [settOpen,setSettOpen]=useState(false); const [exitConfirm,setExitConfirm]=useState(false);
  const [showRanking,setShowRanking]=useState(false);

  const [maze,setMaze]=useState<Maze>([]);
  const [pos,setPos]=useState<Celda>({x:0,y:0});
  const [puertas,setPuertas]=useState<Puerta[]>([]);
  const [preguntaPendiente,setPreguntaPendiente]=useState<{puerta:Puerta;dir:Dir}|null>(null);
  const [preguntaActual,setPreguntaActual]=useState<Pregunta|null>(null);
  const [preguntasUsadas,setPreguntasUsadas]=useState<Set<string>>(new Set());
  const [seleccionada,setSeleccionada]=useState<number|null>(null);
  const [mostrarFeedback,setMostrarFeedback]=useState(false);
  const [puntos,setPuntos]=useState(0); const [puntosMulti,setPuntosMulti]=useState<Record<string,number>>({});
  const [correctas,setCorrectas]=useState(0); const [incorrectas,setIncorrectas]=useState(0);
  const [tiempoSeg,setTiempoSeg]=useState(0);
  const [movimientos,setMovimientos]=useState(0);
  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null);

  const multiState=socket.state;
  const estaEnLobby=modo==="multi"&&multiState.estado==="lobby";
  const hayError=modo==="multi"&&multiState.estado==="error";
  const modoRef=useRef(modo); const gradoRef=useRef(grado); const nameRef=useRef(playerName);
  modoRef.current=modo; gradoRef.current=grado; nameRef.current=playerName;

  const meta:Celda={x:COLS-1,y:ROWS-1};
  const llegó=pos.x===meta.x&&pos.y===meta.y;

  useEffect(()=>{
    if(screen!=="splash")return;
    const dur=4000,t0=Date.now();
    const iv=setInterval(()=>{const p=Math.min(100,((Date.now()-t0)/dur)*100);setSplashPct(p);if(p>=100){clearInterval(iv);setSplashDone(true);setTimeout(()=>setScreen("config"),800);}},30);
    return()=>clearInterval(iv);
  },[screen]);
  useEffect(()=>{if(modoRef.current==="multi"&&multiState.estado==="jugando"&&screen!=="juego"&&nameRef.current.trim())iniciarJuego(gradoRef.current);},[multiState.estado]); // eslint-disable-line
  useEffect(()=>{if(screen==="juego"){timerRef.current=setInterval(()=>setTiempoSeg(t=>t+1),1000);}return()=>{if(timerRef.current)clearInterval(timerRef.current);};},[screen]);
  useEffect(()=>{if(llegó&&screen==="juego"){if(timerRef.current)clearInterval(timerRef.current);setTimeout(()=>{music.stop();setScreen("resultados");},600);};},[llegó]); // eslint-disable-line

  // Teclado
  useEffect(()=>{
    if(screen!=="juego")return;
    const handler=(e:KeyboardEvent)=>{
      const map:Record<string,Dir>={ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right",w:"up",s:"down",a:"left",d:"right"};
      const dir=map[e.key];if(dir)mover(dir);
    };
    window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler);
  },[screen,pos,maze,puertas]); // eslint-disable-line

  function iniciarJuego(g:number){
    const m=generarLaberinto();
    setMaze(m); setPos({x:0,y:0}); setPuertas([]); setPreguntasUsadas(new Set());
    setPuntos(0); setCorrectas(0); setIncorrectas(0); setTiempoSeg(0); setMovimientos(0);
    setExitConfirm(false); setPreguntaPendiente(null); setPreguntaActual(null); setSeleccionada(null);
    setScreen("juego"); music.start();
  }

  function getPreguntaAleatoria(usadas:Set<string>,g:number):Pregunta{
    const banco=PREGUNTAS_BANCO[g]??PREGUNTAS_BANCO[4];
    const disponibles=banco.filter(p=>!usadas.has(p.id));
    if(disponibles.length===0){usadas.clear();}
    const pool=banco.filter(p=>!usadas.has(p.id));
    return pool[Math.floor(Math.random()*pool.length)];
  }

  function mover(dir:Dir){
    if(!maze.length||preguntaPendiente)return;
    const {x,y}=pos;
    const cell=maze[y]?.[x];if(!cell)return;
    const nx=dir==="left"?x-1:dir==="right"?x+1:x;
    const ny=dir==="up"?y-1:dir==="down"?y+1:y;
    if(nx<0||nx>=COLS||ny<0||ny>=ROWS)return;
    // Check wall
    const bloqueado=(dir==="up"&&cell.N)||(dir==="down"&&cell.S)||(dir==="left"&&cell.W)||(dir==="right"&&cell.E);
    if(bloqueado)return;

    // Check si hay puerta respondida incorrectamente bloqueando este paso
    const puertaExistente=puertas.find(p=>(p.from.x===x&&p.from.y===y&&p.to.x===nx&&p.to.y===ny)||(p.from.x===nx&&p.from.y===ny&&p.to.x===x&&p.to.y===y));
    if(puertaExistente){
      if(puertaExistente.respondida&&puertaExistente.correcta){setPos({x:nx,y:ny});setMovimientos(m=>m+1);}
      else if(puertaExistente.respondida&&!puertaExistente.correcta){
        // Puede intentar de nuevo cada 3 movimientos
        setPos({x:nx,y:ny});setMovimientos(m=>m+1);
      }
      return;
    }

    // Generar pregunta para esta puerta (1 de cada 3 pasos)
    if(Math.random()<0.5||movimientos%3===0){
      const nuevasUsadas=new Set(preguntasUsadas);
      const preg=getPreguntaAleatoria(nuevasUsadas,grado);
      const nuevaPuerta:Puerta={from:{x,y},to:{x:nx,y:ny},respondida:false,correcta:false};
      setPreguntaPendiente({puerta:nuevaPuerta,dir});
      setPreguntaActual(preg);
      nuevasUsadas.add(preg.id);setPreguntasUsadas(nuevasUsadas);
      setSeleccionada(null);setMostrarFeedback(false);
      setScreen("pregunta");
    }else{
      setPos({x:nx,y:ny});setMovimientos(m=>m+1);
    }
  }

  function responder(opcion:number){
    if(seleccionada!==null||!preguntaActual||!preguntaPendiente)return;
    setSeleccionada(opcion);setMostrarFeedback(true);
    const ok=opcion===preguntaActual.correcta;
    const puertaResuelta:Puerta={...preguntaPendiente.puerta,respondida:true,correcta:ok};
    setPuertas(ps=>[...ps.filter(p=>!(p.from.x===puertaResuelta.from.x&&p.from.y===puertaResuelta.from.y&&p.to.x===puertaResuelta.to.x&&p.to.y===puertaResuelta.to.y)),puertaResuelta]);
    if(ok){
      const pts=Math.max(20,100-tiempoSeg);setPuntos(p=>p+pts);setCorrectas(c=>c+1);
      if(modo==="multi")setPuntosMulti(pm=>({...pm,[playerName]:(pm[playerName]??0)+pts}));
    }else{setIncorrectas(i=>i+1);}
    setTimeout(()=>{
      if(ok||true){// Siempre avanzar (incorrecto solo da penalización)
        setPos(preguntaPendiente.puerta.to);setMovimientos(m=>m+1);
      }
      setPreguntaPendiente(null);setPreguntaActual(null);setSeleccionada(null);setMostrarFeedback(false);
      setScreen("juego");
    },1500);
  }

  function fmtT(s:number){return`${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;}

  // Tamaño celda responsivo
  const CELL=Math.min(38,Math.floor((typeof window!=="undefined"?Math.min(window.innerWidth-32,480):400)/COLS));

  if(estaEnLobby&&multiState.sala)return<GameLobby state={multiState} nombrePropio={playerName} onIniciar={()=>{socket.iniciarJuego(multiState.sala!.codigo);iniciarJuego(grado);}} onSalir={()=>{socket.salirSala();setModo("solo");}} colorAccent="#9b44ff"/>;
  if(hayError)return<GameError mensaje={multiState.errorMsg} onReset={socket.resetError} colorAccent="#9b44ff"/>;
  if(screen==="splash")return<SplashScreen pct={splashPct} done={splashDone}/>;

  // ── RESULTADOS ──
  if(screen==="resultados"){
    const pct=Math.round((correctas/Math.max(1,correctas+incorrectas))*100);
    const stars=pct>=90?3:pct>=60?2:1;
    return(
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="w-full min-h-screen flex flex-col items-center px-4 py-10 overflow-y-auto" style={{background:"linear-gradient(135deg,#06091a 0%,#12091a 50%,#06091a 100%)"}}>
        <div className="relative z-10 w-full max-w-lg">
          <motion.div initial={{scale:0,rotate:-15}} animate={{scale:1,rotate:0}} transition={{type:"spring",delay:0.1}} className="flex justify-center mb-5"><motion.span className="text-7xl" animate={{rotate:[0,10,-10,8,-8,0]}} transition={{delay:0.4,duration:0.6}}>🏆</motion.span></motion.div>
          <motion.h2 initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="font-['Press_Start_2P'] text-3xl mb-4 text-center" style={{background:"linear-gradient(135deg,#9b44ff,#00e5ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>¡Escapaste!</motion.h2>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}} className="flex justify-center gap-2 mb-8">{[1,2,3].map(s=>(<motion.div key={s} initial={{scale:0}} animate={{scale:1}} transition={{delay:0.3+s*0.12,type:"spring",stiffness:300}}><Star size={36} className={s<=stars?"text-[#ffd700]":"text-gray-700"} fill={s<=stars?"#ffd700":"none"} style={s<=stars?{filter:"drop-shadow(0 0 8px rgba(255,215,0,0.6))"}:{}}/></motion.div>))}</motion.div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              {label:"Tiempo",    val:fmtT(tiempoSeg),color:"#00e5ff",bg:"rgba(0,229,255,0.06)",border:"rgba(0,229,255,0.25)"},
              {label:"Puntos",    val:puntos,          color:"#ffd700",bg:"rgba(255,215,0,0.06)", border:"rgba(255,215,0,0.25)"},
              {label:"Correctas", val:correctas,       color:"#00ff88",bg:"rgba(0,255,136,0.06)",border:"rgba(0,255,136,0.25)"},
              {label:"Incorrectas",val:incorrectas,    color:"#ff4757",bg:"rgba(255,71,87,0.06)",border:"rgba(255,71,87,0.25)"},
            ].map((s,i)=>(<motion.div key={s.label} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.4+i*0.1,type:"spring"}} className="rounded-2xl border-2 p-4 text-center" style={{background:s.bg,borderColor:s.border}}><div className="font-['Press_Start_2P'] text-xl mb-1" style={{color:s.color}}>{s.val}</div><div className="text-xs font-extrabold text-gray-500 tracking-widest uppercase">{s.label}</div></motion.div>))}
          </div>
          <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} transition={{delay:0.7}} className="rounded-2xl border-2 p-6 mb-6" style={{background:"linear-gradient(135deg,rgba(155,68,255,0.08),rgba(0,229,255,0.04))",borderColor:"rgba(155,68,255,0.3)"}}>
            <div className="flex items-center justify-center gap-2 mb-5"><Trophy size={15} className="text-[#ffd700]"/><p className="text-sm font-extrabold text-[#ffd700] tracking-widest uppercase">Recompensas</p></div>
            <div className="flex justify-center gap-10">
              <div className="text-center"><div className="w-10 h-10 rounded-full flex items-center justify-center text-xl mx-auto mb-2" style={{background:"linear-gradient(135deg,#ffd700,#ff9800)",boxShadow:"0 0 16px rgba(255,215,0,0.5)"}}>🪙</div><div className="font-['Press_Start_2P'] text-2xl text-[#ff9800]">+{puntos}</div><div className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">Monedas</div></div>
              <div className="text-center"><div className="w-10 h-10 rounded-full flex items-center justify-center text-xl mx-auto mb-2" style={{background:"linear-gradient(135deg,#a78bfa,#7c3aed)",boxShadow:"0 0 16px rgba(167,139,250,0.5)"}}>⚡</div><div className="font-['Press_Start_2P'] text-2xl text-[#a78bfa]">+{Math.round(puntos*1.5)}</div><div className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">Experiencia</div></div>
            </div>
          </motion.div>
          <motion.button whileHover={{scale:1.02,y:-2}} whileTap={{scale:0.98}} onClick={()=>{music.stop();setScreen("config");}} className="w-full py-5 rounded-2xl font-['Press_Start_2P'] text-base text-white mb-3 flex items-center justify-center gap-3" style={{background:"linear-gradient(135deg,#9b44ff,#00e5ff)",boxShadow:"0 4px 22px rgba(155,68,255,0.4)"}}><RotateCcw size={18}/> Jugar de nuevo</motion.button>
          <Link to="/games" className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-base text-gray-400 border-2 border-white/10 hover:border-white/25 hover:text-white transition-all"><ArrowLeft size={18}/> Menú principal</Link>
        </div>
      </motion.div>
    );
  }

  // ── CONFIG ──
  if(screen==="config")return(
    <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} className="w-full max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8"><Link to="/games" className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"><ArrowLeft size={22}/></Link><div><h1 className="font-['Press_Start_2P'] text-xl text-[#9b44ff]">LABERINTO</h1><p className="text-gray-400 text-sm font-bold mt-1">Todas las Materias</p></div></div>
      <div className="relative overflow-hidden rounded-2xl border-2 border-[#9b44ff]/30 bg-[#0f1425] p-6 mb-5" style={{boxShadow:"0 4px 28px rgba(155,68,255,0.1)"}}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20" style={{background:"radial-gradient(circle,#9b44ff,transparent)",transform:"translate(30%,-30%)"}}/>
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl" style={{background:"rgba(155,68,255,0.15)",border:"1.5px solid rgba(155,68,255,0.35)"}}>🌀</div>
          <div>
            <p className="font-['Press_Start_2P'] text-xs text-[#9b44ff] mb-2">Laberinto del Saber</p>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">Navega por el laberinto usando las flechas del teclado o los botones de pantalla. Responde preguntas para abrir puertas.</p>
            <div className="flex gap-2 flex-wrap">
              {["Mates","Lengua","Ciencias","Sociales"].map(t=>(
                <span key={t} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{background:"rgba(155,68,255,0.1)",color:"#9b44ff",border:"1px solid rgba(155,68,255,0.25)"}}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-4"><p className="text-xs font-extrabold text-[#9b44ff] tracking-widest uppercase mb-3">Grado</p><div className="grid grid-cols-3 gap-2">{[4,5,6].map(g=>(<button key={g} onClick={()=>setGrado(g)} className="py-3 rounded-xl border-2 font-bold text-sm transition-all" style={{borderColor:grado===g?"#9b44ff":"rgba(255,255,255,0.1)",background:grado===g?"rgba(155,68,255,0.1)":"rgba(255,255,255,0.03)",color:grado===g?"#9b44ff":"#6b7280"}}>{g}to Grado</button>))}</div></div>
      <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-4"><p className="text-xs font-extrabold text-[#9b44ff] tracking-widest uppercase mb-3 flex items-center gap-2"><User size={13}/> Tu nombre</p><input className="w-full bg-white/4 border-2 border-white/10 rounded-xl px-4 py-3 text-white font-semibold outline-none focus:border-[#9b44ff]/60 transition-all placeholder:text-gray-600" placeholder="Escribe tu nombre..." value={playerName} onChange={e=>setPlayerName(e.target.value)} maxLength={20}/></div>
      <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-6">
        <p className="text-xs font-extrabold text-[#00ff88] tracking-widest uppercase mb-3 flex items-center gap-2"><Play size={13}/> Modo de juego</p>
        <div className="grid grid-cols-2 gap-2 mb-4"><button onClick={()=>setModo("solo")} className={`py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${modo==="solo"?"border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]":"border-white/10 bg-white/3 text-gray-400 hover:border-white/25"}`}><User size={15}/> Solitario</button><button onClick={()=>setModo("multi")} className={`py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${modo==="multi"?"border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa]":"border-white/10 bg-white/3 text-gray-400 hover:border-white/25"}`}><Users size={15}/> Multijugador</button></div>
        {modo==="multi"&&<MultiPanel nombreJugador={playerName} onNombreChange={setPlayerName} juego="laberinto" grado={grado} jugadoresConectados={multiState.sala?.jugadores??[]} nombrePropio={playerName} onCrear={(n,j)=>{setPlayerName(j);socket.crearSala({nombre:n,nombreJugador:j,materia:"lengua",grado,tiempoPorPregunta:9999,cantPreguntas:5});}} onUnirse={(c,j)=>{setPlayerName(j);socket.unirseASala(c,j);}} conectando={multiState.estado==="conectando"} colorAccent="#9b44ff"/>}
      </div>
      <motion.button whileHover={{scale:1.02,y:-2}} whileTap={{scale:0.98}} onClick={()=>modo==="solo"&&iniciarJuego(grado)} disabled={!playerName.trim()||(modo==="multi")} className="w-full py-5 rounded-2xl font-['Press_Start_2P'] text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed" style={{background:modo==="solo"?"linear-gradient(135deg,#9b44ff,#00e5ff)":"linear-gradient(135deg,#a78bfa,#7c3aed)",boxShadow:modo==="solo"?"0 4px 24px rgba(155,68,255,0.4)":"0 4px 24px rgba(167,139,250,0.35)"}}>{modo==="solo"?"Comenzar":"Crea o únete a una sala arriba"}</motion.button>
    </motion.div>
  );

  // ── PANTALLA PREGUNTA ──
  if(screen==="pregunta"&&preguntaActual){
    return(
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{background:"rgba(0,0,0,0.92)",backdropFilter:"blur(16px)"}}>
        <motion.div initial={{scale:0.8,opacity:0,y:20}} animate={{scale:1,opacity:1,y:0}} transition={{type:"spring",stiffness:300,damping:25}}
          className="w-full max-w-md rounded-3xl overflow-hidden" style={{background:"linear-gradient(145deg,#0d0d1f,#131328)",border:"2px solid rgba(155,68,255,0.4)",boxShadow:"0 30px 80px rgba(0,0,0,0.9)"}}>
          <div className="h-1 w-full" style={{background:"linear-gradient(90deg,transparent,#9b44ff 40%,#00e5ff 60%,transparent)"}}/>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{background:"rgba(155,68,255,0.2)",border:"1.5px solid rgba(155,68,255,0.4)"}}>🔑</div>
              <div>
                <p className="font-['Press_Start_2P'] text-xs text-[#9b44ff]">Puerta bloqueada</p>
                <p className="text-[10px] text-gray-500 font-bold">{preguntaActual.materia} · {grado}to grado</p>
              </div>
            </div>
            <p className="text-white font-semibold text-sm leading-relaxed mb-5">{preguntaActual.texto}</p>
            <div className="flex flex-col gap-2">
              {preguntaActual.opciones.map((op,i)=>{
                const esSel=seleccionada===i;
                const esCorr=mostrarFeedback&&i===preguntaActual.correcta;
                const esWrong=mostrarFeedback&&esSel&&i!==preguntaActual.correcta;
                return(
                  <motion.button key={i} whileHover={!seleccionada?{x:4}:{}} onClick={()=>responder(i)} disabled={!!seleccionada}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all"
                    style={{background:esCorr?"rgba(0,255,136,0.1)":esWrong?"rgba(255,71,87,0.1)":esSel?"rgba(155,68,255,0.1)":"rgba(255,255,255,0.03)",borderColor:esCorr?"#00ff88":esWrong?"#ff4757":esSel?"#9b44ff":"rgba(255,255,255,0.1)"}}>
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0" style={{background:esCorr?"rgba(0,255,136,0.2)":esWrong?"rgba(255,71,87,0.2)":esSel?"rgba(155,68,255,0.2)":"rgba(255,255,255,0.08)",color:esCorr?"#00ff88":esWrong?"#ff4757":esSel?"#9b44ff":"white"}}>{["A","B","C","D"][i]}</span>
                    <span className="text-sm text-white flex-1">{op}</span>
                    {esCorr&&<CheckCircle2 size={16} className="text-[#00ff88] flex-shrink-0"/>}
                    {esWrong&&<XCircle size={16} className="text-[#ff4757] flex-shrink-0"/>}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ── JUEGO — LABERINTO ──
  return(
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="w-full min-h-screen flex flex-col relative overflow-hidden" style={{background:"linear-gradient(135deg,#06091a 0%,#12091a 50%,#06091a 100%)"}}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden"><motion.div animate={{x:[0,40,0],y:[0,-30,0]}} transition={{duration:14,repeat:Infinity,ease:"easeInOut"}} className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-3xl opacity-30" style={{background:"radial-gradient(circle,rgba(155,68,255,0.15),transparent)"}}/></div>

      <AnimatePresence>{settOpen&&(<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center px-4" onClick={()=>setSettOpen(false)}><motion.div initial={{scale:0.88,opacity:0}} animate={{scale:1,opacity:1}} className="w-full max-w-sm rounded-2xl overflow-hidden" style={{background:"#12111e",border:"2px solid rgba(155,68,255,0.3)"}} onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5"><p className="font-['Press_Start_2P'] text-xs text-white">Configuración</p><button onClick={()=>setSettOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-gray-400"><X size={14}/></button></div><div className="px-5 py-4 space-y-3">{[{label:music.muted?"Activar música":"Silenciar música",icon:music.muted?<Volume2 size={14}/>:<VolumeX size={14}/>,action:music.toggleMute},{label:"Salir del juego",icon:<LogOut size={14}/>,action:()=>{music.stop();if(timerRef.current)clearInterval(timerRef.current);setScreen("config");setSettOpen(false);},danger:true}].map((a,i)=>(<button key={i} onClick={a.action} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold border ${(a as any).danger?"text-[#ff4757] border-[#ff4757]/20 bg-[#ff4757]/5":"text-gray-300 border-white/7 bg-white/3"}`}>{a.icon}{a.label}</button>))}<button onClick={()=>setSettOpen(false)} className="w-full py-3 rounded-xl font-bold text-sm text-white" style={{background:"linear-gradient(135deg,#9b44ff,#00e5ff)"}}>Cerrar</button></div></motion.div></motion.div>)}</AnimatePresence>
      <AnimatePresence>{showRanking&&modo==="multi"&&<RankingPanel jugadores={(multiState.sala?.jugadores??[]).map(j=>({...j,puntos:j.nombre===playerName?puntos:(puntosMulti[j.nombre]??0),correctas:j.nombre===playerName?correctas:0}))} nombrePropio={playerName} onClose={()=>setShowRanking(false)}/>}</AnimatePresence>

      {/* TOPBAR */}
      <div className="relative z-10 flex items-center gap-2 px-3 md:px-4 py-2 border-b border-white/5" style={{background:"rgba(6,9,26,0.95)",backdropFilter:"blur(16px)"}}>
        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">{modo==="multi"&&multiState.sala&&multiState.sala.jugadores.length>0?(<div className="flex items-center gap-2 overflow-x-auto pb-0.5 flex-1"><MiniJugadores jugadores={multiState.sala.jugadores} nombrePropio={playerName}/></div>):(<div className="flex items-center gap-2 min-w-0"><div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:"rgba(155,68,255,0.18)",border:"1.5px solid rgba(155,68,255,0.4)"}}><User size={14} style={{color:"#9b44ff"}}/></div><div className="min-w-0"><p className="text-xs font-extrabold text-white truncate leading-tight">{playerName}</p><p className="text-[10px] text-gray-500 font-bold leading-tight">Laberinto · {grado}to</p></div></div>)}</div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-center"><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Tiempo</p><p className="font-['Press_Start_2P'] text-sm text-[#00e5ff] leading-tight">{fmtT(tiempoSeg)}</p></div>
          <div className="w-px h-6 bg-white/10"/>
          <div className="text-center"><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Pos</p><p className="font-['Press_Start_2P'] text-sm text-[#9b44ff] leading-tight">{pos.x},{pos.y}</p></div>
          <div className="w-px h-6 bg-white/10"/>
          <div className="text-center"><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Pts</p><p className="font-['Press_Start_2P'] text-sm text-[#ffd700] leading-tight">{puntos}</p></div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0 ml-2">{modo==="multi"?(<><button onClick={music.toggleMute} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{background:"rgba(155,68,255,0.08)",borderColor:"rgba(155,68,255,0.22)",color:"#9b44ff"}}>{music.muted?<Volume2 size={14}/>:<VolumeX size={14}/>}</button><button onClick={()=>setShowRanking(r=>!r)} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{background:"rgba(255,215,0,0.08)",borderColor:"rgba(255,215,0,0.4)",color:"#ffd700"}}><Trophy size={14}/></button><button onClick={()=>{socket.salirSala();music.stop();setModo("solo");setScreen("config");}} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{background:"rgba(255,71,87,0.08)",borderColor:"rgba(255,71,87,0.3)",color:"#ff4757"}}><LogOut size={14}/></button></>):(<button onClick={()=>setSettOpen(true)} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{background:"rgba(155,68,255,0.08)",borderColor:"rgba(155,68,255,0.22)",color:"#9b44ff"}}><Settings size={14}/></button>)}</div>
      </div>

      {/* LABERINTO + CONTROLES */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-4 px-2 py-4">
        <p className="text-xs font-bold text-gray-500">Llega hasta la <span className="text-[#ffd700]">⭐ meta</span> — usa flechas o botones</p>

        {/* Grid del laberinto */}
        <div className="relative" style={{width:CELL*COLS,height:CELL*ROWS}}>
          {maze.length>0&&maze.map((row,y)=>row.map((cell,x)=>{
            const esJugador=pos.x===x&&pos.y===y;
            const esMeta=meta.x===x&&meta.y===y;
            const W=2; // ancho pared en px
            return(
              <div key={`${x}-${y}`} className="absolute"
                style={{left:x*CELL,top:y*CELL,width:CELL,height:CELL,
                  borderTop:cell.N?`${W}px solid rgba(155,68,255,0.7)`:`${W}px solid transparent`,
                  borderBottom:cell.S?`${W}px solid rgba(155,68,255,0.7)`:`${W}px solid transparent`,
                  borderLeft:cell.W?`${W}px solid rgba(155,68,255,0.7)`:`${W}px solid transparent`,
                  borderRight:cell.E?`${W}px solid rgba(155,68,255,0.7)`:`${W}px solid transparent`,
                  background:esJugador?"rgba(155,68,255,0.15)":esMeta?"rgba(255,215,0,0.1)":"rgba(255,255,255,0.02)",
                }}>
                {esJugador&&<motion.div animate={{scale:[1,1.15,1]}} transition={{duration:0.8,repeat:Infinity}} className="absolute inset-0 flex items-center justify-center text-base">🧙</motion.div>}
                {esMeta&&!esJugador&&<div className="absolute inset-0 flex items-center justify-center text-base">⭐</div>}
              </div>
            );
          }))}
        </div>

        {/* Controles táctiles */}
        <div className="flex flex-col items-center gap-1 mt-2">
          <button onPointerDown={()=>mover("up")} className="w-12 h-12 rounded-xl flex items-center justify-center border-2 border-[#9b44ff]/40 bg-[#9b44ff]/10 active:bg-[#9b44ff]/30 transition-all" style={{color:"#9b44ff"}}><ArrowUp size={22}/></button>
          <div className="flex gap-1">
            <button onPointerDown={()=>mover("left")} className="w-12 h-12 rounded-xl flex items-center justify-center border-2 border-[#9b44ff]/40 bg-[#9b44ff]/10 active:bg-[#9b44ff]/30 transition-all" style={{color:"#9b44ff"}}><AL size={22}/></button>
            <button onPointerDown={()=>mover("down")} className="w-12 h-12 rounded-xl flex items-center justify-center border-2 border-[#9b44ff]/40 bg-[#9b44ff]/10 active:bg-[#9b44ff]/30 transition-all" style={{color:"#9b44ff"}}><ArrowDown size={22}/></button>
            <button onPointerDown={()=>mover("right")} className="w-12 h-12 rounded-xl flex items-center justify-center border-2 border-[#9b44ff]/40 bg-[#9b44ff]/10 active:bg-[#9b44ff]/30 transition-all" style={{color:"#9b44ff"}}><ArrowRight size={22}/></button>
          </div>
        </div>

        {/* Mini stats */}
        <div className="flex gap-4 text-xs font-bold text-gray-600">
          <span>✓ {correctas} correctas</span>
          <span>✗ {incorrectas} incorrectas</span>
          <span>👣 {movimientos} pasos</span>
        </div>
      </div>
    </motion.div>
  );
}
