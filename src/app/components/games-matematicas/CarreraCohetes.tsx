// CarreraCohetes.tsx — Matemáticas 4to-6to
// El jugador responde preguntas para hacer avanzar su cohete hacia la meta.
// Cada respuesta correcta impulsa el cohete. Incorrecta: retrocede un poco.
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Play, Pause, X, Calculator,
  Volume2, VolumeX, RotateCcw, Trophy, Star,
  CheckCircle2, XCircle, LogOut, Rocket,
  User, Users, AlertTriangle, Settings, Zap
, Lightbulb } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "../../AuthContext";
import { useMonedas } from "../../../hooks/useMonedas";
import { useSocket } from "../../../lib/useSocket";
import { GameLobby, GameError, GameRankingFinal, MultiPanel, RankingPanel } from "../GameShared";
import logoImg from "../../../assets/logo.png";

const API = import.meta.env.VITE_API_URL ?? "https://finalproyect-production-3837.up.railway.app";
const COLOR = "#4169E1";
const COLOR_LIGHT = "rgba(65,105,225,0.15)";
const COLOR_BORDER = "rgba(65,105,225,0.35)";

type Screen = "splash" | "config" | "juego" | "resultados";
type Modo = "solo" | "multi";

interface Pregunta {
  pregunta: string;
  opciones: string[];
  correcta: number;
  explicacion: string;
}

// Preguntas rápidas de cálculo mental — ideales para una carrera
const PREGUNTAS: Record<number, Pregunta[]> = {
  4: [
    { pregunta: "¿Cuánto es 7 × 8?", opciones: ["54", "56", "63", "48"], correcta: 1, explicacion: "7 × 8 = 56. Recuerda: 7 × 8, cinco seis." },
    { pregunta: "¿Cuánto es 72 ÷ 9?", opciones: ["7", "8", "9", "6"], correcta: 1, explicacion: "72 ÷ 9 = 8, porque 9 × 8 = 72." },
    { pregunta: "¿Qué fracción es mayor: 1/2 o 1/4?", opciones: ["1/4", "1/2", "Son iguales", "No se puede saber"], correcta: 1, explicacion: "1/2 > 1/4 porque la mitad de algo es más que un cuarto." },
    { pregunta: "¿Cuánto es 0.5 + 0.5?", opciones: ["0.10", "1.0", "0.55", "5.5"], correcta: 1, explicacion: "0.5 + 0.5 = 1.0 (una mitad más una mitad es un entero)." },
    { pregunta: "¿Cuál es el perímetro de un cuadrado de lado 5?", opciones: ["10", "20", "25", "15"], correcta: 1, explicacion: "Perímetro = 4 × lado = 4 × 5 = 20." },
    { pregunta: "¿Cuánto es 125 + 375?", opciones: ["490", "500", "510", "475"], correcta: 1, explicacion: "125 + 375 = 500. Es más fácil: 100+400=500, 25-25=0." },
    { pregunta: "¿Qué número es par?", opciones: ["17", "23", "36", "45"], correcta: 2, explicacion: "36 es par porque termina en 6 (número par)." },
    { pregunta: "¿Cuánto es 1000 - 375?", opciones: ["615", "635", "625", "645"], correcta: 2, explicacion: "1000 - 375 = 625. Puedes calcular: 375 + 625 = 1000." },
    { pregunta: "¿Cuántos cm tiene 1 metro?", opciones: ["10", "100", "1000", "10000"], correcta: 1, explicacion: "1 metro = 100 centímetros." },
    { pregunta: "¿Cuánto es 9 × 9?", opciones: ["72", "81", "89", "90"], correcta: 1, explicacion: "9 × 9 = 81. Truco: 9 × n = (n-1) delante y (9-n+1) detrás." },
  ],
  5: [
    { pregunta: "¿Cuánto es 15% de 200?", opciones: ["25", "30", "35", "20"], correcta: 1, explicacion: "15% de 200 = 0.15 × 200 = 30." },
    { pregunta: "¿Cuál es la raíz cuadrada de 49?", opciones: ["6", "7", "8", "9"], correcta: 1, explicacion: "√49 = 7, porque 7 × 7 = 49." },
    { pregunta: "¿Cuánto es 2³?", opciones: ["6", "8", "12", "16"], correcta: 1, explicacion: "2³ = 2 × 2 × 2 = 8." },
    { pregunta: "¿Cuál es el MCD de 12 y 18?", opciones: ["3", "6", "9", "12"], correcta: 1, explicacion: "MCD(12,18) = 6. Divisores de 12: 1,2,3,4,6,12. De 18: 1,2,3,6,9,18." },
    { pregunta: "¿Cuánto es 3/4 + 1/4?", opciones: ["4/8", "1", "2/4", "4/4"], correcta: 1, explicacion: "3/4 + 1/4 = 4/4 = 1 (un entero completo)." },
    { pregunta: "¿Cuánto es 2.5 × 4?", opciones: ["8", "10", "12", "6"], correcta: 1, explicacion: "2.5 × 4 = 10. Es como 2 × 4 = 8 más 0.5 × 4 = 2, total 10." },
    { pregunta: "¿Qué porcentaje es 3/5?", opciones: ["50%", "60%", "55%", "65%"], correcta: 1, explicacion: "3/5 = 0.60 = 60%." },
    { pregunta: "¿Cuánto es 144 ÷ 12?", opciones: ["11", "12", "13", "14"], correcta: 1, explicacion: "144 ÷ 12 = 12. Por eso decimos que 12 es la raíz cuadrada de 144." },
    { pregunta: "¿Cuál es la media de: 4, 6, 8, 10?", opciones: ["6", "7", "8", "9"], correcta: 1, explicacion: "Media = (4+6+8+10) ÷ 4 = 28 ÷ 4 = 7." },
    { pregunta: "¿Cuánto es 1000 × 0.001?", opciones: ["0.1", "1", "10", "100"], correcta: 1, explicacion: "1000 × 0.001 = 1. El 0.001 es la milésima parte de 1." },
  ],
  6: [
    { pregunta: "¿Cuánto es 15² (quince al cuadrado)?", opciones: ["175", "225", "200", "250"], correcta: 1, explicacion: "15² = 15 × 15 = 225. Truco: (10+5)² = 100 + 100 + 25 = 225." },
    { pregunta: "Si a = 3 y b = 4, ¿cuánto es a² + b²?", opciones: ["14", "25", "49", "12"], correcta: 1, explicacion: "a² + b² = 9 + 16 = 25. Este es el teorema de Pitágoras con a=3, b=4, c=5." },
    { pregunta: "¿Cuánto es el 30% de 150?", opciones: ["40", "45", "50", "55"], correcta: 1, explicacion: "30% de 150 = 0.30 × 150 = 45." },
    { pregunta: "¿Cuánto es π × 2 (aprox, π=3.14)?", opciones: ["5.14", "6.28", "6.14", "7.28"], correcta: 1, explicacion: "π × 2 ≈ 3.14 × 2 = 6.28. Esta es la fórmula de longitud de circunferencia con r=1." },
    { pregunta: "¿Cuánto es 4/5 - 1/5?", opciones: ["3/10", "5/5", "3/5", "1/5"], correcta: 2, explicacion: "4/5 - 1/5 = 3/5 (mismos denominadores, se restan numeradores)." },
    { pregunta: "¿Cuál es el volumen de un cubo de 5 cm?", opciones: ["75 cm³", "100 cm³", "125 cm³", "150 cm³"], correcta: 2, explicacion: "V = 5³ = 5 × 5 × 5 = 125 cm³." },
    { pregunta: "¿Cuánto es 0.25 × 0.4?", opciones: ["0.01", "0.1", "1.0", "0.65"], correcta: 1, explicacion: "0.25 × 0.4 = 0.10. Es como ¼ × ⅖ = 2/20 = 1/10 = 0.1." },
    { pregunta: "¿Cuánto es 360 ÷ 6?", opciones: ["50", "60", "70", "80"], correcta: 1, explicacion: "360 ÷ 6 = 60. El círculo completo tiene 360°, dividido en 6 partes iguales." },
    { pregunta: "Si x + 15 = 40, ¿cuánto es x?", opciones: ["20", "25", "30", "35"], correcta: 1, explicacion: "x = 40 - 15 = 25. Despejamos x pasando el 15 al otro lado." },
    { pregunta: "¿Cuánto es la probabilidad de sacar un número par en un dado de 6 caras?", opciones: ["1/6", "1/3", "1/2", "2/3"], correcta: 2, explicacion: "Números pares en un dado: 2, 4, 6 (3 de 6). Probabilidad = 3/6 = 1/2." },
  ],
};

/* ─── MÚSICA: Cohetes — Ritmo acelerado, electrónico, urgente ─── */
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
      this.masterGain.gain.value = 0.07; this.muteGain.gain.value = 1;
      this.masterGain.connect(this.muteGain); this.muteGain.connect(this.ac.destination);
      this.running = true; this.loop();
    } catch (_) {}
  }
  stop() { this.running = false; try { this.ac?.close(); } catch (_) {} this.ac = null; this.masterGain = null; this.muteGain = null; }
  setMuted(m: boolean) { if (!this.muteGain || !this.ac) return; this.muteGain.gain.linearRampToValueAtTime(m ? 0 : 1, this.ac.currentTime + 0.3); }
  setVolume(v: number) { if (this.masterGain && this.ac) this.masterGain.gain.linearRampToValueAtTime((v / 100) * 0.14, this.ac.currentTime + 0.1); }
  private loop() {
    // Cohetes: bajo rítmico + melodía espacial rápida
    const bass = [65.4, 65.4, 73.4, 65.4];   // Do grave pulsante
    const melody = [523.3, 659.3, 587.3, 784.0, 523.3, 659.3]; // melodía espacial
    let tick = 0;
    const play = () => {
      if (!this.running || !this.ac || !this.masterGain) return;
      const t = this.ac.currentTime;
      // Bass pulse
      const b = this.ac.createOscillator(), bg = this.ac.createGain();
      b.type = "sawtooth"; b.frequency.value = bass[tick % bass.length];
      b.connect(bg); bg.connect(this.masterGain);
      bg.gain.setValueAtTime(0, t); bg.gain.linearRampToValueAtTime(0.5, t + 0.02);
      bg.gain.linearRampToValueAtTime(0, t + 0.18); b.start(t); b.stop(t + 0.2);
      // Melody note every 2 ticks
      if (tick % 2 === 0) {
        const m = this.ac.createOscillator(), mg = this.ac.createGain();
        m.type = "square"; m.frequency.value = melody[(tick / 2) % melody.length];
        const filt = this.ac.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 1400;
        m.connect(filt); filt.connect(mg); mg.connect(this.masterGain);
        mg.gain.setValueAtTime(0, t); mg.gain.linearRampToValueAtTime(0.25, t + 0.03);
        mg.gain.linearRampToValueAtTime(0, t + 0.35); m.start(t); m.stop(t + 0.4);
      }
      tick++; setTimeout(play, 280);
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
        [523.3, 659.3, 784.0, 1046.5, 1318.5].forEach((freq, i) => {
          const osc = ac.createOscillator(), g = ac.createGain();
          osc.type = "square"; osc.frequency.value = freq;
          osc.connect(g); g.connect(ac.destination);
          const t = ac.currentTime + i * 0.1;
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.2, t + 0.03); g.gain.linearRampToValueAtTime(0, t + 0.3);
          osc.start(t); osc.stop(t + 0.35);
        });
        setTimeout(() => ac.close(), 1200);
      } catch (_) {}
    }, 80);
  }, []);
  return { start, stop, toggleMute, setVolume, playVictory, muted, vol };
}

async function guardarResultado(data: { jugador: string; grado: number; puntos: number; correctas: number; incorrectas: number; tiempo_seg: number; modo: string }) {
  try { await fetch(`${API}/api/resultados_juegos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, juego: "carrera_cohetes", materia: "matematicas" }) }); } catch (_) {}
}

function Confetti() {
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i, color: ["#4169E1", "#00e5ff", "#ffd700", "#00ff88", "#ff9800", "#a78bfa"][i % 6],
    x: Math.random() * 100, delay: Math.random() * 0.6, size: 5 + Math.random() * 9, rotate: Math.random() * 360,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <motion.div key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: p.rotate }}
          animate={{ y: "110vh", opacity: [1, 1, 0], rotate: p.rotate + 720 }}
          transition={{ duration: 2.5, delay: p.delay, ease: "easeIn" }}
          style={{ position: "absolute", top: 0, width: p.size, height: p.size, borderRadius: "50%", background: p.color }} />
      ))}
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const TOTAL_PREGUNTAS = 10;
const META = 100; // % de progreso necesario para ganar

export function CarreraCohetes() {
  const music = useMusic();
  const socket = useSocket();

  const [screen, setScreen] = useState<Screen>("splash");
  const [splashPct, setSplashPct] = useState(0);
  const [splashDone, setSplashDone] = useState(false);
  const [modo, setModo] = useState<Modo>("solo");
  const [grado, setGrado] = useState(4);
  const [playerName, setPlayerName] = useState("");

  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [idx, setIdx] = useState(0);
  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const [confirmada, setConfirmada] = useState(false);
  const [progresoCohete, setProgresoCohete] = useState(0); // 0-100
  const [score, setScore] = useState(0);
  const [correctas, setCorrectas] = useState(0);
  const [incorrectas, setIncorrectas] = useState(0);
  const [tiempo, setTiempo] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  const [paused, setPaused] = useState(false);
  const [settOpen, setSettOpen] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [mostrarExplicacion, setMostrarExplicacion] = useState(false);
  const [mostrarPista, setMostrarPista] = useState(false);
  const [coheteShake, setCoheteShake] = useState(false);
  const [cohetePulse, setCohetePulse] = useState(false);

  const pauseRef = useRef(false);
  const playerNameRef = useRef(playerName);
  playerNameRef.current = playerName;

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

  useEffect(() => {
    if (!timerOn || pauseRef.current) return;
    const iv = setInterval(() => { if (!pauseRef.current) setTiempo(t => t + 1); }, 1000);
    return () => clearInterval(iv);
  }, [timerOn]);

  const multiState = socket.state;
  const estaEnLobby = modo === "multi" && multiState.estado === "lobby";
  const hayError = modo === "multi" && multiState.estado === "error";
  const modoRef = useRef(modo); modoRef.current = modo;
  const gradoRef = useRef(grado); gradoRef.current = grado;

  useEffect(() => {
    if (modoRef.current === "multi" && multiState.estado === "jugando" && screen !== "juego" && playerNameRef.current.trim() !== "") {
      iniciarJuego(gradoRef.current);
    }
  }, [multiState.estado]); // eslint-disable-line

  const iniciarJuego = useCallback((g: number) => {
    if (!playerNameRef.current.trim()) return;
    const lista = shuffle(PREGUNTAS[g]).slice(0, TOTAL_PREGUNTAS);
    setPreguntas(lista);
    setIdx(0); setSeleccionada(null); setConfirmada(false);
    setProgresoCohete(0); setScore(0); setCorrectas(0); setIncorrectas(0);
    setTiempo(0); setTimerOn(true);
    setPaused(false); pauseRef.current = false;
    setShowConfetti(false); setMostrarExplicacion(false);
    setScreen("juego"); music.start();
  }, [music]);

  const confirmarRespuesta = () => {
    if (seleccionada === null || confirmada) return;
    setConfirmada(true); setMostrarExplicacion(true);
    const esCorrecto = seleccionada === preguntas[idx].correcta;
    if (esCorrecto) {
      const avance = META / TOTAL_PREGUNTAS;
      setProgresoCohete(p => Math.min(META, p + avance));
      setScore(s => s + Math.max(50, 120 - tiempo * 2));
      setCorrectas(c => c + 1);
      setCohetePulse(true); setTimeout(() => setCohetePulse(false), 600);
    } else {
      setProgresoCohete(p => Math.max(0, p - 5));
      setIncorrectas(i => i + 1);
      setCoheteShake(true); setTimeout(() => setCoheteShake(false), 500);
    }
  };

  const siguiente = () => {
    setMostrarExplicacion(false);
    const esUltima = idx + 1 >= preguntas.length;
    if (esUltima) {
      setTimerOn(false);
      const totalCorrectas = correctas + (seleccionada === preguntas[idx].correcta ? 1 : 0);
      if (totalCorrectas >= Math.ceil(TOTAL_PREGUNTAS * 0.7)) { music.playVictory(); setShowConfetti(true); }
      else { music.stop(); }
      guardarResultado({ jugador: playerName || "Anónimo", grado, puntos: score, correctas, incorrectas, tiempo_seg: tiempo, modo });
      agregarMonedas(score);
      setScreen("resultados");
    } else {
      setIdx(i => i + 1); setSeleccionada(null); setConfirmada(false);
    }
  };

  function togglePause() { const n = !paused; setPaused(n); pauseRef.current = n; }
  function openSettings() { if (!paused) { setPaused(true); pauseRef.current = true; } setSettOpen(true); }
  function requestExit() { setSettOpen(false); setExitConfirm(true); }
  function confirmExit() { music.stop(); setPaused(false); pauseRef.current = false; setExitConfirm(false); setTimerOn(false); setScreen("config"); }
  function cancelExit() { setExitConfirm(false); }

  if (estaEnLobby && multiState.sala) return <GameLobby state={multiState} nombrePropio={playerName} onIniciar={() => { socket.iniciarJuego(multiState.sala!.codigo); iniciarJuego(grado); }} onSalir={() => { socket.salirSala(); setModo("solo"); }} colorAccent={COLOR} />;
  if (hayError) return <GameError mensaje={multiState.errorMsg} onReset={socket.resetError} colorAccent={COLOR} />;

  const preguntaActual = preguntas[idx];

  const ExitModal = (
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
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,71,87,0.1)", border: "1.5px solid rgba(255,71,87,0.35)" }}><AlertTriangle size={30} className="text-[#ff4757]" /></div>
              <div><h3 className="font-['Press_Start_2P'] text-sm text-white mb-2">Salir del juego</h3><p className="text-gray-500 text-xs leading-relaxed">Tu progreso actual se perderá.</p></div>
              <div className="w-full flex flex-col gap-2.5">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={confirmExit}
                  className="w-full py-3.5 rounded-2xl font-['Press_Start_2P'] text-xs text-white"
                  style={{ background: "linear-gradient(135deg,#ff4757,#c0392b)" }}>Sí, salir</motion.button>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={cancelExit}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm text-gray-400"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)" }}>Continuar</motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const SettingsModal = (
    <AnimatePresence>
      {settOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center px-4"
          onClick={() => setSettOpen(false)}>
          <motion.div initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "#12111e", border: `2px solid ${COLOR_BORDER}`, boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}
            onClick={e => e.stopPropagation()}>
            <div className="h-0.5" style={{ background: `linear-gradient(90deg,transparent,${COLOR},transparent)` }} />
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
              <p className="font-['Press_Start_2P'] text-xs text-white">Configuracion</p>
              <button onClick={() => setSettOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white"><X size={14} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-sm font-bold text-gray-300">Volumen</span>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={100} value={music.vol} onChange={e => music.setVolume(Number(e.target.value))} className="w-24" style={{ accentColor: COLOR }} />
                  <span className="text-sm font-bold w-9" style={{ color: COLOR }}>{music.vol}%</span>
                </div>
              </div>
              {[
                { label: "Reanudar", icon: <Play size={14} />, action: () => { togglePause(); setSettOpen(false); } },
                { label: music.muted ? "Activar música" : "Silenciar", icon: music.muted ? <Volume2 size={14} /> : <VolumeX size={14} />, action: music.toggleMute },
                { label: "Salir", icon: <LogOut size={14} />, action: requestExit, danger: true },
              ].map((a, i) => (
                <button key={i} onClick={a.action} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold border transition-all ${(a as any).danger ? "text-[#ff4757] border-[#ff4757]/20 bg-[#ff4757]/5" : "text-gray-300 border-white/7 bg-white/3 hover:text-white"}`}>
                  {a.icon}{a.label}
                </button>
              ))}
              <button onClick={() => setSettOpen(false)} className="w-full py-3 rounded-xl font-bold text-sm text-white" style={{ background: `linear-gradient(135deg,${COLOR},#00e5ff)` }}>Cerrar</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="flex flex-col items-center w-full min-h-screen text-white relative">
      {showConfetti && <Confetti />}
      {ExitModal}{SettingsModal}

      {/* ─── SPLASH ─── */}
      <AnimatePresence>
        {screen === "splash" && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
            style={{ background: "radial-gradient(ellipse 100% 80% at 50% 0%, #020510 0%, #07091a 55%, #000 100%)" }}>
            {[...Array(12)].map((_, i) => (
              <motion.div key={i} className="absolute rounded-full pointer-events-none"
                style={{ width: 1 + (i % 3), height: 1 + (i % 3), left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, background: "white", opacity: 0.6 }}
                animate={{ opacity: [0.2, 0.9, 0.2], scale: [1, 1.5, 1] }} transition={{ duration: 1.5 + i * 0.3, repeat: Infinity, delay: i * 0.2 }} />
            ))}
            <AnimatePresence mode="wait">
              {!splashDone ? (
                <motion.div key="in" initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col items-center gap-0">
                  <motion.div className="relative mb-2" animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                    <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{ background: "radial-gradient(circle,rgba(65,105,225,0.3) 0%,rgba(0,229,255,0.15) 50%,transparent 70%)", transform: "scale(2)" }} />
                    <img src={logoImg} alt="Saberix" className="w-36 h-36 md:w-44 md:h-44 object-contain relative z-10"
                      style={{ filter: "drop-shadow(0 0 30px rgba(65,105,225,0.8)) drop-shadow(0 0 60px rgba(0,229,255,0.3))" }} />
                  </motion.div>
                  <div className="flex items-center gap-0.5 mt-1 mb-2">
                    {["S", "A", "B", "E", "R", "I", "X"].map((l, i) => {
                      const cols = ["#ff4757", "#ff9800", "#ffd700", "#00ff88", "#00e5ff", "#a78bfa", "#ff4757"];
                      return <motion.span key={i} initial={{ opacity: 0, y: -18, scale: 0.6 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.5 + i * 0.07, type: "spring", stiffness: 280, damping: 17 }}
                        className="font-['Press_Start_2P'] text-3xl md:text-4xl font-black leading-none" style={{ color: cols[i], textShadow: `0 0 20px ${cols[i]}bb` }}>{l}</motion.span>;
                    })}
                  </div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }} className="flex items-center gap-2 mb-8">
                    <div className="h-px w-10 rounded-full" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.2))" }} />
                    <p className="text-xs font-bold tracking-[0.25em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>Aprende Jugando</p>
                    <div className="h-px w-10 rounded-full" style={{ background: "linear-gradient(90deg,rgba(255,255,255,0.2),transparent)" }} />
                  </motion.div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="w-48 md:w-64">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.15)" }}>Cargando</span>
                      <span className="text-[10px] font-bold" style={{ color: "rgba(65,105,225,0.7)" }}>{Math.round(splashPct)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full" style={{ width: `${splashPct}%`, background: "linear-gradient(90deg,#ff4757,#ff9800,#ffd700,#00ff88,#00e5ff,#a78bfa)", transition: "width 0.04s linear" }} />
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div key="out" initial={{ scale: 1, opacity: 1 }} animate={{ scale: 0.2, opacity: 0, y: -120 }} transition={{ duration: 0.7, ease: [0.4, 0, 1, 1] }} className="flex flex-col items-center">
                  <img src={logoImg} alt="" className="w-36 h-36 object-contain" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CONFIG ─── */}
      {screen === "config" && !estaEnLobby && !hayError && (
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/games/math" className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"><ArrowLeft size={22} /></Link>
            <div>
              <h1 className="font-['Press_Start_2P'] text-xl" style={{ color: COLOR }}>CARRERA DE COHETES</h1>
              <p className="text-gray-400 text-sm font-bold mt-1">¡Responde y despega hacia la meta!</p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border-2 bg-[#0f1425] p-6 mb-5" style={{ borderColor: COLOR_BORDER }}>
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: COLOR_LIGHT, border: `1.5px solid ${COLOR_BORDER}` }}>
                <Rocket size={26} style={{ color: COLOR }} />
              </div>
              <div>
                <p className="font-['Press_Start_2P'] text-xs mb-2" style={{ color: COLOR }}>Carrera de Cohetes · Matemáticas</p>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">Responde preguntas de cálculo mental para impulsar tu cohete. ¡Correcto = avanza, incorrecto = retrocede!</p>
                <div className="flex gap-2 flex-wrap">
                  {["Cálculo Mental", "Velocidad", "10 Preguntas"].map(t => (
                    <span key={t} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: COLOR_LIGHT, color: COLOR, border: `1px solid ${COLOR_BORDER}` }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-4">
            <p className="text-xs font-extrabold text-[#00e5ff] tracking-widest uppercase mb-3 flex items-center gap-2"><User size={13} /> Tu nombre</p>
            <input className="w-full bg-white/4 border-2 border-white/10 rounded-xl px-4 py-3 text-white font-semibold text-base outline-none focus:border-[#00e5ff]/60 transition-all placeholder:text-gray-600"
              placeholder="Escribe tu nombre..." value={playerName} onChange={e => setPlayerName(e.target.value)} maxLength={20} />
          </div>
          <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-4">
            <p className="text-xs font-extrabold text-[#ffd700] tracking-widest uppercase mb-3 flex items-center gap-2"><Star size={13} /> Grado</p>
            <div className="grid grid-cols-3 gap-2">
              {[4, 5, 6].map(g => (
                <button key={g} onClick={() => setGrado(g)} className="py-3 rounded-xl border-2 font-['Press_Start_2P'] text-sm transition-all"
                  style={{ borderColor: grado === g ? COLOR : "rgba(255,255,255,0.1)", background: grado === g ? COLOR_LIGHT : "rgba(255,255,255,0.03)", color: grado === g ? COLOR : "#6b7280" }}>{g}to</button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-4">
            <p className="text-xs font-extrabold text-[#00ff88] tracking-widest uppercase mb-3 flex items-center gap-2"><Play size={13} /> Modo de juego</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button onClick={() => setModo("solo")} className={`py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${modo === "solo" ? "border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]" : "border-white/10 bg-white/3 text-gray-400 hover:border-white/25"}`}><User size={15} /> Solitario</button>
              <button onClick={() => setModo("multi")} className={`py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${modo === "multi" ? "border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa]" : "border-white/10 bg-white/3 text-gray-400 hover:border-white/25"}`}><Users size={15} /> Multijugador</button>
            </div>
            <AnimatePresence>
              {modo === "multi" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <MultiPanel nombreJugador={playerName} onNombreChange={setPlayerName} juego="carrera_cohetes" grado={grado}
                    jugadoresConectados={multiState.sala?.jugadores ?? []} nombrePropio={playerName}
                    onCrear={(nombre, jugador) => { setPlayerName(jugador); socket.crearSala({ nombre, nombreJugador: jugador, materia: "matematicas", grado, tiempoPorPregunta: 9999, cantPreguntas: 10 }); }}
                    onUnirse={(codigo, jugador) => { setPlayerName(jugador); socket.unirseASala(codigo, jugador); }}
                    conectando={multiState.estado === "conectando"} colorAccent={COLOR} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
            onClick={() => modo === "solo" && iniciarJuego(grado)}
            disabled={!playerName.trim()}
            className="w-full py-5 rounded-2xl font-['Press_Start_2P'] text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: `linear-gradient(135deg,${COLOR},#00e5ff)`, boxShadow: `0 4px 24px rgba(65,105,225,0.4)` }}>
            🚀 ¡Despegar!
          </motion.button>
        </motion.div>
      )}

      {/* ─── JUEGO ─── */}
      {screen === "juego" && preguntaActual && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full min-h-screen flex flex-col"
          style={{ background: "linear-gradient(180deg,#000510 0%,#020a1f 40%,#060d28 100%)" }}>

          {/* Estrellas de fondo */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div key={i} style={{ position: "absolute", width: 1 + (i % 2), height: 1 + (i % 2), left: `${(i * 17 + 3) % 100}%`, top: `${(i * 13 + 7) % 100}%`, background: "white", borderRadius: "50%", opacity: 0.3 + (i % 4) * 0.1 }} />
            ))}
          </div>

          {/* TOPBAR */}
          <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/5"
            style={{ background: "rgba(2,5,16,0.95)", backdropFilter: "blur(16px)" }}>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: COLOR_LIGHT, border: `1.5px solid ${COLOR_BORDER}` }}>
                <Rocket size={14} style={{ color: COLOR }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white truncate leading-tight">{playerName}</p>
                <p className="text-[10px] text-gray-500 font-bold leading-tight">Cohetes · {grado}to Grado</p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-center">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Pregunta</p>
                <p className="font-['Press_Start_2P'] text-sm text-white leading-tight">{idx + 1}<span className="text-gray-600 text-xs">/{TOTAL_PREGUNTAS}</span></p>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="text-center">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Puntos</p>
                <p className="font-['Press_Start_2P'] text-sm text-[#ffd700] leading-tight">{score}</p>
              </div>
            </div>
            <div className="flex gap-1.5 flex-shrink-0 ml-2">
              <button onClick={togglePause} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{ background: "rgba(255,215,0,0.08)", borderColor: "rgba(255,215,0,0.22)", color: "#ffd700" }}>
                {paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
              <button onClick={openSettings} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{ background: "rgba(0,229,255,0.08)", borderColor: "rgba(0,229,255,0.22)", color: "#00e5ff" }}>
                <Settings size={14} />
              </button>
            </div>
          </div>

          {/* PISTA DE COHETE */}
          <div className="relative z-10 px-4 py-4" style={{ background: "rgba(2,5,16,0.7)" }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Progreso al espacio</span>
              <span className="text-[10px] font-bold ml-auto" style={{ color: COLOR }}>{Math.round(progresoCohete)}%</span>
            </div>
            <div className="relative w-full h-8 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {/* Ruta de estrellas */}
              {[20, 40, 60, 80].map(pos => (
                <div key={pos} style={{ position: "absolute", left: `${pos}%`, top: "50%", transform: "translate(-50%,-50%)", fontSize: 10, opacity: progresoCohete >= pos ? 1 : 0.2 }}>⭐</div>
              ))}
              {/* Barra de progreso */}
              <motion.div className="absolute left-0 top-0 h-full rounded-full"
                animate={{ width: `${progresoCohete}%` }} transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                style={{ background: `linear-gradient(90deg,${COLOR},#00e5ff)`, boxShadow: `0 0 12px rgba(65,105,225,0.7)` }} />
              {/* Cohete */}
              <motion.div
                animate={{
                  left: `${Math.max(2, progresoCohete - 3)}%`,
                  x: coheteShake ? [-6, 6, -4, 4, 0] : 0,
                  scale: cohetePulse ? [1, 1.3, 1] : 1,
                }}
                transition={{ duration: coheteShake ? 0.4 : 0.5, type: coheteShake ? "tween" : "spring" }}
                style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", fontSize: 18 }}>
                🚀
              </motion.div>
              {/* Meta */}
              <div style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🌙</div>
            </div>
          </div>

          {/* Barra de progreso general */}
          <div className="relative z-10 w-full h-1" style={{ background: "rgba(255,255,255,0.04)" }}>
            <motion.div className="h-full" animate={{ width: `${((idx + (confirmada ? 1 : 0)) / TOTAL_PREGUNTAS) * 100}%` }} transition={{ duration: 0.5 }}
              style={{ background: `linear-gradient(90deg,${COLOR},#00e5ff)` }} />
          </div>

          <AnimatePresence>
            {showRanking && modo === "multi" && <RankingPanel jugadores={multiState.sala?.jugadores ?? []} nombrePropio={playerName} onClose={() => setShowRanking(false)} />}
          </AnimatePresence>

          {/* CONTENIDO */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-4 max-w-2xl mx-auto w-full">
            <AnimatePresence>
              {paused && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40 flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
                  <div className="text-center">
                    <p className="font-['Press_Start_2P'] text-2xl text-white mb-4">PAUSA</p>
                    <button onClick={togglePause} className="px-6 py-3 rounded-xl font-bold text-white" style={{ background: `linear-gradient(135deg,${COLOR},#00e5ff)` }}>Continuar</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pregunta */}
            <motion.div key={`q-${idx}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="w-full rounded-2xl p-5 mb-4 text-center"
              style={{ background: "rgba(65,105,225,0.08)", border: `2px solid ${COLOR_BORDER}` }}>
              <p className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Pregunta {idx + 1}</p>
              <p className="text-white font-bold text-lg leading-relaxed font-mono">{preguntaActual.pregunta}</p>
            </motion.div>

            {/* Opciones en grid 2x2 */}
            <div className="grid grid-cols-2 gap-3 w-full mb-4">
              {preguntaActual.opciones.map((op, i) => {
                const esCorrecto = i === preguntaActual.correcta, esSeleccionada = i === seleccionada;
                let bg = "rgba(255,255,255,0.04)", border = "rgba(255,255,255,0.1)", textColor = "white";
                if (confirmada) {
                  if (esCorrecto) { bg = "rgba(0,255,136,0.12)"; border = "#00ff88"; textColor = "#00ff88"; }
                  else if (esSeleccionada) { bg = "rgba(255,71,87,0.12)"; border = "#ff4757"; textColor = "#ff4757"; }
                  else { bg = "rgba(255,255,255,0.02)"; border = "rgba(255,255,255,0.05)"; textColor = "#374151"; }
                } else if (esSeleccionada) { bg = COLOR_LIGHT; border = COLOR; textColor = COLOR; }
                return (
                  <motion.button key={i} whileHover={!confirmada ? { scale: 1.03 } : {}} whileTap={!confirmada ? { scale: 0.97 } : {}}
                    onClick={() => !confirmada && setSeleccionada(i)} disabled={confirmada}
                    className="p-4 rounded-xl font-bold text-base transition-all border-2 font-mono flex items-center justify-center gap-2"
                    style={{ background: bg, borderColor: border, color: textColor, minHeight: 56 }}>
                    {confirmada && esCorrecto && <CheckCircle2 size={14} className="text-[#00ff88] flex-shrink-0" />}
                    {confirmada && esSeleccionada && !esCorrecto && <XCircle size={14} className="text-[#ff4757] flex-shrink-0" />}
                    {op}
                  </motion.button>
                );
              })}
            </div>

            {/* Explicación */}
            <AnimatePresence>
              {mostrarExplicacion && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="w-full rounded-xl p-3 mb-3 overflow-hidden"
                  style={{ background: seleccionada === preguntaActual.correcta ? "rgba(0,255,136,0.07)" : "rgba(255,71,87,0.07)", border: `1px solid ${seleccionada === preguntaActual.correcta ? "rgba(0,255,136,0.25)" : "rgba(255,71,87,0.25)"}` }}>
                  <p className="text-xs font-bold mb-0.5" style={{ color: seleccionada === preguntaActual.correcta ? "#00ff88" : "#ff4757" }}>
                    {seleccionada === preguntaActual.correcta ? "🚀 ¡El cohete avanza!" : "💥 ¡El cohete retrocede!"}
                  </p>
                  <p className="text-gray-400 text-xs leading-relaxed">💡 {preguntaActual.explicacion}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {mostrarPista && !confirmada && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="w-full rounded-xl p-4 mb-3 flex items-start gap-3"
                style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.3)" }}>
                <Lightbulb size={16} className="text-[#ffd700] flex-shrink-0 mt-0.5" />
                <p className="text-[#ffd700] text-xs leading-relaxed font-bold">💡 {preguntaActual.explicacion}</p>
              </motion.div>
            )}
            <div className="w-full flex gap-3">
              {!confirmada && !mostrarPista && (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (!gastarMonedas(5000)) { alert("No tienes suficientes monedas (necesitas 5,000 🪙)"); return; }
                    setMostrarPista(true);
                  }}
                  className="px-4 py-4 rounded-2xl border-2 flex items-center gap-2 font-bold text-xs flex-shrink-0 transition-all"
                  style={{ borderColor: "rgba(255,215,0,0.3)", background: "rgba(255,215,0,0.06)", color: "#ffd700" }}>
                  <Lightbulb size={14} />
                  <span className="hidden sm:inline">-5,000 🪙</span>
                </motion.button>
              )}
              {!confirmada ? (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={confirmarRespuesta} disabled={seleccionada === null}
                  className="w-full py-4 rounded-2xl font-['Press_Start_2P'] text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: `linear-gradient(135deg,${COLOR},#00e5ff)`, boxShadow: `0 4px 20px rgba(65,105,225,0.4)` }}>
                  Confirmar
                </motion.button>
              ) : (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={siguiente}
                  className="w-full py-4 rounded-2xl font-['Press_Start_2P'] text-sm text-white"
                  style={{ background: idx + 1 >= TOTAL_PREGUNTAS ? "linear-gradient(135deg,#ffd700,#ff9800)" : `linear-gradient(135deg,${COLOR},#00e5ff)` }}>
                  {idx + 1 >= TOTAL_PREGUNTAS ? "🏁 Ver resultado" : "Siguiente →"}
                </motion.button>
              )}
            </div>
          </div>

          {/* BOTTOMBAR */}
          <div className="relative z-10 flex items-center justify-center gap-6 px-6 py-3 border-t border-white/5" style={{ background: "rgba(2,5,16,0.9)", backdropFilter: "blur(16px)" }}>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500"><CheckCircle2 size={14} className="text-[#00ff88]" /><span className="text-[#00ff88]">{correctas}</span> correctas</div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500"><XCircle size={14} className="text-[#ff4757]" /><span className="text-[#ff4757]">{incorrectas}</span> errores</div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500"><Star size={14} className="text-[#ffd700]" /><span className="text-[#ffd700]">{score}</span> pts</div>
          </div>
        </motion.div>
      )}

      {/* ─── RESULTADOS ─── */}
      {screen === "resultados" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="w-full min-h-screen flex flex-col items-center justify-start px-4 py-10 overflow-y-auto"
          style={{ background: "linear-gradient(180deg,#000510 0%,#020a1f 100%)" }}>
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div key={i} style={{ position: "absolute", width: 1, height: 1, left: `${(i * 17 + 3) % 100}%`, top: `${(i * 13 + 7) % 100}%`, background: "white", borderRadius: "50%", opacity: 0.4 }} />
            ))}
          </div>
          <div className="relative z-10 w-full max-w-lg">
            <motion.div initial={{ scale: 0, y: -50 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", delay: 0.1, stiffness: 200 }} className="flex justify-center mb-5">
              {correctas >= Math.ceil(TOTAL_PREGUNTAS * 0.7)
                ? <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                  <span style={{ fontSize: 72 }}>🚀</span>
                </motion.div>
                : <span style={{ fontSize: 64 }}>🌍</span>}
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="font-['Press_Start_2P'] text-2xl mb-2 text-center"
              style={{ background: correctas >= Math.ceil(TOTAL_PREGUNTAS * 0.7) ? "linear-gradient(135deg,#ffd700,#ff9800)" : `linear-gradient(135deg,${COLOR},#00e5ff)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {correctas >= Math.ceil(TOTAL_PREGUNTAS * 0.7) ? "¡Llegaste al espacio!" : "¡Sigue entrenando!"}
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-center text-gray-400 text-sm mb-6">
              Tu cohete llegó al <span className="font-bold" style={{ color: COLOR }}>{Math.round(progresoCohete)}%</span> del recorrido
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl p-5 mb-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div><p className="text-2xl font-black text-[#00ff88]">{correctas}</p><p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Correctas</p></div>
                <div><p className="text-2xl font-black text-[#ff4757]">{incorrectas}</p><p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Errores</p></div>
                <div><p className="text-2xl font-black text-[#ffd700]">{score}</p><p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Puntos</p></div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-gray-400">Precisión</span>
                  <span className="text-xs font-bold" style={{ color: COLOR }}>{Math.round((correctas / TOTAL_PREGUNTAS) * 100)}%</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(correctas / TOTAL_PREGUNTAS) * 100}%` }} transition={{ delay: 0.5, duration: 1 }}
                    className="h-full rounded-full" style={{ background: `linear-gradient(90deg,${COLOR},#00e5ff)` }} />
                </div>
              </div>
            </motion.div>
            <div className="flex flex-col gap-3">
              <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setShowConfetti(false); iniciarJuego(grado); }}
                className="w-full py-4 rounded-2xl font-['Press_Start_2P'] text-sm text-white"
                style={{ background: `linear-gradient(135deg,${COLOR},#00e5ff)`, boxShadow: `0 4px 24px rgba(65,105,225,0.4)` }}>
                🚀 Volver a despegar
              </motion.button>
              <Link to="/games/math" className="w-full">
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-2xl font-bold text-sm text-gray-400"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)" }}>
                  Volver a Matemáticas
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
