import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Settings, Home, Play, Pause, X, BookOpen,
  Volume2, VolumeX, RotateCcw, Trophy, Star, AlertTriangle,
  CheckCircle2, XCircle, Clock, HelpCircle, Zap, LogOut,
  User, Users, Copy, Check, Wifi
} from "lucide-react";
import { Link } from "react-router";
import { quizApi, type Pregunta } from "../../lib/quizApi";
import { useSocket, PreguntaPublica } from "../../lib/useSocket";
import { MultiLobby, MultiRanking, MiniJugadores } from "./MultiLobby";
import logoImg from "../../assets/logo.png";

type Screen = "splash" | "config" | "game" | "results";

/* ─── BANCO LOCAL (fallback) ─── */
const FALLBACK: Pregunta[] = [
  { id:1,  pregunta:"La lectura comprensiva consiste en:",                     opcion_a:"Leer rapido sin entender",              opcion_b:"Comprender lo que se lee",               opcion_c:"Memorizar sin analizar",            opcion_d:"Copiar el texto",               respuesta_correcta:"B" },
  { id:2,  pregunta:"Un texto narrativo se caracteriza por:",                  opcion_a:"Explicar datos cientificos",             opcion_b:"Contar una historia",                    opcion_c:"Dar instrucciones paso a paso",      opcion_d:"Describir objetos solamente",   respuesta_correcta:"B" },
  { id:3,  pregunta:"Un texto descriptivo tiene como funcion principal:",      opcion_a:"Narrar hechos historicos",              opcion_b:"Explicar experimentos",                  opcion_c:"Describir personas, lugares u objetos", opcion_d:"Argumentar opiniones",       respuesta_correcta:"C" },
  { id:4,  pregunta:"La palabra 'arbol' lleva tilde porque:",                  opcion_a:"Es una palabra aguda",                  opcion_b:"Es grave y termina en consonante",        opcion_c:"Es esdrujula",                      opcion_d:"No lleva tilde",                respuesta_correcta:"B" },
  { id:5,  pregunta:"Escribir correctamente y con coherencia es parte de:",    opcion_a:"La produccion escrita",                 opcion_b:"La lectura silenciosa",                  opcion_c:"La ortografia solamente",           opcion_d:"La pronunciacion oral",         respuesta_correcta:"A" },
  { id:6,  pregunta:"El vocabulario nos ayuda principalmente a:",              opcion_a:"Entender mejor los textos",             opcion_b:"Leer mas lento",                          opcion_c:"Escribir menos palabras",           opcion_d:"Memorizar solo fechas",         respuesta_correcta:"A" },
  { id:7,  pregunta:"Un sinonimo es una palabra que:",                         opcion_a:"Tiene significado opuesto a otra",      opcion_b:"Suena igual pero se escribe diferente",  opcion_c:"Tiene significado similar a otra",  opcion_d:"No tiene ningun significado",   respuesta_correcta:"C" },
  { id:8,  pregunta:"El punto final en un texto sirve para:",                  opcion_a:"Separar elementos de una lista",        opcion_b:"Indicar una pausa breve",                opcion_c:"Terminar un parrafo o texto",       opcion_d:"Mostrar que algo continua",     respuesta_correcta:"C" },
  { id:9,  pregunta:"Las palabras agudas llevan tilde cuando terminan en:",    opcion_a:"Cualquier consonante",                  opcion_b:"N, S o vocal",                           opcion_c:"Dos consonantes seguidas",          opcion_d:"Solo cuando terminan en vocal", respuesta_correcta:"B" },
  { id:10, pregunta:"Un antonimo es una palabra con:",                         opcion_a:"El mismo significado que otra",         opcion_b:"Significado contrario a otra",           opcion_c:"La misma pronunciacion",            opcion_d:"La misma escritura",            respuesta_correcta:"B" },
  { id:11, pregunta:"La mayuscula se usa obligatoriamente despues de:",        opcion_a:"Una coma",                              opcion_b:"Dos puntos siempre",                     opcion_c:"Un punto",                          opcion_d:"Un punto y coma",               respuesta_correcta:"C" },
  { id:12, pregunta:"Un texto instructivo tiene como objetivo:",               opcion_a:"Entretener con una historia",           opcion_b:"Describir paisajes naturales",           opcion_c:"Dar instrucciones paso a paso",     opcion_d:"Argumentar una opinion personal", respuesta_correcta:"C" },
  { id:13, pregunta:"La comunicacion oral se diferencia de la escrita porque:", opcion_a:"No transmite emociones",              opcion_b:"Usa voz, tono y gestos",                 opcion_c:"Es siempre mas formal",             opcion_d:"Solo se usa en el aula",        respuesta_correcta:"B" },
  { id:14, pregunta:"Las palabras esdrujulas llevan tilde:",                   opcion_a:"Solo si terminan en vocal",             opcion_b:"Nunca llevan tilde",                     opcion_c:"Solo en algunos sustantivos",       opcion_d:"Siempre, en todas sus formas",  respuesta_correcta:"D" },
  { id:15, pregunta:"El diccionario sirve principalmente para:",               opcion_a:"Encontrar poemas clasicos",             opcion_b:"Conocer el significado de palabras",     opcion_c:"Aprender operaciones matematicas",  opcion_d:"Mejorar solo la pronunciacion", respuesta_correcta:"B" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomizeOptions(q: Pregunta): Pregunta {
  const opts = [
    { key:"A", text:q.opcion_a }, { key:"B", text:q.opcion_b },
    { key:"C", text:q.opcion_c }, { key:"D", text:q.opcion_d },
  ];
  const correctText = opts.find(o => o.key === q.respuesta_correcta)!.text;
  const shuffled    = shuffle(opts);
  const newKey      = ["A","B","C","D"][shuffled.findIndex(o => o.text === correctText)] as "A"|"B"|"C"|"D";
  return { ...q, opcion_a:shuffled[0].text, opcion_b:shuffled[1].text, opcion_c:shuffled[2].text, opcion_d:shuffled[3].text, respuesta_correcta:newKey };
}

/* ─── MÚSICA ─── */
class MusicEngine {
  private ac: AudioContext|null=null; private masterGain: GainNode|null=null;
  private muteGain: GainNode|null=null; private running=false;
  start() {
    if (this.running) return;
    try {
      this.ac=new (window.AudioContext||(window as any).webkitAudioContext)();
      this.masterGain=this.ac.createGain(); this.muteGain=this.ac.createGain();
      this.masterGain.gain.value=0.12; this.muteGain.gain.value=1;
      this.masterGain.connect(this.muteGain); this.muteGain.connect(this.ac.destination);
      this.running=true; this.loop();
    } catch(_){}
  }
  stop() { this.running=false; try{this.ac?.close();}catch(_){} this.ac=null; this.masterGain=null; this.muteGain=null; }
  setMuted(m:boolean) { if(!this.muteGain||!this.ac)return; this.muteGain.gain.linearRampToValueAtTime(m?0:1,this.ac.currentTime+0.3); }
  setVolume(v:number) { if(this.masterGain&&this.ac) this.masterGain.gain.linearRampToValueAtTime((v/100)*0.2,this.ac.currentTime+0.1); }
  private loop() {
    const prog=[[261.6,329.6,392.0,493.9],[349.2,440.0,523.3,659.3],[220.0,261.6,329.6,440.0],[196.0,246.9,293.7,392.0]];
    let ci=0;
    const play=()=>{
      if(!this.running||!this.ac||!this.masterGain)return;
      prog[ci%prog.length].forEach((freq,vi)=>{
        if(!this.ac||!this.masterGain)return;
        const osc=this.ac.createOscillator(),env=this.ac.createGain(),filt=this.ac.createBiquadFilter();
        filt.type="lowpass";filt.frequency.value=700; osc.type="sine";osc.frequency.value=freq;osc.detune.value=(Math.random()-.5)*6;
        osc.connect(filt);filt.connect(env);env.connect(this.masterGain);
        const t=this.ac.currentTime+vi*0.14,dur=3;
        env.gain.setValueAtTime(0,t);env.gain.linearRampToValueAtTime(0.5,t+0.4);env.gain.setValueAtTime(0.4,t+dur-.5);env.gain.linearRampToValueAtTime(0,t+dur);
        osc.start(t);osc.stop(t+dur);
      });
      ci++; setTimeout(play,3400);
    };
    play();
  }
}

function useMusic() {
  const engine=useRef(new MusicEngine());
  const [muted,setMuted]=useState(false); const [vol,setVolS]=useState(50);
  useEffect(()=>()=>engine.current.stop(),[]);
  const start=useCallback(()=>engine.current.start(),[]);
  const stop=useCallback(()=>{engine.current.stop();setMuted(false);},[]);
  const toggleMute=useCallback(()=>setMuted(m=>{const n=!m;engine.current.setMuted(n);return n;}),[]);
  const setVolume=useCallback((v:number)=>{setVolS(v);engine.current.setVolume(v);},[]);
  return {start,stop,toggleMute,setVolume,muted,vol};
}

/* ═══════════════════════════════════════ COMPONENTE PRINCIPAL ═══════════════════════════════════════ */
export function QuizLengua4() {
  const music  = useMusic();
  const socket = useSocket();

  const [screen,      setScreen]      = useState<Screen>("splash");
  const [splashPct,   setSplashPct]   = useState(0);
  const [splashDone,  setSplashDone]  = useState(false);

  /* Config */
  const [timePerQ,    setTimePerQ]    = useState(15);
  const [qCount,      setQCount]      = useState(8);
  const [playerName,  setPlayerName]  = useState("");
  const [gameMode,    setGameMode]    = useState<"solo"|"multi">("solo");
  const [joinCode,    setJoinCode]    = useState("");         // código para unirse
  const [multiAction, setMultiAction] = useState<"crear"|"unirse">("crear");
  const [roomName,    setRoomName]    = useState("");

  /* Solo mode */
  const [questions,   setQuestions]   = useState<Pregunta[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [curQ,        setCurQ]        = useState(0);
  const [score,       setScore]       = useState(0);
  const [okCount,     setOkCount]     = useState(0);
  const [badCount,    setBadCount]    = useState(0);
  const [timeLeft,    setTimeLeft]    = useState(15);
  const [paused,      setPaused]      = useState(false);
  const [answered,    setAnswered]    = useState(false);
  const [selAns,      setSelAns]      = useState<string|null>(null);
  const [feedback,    setFeedback]    = useState<{msg:string;ok:boolean}|null>(null);
  const [settOpen,    setSettOpen]    = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);

  /* Multi mode — estado derivado del socket */
  const multiState = socket.state;
  const estaEnLobby = gameMode==="multi" && multiState.estado==="lobby";
const estaJugandoMulti = gameMode==="multi" && multiState.estado==="jugando";
  const estaEnResultadosMulti = gameMode==="multi" && multiState.estado==="resultados";
const esHost = multiState.sala?.jugadores[0]?.nombre === playerName || 
               (multiState.sala?.jugadores.length === 1 && multiState.sala?.jugadores[0]?.nombre === playerName);
  // Preguntas multi — vienen del servidor (sin respuesta_correcta)
  const multiPreguntas  = multiState.preguntas;
  const multiPregActual = multiPreguntas[multiState.preguntaIdx] as PreguntaPublica|undefined;

  // Estado local para la pregunta multi
  const [multiAnswered,  setMultiAnswered]  = useState(false);
  const [multiSelAns,    setMultiSelAns]    = useState<string|null>(null);
  const [multiTimeLeft,  setMultiTimeLeft]  = useState(15);
  const multiTimerRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const pauseRef = useRef(false);
  const qsRef    = useRef<Pregunta[]>([]);
  const curQRef  = useRef(0);
  const tlRef    = useRef(15);

  /* SPLASH */
  useEffect(()=>{
    if(screen!=="splash")return;
    const dur=4000,t0=Date.now();
    const iv=setInterval(()=>{
      const pct=Math.min(100,((Date.now()-t0)/dur)*100);
      setSplashPct(pct);
      if(pct>=100){clearInterval(iv);setSplashDone(true);setTimeout(()=>setScreen("config"),800);}
    },30);
    return ()=>clearInterval(iv);
  },[screen]);

  /* Cuando el servidor dice "juego_iniciado" en modo multi, resetear timer local */
  useEffect(()=>{
    if(!estaJugandoMulti)return;
    const tpq = multiState.sala?.tiempoPorPregunta ?? 15;
    setMultiAnswered(false); setMultiSelAns(null); setMultiTimeLeft(tpq);
  },[estaJugandoMulti]);

  /* Timer local para multi (el servidor es la fuente de verdad, este es visual) */
  useEffect(()=>{
    if(!estaJugandoMulti)return;
    if(multiTimerRef.current)clearInterval(multiTimerRef.current);
    const tpq = multiState.sala?.tiempoPorPregunta ?? 15;
    setMultiTimeLeft(tpq);
    multiTimerRef.current=setInterval(()=>{
      setMultiTimeLeft(t=>{
        if(t<=1){clearInterval(multiTimerRef.current!);return 0;}
        return t-1;
      });
    },1000);
    return ()=>{if(multiTimerRef.current)clearInterval(multiTimerRef.current);};
  },[multiState.preguntaIdx, estaJugandoMulti]);

  /* Cuando el servidor dice tiempo_agotado, resetear para siguiente pregunta */
  useEffect(()=>{
    if(multiState.tiempoAgotado){setMultiAnswered(true);}
  },[multiState.tiempoAgotado]);

  /* Avanzar pregunta en multi */
  useEffect(()=>{
    setMultiAnswered(false); setMultiSelAns(null);
  },[multiState.preguntaIdx]);

  /* ─────────────── SOLO MODE ─────────────── */
  function clearTimer(){if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null;}}

  async function startSolo(){
    if(!playerName.trim())return;
    setLoading(true);
    try{
      const raw=await quizApi.getPreguntas(4,"lengua",20);
      const pool=raw.length>0?raw:FALLBACK;
      initGame(shuffle(pool).slice(0,qCount).map(randomizeOptions));
    }catch{
      initGame(shuffle(FALLBACK).slice(0,qCount).map(randomizeOptions));
    }finally{setLoading(false);}
  }

  function initGame(qs:Pregunta[]){
    setCurQ(0);setScore(0);setOkCount(0);setBadCount(0);
    setAnswered(false);setSelAns(null);setFeedback(null);
    setPaused(false);pauseRef.current=false;
    setQuestions(qs);qsRef.current=qs;curQRef.current=0;
    setScreen("game");music.start();runTimer(timePerQ,qs,0);
  }

  function runTimer(secs:number,qs:Pregunta[],qi:number){
    clearTimer();tlRef.current=secs;setTimeLeft(secs);
    timerRef.current=setInterval(()=>{
      if(pauseRef.current)return;
      tlRef.current--;setTimeLeft(tlRef.current);
      if(tlRef.current<=0){clearTimer();onTimeout(qs,qi);}
    },1000);
  }

  function onTimeout(qs:Pregunta[],qi:number){
    setAnswered(true);setSelAns("__timeout__");
    setFeedback({msg:"Tiempo agotado",ok:false});
    setBadCount(p=>p+1);
    setTimeout(()=>nextQ(qs,qi),1900);
  }

  function handleAnswer(letter:string){
    if(answered||pauseRef.current)return;
    clearTimer();
    const qs=qsRef.current,qi=curQRef.current;
    setAnswered(true);setSelAns(letter);
    const correct=qs[qi].respuesta_correcta;
    if(letter===correct){
      const pts=Math.max(10,tlRef.current*10);
      setScore(p=>p+pts);setOkCount(p=>p+1);
      setFeedback({msg:`Correcto  +${pts} pts`,ok:true});
    }else{
      setBadCount(p=>p+1);
      setFeedback({msg:`Incorrecto — Correcta: ${correct}`,ok:false});
    }
    setTimeout(()=>nextQ(qs,qi),1900);
  }

  function nextQ(qs:Pregunta[],qi:number){
    const next=qi+1;
    if(next>=qs.length){music.stop();setScreen("results");return;}
    curQRef.current=next;
    setCurQ(next);setAnswered(false);setSelAns(null);setFeedback(null);
    runTimer(timePerQ,qs,next);
  }

  function togglePause(){const n=!paused;setPaused(n);pauseRef.current=n;}
  function openSettings(){if(!paused){setPaused(true);pauseRef.current=true;}setSettOpen(true);}
  function requestExit(){setSettOpen(false);setExitConfirm(true);}
  function confirmExit(){
    clearTimer();music.stop();
    setPaused(false);pauseRef.current=false;setExitConfirm(false);setScreen("config");
  }
  function cancelExit(){setExitConfirm(false);}

  /* ─────────────── MULTI MODE ─────────────── */
  function handleMultiAnswer(letter:"A"|"B"|"C"|"D"){
    if(multiAnswered||!multiState.sala)return;
    setMultiAnswered(true);setMultiSelAns(letter);
    if(multiTimerRef.current)clearInterval(multiTimerRef.current);
    socket.responder(multiState.sala.codigo, letter, multiTimeLeft);
  }

  function handleCrearSala(){
    if(!playerName.trim()||!roomName.trim())return;
    socket.crearSala({
      nombre:        roomName,
      nombreJugador: playerName,
      materia:       "lengua",
      grado:         4,
      tiempoPorPregunta: timePerQ,
      cantPreguntas:     qCount,
    });
  }

  function handleUnirseASala(){
    if(!playerName.trim()||joinCode.length<6)return;
    socket.unirseASala(joinCode.toUpperCase(), playerName);
  }

  function handleSalirMulti(){
    socket.salirSala();
    setGameMode("solo");
  }

  const q      = questions[curQ];
  const tPct   = timeLeft>0?(timeLeft/timePerQ)*100:0;
  const tColor = timeLeft<=5?"#ff4757":"#00e5ff";

  const multiTpq   = multiState.sala?.tiempoPorPregunta??15;
  const multiTPct  = multiTimeLeft>0?(multiTimeLeft/multiTpq)*100:0;
  const multiTColor= multiTimeLeft<=5?"#ff4757":"#00e5ff";
  const multiResult= multiState.resultado;

  const rPct  = questions.length>0?Math.round((okCount/questions.length)*100):0;
  const rData = rPct>=90?{icon:<Trophy size={56} className="text-[#ffd700]"/>,    title:"Increible",       sub:"Eres un experto en Lengua"}
              : rPct>=70?{icon:<Star size={56} className="text-[#00e5ff]"/>,       title:"Muy bien",        sub:"Gran desempeno, sigue asi"}
              : rPct>=50?{icon:<CheckCircle2 size={56} className="text-[#00ff88]"/>,title:"Bien hecho",     sub:"Vas por buen camino"}
              :           {icon:<Zap size={56} className="text-[#ff9800]"/>,        title:"Sigue intentando",sub:"Practica mas y lo lograras"};

  /* ════════════════════════════════════════════════════════ RENDER ════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col items-center w-full min-h-screen text-white relative">

      {/* LOADING */}
      <AnimatePresence>
        {loading&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 bg-[#06091a]/95 flex flex-col items-center justify-center gap-5">
            <div className="w-12 h-12 border-4 border-white/10 border-t-[#00e5ff] rounded-full animate-spin"/>
            <p className="text-[#00e5ff] font-bold text-base tracking-widest">Cargando preguntas...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ MODAL SALIDA ═══════════ */}
      <AnimatePresence>
        {exitConfirm&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-[60] flex items-center justify-center px-4"
            style={{background:"rgba(0,0,0,0.88)",backdropFilter:"blur(12px)"}}>
            <motion.div
              initial={{scale:0.82,opacity:0,y:24}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.9,opacity:0}}
              transition={{type:"spring",stiffness:340,damping:28}}
              className="w-full max-w-xs rounded-3xl overflow-hidden"
              style={{background:"linear-gradient(145deg,#16111f,#0e0c1a)",border:"2px solid rgba(255,71,87,0.4)",boxShadow:"0 30px 80px rgba(0,0,0,0.9)"}}>
              <div className="h-1 w-full" style={{background:"linear-gradient(90deg,transparent,#ff4757 40%,#ff6b7a 60%,transparent)"}}/>
              <div className="px-7 pt-6 pb-7 flex flex-col items-center text-center gap-5">
                <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",delay:0.1}}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{background:"rgba(255,71,87,0.1)",border:"1.5px solid rgba(255,71,87,0.35)"}}>
                  <AlertTriangle size={30} className="text-[#ff4757]"/>
                </motion.div>
                <div>
                  <h3 className="font-['Press_Start_2P'] text-sm text-white mb-2">Salir del juego</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">Tu progreso actual se perdera.</p>
                </div>
                <div className="w-full flex items-center justify-center gap-4 py-3 rounded-2xl"
                  style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                  <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-[#00ff88]"/><span className="font-['Press_Start_2P'] text-xs text-[#00ff88]">{okCount}</span></div>
                  <div className="w-px h-4 bg-white/10"/>
                  <div className="flex items-center gap-1.5"><Star size={13} className="text-[#ffd700]"/><span className="font-['Press_Start_2P'] text-xs text-[#ffd700]">{score}</span></div>
                  <div className="w-px h-4 bg-white/10"/>
                  <div className="flex items-center gap-1.5"><Clock size={13} className="text-[#00e5ff]"/><span className="font-['Press_Start_2P'] text-xs text-white">{curQ+1}/{questions.length}</span></div>
                </div>
                <div className="w-full flex flex-col gap-2.5">
                  <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={confirmExit}
                    className="w-full py-3.5 rounded-2xl font-['Press_Start_2P'] text-xs text-white"
                    style={{background:"linear-gradient(135deg,#ff4757,#c0392b)",boxShadow:"0 4px 20px rgba(255,71,87,0.35)"}}>
                    Si, salir
                  </motion.button>
                  <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.98}} onClick={cancelExit}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm text-gray-400 transition-all"
                    style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)"}}>
                    Continuar jugando
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ SETTINGS MODAL ═══════════ */}
      <AnimatePresence>
        {settOpen&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center px-4"
            onClick={()=>setSettOpen(false)}>
            <motion.div
              initial={{scale:0.88,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
              transition={{type:"spring",stiffness:300,damping:25}}
              className="w-full max-w-sm rounded-2xl overflow-hidden"
              style={{background:"#12111e",border:"2px solid rgba(0,229,255,0.2)",boxShadow:"0 20px 60px rgba(0,0,0,0.8)"}}
              onClick={e=>e.stopPropagation()}>
              <div className="h-0.5" style={{background:"linear-gradient(90deg,transparent,#00e5ff,transparent)"}}/>
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
                <p className="font-['Press_Start_2P'] text-xs text-white">Configuracion</p>
                <button onClick={()=>setSettOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all"><X size={14}/></button>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm font-bold text-gray-300">Estado</span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{background:paused?"rgba(255,215,0,0.12)":"rgba(0,255,136,0.12)",color:paused?"#ffd700":"#00ff88"}}>
                    {paused?"Pausado":"En curso"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm font-bold text-gray-300">Volumen</span>
                  <div className="flex items-center gap-2">
                    <input type="range" min={0} max={100} value={music.vol} onChange={e=>music.setVolume(Number(e.target.value))} className="w-24 accent-[#00e5ff]"/>
                    <span className="text-sm font-bold text-[#00e5ff] w-9">{music.vol}%</span>
                  </div>
                </div>
                {[
                  {label:paused?"Reanudar":"Pausar juego", icon:paused?<Play size={14}/>:<Pause size={14}/>, action:()=>{togglePause();setSettOpen(false);}},
                  {label:music.muted?"Activar musica":"Silenciar musica", icon:music.muted?<Volume2 size={14}/>:<VolumeX size={14}/>, action:music.toggleMute},
                  {label:"Salir del juego", icon:<LogOut size={14}/>, action:requestExit, danger:true},
                ].map((a,i)=>(
                  <button key={i} onClick={a.action}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${(a as any).danger?"text-[#ff4757] border-[#ff4757]/20 bg-[#ff4757]/5 hover:bg-[#ff4757]/10":"text-gray-300 border-white/7 bg-white/3 hover:text-[#00e5ff] hover:border-[#00e5ff]/25"}`}>
                    {a.icon}{a.label}
                  </button>
                ))}
                <button onClick={()=>setSettOpen(false)} className="w-full py-3 rounded-xl font-bold text-sm text-white" style={{background:"linear-gradient(135deg,#00e5ff,#9b44ff)"}}>
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════ SPLASH ════════════════════ */}
      <AnimatePresence>
        {screen==="splash"&&(
          <motion.div initial={{opacity:1}} exit={{opacity:0}} transition={{duration:0.9}}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
            style={{background:"radial-gradient(ellipse 100% 80% at 50% 0%, #0e082a 0%, #07091a 55%, #000 100%)"}}>
            {[...Array(7)].map((_,i)=>(
              <motion.div key={i} className="absolute rounded-full pointer-events-none"
                style={{width:2+(i%3)*2,height:2+(i%3)*2,left:`${8+i*13}%`,top:`${15+(i%4)*17}%`,
                  background:["#DAA520","#ff9800","#00e5ff","#9b44ff","#00ff88","#ffd700","#ff4757"][i]}}
                animate={{y:[0,-28,0],opacity:[0.2,0.7,0.2]}}
                transition={{duration:2.8+i*0.4,repeat:Infinity,delay:i*0.35,ease:"easeInOut"}}/>
            ))}
            <motion.div animate={{opacity:[0.3,0.65,0.3],scale:[1,1.08,1]}} transition={{duration:4,repeat:Infinity}}
              className="absolute pointer-events-none"
              style={{width:500,height:500,borderRadius:"50%",
                background:"radial-gradient(circle, rgba(155,68,255,0.12) 0%, rgba(218,165,32,0.07) 40%, transparent 70%)",
                top:"50%",left:"50%",transform:"translate(-50%,-52%)"}}/>
            <AnimatePresence mode="wait">
              {!splashDone?(
                <motion.div key="in" initial={{scale:1.5,opacity:0}} animate={{scale:1,opacity:1}}
                  transition={{duration:0.85,ease:[0.16,1,0.3,1]}}
                  className="flex flex-col items-center gap-0">
                  <motion.div className="relative mb-2" animate={{y:[0,-7,0]}} transition={{duration:3.5,repeat:Infinity,ease:"easeInOut"}}>
                    <motion.div animate={{scale:[1,1.3,1],opacity:[0.5,0.9,0.5]}} transition={{duration:2.5,repeat:Infinity}}
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{background:"radial-gradient(circle, rgba(218,165,32,0.25) 0%, rgba(155,68,255,0.12) 50%, transparent 70%)",transform:"scale(1.8)"}}/>
                    <img src={logoImg} alt="Saberix" className="w-36 h-36 md:w-44 md:h-44 object-contain relative z-10"
                      style={{filter:"drop-shadow(0 0 28px rgba(218,165,32,0.65)) drop-shadow(0 0 55px rgba(155,68,255,0.3))"}}/>
                  </motion.div>
                  <div className="flex items-center gap-0.5 mt-1 mb-2">
                    {["S","A","B","E","R","I","X"].map((l,i)=>{
                      const cols=["#ff4757","#ff9800","#ffd700","#00ff88","#00e5ff","#a78bfa","#ff4757"];
                      return(
                        <motion.span key={i} initial={{opacity:0,y:-18,scale:0.6}} animate={{opacity:1,y:0,scale:1}}
                          transition={{delay:0.5+i*0.07,type:"spring",stiffness:280,damping:17}}
                          className="font-['Press_Start_2P'] text-3xl md:text-4xl font-black leading-none"
                          style={{color:cols[i],textShadow:`0 0 20px ${cols[i]}bb, 0 0 40px ${cols[i]}44`}}>
                          {l}
                        </motion.span>
                      );
                    })}
                  </div>
                  <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:1.3}}
                    className="flex items-center gap-2 mb-8">
                    <div className="h-px w-10 rounded-full" style={{background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.2))"}}/>
                    <p className="text-xs md:text-sm font-bold tracking-[0.25em] uppercase" style={{color:"rgba(255,255,255,0.3)"}}>Aprende Jugando</p>
                    <div className="h-px w-10 rounded-full" style={{background:"linear-gradient(90deg,rgba(255,255,255,0.2),transparent)"}}/>
                  </motion.div>
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.6}} className="w-48 md:w-64">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[10px] font-bold tracking-widest uppercase" style={{color:"rgba(255,255,255,0.15)"}}>Cargando</span>
                      <span className="text-[10px] font-bold" style={{color:"rgba(218,165,32,0.5)"}}>{Math.round(splashPct)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.05)"}}>
                      <div className="h-full rounded-full"
                        style={{width:`${splashPct}%`,background:"linear-gradient(90deg,#ff4757,#ff9800,#ffd700,#00ff88,#00e5ff,#a78bfa)",boxShadow:"0 0 10px rgba(0,229,255,0.4)",transition:"width 0.04s linear"}}/>
                    </div>
                  </motion.div>
                </motion.div>
              ):(
                <motion.div key="out" initial={{scale:1,opacity:1}} animate={{scale:0.2,opacity:0,y:-90}}
                  transition={{duration:0.65,ease:[0.4,0,1,1]}} className="flex flex-col items-center">
                  <img src={logoImg} alt="" className="w-36 h-36 object-contain" style={{filter:"drop-shadow(0 0 25px rgba(218,165,32,0.5))"}}/>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════ MULTI — LOBBY ════════════════════ */}
      {estaEnLobby && multiState.sala && (
        <MultiLobby
          sala={multiState.sala}
          esHost={esHost}
          nombrePropio={playerName}
          conectando={multiState.estado==="conectando"}
          onIniciar={()=>socket.iniciarJuego(multiState.sala!.codigo)}
          onSalir={handleSalirMulti}
        />
      )}

      {/* ════════════════════ MULTI — ERROR ════════════════════ */}
      {gameMode==="multi" && multiState.estado==="error" && (
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
          className="w-full max-w-sm mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{background:"rgba(255,71,87,0.1)",border:"1.5px solid rgba(255,71,87,0.3)"}}>
            <AlertTriangle size={28} className="text-[#ff4757]"/>
          </div>
          <p className="font-['Press_Start_2P'] text-sm text-white mb-2">Error</p>
          <p className="text-gray-400 text-sm mb-8">{multiState.errorMsg}</p>
          <button onClick={socket.resetError}
            className="w-full py-4 rounded-2xl font-bold text-white"
            style={{background:"linear-gradient(135deg,#a78bfa,#7c3aed)"}}>
            Volver al menu
          </button>
        </motion.div>
      )}

      {/* ════════════════════ MULTI — RESULTADOS ════════════════════ */}
      {estaEnResultadosMulti && (
        <MultiRanking
          ranking={multiState.rankingFinal}
          nombrePropio={playerName}
          onJugarDeNuevo={handleSalirMulti}
          onSalir={handleSalirMulti}
        />
      )}

      {/* ════════════════════ CONFIG ════════════════════ */}
{screen==="config" && !estaEnLobby && !estaJugandoMulti && !estaEnResultadosMulti && !(gameMode==="multi" && multiState.estado==="error") && (        <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} className="w-full max-w-xl px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/games/language" className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
              <ArrowLeft size={22}/>
            </Link>
            <div>
              <h1 className="font-['Press_Start_2P'] text-xl text-[#DAA520]">QUIZ · LENGUA</h1>
              <p className="text-gray-400 text-sm font-bold mt-1">4to Grado</p>
            </div>
          </div>

          {/* Info */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-[#DAA520]/30 bg-[#0f1425] p-6 mb-5"
            style={{boxShadow:"0 4px 28px rgba(218,165,32,0.1)"}}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20"
              style={{background:"radial-gradient(circle,#DAA520,transparent)",transform:"translate(30%,-30%)"}}/>
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{background:"rgba(218,165,32,0.15)",border:"1.5px solid rgba(218,165,32,0.35)"}}>
                <BookOpen size={26} className="text-[#DAA520]"/>
              </div>
              <div>
                <p className="font-['Press_Start_2P'] text-xs text-[#DAA520] mb-2">Quiz de Lengua Espanola</p>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">
                  Demuestra tus conocimientos para <strong className="text-[#DAA520]">4to grado</strong>.
                </p>
                <div className="flex gap-2 flex-wrap">
                  {[{label:"Lectura",icon:<BookOpen size={11}/>},{label:"Escritura",icon:<HelpCircle size={11}/>},{label:"Gramatica",icon:<Star size={11}/>}].map(t=>(
                    <span key={t.label} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{background:"rgba(218,165,32,0.1)",color:"#DAA520",border:"1px solid rgba(218,165,32,0.25)"}}>
                      {t.icon} {t.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Nombre */}
          <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-4">
            <p className="text-xs font-extrabold text-[#00e5ff] tracking-widest uppercase mb-3 flex items-center gap-2">
              <User size={13}/> Tu nombre
            </p>
            <input className="w-full bg-white/4 border-2 border-white/10 rounded-xl px-4 py-3 text-white font-semibold text-base outline-none focus:border-[#00e5ff]/60 transition-all placeholder:text-gray-600"
              placeholder="Escribe tu nombre..." value={playerName} onChange={e=>setPlayerName(e.target.value)} maxLength={20}/>
          </div>

          {/* Modo */}
          <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-4">
            <p className="text-xs font-extrabold text-[#00ff88] tracking-widest uppercase mb-3 flex items-center gap-2">
              <Play size={13}/> Modo de juego
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button onClick={()=>setGameMode("solo")}
                className={`py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${gameMode==="solo"?"border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]":"border-white/10 bg-white/3 text-gray-400 hover:border-white/25"}`}>
                <User size={15}/> Solitario
              </button>
              <button onClick={()=>setGameMode("multi")}
                className={`py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${gameMode==="multi"?"border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa]":"border-white/10 bg-white/3 text-gray-400 hover:border-white/25"}`}>
                <Users size={15}/> Multijugador
              </button>
            </div>

            {/* Opciones multijugador */}
            <AnimatePresence>
              {gameMode==="multi"&&(
                <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} className="overflow-hidden">
                  <div className="border-t border-white/5 pt-4 space-y-4">
                    {/* Tabs crear / unirse */}
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={()=>setMultiAction("crear")}
                        className={`py-2.5 rounded-xl border text-xs font-extrabold tracking-wide transition-all ${multiAction==="crear"?"border-[#a78bfa] bg-[#a78bfa]/12 text-[#a78bfa]":"border-white/10 text-gray-500 hover:border-white/20"}`}>
                        Crear sala
                      </button>
                      <button onClick={()=>setMultiAction("unirse")}
                        className={`py-2.5 rounded-xl border text-xs font-extrabold tracking-wide transition-all ${multiAction==="unirse"?"border-[#00e5ff] bg-[#00e5ff]/12 text-[#00e5ff]":"border-white/10 text-gray-500 hover:border-white/20"}`}>
                        Unirse a sala
                      </button>
                    </div>

                    {multiAction==="crear"&&(
                      <div>
                        <p className="text-xs font-extrabold text-[#a78bfa] tracking-widest uppercase mb-2">Nombre de la sala</p>
                        <input className="w-full bg-white/4 border-2 border-white/10 rounded-xl px-4 py-3 text-white font-semibold text-base outline-none focus:border-[#a78bfa]/60 transition-all placeholder:text-gray-600"
                          placeholder="Mi sala epica..." value={roomName} onChange={e=>setRoomName(e.target.value)} maxLength={30}/>
                      </div>
                    )}

                    {multiAction==="unirse"&&(
                      <div>
                        <p className="text-xs font-extrabold text-[#00e5ff] tracking-widest uppercase mb-2">Codigo de sala</p>
                        <input className="w-full bg-white/4 border-2 border-white/10 rounded-xl px-4 py-3 text-white font-semibold text-xl outline-none focus:border-[#00e5ff]/60 transition-all placeholder:text-gray-600 tracking-widest text-center font-['Press_Start_2P']"
                          placeholder="000000" value={joinCode} onChange={e=>setJoinCode(e.target.value.replace(/\D/g,"").slice(0,6))} maxLength={6}/>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Config solo */}
          {gameMode==="solo"&&(
            <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-6">
              <p className="text-xs font-extrabold text-[#ffd700] tracking-widest uppercase mb-4 flex items-center gap-2">
                <Settings size={13}/> Configuracion
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {label:"Tiempo / pregunta",color:"#ffd700",icon:<Clock size={12}/>,val:timePerQ,unit:"seg",dec:()=>setTimePerQ(t=>Math.max(5,t-5)),inc:()=>setTimePerQ(t=>Math.min(120,t+5))},
                  {label:"Num. preguntas",color:"#ff9800",icon:<HelpCircle size={12}/>,val:qCount,unit:"",dec:()=>setQCount(t=>Math.max(3,t-1)),inc:()=>setQCount(t=>Math.min(10,t+1))},
                ].map(c=>(
                  <div key={c.label} className="bg-white/3 border border-white/7 rounded-xl p-4">
                    <p className="flex items-center gap-1.5 text-xs font-extrabold tracking-widest uppercase mb-3" style={{color:c.color}}>
                      {c.icon} {c.label}
                    </p>
                    <div className="flex items-center">
                      <button onClick={c.dec} className="w-9 h-9 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-[#00e5ff] transition-all text-xl font-bold">−</button>
                      <div className="flex-1 text-center">
                        <span className="font-['Press_Start_2P'] text-2xl" style={{color:c.color}}>{c.val}</span>
                        {c.unit&&<span className="text-xs text-gray-500 ml-1">{c.unit}</span>}
                      </div>
                      <button onClick={c.inc} className="w-9 h-9 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-[#00e5ff] transition-all text-xl font-bold">+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón acción */}
          <motion.button whileHover={{scale:1.02,y:-2}} whileTap={{scale:0.98}}
            onClick={()=>{
              if(gameMode==="solo") startSolo();
              else if(multiAction==="crear") handleCrearSala();
              else handleUnirseASala();
            }}
            disabled={
              !playerName.trim() ||
              (gameMode==="multi" && multiAction==="crear" && !roomName.trim()) ||
              (gameMode==="multi" && multiAction==="unirse" && joinCode.length<6)
            }
            className="w-full py-5 rounded-2xl font-['Press_Start_2P'] text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: gameMode==="solo"
                ? "linear-gradient(135deg,#DAA520,#ff9800)"
                : "linear-gradient(135deg,#a78bfa,#7c3aed)",
              boxShadow: gameMode==="solo"
                ? "0 4px 24px rgba(218,165,32,0.4)"
                : "0 4px 24px rgba(167,139,250,0.35)",
            }}>
            {gameMode==="solo" ? "Comenzar" : multiAction==="crear" ? "Crear sala" : "Unirse"}
          </motion.button>
        </motion.div>
      )}

      {/* ════════════════════ GAME SOLO ════════════════════ */}
      {screen==="game" && q && gameMode==="solo" && (
        <GameScreen
          q={q} curQ={curQ} totalQ={questions.length}
          playerName={playerName} score={score}
          timeLeft={timeLeft} timePerQ={timePerQ} tPct={tPct} tColor={tColor}
          paused={paused} settOpen={settOpen} exitConfirm={exitConfirm}
          answered={answered} selAns={selAns} feedback={feedback}
          okCount={okCount} badCount={badCount}
          onAnswer={handleAnswer} onTogglePause={togglePause}
          onOpenSettings={openSettings} isMulti={false}
          rankingParcial={[]}
        />
      )}

      {/* ════════════════════ GAME MULTI ════════════════════ */}
      {estaJugandoMulti && multiPregActual && (
        <GameScreen
          q={{
            id: multiPregActual.id, pregunta: multiPregActual.pregunta,
            opcion_a: multiPregActual.opcion_a, opcion_b: multiPregActual.opcion_b,
            opcion_c: multiPregActual.opcion_c, opcion_d: multiPregActual.opcion_d,
            respuesta_correcta: multiResult?.respuestaCorrecta ?? "A",
          }}
          curQ={multiState.preguntaIdx} totalQ={multiPreguntas.length}
          playerName={playerName} score={multiResult?.tusPuntos ?? 0}
          timeLeft={multiTimeLeft} timePerQ={multiTpq} tPct={multiTPct} tColor={multiTColor}
          paused={false} settOpen={false} exitConfirm={false}
          answered={multiAnswered} selAns={multiSelAns}
          feedback={
            multiState.tiempoAgotado ? {msg:"Tiempo agotado",ok:false} :
            multiResult ? {
              msg: multiResult.correcto ? `Correcto  +${multiResult.puntosGanados} pts` : `Incorrecto — Correcta: ${multiResult.respuestaCorrecta}`,
              ok:  multiResult.correcto,
            } : null
          }
          okCount={multiState.ranking.find(r=>r.nombre===playerName)?.correctas??0}
          badCount={0}
          onAnswer={l=>handleMultiAnswer(l as "A"|"B"|"C"|"D")}
          onTogglePause={()=>{}}
          onOpenSettings={()=>{}}
          isMulti={true}
          showCorrect={!!multiResult || multiState.tiempoAgotado}
          rankingParcial={multiState.ranking}
          onSalirMulti={handleSalirMulti}
        />
      )}

      {/* ════════════════════ RESULTS SOLO ════════════════════ */}
      {screen==="results" && gameMode==="solo" && (
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-lg px-4 py-10 text-center">
          <motion.div initial={{scale:0,rotate:-15}} animate={{scale:1,rotate:0}} transition={{type:"spring",delay:0.1}} className="flex justify-center mb-6">
            {rData.icon}
          </motion.div>
          <h2 className="font-['Press_Start_2P'] text-3xl mb-3"
            style={{background:"linear-gradient(135deg,#ffd700,#ff9800)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            {rData.title}
          </h2>
          <p className="text-gray-300 font-bold text-base mb-10">{rData.sub}</p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              {label:"Correctas",val:okCount,color:"#00ff88",bg:"rgba(0,255,136,0.06)",border:"rgba(0,255,136,0.25)",icon:<CheckCircle2 size={20}/>},
              {label:"Incorrectas",val:badCount,color:"#ff4757",bg:"rgba(255,71,87,0.06)",border:"rgba(255,71,87,0.25)",icon:<XCircle size={20}/>},
              {label:"Puntos",val:score,color:"#ffd700",bg:"rgba(255,215,0,0.06)",border:"rgba(255,215,0,0.25)",icon:<Star size={20}/>},
            ].map(s=>(
              <div key={s.label} className="rounded-2xl border-2 p-5" style={{background:s.bg,borderColor:s.border}}>
                <div className="flex justify-center mb-2" style={{color:s.color}}>{s.icon}</div>
                <div className="font-['Press_Start_2P'] text-3xl mb-1" style={{color:s.color}}>{s.val}</div>
                <div className="text-xs font-extrabold text-gray-500 tracking-widest uppercase">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border-2 border-[#ffd700]/20 p-6 mb-8"
            style={{background:"linear-gradient(135deg,rgba(255,215,0,0.05),rgba(255,152,0,0.03))"}}>
            <div className="flex items-center justify-center gap-2 mb-5">
              <Trophy size={16} className="text-[#ffd700]"/>
              <p className="text-sm font-extrabold text-[#ffd700] tracking-widest uppercase">Recompensas</p>
            </div>
            <div className="flex justify-center gap-12">
              <div><div className="font-['Press_Start_2P'] text-2xl text-[#ff9800]">+{okCount*10}</div><div className="text-sm font-bold text-gray-500 mt-2">Monedas</div></div>
              <div><div className="font-['Press_Start_2P'] text-2xl text-[#ff9800]">+{okCount*15}</div><div className="text-sm font-bold text-gray-500 mt-2">Experiencia</div></div>
            </div>
          </div>
          <motion.button whileHover={{scale:1.02,y:-2}} whileTap={{scale:0.98}}
            onClick={()=>{setCurQ(0);setScore(0);setOkCount(0);setBadCount(0);setScreen("config");}}
            className="w-full py-5 rounded-2xl font-['Press_Start_2P'] text-base text-white mb-4 flex items-center justify-center gap-3"
            style={{background:"linear-gradient(135deg,#DAA520,#ff9800)",boxShadow:"0 4px 22px rgba(218,165,32,0.35)"}}>
            <RotateCcw size={18}/> Jugar de nuevo
          </motion.button>
          <Link to="/games/language" className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-base text-gray-400 border-2 border-white/10 hover:border-white/25 hover:text-white transition-all">
            <Home size={18}/> Menu principal
          </Link>
        </motion.div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTE: pantalla de juego (reutilizable solo/multi)
═══════════════════════════════════════════════════════════════ */
interface GameScreenProps {
  q: Pregunta;
  curQ: number; totalQ: number;
  playerName: string; score: number;
  timeLeft: number; timePerQ: number; tPct: number; tColor: string;
  paused: boolean; settOpen: boolean; exitConfirm: boolean;
  answered: boolean; selAns: string|null;
  feedback: {msg:string;ok:boolean}|null;
  okCount: number; badCount: number;
  onAnswer: (l:string)=>void;
  onTogglePause: ()=>void;
  onOpenSettings: ()=>void;
  isMulti: boolean;
  showCorrect?: boolean;
  rankingParcial: {nombre:string;puntos:number;correctas:number}[];
  onSalirMulti?: ()=>void;
}

function GameScreen({
  q, curQ, totalQ, playerName, score,
  timeLeft, timePerQ, tPct, tColor,
  paused, settOpen, exitConfirm,
  answered, selAns, feedback,
  okCount, badCount,
  onAnswer, onTogglePause, onOpenSettings,
  isMulti, showCorrect, rankingParcial, onSalirMulti,
}: GameScreenProps) {
  const [showRanking, setShowRanking] = useState(false);

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}}
      className="w-full min-h-screen flex flex-col relative overflow-hidden"
      style={{background:"linear-gradient(135deg,#06091a 0%,#0d1230 50%,#06091a 100%)"}}>

      {/* Fondo animado */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{x:[0,50,0],y:[0,-40,0]}} transition={{duration:14,repeat:Infinity,ease:"easeInOut"}}
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-3xl opacity-60"
          style={{background:"radial-gradient(circle,rgba(155,68,255,0.12),transparent)"}}/>
        <motion.div animate={{x:[0,-40,0],y:[0,40,0]}} transition={{duration:17,repeat:Infinity,ease:"easeInOut",delay:4}}
          className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] rounded-full blur-3xl opacity-50"
          style={{background:"radial-gradient(circle,rgba(0,229,255,0.1),transparent)"}}/>
        <div className="absolute inset-0 opacity-[0.025]"
          style={{backgroundImage:"linear-gradient(rgba(0,229,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,1) 1px,transparent 1px)",backgroundSize:"60px 60px"}}/>
      </div>

      {/* TOPBAR */}
      <div className="relative z-10 flex flex-col border-b border-white/5"
        style={{background:"rgba(6,9,26,0.9)",backdropFilter:"blur(16px)"}}>

        {/* Burbujas jugadores multi */}
        {isMulti && rankingParcial.length > 0 && (
          <div className="px-4 pt-2 pb-1 border-b border-white/5 overflow-x-auto">
            <MiniJugadores jugadores={rankingParcial} nombrePropio={playerName} />
          </div>
        )}

        <div className="flex items-center gap-3 px-4 md:px-6 py-2.5">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{background:"rgba(218,165,32,0.18)",border:"1.5px solid rgba(218,165,32,0.4)"}}>
            <User size={16} className="text-[#DAA520]"/>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-white truncate">{playerName}</p>
            <p className="text-xs text-gray-500 font-bold">Lengua · 4to {isMulti && <span className="text-[#a78bfa]">· Multi</span>}</p>
          </div>
        </div>
        <div className="text-center flex-shrink-0">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Pregunta</p>
          <p className="font-['Press_Start_2P'] text-base text-white">{curQ+1}<span className="text-gray-600">/{totalQ}</span></p>
        </div>
        <div className="text-center flex-shrink-0">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Puntos</p>
          <p className="font-['Press_Start_2P'] text-base text-[#ffd700]">{score}</p>
        </div>
        {/* Timer */}
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
            <circle cx="28" cy="28" r="24" fill="none" stroke={tColor} strokeWidth="4"
              strokeDasharray={`${2*Math.PI*24}`}
              strokeDashoffset={`${2*Math.PI*24*(1-tPct/100)}`}
              style={{transition:"stroke-dashoffset 1s linear, stroke 0.3s",filter:`drop-shadow(0 0 4px ${tColor})`}}/>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-['Press_Start_2P'] text-sm" style={{color:tColor}}>{timeLeft}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {/* Ranking parcial en multi */}
          {isMulti && rankingParcial.length>0 && (
            <button onClick={()=>setShowRanking(r=>!r)}
              className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all"
              style={{background:"rgba(167,139,250,0.08)",borderColor:"rgba(167,139,250,0.22)",color:"#a78bfa"}}>
              <Trophy size={15}/>
            </button>
          )}
          {!isMulti && (
            <>
              <button onClick={onTogglePause}
                className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all"
                style={{background:"rgba(255,215,0,0.08)",borderColor:"rgba(255,215,0,0.22)",color:"#ffd700"}}>
                {paused?<Play size={15}/>:<Pause size={15}/>}
              </button>
              <button onClick={onOpenSettings}
                className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all"
                style={{background:"rgba(0,229,255,0.08)",borderColor:"rgba(0,229,255,0.22)",color:"#00e5ff"}}>
                <Settings size={15}/>
              </button>
            </>
          )}
          {isMulti && onSalirMulti && (
            <button onClick={onSalirMulti}
              className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all"
              style={{background:"rgba(255,71,87,0.08)",borderColor:"rgba(255,71,87,0.22)",color:"#ff4757"}}>
              <LogOut size={15}/>
            </button>
          )}
        </div>
        </div>
      </div>

      {/* Barra de tiempo */}
      <div className="relative z-10 w-full h-1.5" style={{background:"rgba(255,255,255,0.04)"}}>
        <div className="h-full transition-all duration-1000"
          style={{width:`${tPct}%`,background:`linear-gradient(90deg,${tColor},#9b44ff)`,boxShadow:`0 0 10px ${tColor}80`}}/>
      </div>

      {/* RANKING PARCIAL MULTI — panel lateral */}
      <AnimatePresence>
        {showRanking && isMulti && (
          <motion.div initial={{opacity:0,x:300}} animate={{opacity:1,x:0}} exit={{opacity:0,x:300}}
            className="fixed right-0 top-0 h-full w-64 z-50 border-l border-white/10 p-5 overflow-y-auto"
            style={{background:"rgba(12,10,28,0.97)",backdropFilter:"blur(20px)"}}>
            <div className="flex items-center justify-between mb-5">
              <p className="font-['Press_Start_2P'] text-xs text-[#a78bfa]">Ranking</p>
              <button onClick={()=>setShowRanking(false)} className="text-gray-500 hover:text-white"><X size={16}/></button>
            </div>
            {rankingParcial.map((r,i)=>(
              <div key={r.nombre} className="flex items-center gap-3 py-2.5 border-b border-white/5">
                <span className="text-lg w-6">{["🥇","🥈","🥉"][i]??`${i+1}`}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{r.nombre}</p>
                  <p className="text-xs text-gray-500">{r.correctas} correctas</p>
                </div>
                <span className="font-['Press_Start_2P'] text-xs text-[#ffd700]">{r.puntos}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAUSE OVERLAY (solo mode) */}
      <AnimatePresence>
        {paused && !settOpen && !exitConfirm && !isMulti && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center"
            onClick={onTogglePause}>
            <motion.div initial={{scale:0.8}} animate={{scale:1}}
              className="text-center bg-[#111428] border-2 border-[#ffd700]/30 rounded-3xl px-12 py-10">
              <Pause size={48} className="text-[#ffd700] mx-auto mb-4"/>
              <p className="font-['Press_Start_2P'] text-xl text-[#ffd700] mb-2">PAUSADO</p>
              <p className="text-gray-400 text-sm font-bold">Toca para continuar</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTENIDO */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 md:px-10 py-6">
        <div className="w-full max-w-3xl">
          {/* Tarjeta pregunta */}
          <AnimatePresence mode="wait">
            <motion.div key={curQ}
              initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}
              transition={{duration:0.25}}
              className="relative overflow-hidden rounded-2xl border-2 p-6 md:p-8 mb-5"
              style={{background:"rgba(17,20,40,0.9)",backdropFilter:"blur(20px)",borderColor:"rgba(155,68,255,0.35)",
                boxShadow:"0 8px 40px rgba(155,68,255,0.15), inset 0 1px 0 rgba(255,255,255,0.05)"}}>
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
                style={{background:"radial-gradient(circle,rgba(155,68,255,0.15),transparent)",transform:"translate(30%,-30%)"}}/>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-['Press_Start_2P'] text-xs px-4 py-2 rounded-full"
                  style={{background:"rgba(155,68,255,0.15)",color:"#9b44ff",border:"1px solid rgba(155,68,255,0.35)"}}>
                  Pregunta {curQ+1}
                </span>
                <div className="flex-1 h-px" style={{background:"rgba(155,68,255,0.2)"}}/>
              </div>
              <p className="text-xl md:text-2xl font-semibold text-white leading-relaxed"
                style={{fontFamily:"Nunito, system-ui, sans-serif"}}>
                {q.pregunta}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Feedback fijo */}
          <div className="h-14 flex items-center mb-4">
            <AnimatePresence>
              {feedback&&(
                <motion.div initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} exit={{opacity:0,x:6}} transition={{duration:0.18}}
                  className={`w-full flex items-center justify-center gap-3 text-sm font-bold text-center px-5 py-3 rounded-2xl border-2 ${feedback.ok?"bg-[#00ff88]/8 border-[#00ff88]/30 text-[#00ff88]":"bg-[#ff4757]/8 border-[#ff4757]/30 text-[#ff4757]"}`}>
                  {feedback.ok?<CheckCircle2 size={18}/>:<XCircle size={18}/>}
                  {feedback.msg}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Respuestas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(["A","B","C","D"] as const).map((letter,i)=>{
              const text      = q[`opcion_${letter.toLowerCase()}` as keyof Pregunta] as string;
              // En multi, solo mostramos correcta si ya respondió o tiempo agotado
              const isCorrect = (answered || showCorrect) && letter===q.respuesta_correcta;
              const isSel     = letter===selAns;
              const show      = answered||!!showCorrect;
              let border="rgba(255,255,255,0.1)",bg="rgba(255,255,255,0.04)";
              let lblBg="rgba(0,229,255,0.12)",lblBdr="rgba(0,229,255,0.3)",lblTxt="#00e5ff";
              if(show&&isCorrect){border="#00ff88";bg="rgba(0,255,136,0.08)";lblBg="rgba(0,255,136,0.2)";lblBdr="#00ff88";lblTxt="#00ff88";}
              else if(show&&isSel&&!isCorrect){border="#ff4757";bg="rgba(255,71,87,0.08)";lblBg="rgba(255,71,87,0.18)";lblBdr="#ff4757";lblTxt="#ff4757";}
              return(
                <motion.button key={letter}
                  initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}
                  whileHover={!answered?{y:-2,scale:1.01}:{}}
                  onClick={()=>onAnswer(letter)}
                  disabled={answered}
                  className="flex items-center gap-4 p-4 md:p-5 rounded-2xl border-2 text-left transition-colors disabled:cursor-default"
                  style={{borderColor:border,backgroundColor:bg,backdropFilter:"blur(8px)"}}>
                  <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-black"
                    style={{background:lblBg,border:`2px solid ${lblBdr}`,color:lblTxt,fontFamily:"Poppins, sans-serif"}}>
                    {letter}
                  </div>
                  <span className="text-base font-semibold text-white leading-snug flex-1" style={{fontFamily:"Nunito, system-ui, sans-serif"}}>
                    {text}
                  </span>
                  {show&&isCorrect&&<CheckCircle2 size={18} className="flex-shrink-0 text-[#00ff88]"/>}
                  {show&&isSel&&!isCorrect&&<XCircle size={18} className="flex-shrink-0 text-[#ff4757]"/>}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOMBAR */}
      <div className="relative z-10 flex items-center justify-center gap-6 px-6 py-3 border-t border-white/5"
        style={{background:"rgba(6,9,26,0.85)",backdropFilter:"blur(16px)"}}>
        <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
          <CheckCircle2 size={14} className="text-[#00ff88]"/>
          <span className="text-[#00ff88]">{okCount}</span> correctas
        </div>
        <div className="w-px h-4 bg-white/10"/>
        <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
          <XCircle size={14} className="text-[#ff4757]"/>
          <span className="text-[#ff4757]">{badCount}</span> incorrectas
        </div>
        <div className="w-px h-4 bg-white/10"/>
        <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
          <Star size={14} className="text-[#ffd700]"/>
          <span className="text-[#ffd700]">{score}</span> pts
        </div>
        {isMulti && (
          <>
            <div className="w-px h-4 bg-white/10"/>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
              <Wifi size={14} className="text-[#00ff88]"/>
              <span className="text-[#00ff88] text-xs">En linea</span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
