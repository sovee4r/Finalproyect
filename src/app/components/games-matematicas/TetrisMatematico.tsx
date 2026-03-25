// TetrisMatematico.tsx — Matemáticas 4to-6to
// Bloques con números caen desde arriba. En la parte inferior aparece una operación.
// El jugador debe escribir o seleccionar la respuesta antes de que el bloque llegue al fondo.
// Si aciertas: el bloque desaparece y sumas puntos. Si fallas o se acaba el tiempo: el bloque se apila.
// Cuando 3 bloques se apilan = pierdes una vida. 3 vidas totales.
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Play, Pause, X, Calculator,
  Volume2, VolumeX, RotateCcw, Trophy, Star,
  CheckCircle2, XCircle, LogOut, Heart,
  User, Users, AlertTriangle, Settings, Zap
} from "lucide-react";
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

interface Operacion {
  pregunta: string;
  respuesta: number;
  opciones: number[];   // 4 opciones, una es la correcta
  explicacion: string;
  color: string;        // color del bloque
}

const BLOQUES_COLORS = ["#4169E1", "#00e5ff", "#00ff88", "#ffd700", "#a78bfa", "#ff9800"];

const OPERACIONES: Record<number, Operacion[]> = {
  4: [
    { pregunta: "6 × 7 = ?",   respuesta: 42, opciones: [36, 42, 48, 54], explicacion: "6 × 7 = 42", color: "#4169E1" },
    { pregunta: "63 ÷ 9 = ?",  respuesta: 7,  opciones: [6, 7, 8, 9],     explicacion: "63 ÷ 9 = 7 porque 9 × 7 = 63", color: "#00e5ff" },
    { pregunta: "8 × 8 = ?",   respuesta: 64, opciones: [56, 60, 64, 72], explicacion: "8 × 8 = 64", color: "#00ff88" },
    { pregunta: "45 ÷ 5 = ?",  respuesta: 9,  opciones: [7, 8, 9, 10],    explicacion: "45 ÷ 5 = 9", color: "#ffd700" },
    { pregunta: "7 × 9 = ?",   respuesta: 63, opciones: [54, 56, 63, 72], explicacion: "7 × 9 = 63", color: "#a78bfa" },
    { pregunta: "56 ÷ 7 = ?",  respuesta: 8,  opciones: [6, 7, 8, 9],     explicacion: "56 ÷ 7 = 8", color: "#ff9800" },
    { pregunta: "9 × 9 = ?",   respuesta: 81, opciones: [72, 81, 90, 63], explicacion: "9 × 9 = 81", color: "#4169E1" },
    { pregunta: "72 ÷ 8 = ?",  respuesta: 9,  opciones: [7, 8, 9, 10],    explicacion: "72 ÷ 8 = 9", color: "#00e5ff" },
    { pregunta: "1/2 de 20 = ?",respuesta: 10, opciones: [5, 8, 10, 12],  explicacion: "La mitad de 20 es 10", color: "#00ff88" },
    { pregunta: "25 + 37 = ?",  respuesta: 62, opciones: [52, 62, 72, 82], explicacion: "25 + 37 = 62", color: "#ffd700" },
    { pregunta: "100 - 43 = ?", respuesta: 57, opciones: [47, 57, 67, 77], explicacion: "100 - 43 = 57", color: "#a78bfa" },
    { pregunta: "4 × 12 = ?",   respuesta: 48, opciones: [40, 44, 48, 52], explicacion: "4 × 12 = 48", color: "#ff9800" },
  ],
  5: [
    { pregunta: "3² + 4² = ?",    respuesta: 25,  opciones: [20, 25, 30, 49],   explicacion: "9 + 16 = 25 (terna pitagórica)", color: "#4169E1" },
    { pregunta: "√144 = ?",       respuesta: 12,  opciones: [10, 11, 12, 14],   explicacion: "√144 = 12 porque 12 × 12 = 144", color: "#00e5ff" },
    { pregunta: "25% de 80 = ?",  respuesta: 20,  opciones: [15, 20, 25, 40],   explicacion: "25% = ¼. Un cuarto de 80 = 20", color: "#00ff88" },
    { pregunta: "MCM(4,6) = ?",   respuesta: 12,  opciones: [2, 6, 12, 24],     explicacion: "MCM(4,6) = 12", color: "#ffd700" },
    { pregunta: "2⁵ = ?",         respuesta: 32,  opciones: [16, 25, 32, 64],   explicacion: "2⁵ = 2×2×2×2×2 = 32", color: "#a78bfa" },
    { pregunta: "3/4 de 48 = ?",  respuesta: 36,  opciones: [24, 36, 40, 48],   explicacion: "¾ de 48 = (48÷4)×3 = 36", color: "#ff9800" },
    { pregunta: "50% de 90 = ?",  respuesta: 45,  opciones: [40, 45, 50, 55],   explicacion: "La mitad de 90 = 45", color: "#4169E1" },
    { pregunta: "MCD(18,12) = ?", respuesta: 6,   opciones: [2, 3, 6, 9],       explicacion: "MCD(18,12) = 6", color: "#00e5ff" },
    { pregunta: "√64 = ?",        respuesta: 8,   opciones: [6, 7, 8, 9],       explicacion: "√64 = 8 porque 8 × 8 = 64", color: "#00ff88" },
    { pregunta: "40% de 50 = ?",  respuesta: 20,  opciones: [15, 20, 25, 30],   explicacion: "40% de 50 = 0.4 × 50 = 20", color: "#ffd700" },
    { pregunta: "3³ = ?",         respuesta: 27,  opciones: [9, 18, 27, 81],    explicacion: "3³ = 3×3×3 = 27", color: "#a78bfa" },
    { pregunta: "Media(2,4,6,8)=?",respuesta:5,   opciones: [4, 5, 6, 7],       explicacion: "(2+4+6+8)÷4 = 20÷4 = 5", color: "#ff9800" },
  ],
  6: [
    { pregunta: "π×r² con r=3 ≈?",    respuesta: 28,  opciones: [18, 28, 38, 48],  explicacion: "π×9 ≈ 3.14×9 ≈ 28.26 ≈ 28", color: "#4169E1" },
    { pregunta: "a²+b²=c² con a=5,b=12:c=?",respuesta:13,opciones:[10,11,13,17], explicacion: "5²+12²=25+144=169=13²", color: "#00e5ff" },
    { pregunta: "30% de 150 = ?",      respuesta: 45,  opciones: [30, 40, 45, 50],  explicacion: "30% × 150 = 0.3 × 150 = 45", color: "#00ff88" },
    { pregunta: "V = lado³, lado=4: V=?",respuesta:64, opciones: [16, 48, 64, 96],  explicacion: "4³ = 4×4×4 = 64 cm³", color: "#ffd700" },
    { pregunta: "15² = ?",             respuesta: 225, opciones: [125, 175, 225, 250],explicacion:"15×15 = 225", color: "#a78bfa" },
    { pregunta: "2πr con r=5 ≈ ?",     respuesta: 31,  opciones: [10, 20, 31, 50],  explicacion: "2×3.14×5 = 31.4 ≈ 31", color: "#ff9800" },
    { pregunta: "√225 = ?",            respuesta: 15,  opciones: [12, 13, 15, 17],  explicacion: "√225 = 15 porque 15×15 = 225", color: "#4169E1" },
    { pregunta: "60% de 45 = ?",       respuesta: 27,  opciones: [20, 24, 27, 30],  explicacion: "0.6 × 45 = 27", color: "#00e5ff" },
    { pregunta: "4² + 3² = ?",         respuesta: 25,  opciones: [7, 14, 25, 49],   explicacion: "16 + 9 = 25", color: "#00ff88" },
    { pregunta: "x + 25 = 60: x = ?",  respuesta: 35,  opciones: [25, 30, 35, 40],  explicacion: "x = 60 - 25 = 35", color: "#ffd700" },
    { pregunta: "¾ × 80 = ?",          respuesta: 60,  opciones: [40, 50, 60, 70],  explicacion: "(80÷4)×3 = 20×3 = 60", color: "#a78bfa" },
    { pregunta: "P(par en dado) = ?",  respuesta: 50,  opciones: [17, 33, 50, 67],  explicacion: "3 de 6 caras son pares = 50%", color: "#ff9800" },
  ],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* ─── MÚSICA: Tetris — Clásico retro, 8-bit urgente ─── */
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
    // Tetris: melodía korobeiniki simplificada en 8-bit
    const notas = [
      659.3, 493.9, 523.3, 587.3, 523.3, 493.9,
      440.0, 440.0, 523.3, 659.3, 587.3, 523.3,
      493.9, 523.3, 587.3, 659.3, 523.3, 440.0, 440.0,
    ];
    const duraciones = [0.15, 0.08, 0.08, 0.15, 0.08, 0.08, 0.15, 0.08, 0.08, 0.15, 0.08, 0.08, 0.22, 0.08, 0.15, 0.15, 0.15, 0.15, 0.3];
    let ci = 0;
    let totalTime = 0;
    const playAll = () => {
      if (!this.running || !this.ac || !this.masterGain) return;
      totalTime = 0;
      notas.forEach((freq, i) => {
        const dur = duraciones[i];
        const t = this.ac!.currentTime + totalTime;
        const osc = this.ac!.createOscillator(), env = this.ac!.createGain();
        osc.type = "square"; osc.frequency.value = freq;
        osc.connect(env); env.connect(this.masterGain!);
        env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(0.4, t + 0.01);
        env.gain.setValueAtTime(0.3, t + dur * 0.7); env.gain.linearRampToValueAtTime(0, t + dur);
        osc.start(t); osc.stop(t + dur + 0.01);
        totalTime += dur + 0.02;
      });
      setTimeout(() => { if (this.running) playAll(); }, (totalTime + 0.5) * 1000);
    };
    playAll();
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
        [523.3, 659.3, 784.0, 1046.5, 784.0, 1046.5].forEach((freq, i) => {
          const osc = ac.createOscillator(), g = ac.createGain();
          osc.type = "square"; osc.frequency.value = freq;
          osc.connect(g); g.connect(ac.destination);
          const t = ac.currentTime + i * 0.12;
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.2, t + 0.02); g.gain.linearRampToValueAtTime(0, t + 0.3);
          osc.start(t); osc.stop(t + 0.35);
        });
        setTimeout(() => ac.close(), 1500);
      } catch (_) {}
    }, 80);
  }, []);
  return { start, stop, toggleMute, setVolume, playVictory, muted, vol };
}

async function guardarResultado(data: { jugador: string; grado: number; puntos: number; correctas: number; incorrectas: number; tiempo_seg: number; modo: string }) {
  try { await fetch(`${API}/api/resultados_juegos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, juego: "tetris_matematico", materia: "matematicas" }) }); } catch (_) {}
}

function Confetti() {
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i, color: BLOQUES_COLORS[i % 6],
    x: Math.random() * 100, delay: Math.random() * 0.5, size: 8 + Math.random() * 8, rotate: Math.random() * 360,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <motion.div key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: p.rotate }}
          animate={{ y: "110vh", opacity: [1, 1, 0], rotate: p.rotate + 360 }}
          transition={{ duration: 2.2, delay: p.delay, ease: "easeIn" }}
          style={{ position: "absolute", top: 0, width: p.size, height: p.size, borderRadius: 3, background: p.color }} />
      ))}
    </div>
  );
}

const TIEMPO_POR_BLOQUE: Record<number, number> = { 4: 12, 5: 9, 6: 7 }; // segundos por bloque
const TOTAL_BLOQUES = 12;
const MAX_VIDAS = 3;
const BLOQUES_APILADOS_MAX = 3;

export function TetrisMatematico() {
  const music = useMusic();
  const socket = useSocket();

  const [screen, setScreen] = useState<Screen>("splash");
  const [splashPct, setSplashPct] = useState(0);
  const [splashDone, setSplashDone] = useState(false);
  const [modo, setModo] = useState<Modo>("solo");
  const [grado, setGrado] = useState(4);
  const [playerName, setPlayerName] = useState("");

  const [operaciones, setOperaciones] = useState<Operacion[]>([]);
  const [idx, setIdx] = useState(0);
  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const [confirmada, setConfirmada] = useState(false);
  const [bloqueY, setBloqueY] = useState(0);       // 0-100 posición del bloque
  const [apilados, setApilados] = useState(0);      // bloques apilados en la zona de peligro
  const [vidas, setVidas] = useState(MAX_VIDAS);
  const [score, setScore] = useState(0);
  const [correctas, setCorrectas] = useState(0);
  const [incorrectas, setIncorrectas] = useState(0);
  const [tiempo, setTiempo] = useState(0);
  const [tiempoBloque, setTiempoBloque] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  const [paused, setPaused] = useState(false);
  const [settOpen, setSettOpen] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [bloqueExplotando, setBloqueExplotando] = useState(false);

  const pauseRef = useRef(false);
  const playerNameRef = useRef(playerName);
  playerNameRef.current = playerName;
  const idxRef = useRef(idx);
  idxRef.current = idx;
  const apistadosRef = useRef(apilados);
  apistadosRef.current = apilados;
  const vidasRef = useRef(vidas);
  vidasRef.current = vidas;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const correctasRef = useRef(correctas);
  correctasRef.current = correctas;
  const incorrectasRef = useRef(incorrectas);
  incorrectasRef.current = incorrectas;
  const tiempoRef = useRef(tiempo);
  tiempoRef.current = tiempo;

  /* ─── SPLASH ─── */
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

  /* ─── TIMER GLOBAL ─── */
  useEffect(() => {
    if (!timerOn || pauseRef.current) return;
    const iv = setInterval(() => { if (!pauseRef.current) setTiempo(t => t + 1); }, 1000);
    return () => clearInterval(iv);
  }, [timerOn]);

  /* ─── CAÍDA DEL BLOQUE ─── */
  useEffect(() => {
    if (screen !== "juego" || confirmada || paused || !timerOn) return;
    const maxTiempo = TIEMPO_POR_BLOQUE[grado];
    const iv = setInterval(() => {
      if (pauseRef.current) return;
      setTiempoBloque(t => {
        const nuevo = t + 0.1;
        const pct = Math.min(100, (nuevo / maxTiempo) * 100);
        setBloqueY(pct);
        if (nuevo >= maxTiempo) {
          // Tiempo agotado: bloque se apila
          clearInterval(iv);
          manejarTiempoAgotado();
        }
        return nuevo;
      });
    }, 100);
    return () => clearInterval(iv);
  }, [screen, confirmada, paused, timerOn, idx, grado]); // eslint-disable-line

  const manejarTiempoAgotado = () => {
    setIncorrectas(i => i + 1);
    const nuevosApilados = apistadosRef.current + 1;
    setApilados(nuevosApilados);
    setFlash("wrong");
    setTimeout(() => setFlash(null), 500);
    if (nuevosApilados >= BLOQUES_APILADOS_MAX) {
      const nuevasVidas = vidasRef.current - 1;
      setVidas(nuevasVidas);
      setApilados(0);
      if (nuevasVidas <= 0) {
        terminarJuego();
        return;
      }
    }
    avanzarBloque();
  };

  const terminarJuego = () => {
    setTimerOn(false);
    if (correctasRef.current >= Math.ceil(TOTAL_BLOQUES * 0.7)) { music.playVictory(); setShowConfetti(true); }
    else { music.stop(); }
    guardarResultado({ jugador: playerNameRef.current || "Anónimo", grado, puntos: scoreRef.current, correctas: correctasRef.current, incorrectas: incorrectasRef.current, tiempo_seg: tiempoRef.current, modo });
    agregarMonedas(scoreRef.current);
    setScreen("resultados");
  };

  const avanzarBloque = () => {
    setConfirmada(false);
    setSeleccionada(null);
    setBloqueY(0);
    setTiempoBloque(0);
    setBloqueExplotando(false);
    if (idxRef.current + 1 >= TOTAL_BLOQUES) {
      terminarJuego();
    } else {
      setIdx(i => i + 1);
    }
  };

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
    const lista = shuffle(OPERACIONES[g]).slice(0, TOTAL_BLOQUES);
    setOperaciones(lista);
    setIdx(0); setSeleccionada(null); setConfirmada(false);
    setBloqueY(0); setTiempoBloque(0); setApilados(0); setVidas(MAX_VIDAS);
    setScore(0); setCorrectas(0); setIncorrectas(0);
    setTiempo(0); setTimerOn(true);
    setPaused(false); pauseRef.current = false;
    setShowConfetti(false); setBloqueExplotando(false);
    setScreen("juego"); music.start();
  }, [music]);

  const confirmarRespuesta = () => {
    if (seleccionada === null || confirmada) return;
    setConfirmada(true);
    const esCorrecto = seleccionada === operaciones[idx].correcta;
    if (esCorrecto) {
      const tiempoRestante = TIEMPO_POR_BLOQUE[grado] - tiempoBloque;
      const pts = Math.round(100 + tiempoRestante * 15);
      setScore(s => s + pts);
      setCorrectas(c => c + 1);
      setFlash("correct");
      setBloqueExplotando(true);
      setTimeout(() => setFlash(null), 500);
      setTimeout(avanzarBloque, 800);
    } else {
      setIncorrectas(i => i + 1);
      const nuevosApilados = apistadosRef.current + 1;
      setApilados(nuevosApilados);
      setFlash("wrong");
      setTimeout(() => setFlash(null), 500);
      if (nuevosApilados >= BLOQUES_APILADOS_MAX) {
        const nuevasVidas = vidasRef.current - 1;
        setVidas(nuevasVidas);
        setApilados(0);
        if (nuevasVidas <= 0) {
          setTimeout(terminarJuego, 600);
          return;
        }
      }
      setTimeout(avanzarBloque, 900);
    }
  };

  function togglePause() { const n = !paused; setPaused(n); pauseRef.current = n; }
  function openSettings() { if (!paused) { setPaused(true); pauseRef.current = true; } setSettOpen(true); }
  function requestExit() { setSettOpen(false); setExitConfirm(true); }
  function confirmExit() { music.stop(); setPaused(false); pauseRef.current = false; setExitConfirm(false); setTimerOn(false); setScreen("config"); }
  function cancelExit() { setExitConfirm(false); }

  if (estaEnLobby && multiState.sala) return <GameLobby state={multiState} nombrePropio={playerName} onIniciar={() => { socket.iniciarJuego(multiState.sala!.codigo); iniciarJuego(grado); }} onSalir={() => { socket.salirSala(); setModo("solo"); }} colorAccent={COLOR} />;
  if (hayError) return <GameError mensaje={multiState.errorMsg} onReset={socket.resetError} colorAccent={COLOR} />;

  const operacionActual = operaciones[idx];
  const tiempoMax = TIEMPO_POR_BLOQUE[grado];
  const pctTiempo = tiempoMax > 0 ? Math.min(100, (tiempoBloque / tiempoMax) * 100) : 0;
  const urgente = pctTiempo > 70;

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
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,transparent,#ff4757,transparent)" }} />
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

      {/* Flash de feedback */}
      <AnimatePresence>
        {flash && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55] pointer-events-none"
            style={{ background: flash === "correct" ? "#00ff88" : "#ff4757" }} />
        )}
      </AnimatePresence>

      {/* ─── SPLASH ─── */}
      <AnimatePresence>
        {screen === "splash" && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
            style={{ background: "radial-gradient(ellipse 100% 80% at 50% 0%, #030510 0%, #07091a 55%, #000 100%)" }}>
            {/* Bloques cayendo de fondo */}
            {BLOQUES_COLORS.map((c, i) => (
              <motion.div key={i} initial={{ y: -60 }} animate={{ y: "110vh" }}
                transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.8, ease: "linear" }}
                style={{ position: "absolute", left: `${10 + i * 15}%`, width: 40, height: 40, borderRadius: 6, background: c, opacity: 0.15 }} />
            ))}
            <AnimatePresence mode="wait">
              {!splashDone ? (
                <motion.div key="in" initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col items-center gap-0 relative z-10">
                  <motion.div className="relative mb-2" animate={{ y: [0, -7, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                    <img src={logoImg} alt="Saberix" className="w-36 h-36 md:w-44 md:h-44 object-contain relative z-10"
                      style={{ filter: "drop-shadow(0 0 28px rgba(65,105,225,0.7)) drop-shadow(0 0 55px rgba(0,229,255,0.3))" }} />
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
              <h1 className="font-['Press_Start_2P'] text-xl" style={{ color: COLOR }}>TETRIS MATEMÁTICO</h1>
              <p className="text-gray-400 text-sm font-bold mt-1">¡Resuelve antes de que caiga!</p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border-2 bg-[#0f1425] p-6 mb-5" style={{ borderColor: COLOR_BORDER }}>
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl" style={{ background: COLOR_LIGHT, border: `1.5px solid ${COLOR_BORDER}` }}>🧱</div>
              <div>
                <p className="font-['Press_Start_2P'] text-xs mb-2" style={{ color: COLOR }}>Tetris Matemático</p>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">Bloques con operaciones caen desde arriba. ¡Responde antes de que lleguen al fondo! Tienes <strong className="text-[#ffd700]">3 vidas</strong>. Si 3 bloques se apilan, pierdes una.</p>
                <div className="flex gap-2 flex-wrap">
                  {[`${TIEMPO_POR_BLOQUE[grado]}s por bloque`, "3 vidas", `${TOTAL_BLOQUES} bloques`].map(t => (
                    <span key={t} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: COLOR_LIGHT, color: COLOR, border: `1px solid ${COLOR_BORDER}` }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Selector de grado con preview de velocidad */}
          <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-4">
            <p className="text-xs font-extrabold text-[#ffd700] tracking-widest uppercase mb-3 flex items-center gap-2"><Star size={13} /> Grado</p>
            <div className="grid grid-cols-3 gap-2">
              {[4, 5, 6].map(g => (
                <button key={g} onClick={() => setGrado(g)} className="py-3 rounded-xl border-2 font-['Press_Start_2P'] text-sm transition-all flex flex-col items-center gap-1"
                  style={{ borderColor: grado === g ? COLOR : "rgba(255,255,255,0.1)", background: grado === g ? COLOR_LIGHT : "rgba(255,255,255,0.03)", color: grado === g ? COLOR : "#6b7280" }}>
                  <span>{g}to</span>
                  <span className="text-[8px] opacity-70">{TIEMPO_POR_BLOQUE[g]}s</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-4">
            <p className="text-xs font-extrabold text-[#00e5ff] tracking-widest uppercase mb-3 flex items-center gap-2"><User size={13} /> Tu nombre</p>
            <input className="w-full bg-white/4 border-2 border-white/10 rounded-xl px-4 py-3 text-white font-semibold text-base outline-none focus:border-[#00e5ff]/60 transition-all placeholder:text-gray-600"
              placeholder="Escribe tu nombre..." value={playerName} onChange={e => setPlayerName(e.target.value)} maxLength={20} />
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
                  <MultiPanel nombreJugador={playerName} onNombreChange={setPlayerName} juego="tetris_matematico" grado={grado}
                    jugadoresConectados={multiState.sala?.jugadores ?? []} nombrePropio={playerName}
                    onCrear={(nombre, jugador) => { setPlayerName(jugador); socket.crearSala({ nombre, nombreJugador: jugador, materia: "matematicas", grado, tiempoPorPregunta: TIEMPO_POR_BLOQUE[grado], cantPreguntas: TOTAL_BLOQUES }); }}
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
            🧱 ¡Jugar!
          </motion.button>
        </motion.div>
      )}

      {/* ─── JUEGO ─── */}
      {screen === "juego" && operacionActual && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full min-h-screen flex flex-col"
          style={{ background: "linear-gradient(180deg,#020310 0%,#06091a 100%)" }}>

          {/* Grid de fondo tipo Tetris */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-5">
            {Array.from({ length: 12 }).map((_, row) => (
              Array.from({ length: 8 }).map((_, col) => (
                <div key={`${row}-${col}`} style={{ position: "absolute", left: `${col * 12.5}%`, top: `${row * 8.33}%`, width: "12%", height: "8%", border: "0.5px solid rgba(65,105,225,0.5)" }} />
              ))
            ))}
          </div>

          {/* TOPBAR */}
          <div className="relative z-10 flex items-center justify-between px-4 py-2 border-b border-white/5"
            style={{ background: "rgba(2,3,16,0.95)", backdropFilter: "blur(16px)" }}>
            {/* Vidas */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: MAX_VIDAS }).map((_, i) => (
                <motion.div key={i} animate={i >= vidas ? { scale: [1, 1.3, 0] } : {}} transition={{ duration: 0.3 }}>
                  <Heart size={16} className={i < vidas ? "text-[#ff4757] fill-[#ff4757]" : "text-gray-700 fill-gray-700"} />
                </motion.div>
              ))}
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-center">
                <p className="text-[9px] text-gray-500 font-bold uppercase leading-tight">Bloque</p>
                <p className="font-['Press_Start_2P'] text-xs text-white leading-tight">{idx + 1}<span className="text-gray-600">/{TOTAL_BLOQUES}</span></p>
              </div>
              <div className="w-px h-5 bg-white/10" />
              <div className="text-center">
                <p className="text-[9px] text-gray-500 font-bold uppercase leading-tight">Puntos</p>
                <p className="font-['Press_Start_2P'] text-xs text-[#ffd700] leading-tight">{score}</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={togglePause} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{ background: "rgba(255,215,0,0.08)", borderColor: "rgba(255,215,0,0.22)", color: "#ffd700" }}>{paused ? <Play size={14} /> : <Pause size={14} />}</button>
              <button onClick={openSettings} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{ background: "rgba(0,229,255,0.08)", borderColor: "rgba(0,229,255,0.22)", color: "#00e5ff" }}><Settings size={14} /></button>
            </div>
          </div>

          {/* Barra de tiempo (urgencia) */}
          <div className="relative z-10 w-full h-2" style={{ background: "rgba(255,255,255,0.05)" }}>
            <motion.div className="h-full" animate={{ width: `${100 - pctTiempo}%` }} transition={{ duration: 0.08 }}
              style={{ background: urgente ? "linear-gradient(90deg,#ff4757,#ff9800)" : `linear-gradient(90deg,${COLOR},#00e5ff)`, boxShadow: urgente ? "0 0 10px rgba(255,71,87,0.6)" : `0 0 8px rgba(65,105,225,0.5)` }} />
          </div>

          {/* ZONA DE JUEGO */}
          <div className="relative z-10 flex-1 flex flex-col items-center px-4 py-3 max-w-lg mx-auto w-full">

            <AnimatePresence>
              {paused && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40 flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
                  <div className="text-center">
                    <p className="font-['Press_Start_2P'] text-2xl text-white mb-4">PAUSA</p>
                    <button onClick={togglePause} className="px-6 py-3 rounded-xl font-bold text-white" style={{ background: `linear-gradient(135deg,${COLOR},#00e5ff)` }}>Continuar</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ZONA DE CAÍDA */}
            <div className="relative w-full rounded-2xl overflow-hidden mb-3"
              style={{ height: 160, background: "rgba(10,12,30,0.8)", border: `2px solid ${urgente ? "rgba(255,71,87,0.5)" : "rgba(65,105,225,0.25)"}` }}>

              {/* Bloques apilados (zona de peligro) */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 p-2">
                {Array.from({ length: apilados }).map((_, i) => (
                  <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: "rgba(255,71,87,0.3)", border: "2px solid rgba(255,71,87,0.6)", color: "#ff4757" }}>
                    ⚠️
                  </motion.div>
                ))}
                {Array.from({ length: BLOQUES_APILADOS_MAX - apilados }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-10 h-10 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }} />
                ))}
              </div>

              {/* Línea de peligro */}
              <div className="absolute bottom-14 left-0 right-0 h-px" style={{ background: "rgba(255,71,87,0.3)", boxShadow: "0 0 8px rgba(255,71,87,0.3)" }} />

              {/* BLOQUE CAYENDO */}
              <AnimatePresence mode="wait">
                {!bloqueExplotando ? (
                  <motion.div key={`bloque-${idx}`}
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: `${bloqueY * 0.65}%`,
                      transform: "translateX(-50%)",
                    }}
                    transition={{ duration: 0.08 }}>
                    <motion.div
                      animate={urgente ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 0.3, repeat: Infinity }}
                      className="rounded-xl flex items-center justify-center px-4 py-3"
                      style={{
                        background: `${operacionActual.color}25`,
                        border: `3px solid ${urgente ? "#ff4757" : operacionActual.color}`,
                        boxShadow: `0 0 20px ${urgente ? "rgba(255,71,87,0.5)" : `${operacionActual.color}60`}`,
                        minWidth: 120,
                      }}>
                      <p className="font-['Press_Start_2P'] text-sm font-black" style={{ color: urgente ? "#ff4757" : operacionActual.color }}>
                        {operacionActual.pregunta}
                      </p>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div key="explosion"
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: [1, 1.5, 0], opacity: [1, 1, 0] }}
                    transition={{ duration: 0.5 }}
                    style={{ position: "absolute", left: "50%", top: "40%", transform: "translateX(-50%)", fontSize: 40 }}>
                    ✨
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* OPCIONES DE RESPUESTA */}
            <div className="grid grid-cols-2 gap-3 w-full mb-3">
              {operacionActual.opciones.map((op, i) => {
                const esCorrecto = i === operacionActual.correcta;
                const esSeleccionada = i === seleccionada;
                let bg = "rgba(255,255,255,0.05)", border = "rgba(255,255,255,0.12)", textColor = "white";
                if (confirmada) {
                  if (esCorrecto) { bg = "rgba(0,255,136,0.12)"; border = "#00ff88"; textColor = "#00ff88"; }
                  else if (esSeleccionada) { bg = "rgba(255,71,87,0.12)"; border = "#ff4757"; textColor = "#ff4757"; }
                  else { bg = "rgba(255,255,255,0.02)"; border = "rgba(255,255,255,0.05)"; textColor = "#374151"; }
                } else if (esSeleccionada) { bg = COLOR_LIGHT; border = COLOR; textColor = COLOR; }
                return (
                  <motion.button key={i}
                    whileHover={!confirmada ? { scale: 1.04, y: -2 } : {}}
                    whileTap={!confirmada ? { scale: 0.96 } : {}}
                    onClick={() => !confirmada && setSeleccionada(i)}
                    disabled={confirmada}
                    className="py-4 rounded-xl font-['Press_Start_2P'] text-base transition-all border-2 flex items-center justify-center font-mono"
                    style={{ background: bg, borderColor: border, color: textColor, minHeight: 56 }}>
                    {confirmada && esCorrecto && <CheckCircle2 size={14} className="text-[#00ff88] mr-2" />}
                    {confirmada && esSeleccionada && !esCorrecto && <XCircle size={14} className="text-[#ff4757] mr-2" />}
                    {String(op)}
                  </motion.button>
                );
              })}
            </div>

            {/* Botón confirmar */}
            {!confirmada && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={confirmarRespuesta}
                disabled={seleccionada === null}
                className="w-full py-4 rounded-2xl font-['Press_Start_2P'] text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: urgente ? "linear-gradient(135deg,#ff4757,#ff9800)" : `linear-gradient(135deg,${COLOR},#00e5ff)`, boxShadow: urgente ? "0 4px 20px rgba(255,71,87,0.4)" : `0 4px 20px rgba(65,105,225,0.4)` }}>
                {urgente ? "⚡ ¡Rápido!" : "Confirmar"}
              </motion.button>
            )}

            {/* Instrucción de apilados */}
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-[10px] text-gray-600 font-bold">Apilados:</span>
              {Array.from({ length: BLOQUES_APILADOS_MAX }).map((_, i) => (
                <div key={i} className="w-3 h-3 rounded" style={{ background: i < apilados ? "#ff4757" : "rgba(255,255,255,0.1)" }} />
              ))}
              <span className="text-[10px] text-gray-600 font-bold">= -1 vida</span>
            </div>
          </div>

          {/* BOTTOMBAR */}
          <div className="relative z-10 flex items-center justify-center gap-5 px-4 py-2 border-t border-white/5" style={{ background: "rgba(2,3,16,0.9)", backdropFilter: "blur(16px)" }}>
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500"><CheckCircle2 size={13} className="text-[#00ff88]" /><span className="text-[#00ff88]">{correctas}</span></div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500"><XCircle size={13} className="text-[#ff4757]" /><span className="text-[#ff4757]">{incorrectas}</span></div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500"><Star size={13} className="text-[#ffd700]" /><span className="text-[#ffd700]">{score}</span> pts</div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: urgente ? "#ff4757" : "#00e5ff" }}>
              <Zap size={12} />{Math.max(0, Math.round(TIEMPO_POR_BLOQUE[grado] - tiempoBloque))}s
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── RESULTADOS ─── */}
      {screen === "resultados" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="w-full min-h-screen flex flex-col items-center justify-start px-4 py-10 overflow-y-auto"
          style={{ background: "linear-gradient(180deg,#020310 0%,#06091a 100%)" }}>
          <div className="relative z-10 w-full max-w-lg">
            <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", delay: 0.1 }} className="flex justify-center mb-5">
              {correctas >= Math.ceil(TOTAL_BLOQUES * 0.7)
                ? <motion.div animate={{ rotate: [0, 10, -10, 8, -8, 0] }} transition={{ delay: 0.4, duration: 0.6 }}><Trophy size={64} className="text-[#ffd700]" style={{ filter: "drop-shadow(0 0 20px rgba(255,215,0,0.6))" }} /></motion.div>
                : <span style={{ fontSize: 64 }}>🧱</span>}
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="font-['Press_Start_2P'] text-2xl mb-3 text-center"
              style={{ background: correctas >= Math.ceil(TOTAL_BLOQUES * 0.7) ? "linear-gradient(135deg,#ffd700,#ff9800)" : `linear-gradient(135deg,${COLOR},#00e5ff)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {correctas >= Math.ceil(TOTAL_BLOQUES * 0.7) ? "¡Eres un crack!" : "¡Sigue practicando!"}
            </motion.h2>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl p-5 mb-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div><p className="text-xl font-black text-[#00ff88]">{correctas}</p><p className="text-[9px] text-gray-500 font-bold uppercase mt-1">OK</p></div>
                <div><p className="text-xl font-black text-[#ff4757]">{incorrectas}</p><p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Fallos</p></div>
                <div><p className="text-xl font-black" style={{ color: COLOR }}>{vidas}</p><p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Vidas</p></div>
                <div><p className="text-xl font-black text-[#ffd700]">{score}</p><p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Pts</p></div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-gray-400">Precisión</span>
                  <span className="text-xs font-bold" style={{ color: COLOR }}>{Math.round((correctas / TOTAL_BLOQUES) * 100)}%</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(correctas / TOTAL_BLOQUES) * 100}%` }} transition={{ delay: 0.5, duration: 1 }}
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


