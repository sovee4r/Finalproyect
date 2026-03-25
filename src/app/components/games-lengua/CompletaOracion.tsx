import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Play, Pause, X, BookOpen,
  Volume2, VolumeX, RotateCcw, Trophy, Star,
  CheckCircle2, XCircle, LogOut, HelpCircle,
  User, Users, AlertTriangle, Settings
} from "lucide-react";
import { Link, useNavigate} from "react-router";
import { useSocket } from "../../../lib/useSocket";
import { useAuth } from "../../AuthContext";
import { GameLobby, GameError, GameRankingFinal, MultiPanel, RankingPanel } from "../GameShared";
import { MiniJugadores } from "../MultiLobby";
// Ruta corregida — src/assets/logo.png desde src/app/components/games-lengua/
// Ruta corregida
import logoImg from "../../../assets/logo.png";

const API = import.meta.env.VITE_API_URL ?? "https://finalproyect-production-3837.up.railway.app";

type Screen = "splash" | "config" | "juego" | "resultados";
type Modo = "solo" | "multi";

interface Ejercicio {
  partes:      string[];
  opciones:    string[];
  correcta:    number;
  explicacion: string;
}

const EJERCICIOS: Record<number, Ejercicio[]> = {
  4: [
    { partes: ["Un texto ", "", " cuenta una historia con personajes y eventos."], opciones: ["descriptivo", "narrativo", "instructivo", "expositivo"], correcta: 1, explicacion: "El texto narrativo cuenta historias con personajes, tiempo y lugar." },
    { partes: ["La palabra 'árbol' es ", "", " porque termina en consonante que no es n ni s."], opciones: ["aguda", "grave", "esdrújula", "sobresdrújula"], correcta: 1, explicacion: "Las palabras graves llevan tilde cuando terminan en consonante distinta de n o s." },
    { partes: ["Un ", "", " es una palabra con significado similar a otra."], opciones: ["antónimo", "sinónimo", "homónimo", "parónimo"], correcta: 1, explicacion: "Los sinónimos son palabras con significados parecidos, como 'feliz' y 'contento'." },
    { partes: ["Las palabras esdrújulas llevan tilde ", "", "."], opciones: ["solo a veces", "nunca", "siempre", "solo al final"], correcta: 2, explicacion: "Las palabras esdrújulas siempre llevan tilde, sin excepción." },
    { partes: ["Un texto ", "", " tiene como objetivo dar instrucciones paso a paso."], opciones: ["narrativo", "descriptivo", "instructivo", "argumentativo"], correcta: 2, explicacion: "Los textos instructivos guían al lector con pasos ordenados, como recetas o manuales." },
    { partes: ["La ", "", " es fundamental para escribir de forma correcta."], opciones: ["aritmética", "ortografía", "geografía", "filosofía"], correcta: 1, explicacion: "La ortografía estudia las reglas para escribir correctamente." },
  ],
  5: [
    { partes: ["En la oración 'El perro corre', la palabra 'perro' es un ", "", "."], opciones: ["verbo", "adjetivo", "sustantivo", "artículo"], correcta: 2, explicacion: "Los sustantivos nombran personas, animales, lugares o cosas." },
    { partes: ["Un texto ", "", " busca convencer al lector con opiniones y razones."], opciones: ["descriptivo", "narrativo", "argumentativo", "instructivo"], correcta: 2, explicacion: "Los textos argumentativos presentan una posición y la defienden con argumentos." },
    { partes: ["En 'El perro corre rápido', la palabra 'corre' es un ", "", "."], opciones: ["sustantivo", "verbo", "adjetivo", "pronombre"], correcta: 1, explicacion: "Los verbos expresan acciones, estados o procesos." },
    { partes: ["Un texto no literario se usa para ", "", " hechos reales."], opciones: ["inventar", "informar o explicar", "decorar", "confundir"], correcta: 1, explicacion: "Los textos no literarios tienen un propósito práctico: informar, explicar o instruir." },
    { partes: ["La palabra que describe características del sustantivo se llama ", "", "."], opciones: ["verbo", "artículo", "adjetivo", "preposición"], correcta: 2, explicacion: "Los adjetivos modifican al sustantivo, como 'perro grande' o 'casa bonita'." },
  ],
  6: [
    { partes: ["Un texto argumentativo presenta ", "", " con razones que las apoyan."], opciones: ["solo descripciones", "opiniones", "únicamente datos", "solo diálogos"], correcta: 1, explicacion: "Los textos argumentativos defienden una postura con argumentos y evidencias." },
    { partes: ["Una ", "", " es un trabajo escrito de investigación sobre un tema específico."], opciones: ["novela", "monografía", "carta", "poema"], correcta: 1, explicacion: "La monografía es un texto académico que investiga y analiza un tema en profundidad." },
    { partes: ["La comunicación ", "", " se usa en exposiciones y documentos oficiales."], opciones: ["informal", "gestual", "formal", "secreta"], correcta: 2, explicacion: "La comunicación formal sigue reglas y normas de cortesía propias de contextos profesionales." },
    { partes: ["Comprender textos complejos implica interpretar las ideas ", "", "."], opciones: ["sin analizar", "principales y secundarias", "copiando el texto", "memorizando"], correcta: 1, explicacion: "La comprensión lectora avanzada requiere identificar ideas clave y relaciones entre ellas." },
    { partes: ["Un informe debe ser claro y ", "", "."], opciones: ["desordenado", "muy breve sin explicación", "organizado", "lleno de imágenes"], correcta: 2, explicacion: "Los informes deben presentar información de manera clara, ordenada y precisa." },
  ],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* ─── MÚSICA: COMPLETA LA ORACIÓN — Melódico, optimista, fluido ─── */
class MusicEngine {
  private ac: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muteGain: GainNode | null = null;
  private running = false;
  start() {
    if (this.running) return;
    try {
      this.ac = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ac.createGain(); this.muteGain = this.ac.createGain();
      this.masterGain.gain.value = 0.11; this.muteGain.gain.value = 1;
      this.masterGain.connect(this.muteGain); this.muteGain.connect(this.ac.destination);
      this.running = true; this.loop();
    } catch (_) {}
  }
  stop() { this.running = false; try { this.ac?.close(); } catch (_) {} this.ac = null; this.masterGain = null; this.muteGain = null; }
  setMuted(m: boolean) { if (!this.muteGain || !this.ac) return; this.muteGain.gain.linearRampToValueAtTime(m ? 0 : 1, this.ac.currentTime + 0.3); }
  setVolume(v: number) { if (this.masterGain && this.ac) this.masterGain.gain.linearRampToValueAtTime((v / 100) * 0.2, this.ac.currentTime + 0.1); }
  private loop() {
    // Completa: escala mayor Re (melodía ascendente y descendente, seno puro, fluido)
    const seqs = [
      [349.2, 392.0, 440.0, 493.9, 523.3],  // Re Mi Fa# Sol La Do — ascendente alegre
      [523.3, 493.9, 440.0, 392.0, 349.2],  // descendente suave
      [392.0, 440.0, 523.3, 440.0, 392.0],  // arpegio central
      [349.2, 440.0, 392.0, 523.3, 349.2],  // saltos melódicos
    ];
    let ci = 0;
    const play = () => {
      if (!this.running || !this.ac || !this.masterGain) return;
      seqs[ci % seqs.length].forEach((freq, vi) => {
        if (!this.ac || !this.masterGain) return;
        const osc = this.ac.createOscillator(), env = this.ac.createGain();
        osc.type = "sine"; // seno puro — suave y claro
        osc.frequency.value = freq;
        osc.connect(env); env.connect(this.masterGain);
        const t = this.ac.currentTime + vi * 0.22, dur = 2.8;
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.55, t + 0.12);
        env.gain.setValueAtTime(0.45, t + dur - 0.4);
        env.gain.linearRampToValueAtTime(0, t + dur);
        osc.start(t); osc.stop(t + dur);
      });
      ci++; setTimeout(play, 4000);
    };
    play();
  }
}

function useMusic() {
  const engine = useRef(new MusicEngine());
  const [muted, setMuted] = useState(false);
  const [vol, setVolS] = useState(50);
  useEffect(() => () => engine.current.stop(), []);
  const start = useCallback(() => engine.current.start(), []);
  const stop = useCallback(() => { engine.current.stop(); setMuted(false); }, []);
  const toggleMute = useCallback(() => setMuted(m => { const n = !m; engine.current.setMuted(n); return n; }), []);
  const setVolume = useCallback((v: number) => { setVolS(v); engine.current.setVolume(v); }, []);
  const playVictory = useCallback(() => {
    engine.current.stop();
    setTimeout(() => {
      try {
        const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
        const notes = [523.3, 659.3, 783.9, 1046.5];
        notes.forEach((freq, i) => {
          const osc = ac.createOscillator(), g = ac.createGain();
          osc.type = "sine"; osc.frequency.value = freq;
          osc.connect(g); g.connect(ac.destination);
          const t = ac.currentTime + i * 0.15;
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.3, t + 0.05); g.gain.linearRampToValueAtTime(0, t + 0.4);
          osc.start(t); osc.stop(t + 0.5);
        });
        setTimeout(() => ac.close(), 1500);
      } catch (_) {}
    }, 80);
  }, []);
  return { start, stop, toggleMute, setVolume, playVictory, muted, vol };
}

async function guardarResultado(data: { jugador: string; grado: number; puntos: number; correctas: number; incorrectas: number; tiempo_seg: number; modo: string; }) {
  try { await fetch(`${API}/api/resultados_juegos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, juego: "completa_oracion", materia: "lengua" }) }); } catch (_) {}
}

/* ══════════════════════ COMPONENTE PRINCIPAL ══════════════════════ */

/* ─── CONFETTI ─── */
function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    color: ["#ff4757","#ffd700","#00ff88","#00e5ff","#a78bfa","#ff9800"][i % 6],
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    size: 6 + Math.random() * 8,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <motion.div key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1 }}
          animate={{ y: "110vh", opacity: [1, 1, 0] }}
          transition={{ duration: 2.2, delay: p.delay, ease: "easeIn" }}
          style={{ position: "absolute", top: 0, width: p.size, height: p.size, borderRadius: 2, background: p.color }} />
      ))}
    </div>
  );
}

export function CompletaOracion() {
  const music  = useMusic();
  const socket = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [screen,      setScreen]      = useState<Screen>("splash");
  const [splashPct,   setSplashPct]   = useState(0);
  const [splashDone,  setSplashDone]  = useState(false);

  const [modo,        setModo]        = useState<Modo>("solo");
  const [grado,       setGrado]       = useState(4);
  const [playerName,  setPlayerName]  = useState("");
  // Prellenar nombre con el de la cuenta
  useEffect(() => { if (user?.nombre) setPlayerName(user.nombre); }, [user]);
  const [ejercicios,  setEjercicios]  = useState<Ejercicio[]>([]);
  const [idx,         setIdx]         = useState(0);
  const [seleccion,   setSeleccion]   = useState<number | null>(null);
  const [confirmado,  setConfirmado]  = useState(false);
  const [score,       setScore]       = useState(0);
  const [correctas,   setCorrectas]   = useState(0);
  const [paused,      setPaused]      = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [settOpen,    setSettOpen]    = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [tiempo,      setTiempo]      = useState(0);
  const [timerOn,     setTimerOn]     = useState(false);

  const [showConfetti, setShowConfetti] = useState(false);
  const pauseRef     = useRef(false);
  const playerNameRef = useRef(playerName); // ref for stale closure fix
  playerNameRef.current = playerName; // keep ref current on every render

  /* SPLASH */
  useEffect(() => {
    if (screen !== "splash") return;
    const dur = 4000, t0 = Date.now();
    const iv = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - t0) / dur) * 100);
      setSplashPct(pct);
      if (pct >= 100) { clearInterval(iv); setSplashDone(true); setTimeout(() => setScreen("config"), 800); }
    }, 30);
    return () => clearInterval(iv);
  }, [screen]);

  /* Timer */
  useEffect(() => {
    if (!timerOn || pauseRef.current) return;
    const iv = setInterval(() => { if (!pauseRef.current) setTiempo(t => t + 1); }, 1000);
    return () => clearInterval(iv);
  }, [timerOn]);

  const multiState    = socket.state;
  if (!user) { navigate("/login"); return null; }

  const estaEnLobby   = modo === "multi" && multiState.estado === "lobby";
  // Minijuegos manejan su propia pantalla de resultados - ignorar juego_terminado del backend
  const estaEnRanking = false;
  const hayError      = modo === "multi" && multiState.estado === "error";

  /* ✅ FIX MULTIPLAYER: cuando el backend emite juego_iniciado,
     todos los jugadores (no solo el host) deben iniciar el juego local.
     Usamos refs para evitar stale closure con playerName. */
  const multiEstadoRef = useRef(multiState.estado);
  const modoRef        = useRef(modo);
  const gradoRef       = useRef(grado);
  multiEstadoRef.current = multiState.estado;
  modoRef.current        = modo;
  gradoRef.current       = grado;

  useEffect(() => {
    if (
      modoRef.current === "multi" &&
      multiState.estado === "jugando" &&
      screen !== "juego" &&
      playerNameRef.current.trim() !== ""
    ) {
      iniciarJuego(gradoRef.current);
    }
  }, [multiState.estado]);  // eslint-disable-line react-hooks/exhaustive-deps


  const iniciarJuego = useCallback((g: number) => {
    if (!playerName.trim()) return;
    // Nuevo shuffle cada vez — garantiza orden diferente
    const base = [...EJERCICIOS[g]];
    // Doble shuffle para mayor aleatoriedad
    const lista = shuffle(shuffle(base));
    setEjercicios(lista); setIdx(0); setSeleccion(null); setConfirmado(false);
    setScore(0); setCorrectas(0); setTiempo(0); setTimerOn(true);
    setPaused(false); pauseRef.current = false;
    setShowConfetti(false);
    setScreen("juego"); music.start();
  }, [music, playerName]);

  const confirmar = () => {
    if (seleccion === null || confirmado || pauseRef.current) return;
    setConfirmado(true);
    if (seleccion === ejercicios[idx].correcta) { setScore(s => s + 100); setCorrectas(c => c + 1); }
  };

  const siguiente = () => {
    if (idx + 1 >= ejercicios.length) {
      setScreen("resultados"); setTimerOn(false);
      music.playVictory();
      setShowConfetti(true);
      guardarResultado({ jugador: playerName || "Anónimo", grado, puntos: score, correctas, incorrectas: ejercicios.length - correctas, tiempo_seg: tiempo, modo });
    } else {
      setIdx(i => i + 1); setSeleccion(null); setConfirmado(false);
    }
  };

  function togglePause() { const n = !paused; setPaused(n); pauseRef.current = n; }
  function openSettings() { if (!paused) { setPaused(true); pauseRef.current = true; } setSettOpen(true); }
  function requestExit()  { setSettOpen(false); setExitConfirm(true); }
  function confirmExit()  { music.stop(); setPaused(false); pauseRef.current = false; setExitConfirm(false); setTimerOn(false); setScreen("config"); }
  function cancelExit()   { setExitConfirm(false); }

  if (estaEnLobby && multiState.sala) return <GameLobby state={multiState} nombrePropio={playerName} onIniciar={() => { socket.iniciarJuego(multiState.sala!.codigo); iniciarJuego(grado); }} onSalir={() => { socket.salirSala(); setModo("solo"); }} colorAccent="#DAA520" />;
  if (estaEnRanking) return <GameRankingFinal ranking={multiState.rankingFinal} nombrePropio={playerName} onJugarDeNuevo={() => { socket.salirSala(); setScreen("config"); }} onSalir={() => { socket.salirSala(); setScreen("config"); }} colorAccent="#DAA520" />;
  if (hayError) return <GameError mensaje={multiState.errorMsg} onReset={socket.resetError} colorAccent="#DAA520" />;

  const ejercicio = ejercicios[idx];
  const isCorrect = confirmado && seleccion === ejercicio?.correcta;

  return (
    <div className="flex flex-col items-center w-full min-h-screen text-white relative">

      {/* ══ MODAL SALIDA ══ */}
      <AnimatePresence>
        {exitConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)" }}>
            <motion.div initial={{ scale: 0.82, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="w-full max-w-xs rounded-3xl overflow-hidden"
              style={{ background: "linear-gradient(145deg,#16111f,#0e0c1a)", border: "2px solid rgba(255,71,87,0.4)", boxShadow: "0 30px 80px rgba(0,0,0,0.9)" }}>
              <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,transparent,#ff4757 40%,#ff6b7a 60%,transparent)" }} />
              <div className="px-7 pt-6 pb-7 flex flex-col items-center text-center gap-5">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(255,71,87,0.1)", border: "1.5px solid rgba(255,71,87,0.35)" }}>
                  <AlertTriangle size={30} className="text-[#ff4757]" />
                </motion.div>
                <div>
                  <h3 className="font-['Press_Start_2P'] text-sm text-white mb-2">Salir del juego</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">Tu progreso actual se perderá.</p>
                </div>
                <div className="w-full flex flex-col gap-2.5">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={confirmExit}
                    className="w-full py-3.5 rounded-2xl font-['Press_Start_2P'] text-xs text-white"
                    style={{ background: "linear-gradient(135deg,#ff4757,#c0392b)", boxShadow: "0 4px 20px rgba(255,71,87,0.35)" }}>
                    Sí, salir
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={cancelExit}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm text-gray-400 transition-all"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)" }}>
                    Continuar jugando
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ SETTINGS MODAL ══ */}
      <AnimatePresence>
        {settOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center px-4"
            onClick={() => setSettOpen(false)}>
            <motion.div initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-sm rounded-2xl overflow-hidden"
              style={{ background: "#12111e", border: "2px solid rgba(0,229,255,0.2)", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}
              onClick={e => e.stopPropagation()}>
              <div className="h-0.5" style={{ background: "linear-gradient(90deg,transparent,#00e5ff,transparent)" }} />
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
                <p className="font-['Press_Start_2P'] text-xs text-white">Configuracion</p>
                <button onClick={() => setSettOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all"><X size={14} /></button>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm font-bold text-gray-300">Estado</span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "rgba(255,215,0,0.12)", color: "#ffd700" }}>Pausado</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm font-bold text-gray-300">Volumen</span>
                  <div className="flex items-center gap-2">
                    <input type="range" min={0} max={100} value={music.vol} onChange={e => music.setVolume(Number(e.target.value))} className="w-24 accent-[#00e5ff]" />
                    <span className="text-sm font-bold text-[#00e5ff] w-9">{music.vol}%</span>
                  </div>
                </div>
                {[
                  { label: "Reanudar juego", icon: <Play size={14} />, action: () => { togglePause(); setSettOpen(false); } },
                  { label: music.muted ? "Activar musica" : "Silenciar musica", icon: music.muted ? <Volume2 size={14} /> : <VolumeX size={14} />, action: music.toggleMute },
                  { label: "Salir del juego", icon: <LogOut size={14} />, action: requestExit, danger: true },
                ].map((a, i) => (
                  <button key={i} onClick={a.action}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${(a as any).danger ? "text-[#ff4757] border-[#ff4757]/20 bg-[#ff4757]/5 hover:bg-[#ff4757]/10" : "text-gray-300 border-white/7 bg-white/3 hover:text-[#00e5ff] hover:border-[#00e5ff]/25"}`}>
                    {a.icon}{a.label}
                  </button>
                ))}
                <button onClick={() => setSettOpen(false)} className="w-full py-3 rounded-xl font-bold text-sm text-white" style={{ background: "linear-gradient(135deg,#00e5ff,#9b44ff)" }}>Cerrar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ SPLASH ══ */}
      <AnimatePresence>
        {screen === "splash" && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
            style={{ background: "radial-gradient(ellipse 100% 80% at 50% 0%, #0e082a 0%, #07091a 55%, #000 100%)" }}>
            {[...Array(7)].map((_, i) => (
              <motion.div key={i} className="absolute rounded-full pointer-events-none"
                style={{ width: 2 + (i % 3) * 2, height: 2 + (i % 3) * 2, left: `${8 + i * 13}%`, top: `${15 + (i % 4) * 17}%`, background: ["#DAA520","#ff9800","#00e5ff","#9b44ff","#00ff88","#ffd700","#ff4757"][i] }}
                animate={{ y: [0,-28,0], opacity: [0.2,0.7,0.2] }} transition={{ duration: 2.8+i*0.4, repeat: Infinity, delay: i*0.35, ease: "easeInOut" }} />
            ))}
            <motion.div animate={{ opacity:[0.3,0.65,0.3], scale:[1,1.08,1] }} transition={{ duration: 4, repeat: Infinity }}
              className="absolute pointer-events-none"
              style={{ width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(155,68,255,0.12) 0%,rgba(218,165,32,0.07) 40%,transparent 70%)",top:"50%",left:"50%",transform:"translate(-50%,-52%)" }} />
            <AnimatePresence mode="wait">
              {!splashDone ? (
                <motion.div key="in" initial={{ scale:1.5,opacity:0 }} animate={{ scale:1,opacity:1 }} transition={{ duration:0.85,ease:[0.16,1,0.3,1] }} className="flex flex-col items-center gap-0">
                  <motion.div className="relative mb-2" animate={{ y:[0,-7,0] }} transition={{ duration:3.5,repeat:Infinity,ease:"easeInOut" }}>
                    <motion.div animate={{ scale:[1,1.3,1],opacity:[0.5,0.9,0.5] }} transition={{ duration:2.5,repeat:Infinity }}
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{ background:"radial-gradient(circle,rgba(218,165,32,0.25) 0%,rgba(155,68,255,0.12) 50%,transparent 70%)",transform:"scale(1.8)" }} />
                    <img src={logoImg} alt="Saberix" className="w-36 h-36 md:w-44 md:h-44 object-contain relative z-10"
                      style={{ filter:"drop-shadow(0 0 28px rgba(218,165,32,0.65)) drop-shadow(0 0 55px rgba(155,68,255,0.3))" }} />
                  </motion.div>
                  <div className="flex items-center gap-0.5 mt-1 mb-2">
                    {["S","A","B","E","R","I","X"].map((l,i) => { const cols=["#ff4757","#ff9800","#ffd700","#00ff88","#00e5ff","#a78bfa","#ff4757"]; return (
                      <motion.span key={i} initial={{ opacity:0,y:-18,scale:0.6 }} animate={{ opacity:1,y:0,scale:1 }} transition={{ delay:0.5+i*0.07,type:"spring",stiffness:280,damping:17 }}
                        className="font-['Press_Start_2P'] text-3xl md:text-4xl font-black leading-none" style={{ color:cols[i],textShadow:`0 0 20px ${cols[i]}bb,0 0 40px ${cols[i]}44` }}>{l}</motion.span>
                    );})}
                  </div>
                  <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} transition={{ delay:1.3 }} className="flex items-center gap-2 mb-8">
                    <div className="h-px w-10 rounded-full" style={{ background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.2))" }} />
                    <p className="text-xs md:text-sm font-bold tracking-[0.25em] uppercase" style={{ color:"rgba(255,255,255,0.3)" }}>Aprende Jugando</p>
                    <div className="h-px w-10 rounded-full" style={{ background:"linear-gradient(90deg,rgba(255,255,255,0.2),transparent)" }} />
                  </motion.div>
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.6 }} className="w-48 md:w-64">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color:"rgba(255,255,255,0.15)" }}>Cargando</span>
                      <span className="text-[10px] font-bold" style={{ color:"rgba(218,165,32,0.5)" }}>{Math.round(splashPct)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full" style={{ width:`${splashPct}%`,background:"linear-gradient(90deg,#ff4757,#ff9800,#ffd700,#00ff88,#00e5ff,#a78bfa)",boxShadow:"0 0 10px rgba(0,229,255,0.4)",transition:"width 0.04s linear" }} />
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div key="out" initial={{ scale:1,opacity:1 }} animate={{ scale:0.2,opacity:0,y:-90 }} transition={{ duration:0.65,ease:[0.4,0,1,1] }} className="flex flex-col items-center">
                  <img src={logoImg} alt="" className="w-36 h-36 object-contain" style={{ filter:"drop-shadow(0 0 25px rgba(218,165,32,0.5))" }} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ CONFIG ══ */}
      {screen === "config" && !estaEnLobby && !estaEnRanking && !hayError && (
        <motion.div initial={{ opacity:0,y:18 }} animate={{ opacity:1,y:0 }} className="w-full max-w-xl px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/games/language" className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"><ArrowLeft size={22} /></Link>
            <div>
              <h1 className="font-['Press_Start_2P'] text-lg text-[#DAA520]">COMPLETA LA ORACIÓN</h1>
              <p className="text-gray-400 text-sm font-bold mt-1">Lengua Española</p>
            </div>
          </div>

          {/* Info card */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-[#DAA520]/30 bg-[#0f1425] p-6 mb-5" style={{ boxShadow:"0 4px 28px rgba(218,165,32,0.1)" }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20" style={{ background:"radial-gradient(circle,#DAA520,transparent)",transform:"translate(30%,-30%)" }} />
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background:"rgba(218,165,32,0.15)",border:"1.5px solid rgba(218,165,32,0.35)" }}>
                <BookOpen size={26} className="text-[#DAA520]" />
              </div>
              <div>
                <p className="font-['Press_Start_2P'] text-xs text-[#DAA520] mb-2">Completa la Oración — Lengua</p>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">Elige la palabra correcta para completar cada oración.</p>
                <div className="flex gap-2 flex-wrap">
                  {[{label:"Gramática",icon:<BookOpen size={11}/>},{label:"Ortografía",icon:<HelpCircle size={11}/>},{label:"Vocabulario",icon:<Star size={11}/>}].map(t=>(
                    <span key={t.label} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full" style={{ background:"rgba(218,165,32,0.1)",color:"#DAA520",border:"1px solid rgba(218,165,32,0.25)" }}>{t.icon} {t.label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Nombre */}
          <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-4">
            <p className="text-xs font-extrabold text-[#00e5ff] tracking-widest uppercase mb-3 flex items-center gap-2"><User size={13}/> Tu nombre</p>
            <input className="w-full bg-white/4 border-2 border-white/10 rounded-xl px-4 py-3 text-white font-semibold text-base outline-none focus:border-[#00e5ff]/60 transition-all placeholder:text-gray-600"
              disabled={!!user} placeholder="Escribe tu nombre..." value={playerName} onChange={e => setPlayerName(e.target.value)} maxLength={20} />
          </div>

          {/* Grado */}
          <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-4">
            <p className="text-xs font-extrabold text-[#ffd700] tracking-widest uppercase mb-3 flex items-center gap-2"><Star size={13}/> Grado</p>
            <div className="grid grid-cols-3 gap-2">
              {[4,5,6].map(g => (
                <button key={g} onClick={() => setGrado(g)} className="py-3 rounded-xl border-2 font-['Press_Start_2P'] text-sm transition-all"
                  style={{ borderColor:grado===g?"#DAA520":"rgba(255,255,255,0.1)",background:grado===g?"rgba(218,165,32,0.15)":"rgba(255,255,255,0.03)",color:grado===g?"#DAA520":"#6b7280" }}>
                  {g}to
                </button>
              ))}
            </div>
          </div>

          {/* Modo */}
          <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-4">
            <p className="text-xs font-extrabold text-[#00ff88] tracking-widest uppercase mb-3 flex items-center gap-2"><Play size={13}/> Modo de juego</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button onClick={() => setModo("solo")} className={`py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${modo==="solo"?"border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]":"border-white/10 bg-white/3 text-gray-400 hover:border-white/25"}`}><User size={15}/> Solitario</button>
              <button onClick={() => setModo("multi")} className={`py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${modo==="multi"?"border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa]":"border-white/10 bg-white/3 text-gray-400 hover:border-white/25"}`}><Users size={15}/> Multijugador</button>
            </div>
            <AnimatePresence>
              {modo === "multi" && (
                <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }} exit={{ opacity:0,height:0 }} className="overflow-hidden">
                  <MultiPanel nombreJugador={playerName} onNombreChange={setPlayerName} juego="completa_oracion" grado={grado}
                    jugadoresConectados={multiState.sala?.jugadores ?? []}
                    nombrePropio={playerName}
                    onCrear={(nombre,jugador)=>{ setPlayerName(jugador); socket.crearSala({nombre,nombreJugador:jugador,materia:"lengua",grado,tiempoPorPregunta:9999,cantPreguntas:5}); }}
                    onUnirse={(codigo,jugador)=>{ setPlayerName(jugador); socket.unirseASala(codigo,jugador); }}
                    conectando={multiState.estado==="conectando"} colorAccent="#DAA520" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button whileHover={{ scale:1.02,y:-2 }} whileTap={{ scale:0.98 }}
            onClick={() => modo==="solo" && iniciarJuego(grado)}
            disabled={!playerName.trim()}
            className="w-full py-5 rounded-2xl font-['Press_Start_2P'] text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background:modo==="solo"?"linear-gradient(135deg,#DAA520,#ff9800)":"linear-gradient(135deg,#a78bfa,#7c3aed)", boxShadow:modo==="solo"?"0 4px 24px rgba(218,165,32,0.4)":"0 4px 24px rgba(167,139,250,0.35)" }}>
            {modo==="solo"?"Comenzar":"Ir al lobby"}
          </motion.button>
        </motion.div>
      )}

      {/* ══ RESULTADOS ══ */}
      {screen === "resultados" && (() => {
        const pct   = Math.round((correctas / ejercicios.length) * 100);
        const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : 1;
        const titulo = pct >= 90 ? "¡Increíble!" : pct >= 60 ? "Muy bien" : "Sigue intentando";
        return (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            className="w-full min-h-screen flex flex-col items-center justify-start px-4 py-10 overflow-y-auto"
            style={{ background:"linear-gradient(135deg,#06091a 0%,#0d1230 50%,#06091a 100%)" }}>

            {/* Fondo animado */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
              <motion.div animate={{ x:[0,40,0],y:[0,-30,0] }} transition={{ duration:12,repeat:Infinity,ease:"easeInOut" }}
                className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-3xl opacity-40"
                style={{ background:"radial-gradient(circle,rgba(218,165,32,0.15),transparent)" }}/>
              {[...Array(8)].map((_,i) => (
                <motion.div key={i} className="absolute rounded-full"
                  style={{ width:4,height:4,left:`${10+i*12}%`,top:`${5+(i%3)*15}%`,
                    background:["#ffd700","#DAA520","#00e5ff","#00ff88","#ff9800","#a78bfa","#ff64c8","#64c8ff"][i] }}
                  animate={{ y:[0,60,0],opacity:[0,1,0],scale:[0.5,1.2,0.5] }}
                  transition={{ duration:3+i*0.4,repeat:Infinity,delay:i*0.3,ease:"easeInOut" }} />
              ))}
            </div>

            <div className="relative z-10 w-full max-w-lg">
              {/* Ícono + título */}
              <motion.div initial={{ scale:0,rotate:-15 }} animate={{ scale:1,rotate:0 }}
                transition={{ type:"spring",delay:0.1,stiffness:200 }} className="flex justify-center mb-5">
                <motion.div animate={{ rotate:[0,10,-10,8,-8,0] }} transition={{ delay:0.4,duration:0.6 }}>
                  <Trophy size={64} className="text-[#ffd700]" style={{ filter:"drop-shadow(0 0 20px rgba(255,215,0,0.6))" }}/>
                </motion.div>
              </motion.div>

              <motion.h2 initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.2 }}
                className="font-['Press_Start_2P'] text-3xl mb-4 text-center"
                style={{ background:"linear-gradient(135deg,#ffd700,#ff9800)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>
                {titulo}
              </motion.h2>

              {/* Estrellas */}
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
                className="flex justify-center gap-2 mb-8">
                {[1,2,3].map(s => (
                  <motion.div key={s} initial={{ scale:0 }} animate={{ scale:1 }}
                    transition={{ delay:0.3+s*0.12,type:"spring",stiffness:300 }}>
                    <Star size={36} className={s<=stars?"text-[#ffd700]":"text-gray-700"}
                      fill={s<=stars?"#ffd700":"none"}
                      style={s<=stars?{filter:"drop-shadow(0 0 8px rgba(255,215,0,0.6))"}:{}}/>
                  </motion.div>
                ))}
              </motion.div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  {label:"Correctas",  val:correctas,                  color:"#00ff88",bg:"rgba(0,255,136,0.06)",  border:"rgba(0,255,136,0.25)",  icon:<CheckCircle2 size={22}/>},
                  {label:"Incorrectas",val:ejercicios.length-correctas, color:"#ff4757",bg:"rgba(255,71,87,0.06)",  border:"rgba(255,71,87,0.25)",  icon:<XCircle size={22}/>},
                  {label:"Puntos",     val:score,                      color:"#ffd700",bg:"rgba(255,215,0,0.06)", border:"rgba(255,215,0,0.25)", icon:<Star size={22}/>},
                ].map((s,i) => (
                  <motion.div key={s.label}
                    initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }}
                    transition={{ delay:0.4+i*0.1,type:"spring" }}
                    className="rounded-2xl border-2 p-5 text-center" style={{ background:s.bg,borderColor:s.border }}>
                    <div className="flex justify-center mb-2" style={{ color:s.color }}>{s.icon}</div>
                    <div className="font-['Press_Start_2P'] text-2xl mb-1" style={{ color:s.color }}>{s.val}</div>
                    <div className="text-xs font-extrabold text-gray-500 tracking-widest uppercase">{s.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Recompensas */}
              <motion.div initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }} transition={{ delay:0.7 }}
                className="rounded-2xl border-2 p-6 mb-6"
                style={{ background:"linear-gradient(135deg,rgba(255,215,0,0.08),rgba(255,152,0,0.04))",borderColor:"rgba(255,215,0,0.3)" }}>
                <div className="flex items-center justify-center gap-2 mb-5">
                  <Trophy size={15} className="text-[#ffd700]"/>
                  <p className="text-sm font-extrabold text-[#ffd700] tracking-widest uppercase">Recompensas</p>
                </div>
                <div className="flex justify-center gap-10">
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                        style={{ background:"linear-gradient(135deg,#ffd700,#ff9800)",boxShadow:"0 0 16px rgba(255,215,0,0.5)" }}>🪙</div>
                    </div>
                    <div className="font-['Press_Start_2P'] text-2xl text-[#ff9800]">+{correctas*10}</div>
                    <div className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">Monedas</div>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                        style={{ background:"linear-gradient(135deg,#a78bfa,#7c3aed)",boxShadow:"0 0 16px rgba(167,139,250,0.5)" }}>⚡</div>
                    </div>
                    <div className="font-['Press_Start_2P'] text-2xl text-[#a78bfa]">+{correctas*15}</div>
                    <div className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">Experiencia</div>
                  </div>
                </div>
              </motion.div>

              <motion.button initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.9 }}
                whileHover={{ scale:1.02,y:-2 }} whileTap={{ scale:0.98 }} onClick={() => iniciarJuego(grado)}
                className="w-full py-5 rounded-2xl font-['Press_Start_2P'] text-base text-white mb-3 flex items-center justify-center gap-3"
                style={{ background:"linear-gradient(135deg,#DAA520,#ff9800)",boxShadow:"0 4px 22px rgba(218,165,32,0.4)" }}>
                <RotateCcw size={18}/> Jugar de nuevo
              </motion.button>
              <Link to="/games/language"
                className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-base text-gray-400 border-2 border-white/10 hover:border-white/25 hover:text-white transition-all">
                <ArrowLeft size={18}/> Volver al menú
              </Link>
            </div>
          </motion.div>
        );
      })()}

      {/* ══ JUEGO ══ */}
      {screen === "juego" && ejercicio && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          className="w-full min-h-screen flex flex-col relative overflow-hidden"
          style={{ background:"linear-gradient(135deg,#06091a 0%,#0d1230 50%,#06091a 100%)" }}>

          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div animate={{ x:[0,50,0],y:[0,-40,0] }} transition={{ duration:14,repeat:Infinity,ease:"easeInOut" }} className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-3xl opacity-60" style={{ background:"radial-gradient(circle,rgba(155,68,255,0.12),transparent)" }} />
            <motion.div animate={{ x:[0,-40,0],y:[0,40,0] }} transition={{ duration:17,repeat:Infinity,ease:"easeInOut",delay:4 }} className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] rounded-full blur-3xl opacity-50" style={{ background:"radial-gradient(circle,rgba(0,229,255,0.1),transparent)" }} />
            <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage:"linear-gradient(rgba(0,229,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,1) 1px,transparent 1px)",backgroundSize:"60px 60px" }} />
          </div>

          <AnimatePresence>
            {paused && !settOpen && !exitConfirm && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center" onClick={togglePause}>
                <motion.div initial={{ scale:0.8 }} animate={{ scale:1 }} className="text-center bg-[#111428] border-2 border-[#ffd700]/30 rounded-3xl px-12 py-10">
                  <Pause size={48} className="text-[#ffd700] mx-auto mb-4"/>
                  <p className="font-['Press_Start_2P'] text-xl text-[#ffd700] mb-2">PAUSADO</p>
                  <p className="text-gray-400 text-sm font-bold">Toca para continuar</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TOPBAR — una sola barra unificada */}
          <div className="relative z-10 flex items-center gap-2 px-3 md:px-4 py-2 border-b border-white/5" style={{ background:"rgba(6,9,26,0.95)",backdropFilter:"blur(16px)" }}>
            {/* IZQUIERDA */}
            <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
              {modo === "multi" && multiState.sala && multiState.sala.jugadores.length > 0 ? (
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5 flex-1">
                  <MiniJugadores jugadores={multiState.sala.jugadores} nombrePropio={playerName} />
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:"rgba(218,165,32,0.18)",border:"1.5px solid rgba(218,165,32,0.4)" }}>
                    <User size={14} className="text-[#DAA520]"/>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-white truncate leading-tight">{playerName}</p>
                    <p className="text-[10px] text-gray-500 font-bold leading-tight">Completa · {grado}to</p>
                  </div>
                </div>
              )}
            </div>
            {/* CENTRO */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-center">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Pregunta</p>
                <p className="font-['Press_Start_2P'] text-sm text-white leading-tight">{idx+1}<span className="text-gray-600 text-xs">/{ejercicios.length}</span></p>
              </div>
              <div className="w-px h-6 bg-white/10"/>
              <div className="text-center">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Puntos</p>
                <p className="font-['Press_Start_2P'] text-sm text-[#ffd700] leading-tight">{score}</p>
              </div>
            </div>
            {/* DERECHA */}
            <div className="flex gap-1.5 flex-shrink-0 ml-2">
              {modo === "multi" ? (
                <>
                  <button onClick={music.toggleMute} className="w-8 h-8 rounded-xl border flex items-center justify-center transition-all" style={{ background:"rgba(0,229,255,0.08)",borderColor:"rgba(0,229,255,0.22)",color:"#00e5ff" }}>
                    {music.muted?<Volume2 size={14}/>:<VolumeX size={14}/>}
                  </button>
                  <button onClick={() => setShowRanking(r => !r)} className="w-8 h-8 rounded-xl border flex items-center justify-center transition-all" style={{ background:showRanking?"rgba(255,215,0,0.2)":"rgba(255,215,0,0.08)",borderColor:"rgba(255,215,0,0.4)",color:"#ffd700" }}>
                    <Trophy size={14}/>
                  </button>
                  <button onClick={() => { socket.salirSala(); music.stop(); setModo("solo"); setScreen("config"); }} className="w-8 h-8 rounded-xl border flex items-center justify-center transition-all" style={{ background:"rgba(255,71,87,0.08)",borderColor:"rgba(255,71,87,0.3)",color:"#ff4757" }}>
                    <LogOut size={14}/>
                  </button>
                </>
              ) : (
                <>
                  <button onClick={togglePause} className="w-8 h-8 rounded-xl border flex items-center justify-center transition-all" style={{ background:"rgba(255,215,0,0.08)",borderColor:"rgba(255,215,0,0.22)",color:"#ffd700" }}>{paused?<Play size={14}/>:<Pause size={14}/>}</button>
                  <button onClick={openSettings} className="w-8 h-8 rounded-xl border flex items-center justify-center transition-all" style={{ background:"rgba(0,229,255,0.08)",borderColor:"rgba(0,229,255,0.22)",color:"#00e5ff" }}><Settings size={14}/></button>
                </>
              )}
            </div>
          </div>

          {/* Barra progreso */}
          <div className="relative z-10 w-full h-1.5" style={{ background:"rgba(255,255,255,0.04)" }}>
            <motion.div className="h-full" animate={{ width:`${((idx+1)/ejercicios.length)*100}%` }} transition={{ duration:0.4 }}
              style={{ background:"linear-gradient(90deg,#DAA520,#ff9800)",boxShadow:"0 0 10px rgba(218,165,32,0.5)" }} />
          </div>
          {/* RANKING PANEL LATERAL */}
          <AnimatePresence>
            {showRanking && modo === "multi" && (
              <RankingPanel
                jugadores={multiState.sala?.jugadores ?? []}
                nombrePropio={playerName}
                onClose={() => setShowRanking(false)}
              />
            )}
          </AnimatePresence>

          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto w-full gap-6">

            <AnimatePresence mode="wait">
              <motion.div key={idx} initial={{ opacity:0,x:30 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-30 }}
                className="w-full rounded-2xl border-2 p-6 md:p-8"
                style={{ background:"rgba(17,20,40,0.9)",backdropFilter:"blur(20px)",borderColor:"rgba(218,165,32,0.35)",boxShadow:"0 8px 40px rgba(218,165,32,0.1)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-['Press_Start_2P'] text-xs px-4 py-2 rounded-full" style={{ background:"rgba(218,165,32,0.15)",color:"#DAA520",border:"1px solid rgba(218,165,32,0.35)" }}>Oración {idx+1}</span>
                  <div className="flex-1 h-px" style={{ background:"rgba(218,165,32,0.2)" }} />
                </div>
                <p className="text-xl md:text-2xl font-semibold text-white leading-relaxed" style={{ fontFamily:"Nunito, system-ui, sans-serif" }}>
                  {ejercicio.partes[0]}
                  <span className="inline-block mx-1 px-3 py-0.5 rounded-lg border-b-2 min-w-[80px] text-center transition-all"
                    style={{ background:confirmado?(isCorrect?"rgba(0,255,136,0.2)":"rgba(255,71,87,0.2)"):(seleccion!==null?"rgba(218,165,32,0.2)":"rgba(255,255,255,0.05)"), borderColor:confirmado?(isCorrect?"#00ff88":"#ff4757"):(seleccion!==null?"#DAA520":"rgba(255,255,255,0.2)"), color:confirmado?(isCorrect?"#00ff88":"#ff4757"):(seleccion!==null?"#DAA520":"#666") }}>
                    {seleccion !== null ? ejercicio.opciones[seleccion] : "___"}
                  </span>
                  {ejercicio.partes[2]}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="w-full grid grid-cols-2 gap-3">
              {ejercicio.opciones.map((op, i) => {
                const esCorrecta=i===ejercicio.correcta, esSel=i===seleccion;
                let bg="rgba(255,255,255,0.04)",border="rgba(255,255,255,0.1)",color="white";
                if(confirmado){if(esCorrecta){bg="rgba(0,255,136,0.1)";border="#00ff88";color="#00ff88";}else if(esSel){bg="rgba(255,71,87,0.1)";border="#ff4757";color="#ff4757";}}
                else if(esSel){bg="rgba(218,165,32,0.15)";border="#DAA520";color="#DAA520";}
                return (
                  <motion.button key={i} whileHover={!confirmado?{scale:1.02}:{}} whileTap={!confirmado?{scale:0.97}:{}}
                    onClick={() => !confirmado && !pauseRef.current && setSeleccion(i)} disabled={confirmado}
                    className="py-4 px-4 rounded-2xl border-2 font-semibold text-base text-left transition-all disabled:cursor-default"
                    style={{ background:bg,borderColor:border,color,backdropFilter:"blur(8px)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-black" style={{ background:`${border}22`,border:`2px solid ${border}`,color }}>{["A","B","C","D"][i]}</div>
                      <span style={{ fontFamily:"Nunito, system-ui, sans-serif" }}>{op}</span>
                      {confirmado&&esCorrecta&&<CheckCircle2 size={16} className="ml-auto flex-shrink-0 text-[#00ff88]"/>}
                      {confirmado&&esSel&&!esCorrecta&&<XCircle size={16} className="ml-auto flex-shrink-0 text-[#ff4757]"/>}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {confirmado && (
                <motion.div initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }}
                  className="w-full rounded-2xl p-4 border-2"
                  style={{ background:isCorrect?"rgba(0,255,136,0.05)":"rgba(255,71,87,0.05)",borderColor:isCorrect?"rgba(0,255,136,0.3)":"rgba(255,71,87,0.3)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    {isCorrect?<CheckCircle2 size={14} className="text-[#00ff88]"/>:<XCircle size={14} className="text-[#ff4757]"/>}
                    <span className="text-xs font-bold" style={{ color:isCorrect?"#00ff88":"#ff4757" }}>{isCorrect?"¡Correcto! +100 pts":"Incorrecto"}</span>
                  </div>
                  <p className="text-gray-300 text-xs leading-relaxed">{ejercicio.explicacion}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {!confirmado ? (
              <motion.button whileHover={{ scale:1.02,y:-2 }} whileTap={{ scale:0.98 }} onClick={confirmar} disabled={seleccion===null||paused}
                className="w-full py-5 rounded-2xl font-['Press_Start_2P'] text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background:"linear-gradient(135deg,#DAA520,#ff9800)",boxShadow:"0 4px 24px rgba(218,165,32,0.4)" }}>
                Confirmar
              </motion.button>
            ) : (
              <motion.button whileHover={{ scale:1.02,y:-2 }} whileTap={{ scale:0.98 }} onClick={siguiente}
                className="w-full py-5 rounded-2xl font-['Press_Start_2P'] text-sm text-white"
                style={{ background:"linear-gradient(135deg,#a78bfa,#7c3aed)",boxShadow:"0 4px 24px rgba(167,139,250,0.35)" }}>
                {idx+1>=ejercicios.length?"Ver resultados":"Siguiente →"}
              </motion.button>
            )}
          </div>

          <div className="relative z-10 flex items-center justify-center gap-6 px-6 py-3 border-t border-white/5" style={{ background:"rgba(6,9,26,0.85)",backdropFilter:"blur(16px)" }}>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500"><CheckCircle2 size={14} className="text-[#00ff88]"/><span className="text-[#00ff88]">{correctas}</span> correctas</div>
            <div className="w-px h-4 bg-white/10"/>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500"><XCircle size={14} className="text-[#ff4757]"/><span className="text-[#ff4757]">{idx-correctas+(confirmado&&!isCorrect?1:0)}</span> incorrectas</div>
            <div className="w-px h-4 bg-white/10"/>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500"><Star size={14} className="text-[#ffd700]"/><span className="text-[#ffd700]">{score}</span> pts</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
