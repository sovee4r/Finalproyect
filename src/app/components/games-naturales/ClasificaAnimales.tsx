const API = import.meta.env.VITE_API_URL ?? "https://finalproyect-production-3837.up.railway.app";

// ClasificaAnimales.tsx — Ciencias 4to-6to
// Arrastra animales a su categoría correcta (mamífero, ave, reptil, etc.)
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Play, X, Volume2, VolumeX, RotateCcw, Trophy, Star, CheckCircle2, XCircle, Settings, User, Users, LogOut, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router";
import logoImg from "../../../assets/logo.png";
import { useSocket } from "../../../lib/useSocket";
import { useAuth } from "../../AuthContext";
import { useMonedas } from "../../../hooks/useMonedas";
import { GameLobby, GameError, MultiPanel, RankingPanel } from "../GameShared";
import { MiniJugadores } from "../MultiLobby";

type Screen = "splash" | "config" | "juego" | "resultados";
type Modo = "solo" | "multi";

interface Categoria { id: string; nombre: string; emoji: string; color: string; descripcion: string; }
interface Animal { id: string; nombre: string; emoji: string; categoria: string; dato: string; }

const CATEGORIAS: Record<number, Categoria[]> = {
  4: [
    { id: "mamifero",   nombre: "Mamífero",    emoji: "🦁", color: "#ff9800", descripcion: "Pelo, sangre caliente, amamanta crías" },
    { id: "ave",        nombre: "Ave",         emoji: "🦅", color: "#00e5ff", descripcion: "Plumas, pico, pone huevos" },
    { id: "reptil",     nombre: "Reptil",      emoji: "🦎", color: "#00ff88", descripcion: "Escamas, sangre fría" },
    { id: "pez",        nombre: "Pez",         emoji: "🐟", color: "#4169E1", descripcion: "Aletas, branquias, vive en agua" },
  ],
  5: [
    { id: "mamifero",     nombre: "Mamífero",     emoji: "🦁", color: "#ff9800", descripcion: "Pelo, sangre caliente" },
    { id: "ave",          nombre: "Ave",          emoji: "🦅", color: "#00e5ff", descripcion: "Plumas, pico" },
    { id: "reptil",       nombre: "Reptil",       emoji: "🦎", color: "#00ff88", descripcion: "Escamas, ectotermo" },
    { id: "anfibio",      nombre: "Anfibio",      emoji: "🐸", color: "#a78bfa", descripcion: "Doble vida, metamorfosis" },
    { id: "invertebrado", nombre: "Invertebrado", emoji: "🦋", color: "#ff64c8", descripcion: "Sin columna vertebral" },
  ],
  6: [
    { id: "mamifero",     nombre: "Mamífero",     emoji: "🦁", color: "#ff9800", descripcion: "Clase Mammalia" },
    { id: "ave",          nombre: "Ave",          emoji: "🦅", color: "#00e5ff", descripcion: "Clase Aves" },
    { id: "reptil",       nombre: "Reptil",       emoji: "🦎", color: "#00ff88", descripcion: "Clase Reptilia" },
    { id: "anfibio",      nombre: "Anfibio",      emoji: "🐸", color: "#a78bfa", descripcion: "Clase Amphibia" },
    { id: "pez",          nombre: "Pez",          emoji: "🐟", color: "#4169E1", descripcion: "Superclase Pisces" },
    { id: "invertebrado", nombre: "Invertebrado", emoji: "🦋", color: "#ff64c8", descripcion: "Sin columna vertebral" },
  ],
};

const ANIMALES: Record<number, Animal[]> = {
  4: [
    { id: "perro",     nombre: "Perro",    emoji: "🐕", categoria: "mamifero", dato: "Sangre caliente y pelo" },
    { id: "delfin",    nombre: "Delfín",   emoji: "🐬", categoria: "mamifero", dato: "Mamífero marino" },
    { id: "ballena",   nombre: "Ballena",  emoji: "🐋", categoria: "mamifero", dato: "El mamífero más grande" },
    { id: "aguila",    nombre: "Águila",   emoji: "🦅", categoria: "ave",      dato: "Rapaz con plumas" },
    { id: "pinguino",  nombre: "Pingüino", emoji: "🐧", categoria: "ave",      dato: "Ave que no vuela" },
    { id: "loro",      nombre: "Loro",     emoji: "🦜", categoria: "ave",      dato: "Puede imitar sonidos" },
    { id: "cocodrilo", nombre: "Cocodrilo",emoji: "🐊", categoria: "reptil",   dato: "Escamas y sangre fría" },
    { id: "tortuga",   nombre: "Tortuga",  emoji: "🐢", categoria: "reptil",   dato: "Lleva su caparazón" },
    { id: "salmon",    nombre: "Salmón",   emoji: "🐟", categoria: "pez",      dato: "Migra para reproducirse" },
    { id: "tiburon",   nombre: "Tiburón",  emoji: "🦈", categoria: "pez",      dato: "Pez cartilaginoso" },
    { id: "gato",      nombre: "Gato",     emoji: "🐈", categoria: "mamifero", dato: "Mamífero doméstico" },
    { id: "paloma",    nombre: "Paloma",   emoji: "🕊️", categoria: "ave",      dato: "Símbolo de paz" },
  ],
  5: [
    { id: "murcielago", nombre: "Murciélago", emoji: "🦇", categoria: "mamifero",     dato: "Único mamífero volador" },
    { id: "serpiente",  nombre: "Serpiente",  emoji: "🐍", categoria: "reptil",       dato: "Sin extremidades" },
    { id: "rana",       nombre: "Rana",       emoji: "🐸", categoria: "anfibio",      dato: "Metamorfosis completa" },
    { id: "sardina",    nombre: "Sardina",    emoji: "🐟", categoria: "pez",          dato: "Pez óseo" },
    { id: "mariposa",   nombre: "Mariposa",   emoji: "🦋", categoria: "invertebrado", dato: "Artrópodo con metamorfosis" },
    { id: "aguila",     nombre: "Águila",     emoji: "🦅", categoria: "ave",          dato: "Rapaz diurna" },
    { id: "oso",        nombre: "Oso",        emoji: "🐻", categoria: "mamifero",     dato: "Hiberna en invierno" },
    { id: "caiman",     nombre: "Caimán",     emoji: "🐊", categoria: "reptil",       dato: "Cocodrílido" },
    { id: "salamandra", nombre: "Salamandra", emoji: "🦎", categoria: "anfibio",      dato: "Regenera extremidades" },
    { id: "pulpo",      nombre: "Pulpo",      emoji: "🐙", categoria: "invertebrado", dato: "Molusco cefalópodo" },
    { id: "tiburon",    nombre: "Tiburón",    emoji: "🦈", categoria: "pez",          dato: "Cartilaginoso" },
    { id: "pinguino",   nombre: "Pingüino",   emoji: "🐧", categoria: "ave",          dato: "Ave adaptada al frío" },
  ],
  6: [
    { id: "murcielago", nombre: "Murciélago", emoji: "🦇", categoria: "mamifero",     dato: "Echolocalización" },
    { id: "serpiente",  nombre: "Serpiente",  emoji: "🐍", categoria: "reptil",       dato: "Ectotermo escamoso" },
    { id: "rana",       nombre: "Rana",       emoji: "🐸", categoria: "anfibio",      dato: "Poiquilotermo" },
    { id: "carpa",      nombre: "Carpa",      emoji: "🐟", categoria: "pez",          dato: "Osteictio" },
    { id: "araña",      nombre: "Araña",      emoji: "🕷️", categoria: "invertebrado", dato: "Arácnido, 8 patas" },
    { id: "condor",     nombre: "Cóndor",     emoji: "🦅", categoria: "ave",          dato: "Ave no paseriforme" },
    { id: "ballena",    nombre: "Ballena",    emoji: "🐋", categoria: "mamifero",     dato: "Mayor animal viviente" },
    { id: "gecko",      nombre: "Gecko",      emoji: "🦎", categoria: "reptil",       dato: "Escamoso nocturno" },
    { id: "salamandra", nombre: "Salamandra", emoji: "🦎", categoria: "anfibio",      dato: "Neotenia" },
    { id: "tiburon",    nombre: "Tiburón",    emoji: "🦈", categoria: "pez",          dato: "Condrictio" },
    { id: "estrella",   nombre: "Estrella",   emoji: "⭐", categoria: "invertebrado", dato: "Equinodermo" },
    { id: "loro",       nombre: "Guacamayo",  emoji: "🦜", categoria: "ave",          dato: "Paseriforme tropical" },
  ],
};

class MusicEngine {
  private ac: AudioContext | null = null;
  private mg: GainNode | null = null;
  private mug: GainNode | null = null;
  private running = false;
  start() {
    if (this.running) return;
    try {
      this.ac = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.mg = this.ac.createGain();
      this.mug = this.ac.createGain();
      this.mg.gain.value = 0.08;
      this.mug.gain.value = 1;
      this.mg.connect(this.mug);
      this.mug.connect(this.ac.destination);
      this.running = true;
      this.loop();
    } catch (_) {}
  }
  stop() {
    this.running = false;
    try { this.ac?.close(); } catch (_) {}
    this.ac = null; this.mg = null; this.mug = null;
  }
  setMuted(m: boolean) {
    if (!this.mug || !this.ac) return;
    this.mug.gain.linearRampToValueAtTime(m ? 0 : 1, this.ac.currentTime + 0.3);
  }
  private loop() {
    const seqs = [[523.3, 659.3, 783.9, 523.3], [587.3, 698.5, 880.0, 587.3]];
    let ci = 0;
    const play = () => {
      if (!this.running || !this.ac || !this.mg) return;
      seqs[ci % seqs.length].forEach((f, vi) => {
        if (!this.ac || !this.mg) return;
        const o = this.ac.createOscillator(), e = this.ac.createGain();
        o.type = "triangle"; o.frequency.value = f;
        o.connect(e); e.connect(this.mg);
        const t = this.ac.currentTime + vi * 0.18, d = 0.15;
        e.gain.setValueAtTime(0, t);
        e.gain.linearRampToValueAtTime(0.3, t + 0.02);
        e.gain.exponentialRampToValueAtTime(0.001, t + d);
        o.start(t); o.stop(t + d + 0.05);
      });
      ci++;
      setTimeout(play, 2200);
    };
    play();
  }
}

function useMusic() {
  const e = useRef(new MusicEngine());
  const [muted, setMuted] = useState(false);
  useEffect(() => () => e.current.stop(), []);
  const start = useCallback(() => e.current.start(), []);
  const stop = useCallback(() => { e.current.stop(); setMuted(false); }, []);
  const toggleMute = useCallback(() => setMuted(m => { const n = !m; e.current.setMuted(n); return n; }), []);
  return { start, stop, toggleMute, muted };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function SplashScreen({ splashPct, splashDone }: { splashPct: number; splashDone: boolean }) {
  return (
    <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse 100% 80% at 50% 0%,#0e082a 0%,#07091a 55%,#000 100%)" }}>
      {[...Array(7)].map((_, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{ width: 2 + (i % 3) * 2, height: 2 + (i % 3) * 2, left: `${8 + i * 13}%`, top: `${15 + (i % 4) * 17}%`, background: ["#DAA520", "#ff9800", "#00e5ff", "#9b44ff", "#00ff88", "#ffd700", "#ff4757"][i] }}
          animate={{ y: [0, -28, 0], opacity: [0.2, 0.7, 0.2] }} transition={{ duration: 2.8 + i * 0.4, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }} />
      ))}
      <motion.div animate={{ opacity: [0.3, 0.65, 0.3], scale: [1, 1.08, 1] }} transition={{ duration: 4, repeat: Infinity }}
        className="absolute pointer-events-none"
        style={{ width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(155,68,255,0.12) 0%,rgba(218,165,32,0.07) 40%,transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-52%)" }} />
      <AnimatePresence mode="wait">
        {!splashDone ? (
          <motion.div key="in" initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col items-center">
            <motion.div className="relative mb-2" animate={{ y: [0, -7, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
              <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle,rgba(218,165,32,0.25) 0%,rgba(155,68,255,0.12) 50%,transparent 70%)", transform: "scale(1.8)" }} />
              <img src={logoImg} alt="Saberix" className="w-36 h-36 md:w-44 md:h-44 object-contain relative z-10"
                style={{ filter: "drop-shadow(0 0 28px rgba(218,165,32,0.65)) drop-shadow(0 0 55px rgba(155,68,255,0.3))" }} />
            </motion.div>
            <div className="flex items-center gap-0.5 mt-1 mb-2">
              {["S", "A", "B", "E", "R", "I", "X"].map((l, i) => {
                const c = ["#ff4757", "#ff9800", "#ffd700", "#00ff88", "#00e5ff", "#a78bfa", "#ff4757"][i];
                return (
                  <motion.span key={i} initial={{ opacity: 0, y: -18, scale: 0.6 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.5 + i * 0.07, type: "spring", stiffness: 280, damping: 17 }}
                    className="font-['Press_Start_2P'] text-3xl md:text-4xl font-black leading-none" style={{ color: c, textShadow: `0 0 20px ${c}bb,0 0 40px ${c}44` }}>{l}</motion.span>
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
                <span className="text-[10px] font-bold" style={{ color: "rgba(218,165,32,0.5)" }}>{Math.round(splashPct)}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="h-full rounded-full" style={{ width: `${splashPct}%`, background: "linear-gradient(90deg,#ff4757,#ff9800,#ffd700,#00ff88,#00e5ff,#a78bfa)", boxShadow: "0 0 10px rgba(0,229,255,0.4)", transition: "width 0.04s linear" }} />
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="out" initial={{ scale: 1, opacity: 1 }} animate={{ scale: 0.2, opacity: 0, y: -90 }} transition={{ duration: 0.65, ease: [0.4, 0, 1, 1] }} className="flex flex-col items-center">
            <img src={logoImg} alt="" className="w-36 h-36 object-contain" style={{ filter: "drop-shadow(0 0 25px rgba(218,165,32,0.5))" }} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Recompensas({ puntos }: { puntos: number }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }}
      className="rounded-2xl border-2 p-6 mb-6"
      style={{ background: "linear-gradient(135deg,rgba(255,152,0,0.08),rgba(255,215,0,0.04))", borderColor: "rgba(255,152,0,0.3)" }}>
      <div className="flex items-center justify-center gap-2 mb-5">
        <Trophy size={15} className="text-[#ffd700]" />
        <p className="text-sm font-extrabold text-[#ffd700] tracking-widest uppercase">Recompensas</p>
      </div>
      <div className="flex justify-center gap-10">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl mx-auto mb-2" style={{ background: "linear-gradient(135deg,#ffd700,#ff9800)", boxShadow: "0 0 20px rgba(255,215,0,0.7),0 0 40px rgba(255,215,0,0.2)" }}>🪙</div>
          <div className="font-['Press_Start_2P'] text-2xl text-[#ff9800]">+{puntos}</div>
          <div className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">Monedas</div>
        </div>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl mx-auto mb-2" style={{ background: "linear-gradient(135deg,#a78bfa,#7c3aed)", boxShadow: "0 0 20px rgba(167,139,250,0.7),0 0 40px rgba(167,139,250,0.2)" }}>⚡</div>
          <div className="font-['Press_Start_2P'] text-2xl text-[#a78bfa]">+{Math.round(puntos * 1.5)}</div>
          <div className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">Experiencia</div>
        </div>
      </div>
    </motion.div>
  );
}

async function guardarResultado(data: { jugador: string; grado: number; puntos: number; correctas: number; incorrectas: number; tiempo_seg: number; modo: string; }) {
  try { await fetch(`${API}/api/resultados_juegos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, juego: "clasifica_animales", materia: "ciencias" }) }); } catch (_) {}
}

export function ClasificaAnimales() {
  const { user } = useAuth();
  const { agregarMonedas } = useMonedas();
  const navigate = useNavigate();
  const music = useMusic();
  const socket = useSocket();
  const [screen, setScreen] = useState<Screen>("splash");
  const [splashPct, setSplashPct] = useState(0);
  const [splashDone, setSplashDone] = useState(false);
  const [grado, setGrado] = useState(4);
  const [modo, setModo] = useState<Modo>("solo");
  const [playerName, setPlayerName] = useState("");

  // Prellenar nombre con el de la cuenta
  useEffect(() => { if (user?.nombre) setPlayerName(user.nombre); }, [user]);

  const [settOpen, setSettOpen] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [pendientes, setPendientes] = useState<Animal[]>([]);
  const [clasificados, setClasificados] = useState<Record<string, Animal[]>>({});
  const [dragging, setDragging] = useState<Animal | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [puntos, setPuntos] = useState(0);
  const [puntosMulti, setPuntosMulti] = useState<Record<string, number>>({});
  const [errores, setErrores] = useState(0);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  const multiState = socket.state;

  if (!user) { navigate("/login"); return null; }

  const estaEnLobby = modo === "multi" && multiState.estado === "lobby";
  const hayError = modo === "multi" && multiState.estado === "error";
  const modoRef = useRef(modo);
  const gradoRef = useRef(grado);
  const nameRef = useRef(playerName);
  modoRef.current = modo; gradoRef.current = grado; nameRef.current = playerName;

  const totalClasificados = Object.values(clasificados).flat().length;
  const totalAnimales = (ANIMALES[grado] ?? ANIMALES[4]).length;

  useEffect(() => {
    if (screen !== "splash") return;
    const dur = 4000, t0 = Date.now();
    const iv = setInterval(() => {
      const p = Math.min(100, ((Date.now() - t0) / dur) * 100);
      setSplashPct(p);
      if (p >= 100) { clearInterval(iv); setSplashDone(true); setTimeout(() => setScreen("config"), 800); }
    }, 30);
    return () => clearInterval(iv);
  }, [screen]);

  useEffect(() => {
    if (modoRef.current === "multi" && multiState.estado === "jugando" && screen !== "juego" && nameRef.current.trim())
      iniciarJuego(gradoRef.current);
  }, [multiState.estado]); // eslint-disable-line

  useEffect(() => {
    if (screen === "juego" && pendientes.length === 0 && totalClasificados === totalAnimales && totalAnimales > 0)
      guardarResultado({jugador:playerName||"Anónimo",grado,puntos,correctas:totalClasificados,incorrectas:errores,tiempo_seg:0,modo});setTimeout(() => { music.stop(); agregarMonedas(puntos); setScreen("resultados"); }, 800);
  }, [pendientes.length, screen]); // eslint-disable-line

  function iniciarJuego(g: number) {
    const cats = CATEGORIAS[g] ?? CATEGORIAS[4];
    const animals = shuffle([...(ANIMALES[g] ?? ANIMALES[4])]);
    const init: Record<string, Animal[]> = {};
    cats.forEach(c => { init[c.id] = []; });
    setPendientes(animals); setClasificados(init); setPuntos(0); setErrores(0); setFeedback(null);
    setScreen("juego"); music.start();
  }

  function onDrop(catId: string) {
    if (!dragging) return;
    const ok = dragging.categoria === catId;
    if (ok) {
      const pts = 50; setPuntos(p => p + pts);
      if (modo === "multi") setPuntosMulti(pm => ({ ...pm, [playerName]: (pm[playerName] ?? 0) + pts }));
      setClasificados(c => ({ ...c, [catId]: [...c[catId], dragging!] }));
      setPendientes(p => p.filter(a => a.id !== dragging!.id));
      const cat = CATEGORIAS[grado]?.find(c => c.id === catId);
      setFeedback({ msg: `✓ ${dragging.nombre} → ${cat?.nombre}`, ok: true });
    } else {
      setErrores(e => e + 1);
      const catCorr = CATEGORIAS[grado]?.find(c => c.id === dragging.categoria);
      setFeedback({ msg: `✗ ${dragging.nombre} es un ${catCorr?.nombre}`, ok: false });
    }
    setDragging(null); setDragOver(null);
    setTimeout(() => setFeedback(null), 2200);
  }

  if (estaEnLobby && multiState.sala) return <GameLobby state={multiState} nombrePropio={playerName} onIniciar={() => { socket.iniciarJuego(multiState.sala!.codigo); iniciarJuego(grado); }} onSalir={() => { socket.salirSala(); setModo("solo"); }} colorAccent="#ff9800" />;
  if (hayError) return <GameError mensaje={multiState.errorMsg} onReset={socket.resetError} colorAccent="#ff9800" />;
  if (screen === "splash") return <SplashScreen splashPct={splashPct} splashDone={splashDone} />;

  const cats = CATEGORIAS[grado] ?? CATEGORIAS[4];

  if (screen === "resultados") {
    const stars = errores === 0 ? 3 : errores <= 3 ? 2 : 1;
    return (
      // FIX: eliminado el style prop duplicado, se usa solo el segundo valor
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="w-full min-h-screen flex flex-col items-center px-4 py-10 overflow-y-auto"
        style={{ background: "linear-gradient(135deg,#06091a 0%,#1a0a06 50%,#06091a 100%)" }}>
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {cats.map((c, i) => (
            <motion.div key={i} className="absolute rounded-full"
              style={{ width: 5, height: 5, left: `${10 + i * 14}%`, top: `${5 + (i % 3) * 15}%`, background: c.color }}
              animate={{ y: [0, 80, 0], opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
              transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.3 }} />
          ))}
        </div>
        <div className="relative z-10 w-full max-w-lg">
          <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", delay: 0.1 }} className="flex justify-center mb-5">
            <motion.span className="text-7xl" animate={{ rotate: [0, 10, -10, 8, -8, 0] }} transition={{ delay: 0.4, duration: 0.6 }}>🦁</motion.span>
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-['Press_Start_2P'] text-3xl mb-4 text-center"
            style={{ background: "linear-gradient(135deg,#ff9800,#ffd700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ¡Clasificado!
          </motion.h2>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex justify-center gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <motion.div key={s} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + s * 0.12, type: "spring", stiffness: 300 }}>
                <Star size={36} className={s <= stars ? "text-[#ffd700]" : "text-gray-700"} fill={s <= stars ? "#ffd700" : "none"}
                  style={s <= stars ? { filter: "drop-shadow(0 0 12px rgba(255,215,0,0.8)) drop-shadow(0 0 20px rgba(255,215,0,0.3))" } : {}} />
              </motion.div>
            ))}
          </motion.div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Correctos", val: totalClasificados, color: "#00ff88", bg: "rgba(0,255,136,0.06)",  border: "rgba(0,255,136,0.25)",  icon: <CheckCircle2 size={22} /> },
              { label: "Errores",   val: errores,           color: "#ff4757", bg: "rgba(255,71,87,0.06)",  border: "rgba(255,71,87,0.25)",  icon: <XCircle size={22} /> },
              { label: "Puntos",    val: puntos,            color: "#ffd700", bg: "rgba(255,215,0,0.06)", border: "rgba(255,215,0,0.25)", icon: <Star size={22} /> },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1, type: "spring" }}
                className="rounded-2xl border-2 p-5 text-center" style={{ background: s.bg, borderColor: s.border }}>
                <div className="flex justify-center mb-2" style={{ color: s.color }}>{s.icon}</div>
                <div className="font-['Press_Start_2P'] text-2xl mb-1" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs font-extrabold text-gray-500 tracking-widest uppercase">{s.label}</div>
              </motion.div>
            ))}
          </div>
          <Recompensas puntos={puntos} />
          <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
            onClick={() => { music.stop(); setScreen("config"); }}
            className="w-full py-5 rounded-2xl font-['Press_Start_2P'] text-base text-white mb-3 flex items-center justify-center gap-3"
            style={{ background: "linear-gradient(135deg,#ff9800,#ffd700)", boxShadow: "0 4px 22px rgba(255,152,0,0.4)" }}>
            <RotateCcw size={18} /> Jugar de nuevo
          </motion.button>
          <Link to="/games/science" className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-base text-gray-400 border-2 border-white/10 hover:border-white/25 hover:text-white transition-all">
            <ArrowLeft size={18} /> Menú principal
          </Link>
        </div>
      </motion.div>
    );
  }

  if (screen === "config") return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/games/science" className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"><ArrowLeft size={22} /></Link>
        <div>
          <h1 className="font-['Press_Start_2P'] text-xl text-[#ff9800]">CLASIFICA ANIMALES</h1>
          <p className="text-gray-400 text-sm font-bold mt-1">Ciencias Naturales</p>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-2xl border-2 border-[#ff9800]/30 bg-[#080d1e] p-6 mb-5" style={{ boxShadow: "0 4px 28px rgba(255,152,0,0.1)" }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20" style={{ background: "radial-gradient(circle,#ff9800,transparent)", transform: "translate(30%,-30%)" }} />
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl" style={{ background: "rgba(255,152,0,0.15)", border: "1.5px solid rgba(255,152,0,0.35)" }}>🦁</div>
          <div>
            <p className="font-['Press_Start_2P'] text-xs text-[#ff9800] mb-2">Clasifica Animales</p>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">Arrastra cada animal a su categoría correcta. ¡Mamífero, Ave, Reptil y más!</p>
            <div className="flex gap-2 flex-wrap">
              {cats.map(c => (
                <span key={c.id} className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: `${c.color}18`, color: c.color, border: `1px solid ${c.color}44` }}>{c.emoji} {c.nombre}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border-2 border-white/8 bg-[#080d1e] p-5 mb-4">
        <p className="text-xs font-extrabold text-[#ff9800] tracking-widest uppercase mb-3">Grado</p>
        <div className="grid grid-cols-3 gap-2">
          {[4, 5, 6].map(g => (
            <button key={g} onClick={() => setGrado(g)} className="py-3 rounded-xl border-2 font-bold text-sm transition-all"
              style={{ borderColor: grado === g ? "#ff9800" : "rgba(255,255,255,0.1)", background: grado === g ? "rgba(255,152,0,0.1)" : "rgba(255,255,255,0.03)", color: grado === g ? "#ff9800" : "#6b7280" }}>
              {g}to Grado
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border-2 border-white/8 bg-[#080d1e] p-5 mb-4">
        <p className="text-xs font-extrabold text-[#ff9800] tracking-widest uppercase mb-3 flex items-center gap-2"><User size={13} /> Tu nombre</p>
        <input className="w-full bg-white/4 border-2 border-white/10 rounded-xl px-4 py-3 text-white font-semibold outline-none focus:border-[#ff9800]/60 transition-all placeholder:text-gray-600"
          disabled={!!user} placeholder="Escribe tu nombre..." value={playerName} onChange={e => setPlayerName(e.target.value)} maxLength={20} />
      </div>
      <div className="rounded-2xl border-2 border-white/8 bg-[#080d1e] p-5 mb-6">
        <p className="text-xs font-extrabold text-[#00ff88] tracking-widest uppercase mb-3 flex items-center gap-2"><Play size={13} /> Modo de juego</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => setModo("solo")} className={`py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${modo === "solo" ? "border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]" : "border-white/10 bg-white/3 text-gray-400 hover:border-white/25"}`}><User size={15} /> Solitario</button>
          <button onClick={() => setModo("multi")} className={`py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${modo === "multi" ? "border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa]" : "border-white/10 bg-white/3 text-gray-400 hover:border-white/25"}`}><Users size={15} /> Multijugador</button>
        </div>
        {modo === "multi" && (
          <MultiPanel nombreJugador={playerName} onNombreChange={setPlayerName} juego="clasifica_animales" grado={grado}
            jugadoresConectados={multiState.sala?.jugadores ?? []} nombrePropio={playerName}
            onCrear={(n, j) => { setPlayerName(j); socket.crearSala({ nombre: n, nombreJugador: j, materia: "ciencias", grado, tiempoPorPregunta: 9999, cantPreguntas: 5 }); }}
            onUnirse={(c, j) => { setPlayerName(j); socket.unirseASala(c, j); }}
            conectando={multiState.estado === "conectando"} colorAccent="#ff9800" />
        )}
      </div>
      <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
        onClick={() => modo === "solo" && iniciarJuego(grado)}
        disabled={!playerName.trim() || (modo === "multi")}
        className="w-full py-5 rounded-2xl font-['Press_Start_2P'] text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ background: modo === "solo" ? "linear-gradient(135deg,#ff9800,#ffd700)" : "linear-gradient(135deg,#a78bfa,#7c3aed)", boxShadow: modo === "solo" ? "0 4px 24px rgba(255,152,0,0.4)" : "0 4px 24px rgba(167,139,250,0.35)" }}>
        {modo === "solo" ? "Comenzar" : "Crea o únete a una sala arriba"}
      </motion.button>
    </motion.div>
  );

  // JUEGO
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#06091a 0%,#1a0a06 50%,#06091a 100%)" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(circle,rgba(255,152,0,0.15),transparent)" }} />
      </div>

      <AnimatePresence>
        {settOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center px-4"
            onClick={() => setSettOpen(false)}>
            <motion.div initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm rounded-2xl overflow-hidden"
              style={{ background: "#0d0b1a", border: "2px solid rgba(255,152,0,0.3)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
                <p className="font-['Press_Start_2P'] text-xs text-white">Configuración</p>
                <button onClick={() => setSettOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-gray-400"><X size={14} /></button>
              </div>
              <div className="px-5 py-4 space-y-3">
                {[
                  { label: music.muted ? "Activar música" : "Silenciar música", icon: music.muted ? <Volume2 size={14} /> : <VolumeX size={14} />, action: music.toggleMute },
                  { label: "Salir", icon: <LogOut size={14} />, action: () => { music.stop(); setScreen("config"); setSettOpen(false); }, danger: true },
                ].map((a, i) => (
                  <button key={i} onClick={a.action}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold border ${(a as any).danger ? "text-[#ff4757] border-[#ff4757]/20 bg-[#ff4757]/5" : "text-gray-300 border-white/7 bg-white/3"}`}>
                    {a.icon}{a.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRanking && modo === "multi" && (
          <RankingPanel
            jugadores={(multiState.sala?.jugadores ?? []).map(j => ({ ...j, puntos: j.nombre === playerName ? puntos : (puntosMulti[j.nombre] ?? 0), correctas: j.nombre === playerName ? totalClasificados : 0 }))}
            nombrePropio={playerName}
            onClose={() => setShowRanking(false)} />
        )}
      </AnimatePresence>

      {/* TOPBAR */}
      <div className="relative z-10 flex items-center gap-2 px-3 md:px-4 py-2 border-b border-white/5"
        style={{ background: "rgba(4,6,18,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,152,0,0.2)" }}>
        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
          {modo === "multi" && multiState.sala && multiState.sala.jugadores.length > 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 flex-1">
              <MiniJugadores jugadores={multiState.sala.jugadores} nombrePropio={playerName} />
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,152,0,0.18)", border: "1.5px solid rgba(255,152,0,0.4)" }}>
                <User size={14} style={{ color: "#ff9800" }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white truncate leading-tight">{playerName}</p>
                <p className="text-[10px] text-gray-500 font-bold leading-tight">Clasifica · {grado}to</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-center">
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Clasificados</p>
            <p className="font-['Press_Start_2P'] text-sm text-[#00ff88] leading-tight">{totalClasificados}<span className="text-gray-600 text-xs">/{totalAnimales}</span></p>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="text-center">
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Pts</p>
            <p className="font-['Press_Start_2P'] text-sm text-[#ffd700] leading-tight">{puntos}</p>
          </div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0 ml-2">
          {modo === "multi" ? (
            <>
              <button onClick={music.toggleMute} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{ background: "rgba(255,152,0,0.08)", borderColor: "rgba(255,152,0,0.22)", color: "#ff9800" }}>
                {music.muted ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              <button onClick={() => setShowRanking(r => !r)} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{ background: "rgba(255,215,0,0.08)", borderColor: "rgba(255,215,0,0.4)", color: "#ffd700" }}>
                <Trophy size={14} />
              </button>
              <button onClick={() => { socket.salirSala(); music.stop(); setModo("solo"); setScreen("config"); }} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{ background: "rgba(255,71,87,0.08)", borderColor: "rgba(255,71,87,0.3)", color: "#ff4757" }}>
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <button onClick={() => setSettOpen(true)} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{ background: "rgba(255,152,0,0.08)", borderColor: "rgba(255,152,0,0.22)", color: "#ff9800" }}>
              <Settings size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="relative z-10 w-full h-1.5" style={{ background: "rgba(255,255,255,0.03)" }}>
        <div className="h-full transition-all duration-500"
          style={{ width: `${(totalClasificados / Math.max(1, totalAnimales)) * 100}%`, background: "linear-gradient(90deg,#ff9800,#ffd700)", boxShadow: "0 0 16px rgba(255,152,0,0.7),0 0 30px rgba(255,152,0,0.3)" }} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col gap-3 p-3 md:p-4 overflow-y-auto">
        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`mx-auto max-w-xl w-full flex items-center justify-center gap-3 text-sm font-bold px-5 py-3 rounded-2xl border-2 ${feedback.ok ? "bg-[#00ff88]/8 border-[#00ff88]/30 text-[#00ff88]" : "bg-[#ff4757]/8 border-[#ff4757]/30 text-[#ff4757]"}`}>
              {feedback.ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />} {feedback.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animales pendientes */}
        <div className="max-w-4xl mx-auto w-full">
          <p className="text-xs font-extrabold text-gray-500 tracking-widest uppercase mb-2 text-center">Arrastra cada animal a su categoría</p>
          <div className="flex flex-wrap justify-center gap-2 min-h-16 p-3 rounded-2xl border-2 border-dashed border-white/10 mb-3">
            {pendientes.map(a => (
              <motion.div key={a.id} draggable onDragStart={() => setDragging(a)} onDragEnd={() => setDragging(null)}
                whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 cursor-grab select-none"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.15)", opacity: dragging?.id === a.id ? 0.4 : 1 }}>
                <span className="text-2xl">{a.emoji}</span>
                <span className="text-[10px] font-bold text-white whitespace-nowrap">{a.nombre}</span>
              </motion.div>
            ))}
            {pendientes.length === 0 && <p className="text-[#00ff88] text-sm font-bold self-center">¡Todos clasificados! 🎉</p>}
          </div>
        </div>

        {/* Categorías */}
        <div className="max-w-4xl mx-auto w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {cats.map(cat => (
            <div key={cat.id}
              onDragOver={e => { e.preventDefault(); setDragOver(cat.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => onDrop(cat.id)}
              className="rounded-2xl border-2 p-3 min-h-24 transition-all"
              style={{ borderColor: dragOver === cat.id ? cat.color : `${cat.color}44`, background: dragOver === cat.id ? `${cat.color}18` : `${cat.color}08`, boxShadow: dragOver === cat.id ? `0 0 20px ${cat.color}44` : "none" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-lg">{cat.emoji}</span>
                <div>
                  <p className="font-bold text-xs" style={{ color: cat.color }}>{cat.nombre}</p>
                  <p className="text-[9px] text-gray-600 leading-tight">{cat.descripcion}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {(clasificados[cat.id] ?? []).map(a => (
                  <motion.span key={a.id} initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-lg" title={a.nombre}>{a.emoji}</motion.span>
                ))}
              </div>
              {dragOver === cat.id && <p className="text-center text-[10px] font-bold mt-1" style={{ color: cat.color }}>Soltar aquí ↓</p>}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

