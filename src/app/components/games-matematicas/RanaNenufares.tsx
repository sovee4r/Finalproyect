// RanaNenufares.tsx — Matemáticas 4to-6to
// La rana salta de nenúfar en nenúfar. Cada nenúfar tiene un número.
// Responde la pregunta y elige el nenúfar con la respuesta correcta para saltar.
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Play, Pause, X, Calculator,
  Volume2, VolumeX, RotateCcw, Trophy, Star,
  CheckCircle2, XCircle, LogOut,
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
  nenufares: number[];   // 4 números en los nenúfares
  correcta: number;      // índice del nenúfar correcto (0-3)
  explicacion: string;
}

const PREGUNTAS: Record<number, Pregunta[]> = {
  4: [
    { pregunta: "¿Cuánto es 6 × 7?", nenufares: [40, 42, 48, 36], correcta: 1, explicacion: "6 × 7 = 42. Tabla del 7: 7, 14, 21, 28, 35, 42." },
    { pregunta: "¿Cuánto es 56 ÷ 8?", nenufares: [6, 8, 7, 9], correcta: 2, explicacion: "56 ÷ 8 = 7, porque 8 × 7 = 56." },
    { pregunta: "¿Cuánto es 3/4 de 20?", nenufares: [10, 12, 15, 18], correcta: 2, explicacion: "3/4 de 20 = (20 ÷ 4) × 3 = 5 × 3 = 15." },
    { pregunta: "Perímetro de rectángulo 8 cm × 3 cm", nenufares: [22, 24, 11, 32], correcta: 1, explicacion: "P = 2 × (largo + ancho) = 2 × (8 + 3) = 2 × 11 = 22. ¡Espera, es 22!" },
    { pregunta: "¿Cuánto es 0.3 + 0.7?", nenufares: [0.37, 10, 1, 0.1], correcta: 2, explicacion: "0.3 + 0.7 = 1.0 (tres décimas más siete décimas = 10 décimas = 1 entero)." },
    { pregunta: "¿Cuánto es 9 × 6?", nenufares: [52, 54, 56, 58], correcta: 1, explicacion: "9 × 6 = 54. Truco del 9: el resultado siempre suma 9 (5+4=9)." },
    { pregunta: "Área de cuadrado de lado 7 cm", nenufares: [28, 49, 14, 42], correcta: 1, explicacion: "Área = lado² = 7 × 7 = 49 cm²." },
    { pregunta: "¿Cuánto es 200 - 75?", nenufares: [125, 135, 115, 145], correcta: 0, explicacion: "200 - 75 = 125. Puedes verificar: 75 + 125 = 200." },
    { pregunta: "¿Cuánto es 1/2 + 1/4?", nenufares: ["2/6", "3/4", "1/6", "2/4"], correcta: 1, explicacion: "1/2 + 1/4 = 2/4 + 1/4 = 3/4. Hay que igualar denominadores." },
    { pregunta: "¿Cuántos mm tiene 1 cm?", nenufares: [5, 100, 10, 1000], correcta: 2, explicacion: "1 centímetro = 10 milímetros." },
  ],
  5: [
    { pregunta: "¿Cuánto es 2⁴?", nenufares: [8, 12, 16, 20], correcta: 2, explicacion: "2⁴ = 2 × 2 × 2 × 2 = 16." },
    { pregunta: "¿Cuánto es √81?", nenufares: [7, 8, 9, 10], correcta: 2, explicacion: "√81 = 9, porque 9 × 9 = 81." },
    { pregunta: "¿Cuánto es 25% de 60?", nenufares: [12, 15, 20, 25], correcta: 1, explicacion: "25% = 1/4. Un cuarto de 60 = 60 ÷ 4 = 15." },
    { pregunta: "MCM de 6 y 8", nenufares: [12, 24, 48, 16], correcta: 1, explicacion: "MCM(6,8) = 24. Múltiplos de 6: 6,12,18,24. De 8: 8,16,24. El menor común es 24." },
    { pregunta: "¿Cuánto es 5/6 - 1/3?", nenufares: ["1/2", "4/3", "1/6", "2/6"], correcta: 0, explicacion: "5/6 - 1/3 = 5/6 - 2/6 = 3/6 = 1/2." },
    { pregunta: "Media de: 10, 20, 30, 40", nenufares: [20, 25, 30, 22], correcta: 1, explicacion: "Media = (10+20+30+40) ÷ 4 = 100 ÷ 4 = 25." },
    { pregunta: "¿Cuánto es 3.5 × 6?", nenufares: [18, 21, 24, 28], correcta: 1, explicacion: "3.5 × 6 = 21. Es como 3 × 6 = 18 más 0.5 × 6 = 3, total 21." },
    { pregunta: "MCD de 18 y 12", nenufares: [3, 4, 6, 9], correcta: 2, explicacion: "MCD(18,12) = 6. Divisores de 18: 1,2,3,6,9,18. De 12: 1,2,3,4,6,12." },
    { pregunta: "¿Cuánto es 40% de 80?", nenufares: [28, 30, 32, 34], correcta: 2, explicacion: "40% de 80 = 0.40 × 80 = 32." },
    { pregunta: "¿Cuánto es 1000 ÷ 25?", nenufares: [35, 40, 45, 50], correcta: 1, explicacion: "1000 ÷ 25 = 40. Porque 25 × 4 = 100, entonces 25 × 40 = 1000." },
  ],
  6: [
    { pregunta: "Si a=5, b=12: ¿cuánto es √(a²+b²)?", nenufares: [10, 11, 13, 15], correcta: 2, explicacion: "√(25+144) = √169 = 13. ¡Terna pitagórica 5-12-13!" },
    { pregunta: "¿Cuánto es 3/8 expresado en decimal?", nenufares: [0.25, 0.375, 0.35, 0.38], correcta: 1, explicacion: "3/8 = 3 ÷ 8 = 0.375." },
    { pregunta: "Área de círculo con r=5 (π≈3.14)", nenufares: [78.5, 31.4, 62.8, 157], correcta: 0, explicacion: "A = π × r² = 3.14 × 25 = 78.5 cm²." },
    { pregunta: "¿Cuánto es 60% de 45?", nenufares: [24, 27, 30, 33], correcta: 1, explicacion: "60% de 45 = 0.6 × 45 = 27." },
    { pregunta: "Volumen de cubo de 4 cm", nenufares: [48, 64, 32, 96], correcta: 1, explicacion: "V = 4³ = 4 × 4 × 4 = 64 cm³." },
    { pregunta: "¿Cuánto es 5² + 12²?", nenufares: [144, 169, 196, 121], correcta: 1, explicacion: "5² + 12² = 25 + 144 = 169 = 13²." },
    { pregunta: "Longitud de circunferencia con d=10 (π≈3.14)", nenufares: [15.7, 31.4, 62.8, 78.5], correcta: 1, explicacion: "L = π × d = 3.14 × 10 = 31.4 cm." },
    { pregunta: "¿Cuánto es el 150% de 60?", nenufares: [75, 80, 90, 100], correcta: 2, explicacion: "150% de 60 = 1.5 × 60 = 90." },
    { pregunta: "Si x/4 = 7, ¿cuánto es x?", nenufares: [21, 28, 35, 14], correcta: 1, explicacion: "x = 7 × 4 = 28." },
    { pregunta: "Probabilidad de sacar 6 en un dado", nenufares: ["1/3", "1/4", "1/6", "1/2"], correcta: 2, explicacion: "P(6) = 1/6. Un dado tiene 6 caras y solo una es el 6." },
  ],
};

/* ─── MÚSICA: Nenúfares — Tropical, suave, acuático ─── */
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
      this.masterGain.gain.value = 0.08; this.muteGain.gain.value = 1;
      this.masterGain.connect(this.muteGain); this.muteGain.connect(this.ac.destination);
      this.running = true; this.loop();
    } catch (_) {}
  }
  stop() { this.running = false; try { this.ac?.close(); } catch (_) {} this.ac = null; this.masterGain = null; this.muteGain = null; }
  setMuted(m: boolean) { if (!this.muteGain || !this.ac) return; this.muteGain.gain.linearRampToValueAtTime(m ? 0 : 1, this.ac.currentTime + 0.3); }
  setVolume(v: number) { if (this.masterGain && this.ac) this.masterGain.gain.linearRampToValueAtTime((v / 100) * 0.15, this.ac.currentTime + 0.1); }
  private loop() {
    // Nenúfares: notas tropicales tipo xilófono acuático — Fa mayor
    const notas = [349.2, 392.0, 440.0, 523.3, 587.3, 523.3, 440.0, 392.0];
    let ci = 0;
    const play = () => {
      if (!this.running || !this.ac || !this.masterGain) return;
      const freq = notas[ci % notas.length];
      const osc = this.ac.createOscillator(), env = this.ac.createGain();
      osc.type = "sine"; osc.frequency.value = freq;
      const filt = this.ac.createBiquadFilter(); filt.type = "bandpass"; filt.frequency.value = freq * 2; filt.Q.value = 3;
      osc.connect(filt); filt.connect(env); env.connect(this.masterGain);
      const t = this.ac.currentTime, dur = 0.8;
      env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(0.6, t + 0.04);
      env.gain.exponentialRampToValueAtTime(0.001, t + dur); osc.start(t); osc.stop(t + dur);
      ci++; setTimeout(play, 420);
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
        [349.2, 440.0, 523.3, 659.3, 784.0, 1046.5].forEach((freq, i) => {
          const osc = ac.createOscillator(), g = ac.createGain();
          osc.type = "sine"; osc.frequency.value = freq;
          osc.connect(g); g.connect(ac.destination);
          const t = ac.currentTime + i * 0.1;
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.3, t + 0.04); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
          osc.start(t); osc.stop(t + 0.55);
        });
        setTimeout(() => ac.close(), 1500);
      } catch (_) {}
    }, 80);
  }, []);
  return { start, stop, toggleMute, setVolume, playVictory, muted, vol };
}

async function guardarResultado(data: { jugador: string; grado: number; puntos: number; correctas: number; incorrectas: number; tiempo_seg: number; modo: string }) {
  try { await fetch(`${API}/api/resultados_juegos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, juego: "rana_nenufares", materia: "matematicas" }) }); } catch (_) {}
}

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id: i, color: ["#00ff88", "#4169E1", "#ffd700", "#00e5ff", "#a78bfa", "#22c55e"][i % 6],
    x: Math.random() * 100, delay: Math.random() * 0.5, size: 6 + Math.random() * 8, rotate: Math.random() * 360,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <motion.div key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: p.rotate }}
          animate={{ y: "110vh", opacity: [1, 1, 0], rotate: p.rotate + 360 }}
          transition={{ duration: 2.2, delay: p.delay, ease: "easeIn" }}
          style={{ position: "absolute", top: 0, width: p.size, height: p.size, borderRadius: 2, background: p.color }} />
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
// Posiciones fijas de los 4 nenúfares en la pantalla
const NENUFAR_POSITIONS = [
  { x: 20, y: 35 },
  { x: 65, y: 28 },
  { x: 15, y: 68 },
  { x: 70, y: 62 },
];

export function RanaNenufares() {
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
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  const [ranaPos, setRanaPos] = useState(0); // índice del nenúfar donde está la rana
  const [saltando, setSaltando] = useState(false);
  const [score, setScore] = useState(0);
  const [correctas, setCorrectas] = useState(0);
  const [incorrectas, setIncorrectas] = useState(0);
  const [tiempo, setTiempo] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  const [paused, setPaused] = useState(false);
  const [settOpen, setSettOpen] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [mostrarExplicacion, setMostrarExplicacion] = useState(false);
  const [mostrarPista, setMostrarPista] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [splash, setSplash] = useState<number | null>(null); // índice del nenúfar que splash

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
    setIdx(0); setSeleccionado(null); setConfirmado(false);
    setRanaPos(0); setScore(0); setCorrectas(0); setIncorrectas(0);
    setTiempo(0); setTimerOn(true);
    setPaused(false); pauseRef.current = false;
    setShowConfetti(false); setMostrarExplicacion(false);
    setScreen("juego"); music.start();
  }, [music]);

  const elegirNenufar = (i: number) => {
    if (confirmado || saltando) return;
    setSeleccionado(i);
  };

  const confirmarSalto = () => {
    if (seleccionado === null || confirmado || saltando) return;
    setSaltando(true);
    const esCorrecto = seleccionado === preguntas[idx].correcta;

    // Animación de salto
    setTimeout(() => {
      setRanaPos(seleccionado);
      setSplash(seleccionado);
      setTimeout(() => setSplash(null), 600);
    }, 300);

    setTimeout(() => {
      setSaltando(false);
      setConfirmado(true);
      setMostrarExplicacion(true);
      if (esCorrecto) {
        setScore(s => s + Math.max(50, 130 - tiempo * 2));
        setCorrectas(c => c + 1);
      } else {
        setIncorrectas(i => i + 1);
      }
    }, 700);
  };

  const siguiente = () => {
    setMostrarExplicacion(false);
    if (idx + 1 >= preguntas.length) {
      setTimerOn(false);
      const totalCorrectas = correctas + (seleccionado === preguntas[idx].correcta ? 1 : 0);
      if (totalCorrectas >= Math.ceil(TOTAL_PREGUNTAS * 0.7)) { music.playVictory(); setShowConfetti(true); }
      else { music.stop(); }
      guardarResultado({ jugador: playerName || "Anónimo", grado, puntos: score, correctas, incorrectas, tiempo_seg: tiempo, modo });
      agregarMonedas(score);
      setScreen("resultados");
    } else {
      setIdx(i => i + 1); setSeleccionado(null); setConfirmado(false);
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
              <button onClick={() => setSettOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-gray-400"><X size={14} /></button>
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
              <button onClick={() => setSettOpen(false)} className="w-full py-3 rounded-xl font-bold text-sm text-white" style={{ background: `linear-gradient(135deg,#00ff88,${COLOR})` }}>Cerrar</button>
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
            style={{ background: "radial-gradient(ellipse 100% 80% at 50% 0%, #051a08 0%, #07091a 55%, #000 100%)" }}>
            {[...Array(7)].map((_, i) => (
              <motion.div key={i} className="absolute rounded-full pointer-events-none"
                style={{ width: 2 + (i % 3) * 2, height: 2 + (i % 3) * 2, left: `${8 + i * 13}%`, top: `${15 + (i % 4) * 17}%`, background: ["#00ff88", "#4169E1", "#00e5ff", "#ffd700", "#a78bfa", "#22c55e", "#00ff88"][i] }}
                animate={{ y: [0, -28, 0], opacity: [0.2, 0.7, 0.2] }} transition={{ duration: 2.8 + i * 0.4, repeat: Infinity, delay: i * 0.35 }} />
            ))}
            <AnimatePresence mode="wait">
              {!splashDone ? (
                <motion.div key="in" initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col items-center gap-0">
                  <motion.div className="relative mb-2" animate={{ y: [0, -7, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                    <img src={logoImg} alt="Saberix" className="w-36 h-36 md:w-44 md:h-44 object-contain relative z-10"
                      style={{ filter: "drop-shadow(0 0 28px rgba(0,255,136,0.5)) drop-shadow(0 0 55px rgba(65,105,225,0.3))" }} />
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
                      <span className="text-[10px] font-bold" style={{ color: "rgba(0,255,136,0.6)" }}>{Math.round(splashPct)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full" style={{ width: `${splashPct}%`, background: "linear-gradient(90deg,#ff4757,#ff9800,#ffd700,#00ff88,#00e5ff,#a78bfa)", transition: "width 0.04s linear" }} />
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div key="out" initial={{ scale: 1, opacity: 1 }} animate={{ scale: 0.2, opacity: 0, y: -90 }} transition={{ duration: 0.65, ease: [0.4, 0, 1, 1] }} className="flex flex-col items-center">
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
              <h1 className="font-['Press_Start_2P'] text-xl" style={{ color: "#00ff88" }}>RANA EN NENÚFARES</h1>
              <p className="text-gray-400 text-sm font-bold mt-1">¡Salta al nenúfar correcto!</p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border-2 bg-[#0f1425] p-6 mb-5" style={{ borderColor: "rgba(0,255,136,0.35)" }}>
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl" style={{ background: "rgba(0,255,136,0.1)", border: "1.5px solid rgba(0,255,136,0.3)" }}>🐸</div>
              <div>
                <p className="font-['Press_Start_2P'] text-xs mb-2" style={{ color: "#00ff88" }}>Rana en Nenúfares · Matemáticas</p>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">¡Ayuda a la rana a cruzar el estanque! Cada nenúfar tiene un número. Salta al correcto respondiendo la pregunta.</p>
                <div className="flex gap-2 flex-wrap">
                  {["Cálculo", "10 Saltos", "¡A saltar!"].map(t => (
                    <span key={t} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.3)" }}>{t}</span>
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
                  style={{ borderColor: grado === g ? "#00ff88" : "rgba(255,255,255,0.1)", background: grado === g ? "rgba(0,255,136,0.15)" : "rgba(255,255,255,0.03)", color: grado === g ? "#00ff88" : "#6b7280" }}>{g}to</button>
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
                  <MultiPanel nombreJugador={playerName} onNombreChange={setPlayerName} juego="rana_nenufares" grado={grado}
                    jugadoresConectados={multiState.sala?.jugadores ?? []} nombrePropio={playerName}
                    onCrear={(nombre, jugador) => { setPlayerName(jugador); socket.crearSala({ nombre, nombreJugador: jugador, materia: "matematicas", grado, tiempoPorPregunta: 9999, cantPreguntas: 10 }); }}
                    onUnirse={(codigo, jugador) => { setPlayerName(jugador); socket.unirseASala(codigo, jugador); }}
                    conectando={multiState.estado === "conectando"} colorAccent="#00ff88" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
            onClick={() => modo === "solo" && iniciarJuego(grado)}
            disabled={!playerName.trim()}
            className="w-full py-5 rounded-2xl font-['Press_Start_2P'] text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg,#00ff88,#4169E1)", boxShadow: "0 4px 24px rgba(0,255,136,0.35)" }}>
            🐸 ¡A saltar!
          </motion.button>
        </motion.div>
      )}

      {/* ─── JUEGO ─── */}
      {screen === "juego" && preguntaActual && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full min-h-screen flex flex-col"
          style={{ background: "linear-gradient(180deg,#061a0a 0%,#0a2810 40%,#051510 100%)" }}>

          {/* Fondo acuático */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(180deg,transparent,rgba(0,100,50,0.3))" }} />
            {[...Array(6)].map((_, i) => (
              <motion.div key={i} animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
                style={{ position: "absolute", width: 80 + i * 30, height: 30 + i * 10, borderRadius: "50%", left: `${10 + i * 15}%`, top: `${30 + (i % 3) * 20}%`, background: "rgba(0,180,80,0.08)", border: "1px solid rgba(0,255,136,0.1)" }} />
            ))}
          </div>

          {/* TOPBAR */}
          <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/5"
            style={{ background: "rgba(6,26,10,0.95)", backdropFilter: "blur(16px)" }}>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">🐸</div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white truncate leading-tight">{playerName}</p>
                <p className="text-[10px] text-gray-500 font-bold leading-tight">Nenúfares · {grado}to Grado</p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-center">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Salto</p>
                <p className="font-['Press_Start_2P'] text-sm text-white leading-tight">{idx + 1}<span className="text-gray-600 text-xs">/{TOTAL_PREGUNTAS}</span></p>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="text-center">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Puntos</p>
                <p className="font-['Press_Start_2P'] text-sm text-[#ffd700] leading-tight">{score}</p>
              </div>
            </div>
            <div className="flex gap-1.5 flex-shrink-0 ml-2">
              <button onClick={togglePause} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{ background: "rgba(255,215,0,0.08)", borderColor: "rgba(255,215,0,0.22)", color: "#ffd700" }}>{paused ? <Play size={14} /> : <Pause size={14} />}</button>
              <button onClick={openSettings} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{ background: "rgba(0,229,255,0.08)", borderColor: "rgba(0,229,255,0.22)", color: "#00e5ff" }}><Settings size={14} /></button>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="relative z-10 w-full h-1.5" style={{ background: "rgba(255,255,255,0.04)" }}>
            <motion.div className="h-full" animate={{ width: `${((idx + (confirmado ? 1 : 0)) / TOTAL_PREGUNTAS) * 100}%` }} transition={{ duration: 0.5 }}
              style={{ background: "linear-gradient(90deg,#00ff88,#4169E1)", boxShadow: "0 0 8px rgba(0,255,136,0.5)" }} />
          </div>

          <AnimatePresence>
            {showRanking && modo === "multi" && <RankingPanel jugadores={multiState.sala?.jugadores ?? []} nombrePropio={playerName} onClose={() => setShowRanking(false)} />}
          </AnimatePresence>

          <div className="relative z-10 flex-1 flex flex-col px-4 py-3 max-w-2xl mx-auto w-full">
            <AnimatePresence>
              {paused && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40 flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
                  <div className="text-center">
                    <p className="font-['Press_Start_2P'] text-2xl text-white mb-4">PAUSA</p>
                    <button onClick={togglePause} className="px-6 py-3 rounded-xl font-bold text-white" style={{ background: "linear-gradient(135deg,#00ff88,#4169E1)" }}>Continuar</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pregunta */}
            <motion.div key={`q-${idx}`} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-4 mb-3 text-center"
              style={{ background: "rgba(0,255,136,0.06)", border: "2px solid rgba(0,255,136,0.2)" }}>
              <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-widest">¿A cuál nenúfar salta la rana?</p>
              <p className="text-white font-bold text-lg leading-relaxed font-mono">{preguntaActual.pregunta}</p>
            </motion.div>

            {/* ESTANQUE CON NENÚFARES */}
            <div className="relative flex-1 rounded-2xl overflow-hidden mb-3"
              style={{ minHeight: 220, background: "linear-gradient(180deg,rgba(0,60,30,0.4),rgba(0,100,50,0.5))", border: "2px solid rgba(0,255,136,0.15)" }}>

              {/* Efecto agua */}
              <motion.div animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 opacity-20"
                style={{ backgroundImage: "repeating-linear-gradient(45deg,rgba(0,255,136,0.1) 0px,transparent 10px,transparent 20px,rgba(0,255,136,0.05) 30px)", backgroundSize: "60px 60px" }} />

              {/* Rana (siempre visible en el centro si no ha saltado) */}
              <AnimatePresence mode="wait">
                <motion.div key={`rana-${ranaPos}-${idx}`}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{
                    left: `${NENUFAR_POSITIONS[ranaPos].x + 4}%`,
                    top: `${NENUFAR_POSITIONS[ranaPos].y - 14}%`,
                    scale: saltando ? [1, 1.4, 0.8, 1] : 1,
                    y: saltando ? [0, -30, 0] : 0,
                    opacity: 1,
                  }}
                  transition={{ duration: 0.6, type: "spring" }}
                  style={{ position: "absolute", fontSize: 28, zIndex: 20, transform: "translateX(-50%)" }}>
                  🐸
                </motion.div>
              </AnimatePresence>

              {/* Nenúfares */}
              {preguntaActual.nenufares.map((num, i) => {
                const pos = NENUFAR_POSITIONS[i];
                const esCorrecto = i === preguntaActual.correcta;
                const esSeleccionado = i === seleccionado;
                let borderColor = "rgba(0,255,136,0.25)";
                let bg = "rgba(0,100,50,0.6)";
                let textColor = "#00ff88";
                if (confirmado) {
                  if (esCorrecto) { borderColor = "#00ff88"; bg = "rgba(0,255,136,0.25)"; textColor = "#00ff88"; }
                  else if (esSeleccionado) { borderColor = "#ff4757"; bg = "rgba(255,71,87,0.2)"; textColor = "#ff4757"; }
                  else { bg = "rgba(0,50,30,0.4)"; textColor = "#374151"; }
                } else if (esSeleccionado) {
                  borderColor = "#00e5ff"; bg = "rgba(0,229,255,0.15)"; textColor = "#00e5ff";
                }
                return (
                  <motion.button key={i}
                    whileHover={!confirmado ? { scale: 1.1 } : {}}
                    whileTap={!confirmado ? { scale: 0.9 } : {}}
                    onClick={() => elegirNenufar(i)}
                    disabled={confirmado || saltando}
                    animate={{ scale: splash === i ? [1, 1.3, 0.9, 1] : 1 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      position: "absolute",
                      left: `${pos.x}%`, top: `${pos.y}%`,
                      transform: "translate(-50%,-50%)",
                      width: 70, height: 70, borderRadius: "50%",
                      background: bg, border: `3px solid ${borderColor}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexDirection: "column",
                      cursor: confirmado ? "default" : "pointer",
                      boxShadow: esSeleccionado && !confirmado ? `0 0 20px rgba(0,229,255,0.5)` : esCorrecto && confirmado ? `0 0 20px rgba(0,255,136,0.5)` : "none",
                      zIndex: 10,
                    }}>
                    <span className="font-['Press_Start_2P'] text-sm font-black leading-none" style={{ color: textColor }}>{String(num)}</span>
                    {confirmado && esCorrecto && <CheckCircle2 size={12} className="text-[#00ff88] mt-0.5" />}
                    {confirmado && esSeleccionado && !esCorrecto && <XCircle size={12} className="text-[#ff4757] mt-0.5" />}
                  </motion.button>
                );
              })}
            </div>

            {/* Explicación */}
            <AnimatePresence>
              {mostrarExplicacion && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl p-3 mb-3 overflow-hidden"
                  style={{ background: seleccionado === preguntaActual.correcta ? "rgba(0,255,136,0.07)" : "rgba(255,71,87,0.07)", border: `1px solid ${seleccionado === preguntaActual.correcta ? "rgba(0,255,136,0.25)" : "rgba(255,71,87,0.25)"}` }}>
                  <p className="text-xs font-bold mb-0.5" style={{ color: seleccionado === preguntaActual.correcta ? "#00ff88" : "#ff4757" }}>
                    {seleccionado === preguntaActual.correcta ? "🐸 ¡Salto perfecto!" : "💦 ¡Cayó al agua!"}
                  </p>
                  <p className="text-gray-400 text-xs leading-relaxed">💡 {preguntaActual.explicacion}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {mostrarPista && !confirmado && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="w-full rounded-xl p-4 mb-3 flex items-start gap-3"
                style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.3)" }}>
                <Lightbulb size={16} className="text-[#ffd700] flex-shrink-0 mt-0.5" />
                <p className="text-[#ffd700] text-xs leading-relaxed font-bold">💡 {preguntaActual.explicacion}</p>
              </motion.div>
            )}
            {/* Botones */}
            {!confirmado && !mostrarPista && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (!gastarMonedas(5000)) { alert("No tienes suficientes monedas (necesitas 5,000 🪙)"); return; }
                  setMostrarPista(true);
                }}
                className="w-full py-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold text-xs mb-3 transition-all"
                style={{ borderColor: "rgba(255,215,0,0.3)", background: "rgba(255,215,0,0.06)", color: "#ffd700" }}>
                <Lightbulb size={14} /> Pista (-5,000 🪙)
              </motion.button>
            )}
            {!confirmado ? (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={confirmarSalto}
                disabled={seleccionado === null || saltando}
                className="w-full py-4 rounded-2xl font-['Press_Start_2P'] text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg,#00ff88,#4169E1)", boxShadow: "0 4px 20px rgba(0,255,136,0.35)" }}>
                🐸 ¡Saltar!
              </motion.button>
            ) : (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={siguiente}
                className="w-full py-4 rounded-2xl font-['Press_Start_2P'] text-sm text-white"
                style={{ background: idx + 1 >= TOTAL_PREGUNTAS ? "linear-gradient(135deg,#ffd700,#ff9800)" : "linear-gradient(135deg,#00ff88,#4169E1)" }}>
                {idx + 1 >= TOTAL_PREGUNTAS ? "🏆 Ver resultado" : "Siguiente salto →"}
              </motion.button>
            )}
          </div>

          {/* BOTTOMBAR */}
          <div className="relative z-10 flex items-center justify-center gap-6 px-6 py-3 border-t border-white/5" style={{ background: "rgba(6,26,10,0.9)", backdropFilter: "blur(16px)" }}>
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
          style={{ background: "linear-gradient(180deg,#061a0a 0%,#0a2810 100%)" }}>
          <div className="relative z-10 w-full max-w-lg">
            <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", delay: 0.1 }} className="flex justify-center mb-5">
              {correctas >= Math.ceil(TOTAL_PREGUNTAS * 0.7)
                ? <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><span style={{ fontSize: 72 }}>🐸</span></motion.div>
                : <span style={{ fontSize: 64 }}>💦</span>}
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="font-['Press_Start_2P'] text-2xl mb-3 text-center"
              style={{ background: correctas >= Math.ceil(TOTAL_PREGUNTAS * 0.7) ? "linear-gradient(135deg,#00ff88,#4169E1)" : "linear-gradient(135deg,#4169E1,#00e5ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {correctas >= Math.ceil(TOTAL_PREGUNTAS * 0.7) ? "¡La rana cruzó!" : "¡Sigue practicando!"}
            </motion.h2>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl p-5 mb-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div><p className="text-2xl font-black text-[#00ff88]">{correctas}</p><p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Saltos OK</p></div>
                <div><p className="text-2xl font-black text-[#ff4757]">{incorrectas}</p><p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Caídas</p></div>
                <div><p className="text-2xl font-black text-[#ffd700]">{score}</p><p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Puntos</p></div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-gray-400">Precisión</span>
                  <span className="text-xs font-bold text-[#00ff88]">{Math.round((correctas / TOTAL_PREGUNTAS) * 100)}%</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(correctas / TOTAL_PREGUNTAS) * 100}%` }} transition={{ delay: 0.5, duration: 1 }}
                    className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#00ff88,#4169E1)" }} />
                </div>
              </div>
            </motion.div>
            <div className="flex flex-col gap-3">
              <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setShowConfetti(false); iniciarJuego(grado); }}
                className="w-full py-4 rounded-2xl font-['Press_Start_2P'] text-sm text-white"
                style={{ background: "linear-gradient(135deg,#00ff88,#4169E1)", boxShadow: "0 4px 24px rgba(0,255,136,0.35)" }}>
                🐸 Jugar de nuevo
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


