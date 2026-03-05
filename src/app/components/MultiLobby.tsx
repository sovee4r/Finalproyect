// src/app/components/MultiLobby.tsx
import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Crown, Copy, Check, Play, LogOut,
  Clock, HelpCircle, Loader2, Wifi
} from "lucide-react";
import { SalaInfo, RankingItem } from "../../lib/useSocket";

/* ─── Paleta de colores para avatares ─── */
const AVATAR_COLORS = [
  { bg: "rgba(0,229,255,0.15)",  border: "#00e5ff", text: "#00e5ff"  },
  { bg: "rgba(167,139,250,0.15)",border: "#a78bfa", text: "#a78bfa"  },
  { bg: "rgba(0,255,136,0.15)",  border: "#00ff88", text: "#00ff88"  },
  { bg: "rgba(255,152,0,0.15)",  border: "#ff9800", text: "#ff9800"  },
  { bg: "rgba(255,71,87,0.15)",  border: "#ff4757", text: "#ff4757"  },
  { bg: "rgba(255,215,0,0.15)",  border: "#ffd700", text: "#ffd700"  },
  { bg: "rgba(100,200,255,0.15)",border: "#64c8ff", text: "#64c8ff"  },
  { bg: "rgba(255,100,200,0.15)",border: "#ff64c8", text: "#ff64c8"  },
];

function getAvatarColor(nombre: string) {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(nombre: string) {
  const words = nombre.trim().split(" ");
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return nombre.slice(0, 2).toUpperCase();
}

/* ══════════════════════════════════════════════════════
   BURBUJA DE JUGADOR — usada en lobby Y en juego
══════════════════════════════════════════════════════ */
interface BurbujaProps {
  nombre:     string;
  esHost?:    boolean;
  esYo?:      boolean;
  size?:      "sm" | "md" | "lg";
  puntos?:    number;
  showPuntos?: boolean;
}

export function BurbujaJugador({ nombre, esHost, esYo, size = "md", puntos, showPuntos }: BurbujaProps) {
  const color = getAvatarColor(nombre);
  const initials = getInitials(nombre);

  const sizes = {
    sm: { outer: "w-10 h-10", text: "text-xs",  font: "text-[10px]", badge: "w-4 h-4" },
    md: { outer: "w-14 h-14", text: "text-sm",  font: "text-xs",     badge: "w-5 h-5" },
    lg: { outer: "w-20 h-20", text: "text-base",font: "text-sm",     badge: "w-6 h-6" },
  };
  const s = sizes[size];

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        {/* Glow ring cuando es yo */}
        {esYo && (
          <motion.div
            animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`absolute inset-0 rounded-full pointer-events-none`}
            style={{ boxShadow: `0 0 0 3px ${color.border}60`, borderRadius: "50%" }}
          />
        )}

        {/* Avatar circular */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`${s.outer} rounded-full flex items-center justify-center font-black relative`}
          style={{
            background: color.bg,
            border: `2px solid ${color.border}`,
            boxShadow: esYo ? `0 0 16px ${color.border}55` : "none",
          }}
        >
          <span className={`${s.text} font-black`} style={{ color: color.text }}>
            {initials}
          </span>
        </motion.div>

        {/* Corona del host */}
        {esHost && (
          <div className={`absolute -top-2 -right-1 ${s.badge} rounded-full bg-[#ffd700] flex items-center justify-center`}
            style={{ boxShadow: "0 0 8px rgba(255,215,0,0.6)" }}>
            <Crown size={10} className="text-black" />
          </div>
        )}

        {/* Indicador online */}
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#00ff88] border-2 border-[#0f1425]"
          style={{ boxShadow: "0 0 6px rgba(0,255,136,0.8)" }} />
      </div>

      {/* Nombre */}
      <div className="text-center max-w-[70px]">
        <p className={`${s.font} font-bold truncate`} style={{ color: esYo ? color.text : "rgba(255,255,255,0.85)" }}>
          {nombre}
          {esYo && <span className="ml-0.5 opacity-60">(tú)</span>}
        </p>
        {showPuntos && puntos !== undefined && (
          <p className="text-[10px] font-bold text-[#ffd700]">{puntos} pts</p>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   LOBBY — sala de espera
══════════════════════════════════════════════════════ */
interface LobbyProps {
  sala:         SalaInfo;
  esHost:       boolean;
  nombrePropio: string;
  conectando:   boolean;
  onIniciar:    () => void;
  onSalir:      () => void;
}

export function MultiLobby({ sala, esHost, nombrePropio, conectando, onIniciar, onSalir }: LobbyProps) {
  const [copiado, setCopiado] = React.useState(false);

  function copiarCodigo() {
    navigator.clipboard?.writeText(sala.codigo).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  const puedeIniciar = esHost && sala.jugadores.length >= 1 && !conectando;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-['Press_Start_2P'] text-base text-[#a78bfa]">SALA DE ESPERA</h1>
          <p className="text-gray-400 text-sm mt-1 font-bold">{sala.nombre}</p>
        </div>
        <button onClick={onSalir}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-400 border border-white/10 hover:border-red-500/40 hover:text-red-400 transition-all">
          <LogOut size={14} /> Salir
        </button>
      </div>

      {/* Código de sala */}
      <div className="relative overflow-hidden rounded-2xl border-2 mb-6 p-5"
        style={{ background: "linear-gradient(135deg,rgba(0,229,255,0.05),rgba(167,139,250,0.07))", borderColor: "rgba(167,139,250,0.35)" }}>
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(circle,#00e5ff,transparent)", transform: "translate(30%,-30%)" }} />

        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Codigo de sala</p>
        <div className="flex items-center justify-between">
          <span className="font-['Press_Start_2P'] text-3xl tracking-[0.2em]"
            style={{ background: "linear-gradient(135deg,#00e5ff,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {sala.codigo}
          </span>
          <button onClick={copiarCodigo}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              color:      copiado ? "#00ff88" : "#00e5ff",
              background: copiado ? "rgba(0,255,136,0.1)" : "rgba(0,229,255,0.1)",
              border:     `1.5px solid ${copiado ? "rgba(0,255,136,0.4)" : "rgba(0,229,255,0.3)"}`,
            }}>
            {copiado ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
          </button>
        </div>

        <div className="flex gap-4 mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
            <Clock size={12} className="text-[#ffd700]" />
            <span className="text-[#ffd700]">{sala.tiempoPorPregunta}s</span> por pregunta
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
            <HelpCircle size={12} className="text-[#ff9800]" />
            <span className="text-[#ff9800]">{sala.cantPreguntas}</span> preguntas
          </div>
        </div>
      </div>

      {/* ═══ JUGADORES — burbujas visuales ═══ */}
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

        {/* Grid de burbujas */}
        <div className="flex flex-wrap justify-center gap-6 py-2">
          <AnimatePresence>
            {sala.jugadores.map((j, i) => (
              <motion.div key={j.nombre}
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: i * 0.07, type: "spring", stiffness: 260, damping: 20 }}>
                <BurbujaJugador
                  nombre={j.nombre}
                  esHost={i === 0}
                  esYo={j.nombre === nombrePropio}
                  size="md"
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Slots vacíos */}
          {Array.from({ length: Math.max(0, 4 - sala.jugadores.length) }).map((_, i) => (
            <motion.div key={`empty-${i}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                <span className="text-gray-700 text-xs font-bold">?</span>
              </div>
              <p className="text-[10px] text-gray-700 font-bold">Esperando</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Botón iniciar o mensaje espera */}
      {esHost ? (
        <motion.button
          whileHover={puedeIniciar ? { scale: 1.02, y: -2 } : {}}
          whileTap={puedeIniciar ? { scale: 0.98 } : {}}
          onClick={puedeIniciar ? onIniciar : undefined}
          disabled={!puedeIniciar}
          className="w-full py-5 rounded-2xl font-['Press_Start_2P'] text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          style={{ background: "linear-gradient(135deg,#a78bfa,#7c3aed)", boxShadow: "0 4px 24px rgba(167,139,250,0.35)" }}>
          {conectando
            ? <><Loader2 size={18} className="animate-spin" /> Iniciando...</>
            : <><Play size={18} /> Iniciar juego</>}
        </motion.button>
      ) : (
        <div className="flex items-center justify-center gap-3 py-5 rounded-2xl border-2 border-white/8"
          style={{ background: "rgba(255,255,255,0.02)" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Loader2 size={18} className="text-[#a78bfa]" />
          </motion.div>
          <span className="text-sm font-bold text-gray-400">Esperando que el host inicie...</span>
        </div>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════
   MINI-BARRA DE JUGADORES en partida (topbar del juego)
══════════════════════════════════════════════════════ */
interface MiniPlayersProps {
  jugadores:    { nombre: string; puntos: number }[];
  nombrePropio: string;
}

export function MiniJugadores({ jugadores, nombrePropio }: MiniPlayersProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {jugadores.map((j) => {
        const color = getAvatarColor(j.nombre);
        const esYo  = j.nombre === nombrePropio;
        return (
          <div key={j.nombre} className="flex items-center gap-1.5 px-2 py-1 rounded-full flex-shrink-0"
            style={{
              background: esYo ? color.bg : "rgba(255,255,255,0.04)",
              border: `1.5px solid ${esYo ? color.border : "rgba(255,255,255,0.1)"}`,
            }}>
            {/* Mini avatar */}
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0"
              style={{ background: color.bg, border: `1px solid ${color.border}`, color: color.text }}>
              {getInitials(j.nombre)}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold truncate max-w-[60px]" style={{ color: esYo ? color.text : "rgba(255,255,255,0.7)" }}>
                {j.nombre}
              </p>
              <p className="text-[9px] text-[#ffd700] font-bold">{j.puntos}pts</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   RANKING FINAL
══════════════════════════════════════════════════════ */
interface RankingProps {
  ranking:        RankingItem[];
  nombrePropio:   string;
  onJugarDeNuevo: () => void;
  onSalir:        () => void;
}

export function MultiRanking({ ranking, nombrePropio, onJugarDeNuevo, onSalir }: RankingProps) {
  const medallas    = ["🥇", "🥈", "🥉"];
  const tuPuesto    = ranking.findIndex((r) => r.nombre === nombrePropio);
  const tuData      = ranking[tuPuesto];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mx-auto px-4 py-8">

      <h1 className="font-['Press_Start_2P'] text-xl text-center mb-2"
        style={{ background: "linear-gradient(135deg,#ffd700,#ff9800)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        RESULTADOS
      </h1>
      <p className="text-center text-gray-400 text-sm font-bold mb-8">Partida finalizada</p>

      {/* Podio top 3 */}
      {ranking.length >= 1 && (
        <div className="flex items-end justify-center gap-4 mb-8">
          {/* 2do */}
          {ranking[1] && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-2">
              <BurbujaJugador nombre={ranking[1].nombre} esYo={ranking[1].nombre === nombrePropio} size="sm" />
              <div className="w-16 h-12 rounded-t-lg flex items-center justify-center font-['Press_Start_2P'] text-xs text-white"
                style={{ background: "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.3)" }}>
                🥈
              </div>
            </motion.div>
          )}
          {/* 1ro */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex flex-col items-center gap-2">
            <BurbujaJugador nombre={ranking[0].nombre} esYo={ranking[0].nombre === nombrePropio} size="lg" />
            <div className="w-20 h-16 rounded-t-lg flex items-center justify-center font-['Press_Start_2P'] text-sm text-white"
              style={{ background: "rgba(255,215,0,0.2)", border: "1px solid rgba(255,215,0,0.4)" }}>
              🥇
            </div>
          </motion.div>
          {/* 3ro */}
          {ranking[2] && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="flex flex-col items-center gap-2">
              <BurbujaJugador nombre={ranking[2].nombre} esYo={ranking[2].nombre === nombrePropio} size="sm" />
              <div className="w-16 h-10 rounded-t-lg flex items-center justify-center font-['Press_Start_2P'] text-xs text-white"
                style={{ background: "rgba(255,152,0,0.2)", border: "1px solid rgba(255,152,0,0.3)" }}>
                🥉
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Tu posicion */}
      {tuPuesto >= 0 && tuData && (
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
          className="rounded-2xl border-2 p-4 mb-5 text-center"
          style={{
            background:  tuPuesto === 0 ? "rgba(255,215,0,0.08)" : "rgba(167,139,250,0.06)",
            borderColor: tuPuesto === 0 ? "rgba(255,215,0,0.35)" : "rgba(167,139,250,0.25)",
          }}>
          <p className="text-2xl mb-1">{medallas[tuPuesto] ?? `#${tuPuesto + 1}`}</p>
          <p className="font-['Press_Start_2P'] text-lg text-white">{tuData.puntos} pts</p>
          <p className="text-xs text-gray-500 font-bold mt-1">
            {tuPuesto === 0 ? "Ganaste la partida!" : tuPuesto === 1 ? "Segundo lugar" : `Puesto #${tuPuesto + 1}`}
          </p>
        </motion.div>
      )}

      {/* Tabla completa */}
      <div className="rounded-2xl border-2 border-white/8 bg-[#0f1425] overflow-hidden mb-6">
        {ranking.map((r, i) => {
          const esYo = r.nombre === nombrePropio;
          const color = getAvatarColor(r.nombre);
          return (
            <div key={r.nombre}
              className="flex items-center gap-4 px-5 py-4 border-b border-white/5 last:border-0"
              style={{ background: esYo ? `${color.bg}` : "transparent" }}>
              <span className="text-xl w-7 text-center">{medallas[i] ?? `#${i + 1}`}</span>
              {/* Mini avatar */}
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
                style={{ background: color.bg, border: `2px solid ${color.border}`, color: color.text }}>
                {getInitials(r.nombre)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: esYo ? color.text : "white" }}>
                  {r.nombre} {esYo && <span className="text-xs opacity-60">(tú)</span>}
                </p>
                <p className="text-xs text-gray-500">{r.correctas} correctas</p>
              </div>
              <span className="font-['Press_Start_2P'] text-base text-[#ffd700]">{r.puntos}</span>
            </div>
          );
        })}
      </div>

      <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
        onClick={onJugarDeNuevo}
        className="w-full py-4 rounded-2xl font-['Press_Start_2P'] text-sm text-white mb-3"
        style={{ background: "linear-gradient(135deg,#a78bfa,#7c3aed)", boxShadow: "0 4px 20px rgba(167,139,250,0.3)" }}>
        Jugar de nuevo
      </motion.button>
      <button onClick={onSalir}
        className="w-full py-4 rounded-2xl font-bold text-sm text-gray-400 border-2 border-white/10 hover:border-white/25 hover:text-white transition-all">
        Salir al menu
      </button>
    </motion.div>
  );
}
