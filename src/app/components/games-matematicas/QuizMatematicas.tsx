// QuizMatematicas.tsx — Matemáticas 4to-6to
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Play, Pause, X, Calculator,
  Volume2, VolumeX, RotateCcw, Trophy, Star,
  CheckCircle2, XCircle, LogOut,
  User, Users, AlertTriangle, Settings
} from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "../../AuthContext";
import { useMonedas } from "../../../hooks/useMonedas";
import { useSocket } from "../../../lib/useSocket";
import { GameLobby, GameError, GameRankingFinal, MultiPanel, RankingPanel } from "../GameShared";
import { MultiRanking } from "../MultiLobby";
import { MiniJugadores } from "../MultiLobby";
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
  emoji: string;
}

const PREGUNTAS: Record<number, Pregunta[]> = {
  4: [
    { pregunta: "¿Cuánto es 48 ÷ 6?", opciones: ["6", "7", "8", "9"], correcta: 2, explicacion: "48 ÷ 6 = 8, porque 6 × 8 = 48.", emoji: "➗" },
    { pregunta: "¿Cuál es la fracción equivalente a 1/2?", opciones: ["2/3", "3/6", "4/9", "2/5"], correcta: 1, explicacion: "3/6 = 1/2 porque al simplificar (dividir numerador y denominador por 3) obtenemos 1/2.", emoji: "🍕" },
    { pregunta: "¿Cuántos lados tiene un hexágono?", opciones: ["5", "6", "7", "8"], correcta: 1, explicacion: "El hexágono tiene 6 lados. 'Hex' significa seis en griego.", emoji: "⬡" },
    { pregunta: "¿Qué es el perímetro de una figura?", opciones: ["El área interior", "La suma de todos sus lados", "La altura", "El volumen"], correcta: 1, explicacion: "El perímetro es la suma de la longitud de todos los lados de una figura.", emoji: "📐" },
    { pregunta: "¿Cuánto es 0.1 + 0.3?", opciones: ["0.3", "0.4", "0.13", "1.3"], correcta: 1, explicacion: "0.1 + 0.3 = 0.4 (una décima más tres décimas = cuatro décimas).", emoji: "🔢" },
    { pregunta: "En una tabla de conteo, ¿qué representa cada marca?", opciones: ["Un error", "Una unidad contada", "Un porcentaje", "Un grado"], correcta: 1, explicacion: "Cada marca en una tabla de conteo representa una unidad o evento registrado.", emoji: "📊" },
    { pregunta: "¿Cuál es el área de un cuadrado de 4 cm de lado?", opciones: ["8 cm²", "12 cm²", "16 cm²", "20 cm²"], correcta: 2, explicacion: "Área = lado × lado = 4 × 4 = 16 cm².", emoji: "⬛" },
    { pregunta: "¿Qué tipo de ángulo mide exactamente 90°?", opciones: ["Agudo", "Recto", "Obtuso", "Llano"], correcta: 1, explicacion: "El ángulo recto mide exactamente 90°. Es el ángulo de una esquina perfecta.", emoji: "📏" },
  ],
  5: [
    { pregunta: "¿Cuál es la raíz cuadrada de 64?", opciones: ["6", "7", "8", "9"], correcta: 2, explicacion: "√64 = 8, porque 8 × 8 = 64.", emoji: "√" },
    { pregunta: "¿Qué son números primos?", opciones: ["Números pares", "Números divisibles solo entre 1 y sí mismos", "Múltiplos de 5", "Números mayores de 100"], correcta: 1, explicacion: "Los números primos solo se dividen exactamente entre 1 y sí mismos. Ejemplo: 2, 3, 5, 7, 11.", emoji: "🔢" },
    { pregunta: "¿Cuánto es 3/4 de 80?", opciones: ["40", "60", "75", "45"], correcta: 1, explicacion: "3/4 de 80 = (80 ÷ 4) × 3 = 20 × 3 = 60.", emoji: "🍕" },
    { pregunta: "¿Qué es la moda en estadística?", opciones: ["El valor central", "El valor que más se repite", "El promedio", "El valor mayor"], correcta: 1, explicacion: "La moda es el valor que aparece con mayor frecuencia en un conjunto de datos.", emoji: "📊" },
    { pregunta: "¿Cuántos grados tiene un ángulo obtuso?", opciones: ["Menos de 90°", "Exactamente 90°", "Entre 90° y 180°", "Más de 180°"], correcta: 2, explicacion: "Un ángulo obtuso mide más de 90° pero menos de 180°.", emoji: "📐" },
    { pregunta: "¿Cuál es el MCM de 4 y 6?", opciones: ["2", "8", "12", "24"], correcta: 2, explicacion: "El Mínimo Común Múltiplo de 4 y 6 es 12, porque es el menor número divisible entre ambos.", emoji: "🔢" },
    { pregunta: "¿Cómo se convierte 0.75 a fracción?", opciones: ["1/4", "3/4", "7/5", "5/7"], correcta: 1, explicacion: "0.75 = 75/100 = 3/4 (simplificando dividiendo por 25).", emoji: "↔️" },
    { pregunta: "¿Qué es la media aritmética?", opciones: ["El valor del medio", "La suma de datos dividida entre la cantidad", "El dato que más se repite", "El dato mayor menos el menor"], correcta: 1, explicacion: "La media aritmética (promedio) es la suma de todos los datos dividida entre la cantidad de datos.", emoji: "📈" },
  ],
  6: [
    { pregunta: "¿Cuánto es 2.5 × 3.4?", opciones: ["6.5", "7.5", "8.5", "8.0"], correcta: 2, explicacion: "2.5 × 3.4 = 8.5 (2 × 3.4 = 6.8, más 0.5 × 3.4 = 1.7, total = 8.5).", emoji: "✖️" },
    { pregunta: "¿Cuál es el teorema de Pitágoras?", opciones: ["a + b = c", "a² + b² = c²", "a × b = c²", "a² - b² = c"], correcta: 1, explicacion: "En un triángulo rectángulo: a² + b² = c², donde c es la hipotenusa (el lado más largo).", emoji: "📐" },
    { pregunta: "¿Cómo se calcula el porcentaje de un número?", opciones: ["Multiplicar por 100", "Dividir entre 100 y multiplicar", "Sumar 100", "Restar el porcentaje"], correcta: 1, explicacion: "Para calcular el X% de N: (X ÷ 100) × N. Ejemplo: 20% de 50 = (20 ÷ 100) × 50 = 10.", emoji: "%" },
    { pregunta: "¿Cuál es el volumen de un cubo de 3 cm?", opciones: ["9 cm³", "18 cm³", "27 cm³", "36 cm³"], correcta: 2, explicacion: "Volumen del cubo = lado³ = 3³ = 3 × 3 × 3 = 27 cm³.", emoji: "🧊" },
    { pregunta: "¿Qué es la probabilidad de sacar cara en una moneda?", opciones: ["1/4", "1/3", "1/2", "2/3"], correcta: 2, explicacion: "Una moneda tiene 2 caras (cara y sello), así que la probabilidad de sacar cara es 1/2 = 50%.", emoji: "🪙" },
    { pregunta: "¿Cuál es la longitud de la circunferencia con radio 7? (π ≈ 3.14)", opciones: ["21.98 cm", "43.96 cm", "49 cm", "28 cm"], correcta: 1, explicacion: "Longitud = 2πr = 2 × 3.14 × 7 = 43.96 cm.", emoji: "⭕" },
    { pregunta: "¿Qué es una razón?", opciones: ["Un número primo", "La comparación entre dos cantidades", "Una suma de fracciones", "El área de un polígono"], correcta: 1, explicacion: "Una razón es la comparación entre dos cantidades, expresada como a:b o a/b.", emoji: "⚖️" },
    { pregunta: "¿Qué son figuras semejantes?", opciones: ["Figuras iguales en tamaño", "Figuras con la misma forma pero diferente tamaño", "Figuras sin ángulos", "Figuras con el mismo perímetro"], correcta: 1, explicacion: "Las figuras semejantes tienen la misma forma y sus lados son proporcionales, pero pueden tener diferente tamaño.", emoji: "🔍" },
  ],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ─── MÚSICA: MATEMÁTICAS — Rítmico, preciso, tecnológico ─── */
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
  setVolume(v: number) { if (this.masterGain && this.ac) this.masterGain.gain.linearRampToValueAtTime((v / 100) * 0.16, this.ac.currentTime + 0.1); }
  private loop() {
    // Matemáticas: patrón rítmico y preciso — escala pentatónica mayor
    const seqs = [
      [261.6, 293.7, 329.6, 392.0, 440.0],  // Do Re Mi Sol La
      [392.0, 440.0, 493.9, 392.0, 329.6],  // Sol La Si Sol Mi
      [261.6, 329.6, 261.6, 392.0, 261.6],  // patrón rítmico
      [440.0, 392.0, 329.6, 293.7, 261.6],  // descendente
    ];
    let ci = 0;
    const play = () => {
      if (!this.running || !this.ac || !this.masterGain) return;
      seqs[ci % seqs.length].forEach((freq, vi) => {
        if (!this.ac || !this.masterGain) return;
        const osc = this.ac.createOscillator();
        const env = this.ac.createGain();
        osc.type = "sawtooth";
        osc.frequency.value = freq;
        const filt = this.ac.createBiquadFilter();
        filt.type = "lowpass"; filt.frequency.value = 1200; filt.Q.value = 1;
        osc.connect(filt); filt.connect(env); env.connect(this.masterGain);
        const t = this.ac.currentTime + vi * 0.16, dur = 1.8;
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.35, t + 0.03);
        env.gain.setValueAtTime(0.25, t + dur - 0.2);
        env.gain.linearRampToValueAtTime(0, t + dur);
        osc.start(t); osc.stop(t + dur + 0.05);
      });
      ci++; setTimeout(play, 3200);
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
        [261.6, 329.6, 392.0, 523.3, 659.3].forEach((freq, i) => {
          const osc = ac.createOscillator(), g = ac.createGain();
          osc.type = "square"; osc.frequency.value = freq;
          osc.connect(g); g.connect(ac.destination);
          const t = ac.currentTime + i * 0.12;
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.25, t + 0.04); g.gain.linearRampToValueAtTime(0, t + 0.35);
          osc.start(t); osc.stop(t + 0.4);
        });
        setTimeout(() => ac.close(), 1500);
      } catch (_) {}
    }, 80);
  }, []);
  return { start, stop, toggleMute, setVolume, playVictory, muted, vol };
}

async function guardarResultado(data: { jugador: string; grado: number; puntos: number; correctas: number; incorrectas: number; tiempo_seg: number; modo: string }) {
  try { await fetch(`${API}/api/resultados_juegos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, juego: "quiz_matematicas", materia: "matematicas" }) }); } catch (_) {}
}

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id: i, color: ["#4169E1", "#00e5ff", "#ffd700", "#00ff88", "#a78bfa", "#ff9800"][i % 6],
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

export function QuizMatematicas() {
  const { user } = useAuth();
  const { agregarMonedas, gastarMonedas } = useMonedas();
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

  const pauseRef = useRef(false);
  useEffect(() => { if (user?.nombre) setPlayerName(user.nombre); }, [user]);
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
  const estaEnResultadosMulti = modo === "multi" && multiState.estado === "resultados";
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
    const lista = shuffle(PREGUNTAS[g]).slice(0, 8);
    setPreguntas(lista);
    setIdx(0); setSeleccionada(null); setConfirmada(false);
    setScore(0); setCorrectas(0); setIncorrectas(0);
    setTiempo(0); setTimerOn(true);
    setPaused(false); pauseRef.current = false;
    setShowConfetti(false); setMostrarExplicacion(false);
    setScreen("juego"); music.start();
  }, [music]);

  const confirmarRespuesta = () => {
    if (seleccionada === null || confirmada) return;
    setConfirmada(true); setMostrarExplicacion(true);
    const opciones: ("A"|"B"|"C"|"D")[] = ["A","B","C","D"];
    if (modo === "multi" && multiState.sala) {
      const esCorrecta = seleccionada === preguntas[idx].correcta;
    socket.responder(multiState.sala.codigo, esCorrecta ? pregActual.respuesta_correcta ?? opciones[seleccionada] : "X", esCorrecta ? 99 : 0);
    }
    if (seleccionada === preguntas[idx].correcta) {
      const pts = Math.max(50, 150 - Math.floor(tiempo / preguntas.length) * 5);
      setScore(s => s + pts); setCorrectas(c => c + 1);
    } else { setIncorrectas(i => i + 1); }
  };

  const siguiente = () => {
    setMostrarExplicacion(false);
    if (idx + 1 >= preguntas.length) {
      setTimerOn(false);
      if (correctas + (seleccionada === preguntas[idx].correcta ? 1 : 0) >= Math.ceil(preguntas.length * 0.7)) {
        music.playVictory(); setShowConfetti(true);
      } else { music.stop(); }
      const _esCorr = seleccionada === preguntas[idx].correcta;
      const _totalCorr = correctas + (_esCorr ? 1 : 0);
      const _totalInc = incorrectas + (_esCorr ? 0 : 1);
      const _ptsExtra = _esCorr ? Math.max(50, 120 - tiempo * 2) : 0;
      const _totalPts = score + _ptsExtra;
      guardarResultado({ jugador: playerName || "Anónimo", grado, puntos: _totalPts, correctas: _totalCorr, incorrectas: _totalInc, tiempo_seg: tiempo, modo, user_id: user?.id });
      agregarMonedas(_totalPts);
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
  const progreso = preguntas.length > 0 ? ((idx + (confirmada ? 1 : 0)) / preguntas.length) * 100 : 0;

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
                  style={{ background: "linear-gradient(135deg,#ff4757,#c0392b)", boxShadow: "0 4px 20px rgba(255,71,87,0.35)" }}>Sí, salir</motion.button>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={cancelExit}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm text-gray-400"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)" }}>Continuar jugando</motion.button>
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
                { label: "Reanudar juego", icon: <Play size={14} />, action: () => { togglePause(); setSettOpen(false); } },
                { label: music.muted ? "Activar música" : "Silenciar música", icon: music.muted ? <Volume2 size={14} /> : <VolumeX size={14} />, action: music.toggleMute },
                { label: "Salir del juego", icon: <LogOut size={14} />, action: requestExit, danger: true },
              ].map((a, i) => (
                <button key={i} onClick={a.action}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${(a as any).danger ? "text-[#ff4757] border-[#ff4757]/20 bg-[#ff4757]/5 hover:bg-[#ff4757]/10" : "text-gray-300 border-white/7 bg-white/3 hover:text-white"}`}>
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
            style={{ background: "radial-gradient(ellipse 100% 80% at 50% 0%, #060a1a 0%, #07091a 55%, #000 100%)" }}>
            {[...Array(7)].map((_, i) => (
              <motion.div key={i} className="absolute rounded-full pointer-events-none"
                style={{ width: 2 + (i % 3) * 2, height: 2 + (i % 3) * 2, left: `${8 + i * 13}%`, top: `${15 + (i % 4) * 17}%`, background: ["#4169E1", "#00e5ff", "#ffd700", "#00ff88", "#a78bfa", "#ff9800", "#4169E1"][i] }}
                animate={{ y: [0, -28, 0], opacity: [0.2, 0.7, 0.2] }} transition={{ duration: 2.8 + i * 0.4, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }} />
            ))}
            <motion.div animate={{ opacity: [0.3, 0.65, 0.3], scale: [1, 1.08, 1] }} transition={{ duration: 4, repeat: Infinity }}
              className="absolute pointer-events-none"
              style={{ width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(65,105,225,0.15) 0%,rgba(0,229,255,0.07) 40%,transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-52%)" }} />
            <AnimatePresence mode="wait">
              {!splashDone ? (
                <motion.div key="in" initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col items-center gap-0">
                  <motion.div className="relative mb-2" animate={{ y: [0, -7, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                    <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 2.5, repeat: Infinity }}
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{ background: "radial-gradient(circle,rgba(65,105,225,0.3) 0%,rgba(0,229,255,0.12) 50%,transparent 70%)", transform: "scale(1.8)" }} />
                    <img src={logoImg} alt="Saberix" className="w-36 h-36 md:w-44 md:h-44 object-contain relative z-10"
                      style={{ filter: "drop-shadow(0 0 28px rgba(65,105,225,0.7)) drop-shadow(0 0 55px rgba(0,229,255,0.3))" }} />
                  </motion.div>
                  <div className="flex items-center gap-0.5 mt-1 mb-2">
                    {["S", "A", "B", "E", "R", "I", "X"].map((l, i) => {
                      const cols = ["#ff4757", "#ff9800", "#ffd700", "#00ff88", "#00e5ff", "#a78bfa", "#ff4757"];
                      return (
                        <motion.span key={i} initial={{ opacity: 0, y: -18, scale: 0.6 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.5 + i * 0.07, type: "spring", stiffness: 280, damping: 17 }}
                          className="font-['Press_Start_2P'] text-3xl md:text-4xl font-black leading-none" style={{ color: cols[i], textShadow: `0 0 20px ${cols[i]}bb` }}>{l}</motion.span>
                      );
                    })}
                  </div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }} className="flex items-center gap-2 mb-8">
                    <div className="h-px w-10 rounded-full" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.2))" }} />
                    <p className="text-xs md:text-sm font-bold tracking-[0.25em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>Aprende Jugando</p>
                    <div className="h-px w-10 rounded-full" style={{ background: "linear-gradient(90deg,rgba(255,255,255,0.2),transparent)" }} />
                  </motion.div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="w-48 md:w-64">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.15)" }}>Cargando</span>
                      <span className="text-[10px] font-bold" style={{ color: "rgba(65,105,225,0.7)" }}>{Math.round(splashPct)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full" style={{ width: `${splashPct}%`, background: "linear-gradient(90deg,#ff4757,#ff9800,#ffd700,#00ff88,#00e5ff,#a78bfa)", boxShadow: "0 0 10px rgba(65,105,225,0.5)", transition: "width 0.04s linear" }} />
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div key="out" initial={{ scale: 1, opacity: 1 }} animate={{ scale: 0.2, opacity: 0, y: -90 }} transition={{ duration: 0.65, ease: [0.4, 0, 1, 1] }} className="flex flex-col items-center">
                  <img src={logoImg} alt="" className="w-36 h-36 object-contain" style={{ filter: "drop-shadow(0 0 25px rgba(65,105,225,0.5))" }} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ─── RANKING FINAL MULTI ─── */}
      {estaEnResultadosMulti && (
        <MultiRanking
          ranking={multiState.rankingFinal} nombrePropio={playerName}
          onJugarDeNuevo={() => { socket.salirSala(); setModo("solo"); setScreen("config"); }}
          onSalir={() => { socket.salirSala(); setModo("solo"); setScreen("config"); }}
        />
      )}

            {/* ─── CONFIG ─── */}
      {screen === "config" && !estaEnLobby && !estaEnResultadosMulti && !hayError && (
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/games/math" className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"><ArrowLeft size={22} /></Link>
            <div>
              <h1 className="font-['Press_Start_2P'] text-xl" style={{ color: COLOR }}>QUIZ · MATEMÁTICAS</h1>
              <p className="text-gray-400 text-sm font-bold mt-1">Números, geometría y estadística</p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border-2 bg-[#0f1425] p-6 mb-5" style={{ borderColor: COLOR_BORDER, boxShadow: `0 4px 28px rgba(65,105,225,0.1)` }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20" style={{ background: `radial-gradient(circle,${COLOR},transparent)`, transform: "translate(30%,-30%)" }} />
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: COLOR_LIGHT, border: `1.5px solid ${COLOR_BORDER}` }}><Calculator size={26} style={{ color: COLOR }} /></div>
              <div>
                <p className="font-['Press_Start_2P'] text-xs mb-2" style={{ color: COLOR }}>Matemáticas</p>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">Responde preguntas sobre numeración, geometría y estadística. ¡Más rápido, más puntos!</p>
                <div className="flex gap-2 flex-wrap">
                  {[{ label: "Numeración" }, { label: "Geometría" }, { label: "Estadística" }].map(t => (
                    <span key={t.label} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: COLOR_LIGHT, color: COLOR, border: `1px solid ${COLOR_BORDER}` }}>{t.label}</span>
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
                  <MultiPanel nombreJugador={playerName} onNombreChange={setPlayerName} juego="quiz_matematicas" grado={grado}
                    jugadoresConectados={multiState.sala?.jugadores ?? []} nombrePropio={playerName}
                    onCrear={(nombre, jugador) => { setPlayerName(jugador); socket.crearSala({ nombre, nombreJugador: jugador, materia: "matematicas", grado, tiempoPorPregunta: 30, cantPreguntas: 8 }); }}
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
            style={{ background: modo === "solo" ? `linear-gradient(135deg,${COLOR},#00e5ff)` : "linear-gradient(135deg,#a78bfa,#7c3aed)", boxShadow: modo === "solo" ? `0 4px 24px rgba(65,105,225,0.4)` : "0 4px 24px rgba(167,139,250,0.35)" }}>
            {modo === "solo" ? "Comenzar" : "Ir al lobby"}
          </motion.button>
        </motion.div>
      )}

      {/* ─── JUEGO ─── */}
      {screen === "juego" && preguntaActual && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full min-h-screen flex flex-col"
          style={{ background: "linear-gradient(135deg,#06091a 0%,#060a1e 50%,#06091a 100%)" }}>
          <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/5"
            style={{ background: "rgba(6,9,26,0.9)", backdropFilter: "blur(16px)" }}>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: COLOR_LIGHT, border: `1.5px solid ${COLOR_BORDER}` }}>
                <Calculator size={14} style={{ color: COLOR }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white truncate leading-tight">{playerName}</p>
                <p className="text-[10px] text-gray-500 font-bold leading-tight">Quiz Matemáticas · {grado}to</p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-center">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Pregunta</p>
                <p className="font-['Press_Start_2P'] text-sm text-white leading-tight">{idx + 1}<span className="text-gray-600 text-xs">/{preguntas.length}</span></p>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="text-center">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Puntos</p>
                <p className="font-['Press_Start_2P'] text-sm text-[#ffd700] leading-tight">{score}</p>
              </div>
            </div>
            <div className="flex gap-1.5 flex-shrink-0 ml-2">
              {modo === "multi" ? (
                <>
                  <button onClick={music.toggleMute} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{ background: "rgba(0,229,255,0.08)", borderColor: "rgba(0,229,255,0.22)", color: "#00e5ff" }}>{music.muted ? <Volume2 size={14} /> : <VolumeX size={14} />}</button>
                  <button onClick={() => setShowRanking(r => !r)} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{ background: showRanking ? "rgba(255,215,0,0.2)" : "rgba(255,215,0,0.08)", borderColor: "rgba(255,215,0,0.4)", color: "#ffd700" }}><Trophy size={14} /></button>
                  <button onClick={() => { socket.salirSala(); music.stop(); setModo("solo"); setScreen("config"); }} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{ background: "rgba(255,71,87,0.08)", borderColor: "rgba(255,71,87,0.3)", color: "#ff4757" }}><LogOut size={14} /></button>
                </>
              ) : (
                <>
                  <button onClick={togglePause} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{ background: "rgba(255,215,0,0.08)", borderColor: "rgba(255,215,0,0.22)", color: "#ffd700" }}>{paused ? <Play size={14} /> : <Pause size={14} />}</button>
                  <button onClick={openSettings} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{ background: "rgba(0,229,255,0.08)", borderColor: "rgba(0,229,255,0.22)", color: "#00e5ff" }}><Settings size={14} /></button>
                </>
              )}
            </div>
          </div>
          <div className="relative z-10 w-full h-1.5" style={{ background: "rgba(255,255,255,0.04)" }}>
            <motion.div className="h-full" animate={{ width: `${progreso}%` }} transition={{ duration: 0.5 }}
              style={{ background: `linear-gradient(90deg,${COLOR},#00e5ff)`, boxShadow: `0 0 10px rgba(65,105,225,0.6)` }} />
          </div>
          <AnimatePresence>{showRanking && modo === "multi" && <RankingPanel jugadores={multiState.sala?.jugadores ?? []} nombrePropio={playerName} onClose={() => setShowRanking(false)} />}</AnimatePresence>
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-2xl mx-auto w-full">
            <AnimatePresence>
              {paused && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40 flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
                  <div className="text-center">
                    <p className="font-['Press_Start_2P'] text-2xl text-white mb-4">PAUSA</p>
                    <button onClick={togglePause} className="px-6 py-3 rounded-xl font-bold text-white" style={{ background: `linear-gradient(135deg,${COLOR},#00e5ff)` }}>Continuar</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div key={idx} initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300 }} className="text-6xl mb-4">{preguntaActual.emoji}</motion.div>
            <motion.div key={`q-${idx}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="w-full rounded-2xl p-5 mb-5 text-center"
              style={{ background: "rgba(65,105,225,0.06)", border: `2px solid ${COLOR_BORDER}` }}>
              <p className="text-white font-bold text-base md:text-lg leading-relaxed font-mono">{preguntaActual.pregunta}</p>
            </motion.div>
            <div className="grid grid-cols-2 gap-3 w-full mb-4">
              {preguntaActual.opciones.map((op, i) => {
                const esCorrecto = i === preguntaActual.correcta, esSeleccionada = i === seleccionada;
                let bg = "rgba(255,255,255,0.04)", border = "rgba(255,255,255,0.1)", textColor = "white";
                if (confirmada) {
                  if (esCorrecto) { bg = "rgba(0,255,136,0.12)"; border = "#00ff88"; textColor = "#00ff88"; }
                  else if (esSeleccionada) { bg = "rgba(255,71,87,0.12)"; border = "#ff4757"; textColor = "#ff4757"; }
                  else { bg = "rgba(255,255,255,0.02)"; border = "rgba(255,255,255,0.06)"; textColor = "#4b5563"; }
                } else if (esSeleccionada) { bg = COLOR_LIGHT; border = COLOR; textColor = COLOR; }
                return (
                  <motion.button key={i} whileHover={!confirmada ? { scale: 1.02, y: -2 } : {}} whileTap={!confirmada ? { scale: 0.98 } : {}}
                    onClick={() => !confirmada && setSeleccionada(i)} disabled={confirmada}
                    className="w-full p-4 rounded-xl font-bold text-sm transition-all border-2 flex items-center justify-center gap-2 font-mono"
                    style={{ background: bg, borderColor: border, color: textColor }}>
                    <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={{ background: esSeleccionada || (confirmada && esCorrecto) ? border : "rgba(255,255,255,0.08)", color: esSeleccionada || (confirmada && esCorrecto) ? "white" : "#6b7280" }}>
                      {["A", "B", "C", "D"][i]}
                    </span>
                    {op}
                    {confirmada && esCorrecto && <CheckCircle2 size={14} className="ml-auto text-[#00ff88]" />}
                    {confirmada && esSeleccionada && !esCorrecto && <XCircle size={14} className="ml-auto text-[#ff4757]" />}
                  </motion.button>
                );
              })}
            </div>
            <AnimatePresence>
              {mostrarExplicacion && (
                <motion.div initial={{ opacity: 0, y: 10, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="w-full rounded-xl p-4 mb-4 overflow-hidden"
                  style={{ background: seleccionada === preguntaActual.correcta ? "rgba(0,255,136,0.08)" : "rgba(255,71,87,0.08)", border: `1px solid ${seleccionada === preguntaActual.correcta ? "rgba(0,255,136,0.3)" : "rgba(255,71,87,0.3)"}` }}>
                  <p className="text-xs font-bold mb-1" style={{ color: seleccionada === preguntaActual.correcta ? "#00ff88" : "#ff4757" }}>
                    {seleccionada === preguntaActual.correcta ? "✅ ¡Correcto!" : "❌ Incorrecto"}
                  </p>
                  <p className="text-gray-300 text-xs leading-relaxed">💡 {preguntaActual.explicacion}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="w-full flex gap-3">
              {!confirmada ? (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={confirmarRespuesta} disabled={seleccionada === null}
                  className="flex-1 py-4 rounded-2xl font-['Press_Start_2P'] text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: `linear-gradient(135deg,${COLOR},#00e5ff)`, boxShadow: `0 4px 20px rgba(65,105,225,0.4)` }}>
                  Confirmar
                </motion.button>
              ) : (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={siguiente}
                  className="flex-1 py-4 rounded-2xl font-['Press_Start_2P'] text-sm text-white"
                  style={{ background: idx + 1 >= preguntas.length ? "linear-gradient(135deg,#ffd700,#ff9800)" : `linear-gradient(135deg,${COLOR},#00e5ff)`, boxShadow: "0 4px 20px rgba(65,105,225,0.4)" }}>
                  {idx + 1 >= preguntas.length ? "Ver resultado" : "Siguiente →"}
                </motion.button>
              )}
            </div>
          </div>
          <div className="relative z-10 flex items-center justify-center gap-6 px-6 py-3 border-t border-white/5" style={{ background: "rgba(6,9,26,0.85)", backdropFilter: "blur(16px)" }}>
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
          style={{ background: "linear-gradient(135deg,#06091a 0%,#060a1e 50%,#06091a 100%)" }}>
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 12, repeat: Infinity }}
              className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-3xl opacity-40"
              style={{ background: `radial-gradient(circle,rgba(65,105,225,0.12),transparent)` }} />
          </div>
          <div className="relative z-10 w-full max-w-lg">
            <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", delay: 0.1, stiffness: 200 }} className="flex justify-center mb-5">
              {correctas >= Math.ceil(preguntas.length * 0.7)
                ? <motion.div animate={{ rotate: [0, 10, -10, 8, -8, 0] }} transition={{ delay: 0.4, duration: 0.6 }}><Trophy size={64} className="text-[#ffd700]" style={{ filter: "drop-shadow(0 0 20px rgba(255,215,0,0.6))" }} /></motion.div>
                : <Calculator size={64} style={{ color: COLOR, filter: `drop-shadow(0 0 20px rgba(65,105,225,0.5))` }} />}
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="font-['Press_Start_2P'] text-3xl mb-3 text-center"
              style={{ background: correctas >= Math.ceil(preguntas.length * 0.7) ? "linear-gradient(135deg,#ffd700,#ff9800)" : `linear-gradient(135deg,${COLOR},#00e5ff)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {correctas >= Math.ceil(preguntas.length * 0.7) ? "¡Excelente!" : "¡Sigue Practicando!"}
            </motion.h2>
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
                  <span className="text-xs font-bold" style={{ color: COLOR }}>{preguntas.length > 0 ? Math.round((correctas / preguntas.length) * 100) : 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${preguntas.length > 0 ? (correctas / preguntas.length) * 100 : 0}%` }} transition={{ delay: 0.5, duration: 1 }}
                    className="h-full rounded-full" style={{ background: `linear-gradient(90deg,${COLOR},#00e5ff)` }} />
                </div>
              </div>
            </motion.div>
            <div className="flex flex-col gap-3">
              <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setShowConfetti(false); iniciarJuego(grado); }}
                className="w-full py-4 rounded-2xl font-['Press_Start_2P'] text-sm text-white"
                style={{ background: `linear-gradient(135deg,${COLOR},#00e5ff)`, boxShadow: `0 4px 24px rgba(65,105,225,0.4)` }}>
                <RotateCcw size={16} className="inline mr-2" />Jugar de nuevo
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




