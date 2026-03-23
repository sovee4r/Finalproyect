// src/app/components/GameShared.tsx
// Lobby y componentes compartidos para minijuegos
// Diseño idéntico al MultiLobby del quiz (imágenes de referencia)

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Crown, Copy, Check, Play, LogOut,
  Loader2, Wifi, AlertTriangle, X, Zap
} from "lucide-react";
import { getAvatarColor as getColor, getInitials as getInits, BurbujaJugador, MiniJugadores } from "./MultiLobby";
import type { MultiState, RankingItem } from "../../lib/useSocket";

/* ══════════════════════════════════════════════════════
   GAME LOBBY — idéntico al MultiLobby del quiz
══════════════════════════════════════════════════════ */
interface LobbyProps {
  state:        MultiState;
  nombrePropio: string;
  onIniciar:    () => void;
  onSalir:      () => void;
  colorAccent?: string;
}

export function GameLobby({ state, nombrePropio, onIniciar, onSalir, colorAccent = "#a78bfa" }: LobbyProps) {
  const [copiado, setCopiado] = useState(false);
  const sala      = state.sala!;
  const esHost    = sala.jugadores[0]?.nombre === nombrePropio;
  const conectando = state.estado === "conectando";

  function copiarCodigo() {
    navigator.clipboard?.writeText(sala.codigo).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-['Press_Start_2P'] text-base" style={{ color: colorAccent }}>SALA DE ESPERA</h1>
          <p className="text-gray-400 text-sm mt-1 font-bold">{sala.nombre}</p>
        </div>
        <button onClick={onSalir}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-400 border border-white/10 hover:border-red-500/40 hover:text-red-400 transition-all">
          <LogOut size={14} /> Salir
        </button>
      </div>

      {/* Código */}
      <div className="relative overflow-hidden rounded-2xl border-2 mb-6 p-5"
        style={{ background: `linear-gradient(135deg,${colorAccent}08,${colorAccent}12)`, borderColor: `${colorAccent}50` }}>
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-30 pointer-events-none"
          style={{ background: `radial-gradient(circle,${colorAccent},transparent)`, transform: "translate(30%,-30%)" }} />
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Codigo de sala</p>
        <div className="flex items-center justify-between">
          <span className="font-['Press_Start_2P'] text-3xl tracking-[0.2em]"
            style={{ background: `linear-gradient(135deg,${colorAccent},#a78bfa)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {sala.codigo}
          </span>
          <button onClick={copiarCodigo}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              color:      copiado ? "#00ff88" : colorAccent,
              background: copiado ? "rgba(0,255,136,0.1)" : `${colorAccent}18`,
              border:     `1.5px solid ${copiado ? "rgba(0,255,136,0.4)" : `${colorAccent}44`}`,
            }}>
            {copiado ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
          </button>
        </div>
      </div>

      {/* Jugadores burbujas */}
      <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5 mb-5">
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs font-extrabold text-[#00ff88] tracking-widest uppercase flex items-center gap-2">
            <Wifi size={13} /> Jugadores ({sala.jugadores.length}/8)
          </p>
          <div className="flex items-center gap-2">
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-[#00ff88]" />
            <span className="text-xs text-gray-500 font-bold">En vivo</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-6 py-2">
          <AnimatePresence>
            {sala.jugadores.map((j, i) => (
              <motion.div key={j.nombre}
                initial={{ opacity: 0, scale: 0, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: i * 0.07, type: "spring", stiffness: 260, damping: 20 }}>
                <BurbujaJugador nombre={j.nombre} esHost={i === 0} esYo={j.nombre === nombrePropio} size="md" />
              </motion.div>
            ))}
          </AnimatePresence>
          {Array.from({ length: Math.max(0, 4 - sala.jugadores.length) }).map((_, i) => (
            <motion.div key={`empty-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                <span className="text-gray-700 text-xs font-bold">?</span>
              </div>
              <p className="text-[10px] text-gray-700 font-bold">Esperando</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Botón iniciar / esperar */}
      {esHost ? (
        <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
          onClick={onIniciar} disabled={sala.jugadores.length < 1 || conectando}
          className="w-full py-5 rounded-2xl font-['Press_Start_2P'] text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          style={{ background: `linear-gradient(135deg,${colorAccent},#7c3aed)`, boxShadow: `0 4px 24px ${colorAccent}55` }}>
          {conectando ? <><Loader2 size={18} className="animate-spin" /> Iniciando...</> : <><Play size={18} /> Iniciar juego</>}
        </motion.button>
      ) : (
        <div className="flex items-center justify-center gap-3 py-5 rounded-2xl border-2 border-white/8"
          style={{ background: "rgba(255,255,255,0.02)" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Loader2 size={18} style={{ color: colorAccent }} />
          </motion.div>
          <span className="text-sm font-bold text-gray-400">Esperando que el host inicie...</span>
        </div>
      )}
    </motion.div>
  );
}

/* ─── ERROR ─── */
export function GameError({ mensaje, onReset, colorAccent = "#a78bfa" }: {
  mensaje: string; onReset: () => void; colorAccent?: string;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg,#06091a,#0d1230)" }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: "rgba(255,71,87,0.1)", border: "1.5px solid rgba(255,71,87,0.3)" }}>
          <AlertTriangle size={28} className="text-[#ff4757]" />
        </div>
        <p className="font-['Press_Start_2P'] text-sm text-white mb-2">Error</p>
        <p className="text-gray-400 text-sm mb-8">{mensaje}</p>
        <button onClick={onReset} className="w-full py-4 rounded-2xl font-bold text-white"
          style={{ background: `linear-gradient(135deg,${colorAccent},#7c3aed)` }}>
          Volver al menú
        </button>
      </motion.div>
    </div>
  );
}

/* ─── RANKING FINAL ─── */
interface RankingFinalProps {
  ranking: RankingItem[]; nombrePropio: string;
  onJugarDeNuevo: () => void; onSalir: () => void; colorAccent?: string;
}

export function GameRankingFinal({ ranking, nombrePropio, onJugarDeNuevo, onSalir, colorAccent = "#a78bfa" }: RankingFinalProps) {
  const medallas = ["🥇", "🥈", "🥉"];
  const tuPuesto = ranking.findIndex(r => r.nombre === nombrePropio);
  const tuData   = ranking[tuPuesto];
  const podioColors = [
    { bar: "rgba(255,215,0,0.25)",   border: "rgba(255,215,0,0.5)",   h: "h-20" },
    { bar: "rgba(167,139,250,0.25)", border: "rgba(167,139,250,0.5)", h: "h-14" },
    { bar: "rgba(255,152,0,0.25)",   border: "rgba(255,152,0,0.5)",   h: "h-10" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="w-full min-h-screen flex flex-col items-center justify-start px-4 py-8 overflow-y-auto"
      style={{ background: "linear-gradient(135deg,#06091a 0%,#0d1230 50%,#06091a 100%)" }}>

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ x:[0,40,0], y:[0,-30,0] }} transition={{ duration:12, repeat:Infinity, ease:"easeInOut" }}
          className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-3xl opacity-40"
          style={{ background: "radial-gradient(circle,rgba(167,139,250,0.15),transparent)" }}/>
        {[...Array(8)].map((_, i) => (
          <motion.div key={i} className="absolute rounded-full"
            style={{ width: 4, height: 4, left: `${10+i*12}%`, top: `${5+(i%3)*15}%`,
              background: ["#ffd700","#a78bfa","#00e5ff","#00ff88","#ff9800","#ff4757","#ff64c8","#64c8ff"][i] }}
            animate={{ y:[0,60,0], opacity:[0,1,0], scale:[0.5,1.2,0.5] }}
            transition={{ duration:3+i*0.4, repeat:Infinity, delay:i*0.3, ease:"easeInOut" }} />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <motion.div initial={{ y:-30, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.1 }}
          className="text-center mb-8">
          <motion.div animate={{ rotate:[0,10,-10,8,-8,0] }} transition={{ delay:0.5, duration:0.7 }}
            className="text-5xl mb-3">🏆</motion.div>
          <h1 className="font-['Press_Start_2P'] text-2xl mb-2"
            style={{ background:"linear-gradient(135deg,#ffd700,#ff9800)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            RESULTADOS
          </h1>
          <p className="text-gray-400 text-sm font-bold">Partida finalizada</p>
        </motion.div>

        {ranking.length >= 1 && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
            className="flex items-end justify-center gap-3 mb-8">
            {[ranking[1], ranking[0], ranking[2]].map((r, podioIdx) => {
              if (!r) return <div key={podioIdx} className="w-20" />;
              const realIdx = podioIdx === 0 ? 1 : podioIdx === 1 ? 0 : 2;
              const pc      = podioColors[realIdx];
              const esYo    = r.nombre === nombrePropio;
              return (
                <motion.div key={r.nombre}
                  initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay:0.3+realIdx*0.1, type:"spring" }}
                  className="flex flex-col items-center gap-2">
                  <BurbujaJugador nombre={r.nombre} esYo={esYo} size={realIdx === 0 ? "lg" : "sm"} />
                  <motion.div initial={{ scaleY:0 }} animate={{ scaleY:1 }}
                    transition={{ delay:0.6+realIdx*0.1, duration:0.4 }}
                    className={`w-20 ${pc.h} rounded-t-xl flex flex-col items-center justify-center gap-1`}
                    style={{ background:pc.bar, border:`1px solid ${pc.border}`, boxShadow:`0 4px 20px ${pc.border}50` }}>
                    <span className="text-2xl">{medallas[realIdx]}</span>
                    <span className="font-['Press_Start_2P'] text-[10px] text-white">{r.puntos}pts</span>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {tuPuesto >= 0 && tuData && (
          <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ delay:0.7 }}
            className="rounded-2xl border-2 p-5 mb-5 text-center relative overflow-hidden"
            style={{ background:tuPuesto===0?"linear-gradient(135deg,rgba(255,215,0,0.12),rgba(255,152,0,0.06))":"rgba(167,139,250,0.06)", borderColor:tuPuesto===0?"rgba(255,215,0,0.4)":"rgba(167,139,250,0.3)" }}>
            <p className="text-3xl mb-2">{medallas[tuPuesto] ?? `#${tuPuesto+1}`}</p>
            <p className="font-['Press_Start_2P'] text-2xl mb-1" style={{ color:tuPuesto===0?"#ffd700":colorAccent }}>{tuData.puntos} pts</p>
            <p className="text-xs text-gray-400 font-bold">{tuPuesto===0?"🎉 ¡Ganaste la partida!":tuPuesto===1?"🥈 Segundo lugar":`Puesto #${tuPuesto+1}`}</p>
            <div className="flex justify-center gap-6 mt-3 pt-3 border-t border-white/10">
              <div className="text-center"><p className="text-lg font-black text-[#00ff88]">{tuData.correctas}</p><p className="text-[10px] text-gray-500 uppercase tracking-widest">Correctas</p></div>
              <div className="w-px bg-white/10" />
              <div className="text-center"><p className="text-lg font-black text-[#ffd700]">{tuData.puntos}</p><p className="text-[10px] text-gray-500 uppercase tracking-widest">Puntos</p></div>
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.8 }}
          className="rounded-2xl border-2 border-white/8 bg-[#0f1425] overflow-hidden mb-6">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5" style={{ background:"rgba(255,255,255,0.02)" }}>
            <span className="text-xs font-extrabold text-gray-500 uppercase tracking-widest flex-shrink-0 w-8">#</span>
            <span className="flex-1 text-xs font-extrabold text-gray-500 uppercase tracking-widest">Jugador</span>
            <span className="text-xs font-extrabold text-[#00ff88] uppercase tracking-widest">✓</span>
            <span className="text-xs font-extrabold text-[#ffd700] uppercase tracking-widest ml-4">Pts</span>
          </div>
          {ranking.map((r, i) => {
            const esYo  = r.nombre === nombrePropio;
            const color = getColor(r.nombre);
            return (
              <motion.div key={r.nombre}
                initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
                transition={{ delay:0.9+i*0.08 }}
                className="flex items-center gap-3 px-5 py-4 border-b border-white/5 last:border-0"
                style={{ background:esYo?color.bg:"transparent" }}>
                <span className="text-xl flex-shrink-0 w-8 text-center">{medallas[i] ?? `#${i+1}`}</span>
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
                  style={{ background:color.bg, border:`2px solid ${color.border}`, color:color.text }}>
                  {getInits(r.nombre)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color:esYo?color.text:"white" }}>
                    {r.nombre} {esYo && <span className="text-xs opacity-60">(tú)</span>}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="h-1.5 rounded-full bg-white/10 flex-1 max-w-[80px] overflow-hidden">
                      <motion.div className="h-full rounded-full bg-[#00ff88]"
                        initial={{ width:0 }}
                        animate={{ width:`${Math.min(100,(r.correctas/Math.max(1,ranking[0]?.correctas??1))*100)}%` }}
                        transition={{ delay:1+i*0.1, duration:0.6 }} />
                    </div>
                    <span className="text-[10px] text-gray-500">{r.correctas}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-['Press_Start_2P'] text-base text-[#ffd700]">{r.puntos}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.button initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:1.2 }}
          whileHover={{ scale:1.02, y:-2 }} whileTap={{ scale:0.98 }} onClick={onJugarDeNuevo}
          className="w-full py-5 rounded-2xl font-['Press_Start_2P'] text-sm text-white mb-3 flex items-center justify-center gap-3"
          style={{ background:`linear-gradient(135deg,${colorAccent},#7c3aed)`, boxShadow:`0 4px 20px ${colorAccent}44` }}>
          <Zap size={16} /> Jugar de nuevo
        </motion.button>
        <button onClick={onSalir}
          className="w-full py-4 rounded-2xl font-bold text-sm text-gray-400 border-2 border-white/10 hover:border-white/25 hover:text-white transition-all">
          Salir al menú
        </button>
      </div>
    </motion.div>
  );
}

/* ─── RANKING LATERAL (durante el juego) — idéntico a imagen 2 ─── */
interface RankingPanelProps {
  jugadores:    { nombre: string; puntos: number; correctas: number; incorrectas: number }[];
  nombrePropio: string;
  onClose:      () => void;
}

export function RankingPanel({ jugadores, nombrePropio, onClose }: RankingPanelProps) {
  const medallas = ["🥇", "🥈", "🥉"];
  const sorted   = [...jugadores].sort((a, b) => b.puntos - a.puntos);
  return (
    <motion.div initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 h-full w-80 z-50 border-l border-white/10 p-5 overflow-y-auto"
      style={{ background: "rgba(8,7,20,0.98)", backdropFilter: "blur(20px)" }}>
      <div className="flex items-center justify-between mb-6">
        <p className="font-['Press_Start_2P'] text-sm text-[#a78bfa]">Ranking</p>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={16}/></button>
      </div>
      {sorted.map((j, i) => {
        const esYo  = j.nombre === nombrePropio;
        const color = getColor(j.nombre);
        return (
          <div key={j.nombre} className="flex items-center gap-3 py-3.5 border-b border-white/5 last:border-0"
            style={{ background: esYo ? color.bg : "transparent" }}>
            <span className="text-2xl w-8 text-center flex-shrink-0">{medallas[i] ?? `#${i + 1}`}</span>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
              style={{ background: color.bg, border: `2px solid ${color.border}`, color: color.text }}>
              {getInits(j.nombre)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate" style={{ color: esYo ? color.text : "white" }}>{j.nombre}</p>
              <p className="text-xs text-gray-500">{j.correctas} correctas</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-base">🪙</span>
              <span className="font-['Press_Start_2P'] text-xs text-[#ffd700]">{j.puntos}</span>
            </div>
          </div>
        );
      })}
      {sorted.length === 0 && <p className="text-gray-600 text-sm text-center py-8">Sin datos aún...</p>}
    </motion.div>
  );
}

/* ─── PANEL CREAR / UNIRSE (con burbujas integradas) ─── */
interface MultiPanelProps {
  nombreJugador:        string;
  onNombreChange:       (v: string) => void;
  juego:                string;
  grado:                number;
  onCrear:              (nombre: string, nombreJugador: string) => void;
  onUnirse:             (codigo: string, nombreJugador: string) => void;
  conectando:           boolean;
  colorAccent?:         string;
  jugadoresConectados?: { nombre: string }[];
  nombrePropio?:        string;
}

export function MultiPanel({
  nombreJugador, onNombreChange, juego, grado,
  onCrear, onUnirse, conectando, colorAccent = "#a78bfa",
  jugadoresConectados = [], nombrePropio = "",
}: MultiPanelProps) {
  const [tab, setTab]           = useState<"crear" | "unirse">("crear");
  const [roomName, setRoomName] = useState("");
  const [codigo, setCodigo]     = useState("");

  return (
    <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] p-5">

      {/* Burbujas de jugadores ya en sala */}
      {jugadoresConectados.length > 0 && (
        <div className="mb-4 pb-4 border-b border-white/8">
          <p className="text-xs font-bold text-[#00ff88] tracking-widest uppercase flex items-center gap-2 mb-3">
            <Wifi size={12} /> En sala ({jugadoresConectados.length}/8)
            <span className="ml-auto flex items-center gap-1">
              <motion.div animate={{ opacity:[1,0.3,1] }} transition={{ duration:1.5,repeat:Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-[#00ff88]"/>
              <span className="text-gray-500 normal-case font-normal">En vivo</span>
            </span>
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {jugadoresConectados.map((j, i) => (
              <BurbujaJugador key={j.nombre} nombre={j.nombre} esHost={i === 0}
                esYo={j.nombre === nombrePropio} size="sm" />
            ))}
            {Array.from({ length: Math.max(0, 2 - jugadoresConectados.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                  <span className="text-gray-700 text-xs">?</span>
                </div>
                <p className="text-[9px] text-gray-700">Esperando</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {(["crear", "unirse"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="py-2.5 rounded-xl border text-xs font-extrabold tracking-wide transition-all"
            style={{
              borderColor: tab === t ? colorAccent : "rgba(255,255,255,0.1)",
              background:  tab === t ? `${colorAccent}18` : "transparent",
              color:       tab === t ? colorAccent : "#6b7280",
            }}>
            {t === "crear" ? "Crear sala" : "Unirse"}
          </button>
        ))}
      </div>

      {tab === "crear" ? (
        <div className="mb-4">
          <p className="text-xs font-extrabold tracking-widest uppercase mb-2" style={{ color: colorAccent }}>
            Nombre de la sala
          </p>
          <input className="w-full bg-white/4 border-2 border-white/10 rounded-xl px-4 py-3 text-white font-semibold outline-none transition-all placeholder:text-gray-600"
            placeholder="Mi sala épica..." value={roomName} onChange={e => setRoomName(e.target.value)} maxLength={30} />
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-xs font-extrabold text-[#00e5ff] tracking-widest uppercase mb-2">Código de sala</p>
          <input className="w-full bg-white/4 border-2 border-white/10 rounded-xl px-4 py-3 text-white font-semibold text-xl outline-none focus:border-[#00e5ff]/60 transition-all placeholder:text-gray-600 tracking-widest text-center font-['Press_Start_2P']"
            placeholder="000000" value={codigo}
            onChange={e => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} />
        </div>
      )}

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={() => tab === "crear" ? onCrear(roomName, nombreJugador) : onUnirse(codigo, nombreJugador)}
        disabled={conectando || !nombreJugador.trim() || (tab === "crear" && !roomName.trim()) || (tab === "unirse" && codigo.length < 6)}
        className="w-full py-4 rounded-2xl font-['Press_Start_2P'] text-sm text-white disabled:opacity-30"
        style={{ background: `linear-gradient(135deg,${colorAccent},#7c3aed)` }}>
        {conectando ? "Conectando..." : tab === "crear" ? "Crear sala" : "Unirse"}
      </motion.button>
    </div>
  );
}
