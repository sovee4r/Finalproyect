import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Calculator, FlaskConical, BookOpen, Globe2,
  Brain, Trophy, Users, Shield, Rocket, Sword,
  Coins, Clock, Lock, ChevronDown, Play,
  HelpCircle, Star, User, Copy, Check
} from "lucide-react";
import { cn } from "../../lib/utils";

/* ─── LEADERBOARD ─── */
const LEADERBOARD = [
  { rank: 1, name: "AlexMaster",  subject: "Matematicas", score: 1250 },
  { rank: 2, name: "SaraGenius",  subject: "Ciencias",    score: 1180 },
  { rank: 3, name: "LuisPro",     subject: "Lengua",      score: 1050 },
  { rank: 4, name: "MariaBrain",  subject: "Sociales",    score: 980  },
  { rank: 5, name: "CarlosSmart", subject: "Matematicas", score: 920  },
];

/* ─── TIPOS ─── */
interface GameEntry {
  id: string;
  title: string;
  description: string;
  grade: 4 | 5 | 6;
  available: boolean;
  route?: string;
  difficulty: "Facil" | "Medio" | "Dificil";
  questions: number;
  time: number;
  subject: string;
}

const diffColor: Record<string, string> = {
  Facil:   "#00ff88",
  Medio:   "#ffd700",
  Dificil: "#DC143C",
};

type IconComp = React.ComponentType<{ size?: number; className?: string }>;

const subjectCfg: Record<string, { color: string; Icon: IconComp; label: string; coins: number; time: string }> = {
  math:     { color: "#4169E1", Icon: Calculator,  label: "MATEMATICAS", coins: 250, time: "15m" },
  science:  { color: "#228B22", Icon: FlaskConical, label: "CIENCIAS",   coins: 200, time: "12m" },
  language: { color: "#DAA520", Icon: BookOpen,     label: "LENGUA",     coins: 180, time: "10m" },
  social:   { color: "#DC143C", Icon: Globe2,       label: "SOCIALES",   coins: 220, time: "13m" },
};

const ALL_GAMES: GameEntry[] = [
  { id:"ql4",  subject:"language", title:"Quiz de Lengua",      grade:4, available:true,  route:"/games/language/quiz/4", description:"Lectura, escritura, gramatica y vocabulario.",  difficulty:"Facil",   questions:6,  time:15 },
  { id:"ql5",  subject:"language", title:"Quiz de Lengua",      grade:5, available:false,  description:"Comprension lectora y redaccion avanzada.",     difficulty:"Medio",   questions:8,  time:20 },
  { id:"ql6",  subject:"language", title:"Quiz de Lengua",      grade:6, available:false,  description:"Literatura, composicion y comunicacion.",       difficulty:"Dificil", questions:10, time:20 },
  { id:"qm4",  subject:"math",     title:"Quiz de Matematicas", grade:4, available:false,  description:"Operaciones basicas y fracciones.",             difficulty:"Facil",   questions:6,  time:20 },
  { id:"qm5",  subject:"math",     title:"Quiz de Matematicas", grade:5, available:false,  description:"Decimales, porcentajes y geometria.",           difficulty:"Medio",   questions:8,  time:25 },
  { id:"qm6",  subject:"math",     title:"Quiz de Matematicas", grade:6, available:false,  description:"Algebra basica y estadistica.",                 difficulty:"Dificil", questions:10, time:30 },
  { id:"qs4",  subject:"science",  title:"Quiz de Ciencias",    grade:4, available:false,  description:"Seres vivos, cuerpo humano y ambiente.",        difficulty:"Facil",   questions:6,  time:15 },
  { id:"qs5",  subject:"science",  title:"Quiz de Ciencias",    grade:5, available:false,  description:"Ecosistemas, materia y energia.",              difficulty:"Medio",   questions:8,  time:20 },
  { id:"qs6",  subject:"science",  title:"Quiz de Ciencias",    grade:6, available:false,  description:"Fisica, quimica y ciencias de la tierra.",     difficulty:"Dificil", questions:10, time:25 },
  { id:"qso4", subject:"social",   title:"Quiz de Sociales",    grade:4, available:false,  description:"Historia dominicana, geografia y valores.",     difficulty:"Facil",   questions:6,  time:15 },
  { id:"qso5", subject:"social",   title:"Quiz de Sociales",    grade:5, available:false,  description:"Latinoamerica, economia y cultura.",           difficulty:"Medio",   questions:8,  time:20 },
  { id:"qso6", subject:"social",   title:"Quiz de Sociales",    grade:6, available:false,  description:"Historia mundial y ciudadania global.",         difficulty:"Dificil", questions:10, time:20 },
];

const GRADES = [4, 5, 6] as const;

/* ══════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════ */
export function Games() {
  const { subject } = useParams();
  const navigate    = useNavigate();

  // Secciones colapsables
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 4: true, 5: true, 6: true });

  // Filtrar juegos si hay subject param, si no mostrar todos
  const filteredGames = subject
    ? ALL_GAMES.filter(g => g.subject === subject)
    : ALL_GAMES;

  const pageTitle = subject
    ? (subjectCfg[subject]?.label ?? "JUEGOS")
    : "TODOS LOS JUEGOS";

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-20">


      {/* ── HERO ── */}
      <section className="text-center py-10 md:py-14 mb-8">
        <motion.h1
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="font-['Press_Start_2P'] text-3xl md:text-5xl text-[#00ff88] mb-4"
          style={{ textShadow: "0 0 20px rgba(0,255,136,0.6)" }}
        >
          {pageTitle}
        </motion.h1>
        <p className="text-[#ffd700] font-['Press_Start_2P'] text-xs md:text-sm max-w-2xl mx-auto leading-relaxed">
          Elige una materia y demuestra tus conocimientos para ganar monedas
        </p>
      </section>

      {/* ── MATERIAS (tarjetas grandes) ── */}
      {!subject && (
        <section className="mb-16">
          <SectionTitle title="MATERIAS" color="#00ff88" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {Object.entries(subjectCfg).map(([key, cfg]) => (
              <motion.div
                key={key}
                whileHover={{ y: -5 }}
                onClick={() => navigate(`/games/${key}`)}
                className="group relative bg-[#0f1425] border-2 border-transparent rounded-xl p-6 cursor-pointer overflow-hidden transition-all shadow-lg"
                style={{ borderColor: `${cfg.color}40` }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = cfg.color)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = `${cfg.color}40`)}
              >
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                  <cfg.Icon size={64} />
                </div>
                <div className="relative z-10 flex flex-col gap-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: cfg.color }}>
                    <cfg.Icon size={24} />
                  </div>
                  <h3 className="font-['Press_Start_2P'] text-sm text-white">{cfg.label}</h3>
                  <div className="flex items-center gap-4 text-xs font-bold text-[#00d9ff]">
                    <span className="flex items-center gap-1"><Coins size={12}/> {cfg.coins}</span>
                    <span className="flex items-center gap-1"><Clock size={12}/> {cfg.time}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── JUEGOS POR GRADO (todas las materias o la filtrada) ── */}
      <section className="mb-16">
        <SectionTitle title={subject ? "JUEGOS DISPONIBLES" : "JUEGOS POR GRADO"} color="#00d9ff" />

        {Object.entries(subjectCfg)
          .filter(([key]) => !subject || key === subject)
          .map(([subjectKey, cfg]) => {
            const subGames = filteredGames.filter(g => g.subject === subjectKey);
            if (subGames.length === 0) return null;
            return (
              <div key={subjectKey} className="mb-10">
                {/* Título de materia */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: cfg.color }}>
                    <cfg.Icon size={16} />
                  </div>
                  <h3 className="font-['Press_Start_2P'] text-sm" style={{ color: cfg.color }}>{cfg.label}</h3>
                  <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg,${cfg.color}50,transparent)` }} />
                </div>

                {/* Por grado */}
                {GRADES.map(grade => {
                  const gradeGames = subGames.filter(g => g.grade === grade);
                  const isOpen = expanded[grade];
                  return (
                    <div key={grade} className="mb-4">
                      <button
                        onClick={() => setExpanded(e => ({ ...e, [grade]: !e[grade] }))}
                        className="flex items-center gap-3 mb-3 w-full group"
                      >
                        <span className="text-sm font-extrabold text-gray-500 tracking-widest uppercase group-hover:text-white transition-colors">
                          {grade}to Grado
                        </span>
                        <div className="flex-1 h-px bg-white/6" />
                        <ChevronDown size={14} className="text-gray-600 transition-transform"
                          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-2">
                              {gradeGames.map(game => (
                                <SmallGameCard
                                  key={game.id}
                                  game={game}
                                  color={cfg.color}
                                  Icon={cfg.Icon}
                                  onPlay={() => game.available && game.route && navigate(game.route)}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            );
          })}
      </section>

      {/* ── MODOS ── */}
      <section className="mb-16">
        <SectionTitle title="MODOS" color="#00d9ff" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ModeCard badge="POPULAR" title="NORMAL"       desc="Sin presion de tiempo. Perfecto para practicar y aprender." icon={<Brain size={28}/>}  color="#00d9ff" />
          <ModeCard badge="HOT"     title="COMPETENCIA"  desc="Ranking mundial en vivo. Solo los mejores ganan."           icon={<Trophy size={28}/>} color="#ff1b8d" isHot />
          <ModeCard badge="NEW"     title="MULTIJUGADOR" desc="Desafia a tus amigos en tiempo real."                       icon={<Users size={28}/>}  color="#00ff88" isNew />
        </div>
      </section>

      {/* ── DIFICULTAD ── */}
      <section className="mb-16">
        <SectionTitle title="DIFICULTAD" color="#ff1b8d" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DiffCard title="FACIL"   icon={<Shield size={32}/>} level={1} color="#00ff88" />
          <DiffCard title="MEDIO"   icon={<Rocket size={32}/>} level={2} color="#ffd700" />
          <DiffCard title="DIFICIL" icon={<Sword  size={32}/>} level={3} color="#DC143C" />
        </div>
      </section>

      {/* ── LEADERBOARD ── */}
      <section>
        <SectionTitle title="TOP JUGADORES" color="#ffd700" />
        <div className="bg-[#0f1425] border-4 border-[#00d9ff] rounded-xl p-6 shadow-[0_0_30px_rgba(0,217,255,0.15)]">
          <div className="space-y-3">
            {LEADERBOARD.map((player, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                className={cn(
                  "flex items-center p-3 rounded-lg border transition-all hover:translate-x-1",
                  i === 0 ? "border-[#ffd700] bg-[#ffd700]/10" :
                  i === 1 ? "border-gray-400 bg-gray-400/10" :
                  i === 2 ? "border-[#cd7f32] bg-[#cd7f32]/10" :
                  "border-white/10 bg-[#1a1f35]"
                )}
              >
                <div className="w-10 text-center font-['Press_Start_2P'] text-base"
                  style={{ color: i === 0 ? "#ffd700" : i === 1 ? "#aaa" : i === 2 ? "#cd7f32" : "#fff" }}>
                  {i + 1}
                </div>
                <div className="flex-1 px-3">
                  <div className="font-['Press_Start_2P'] text-xs md:text-sm text-white">{player.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{player.subject}</div>
                </div>
                <div className="flex items-center gap-1.5 font-['Press_Start_2P'] text-sm text-[#00ff88]">
                  <Coins size={13} className="text-[#ffd700]"/> {player.score}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── PEQUEÑA TARJETA DE JUEGO CON CANDADO ── */
function SmallGameCard({ game, color, Icon, onPlay }: { game: GameEntry; color: string; Icon: IconComp; onPlay: () => void }) {
  const [tooltip, setTooltip] = useState(false);

  return (
    <div className="relative">
      <motion.div
        whileHover={game.available ? { y: -4, scale: 1.01 } : {}}
        onClick={onPlay}
        onMouseEnter={() => !game.available && setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
        className={cn(
          "relative overflow-hidden rounded-xl border-2 transition-all",
          game.available ? "cursor-pointer" : "cursor-not-allowed"
        )}
        style={{
          background:  game.available ? `${color}08` : "rgba(255,255,255,0.02)",
          borderColor: game.available ? `${color}50` : "rgba(255,255,255,0.08)",
          boxShadow:   game.available ? `0 4px 20px ${color}20` : "none",
          opacity:     game.available ? 1 : 0.5,
        }}
      >
        {/* Candado overlay para no disponibles */}
        {!game.available && (
          <div className="absolute inset-0 flex items-end justify-end p-3 z-10 pointer-events-none">
            <div className="w-7 h-7 rounded-lg bg-[#1a1f35] border border-white/20 flex items-center justify-center">
              <Lock size={14} className="text-gray-400"/>
            </div>
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
              style={{ background: game.available ? color : "rgba(255,255,255,0.1)" }}>
              <Icon size={18} />
            </div>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full"
              style={{ background: `${diffColor[game.difficulty]}15`, color: diffColor[game.difficulty], border: `1px solid ${diffColor[game.difficulty]}30` }}>
              {game.difficulty}
            </span>
          </div>

          <p className="font-['Press_Start_2P'] text-xs mb-1" style={{ color: game.available ? color : "rgba(255,255,255,0.2)" }}>
            {game.title}
          </p>
          <p className="text-gray-500 text-xs font-bold mb-2">{game.grade}to Grado</p>
          <p className="text-gray-400 text-xs leading-relaxed mb-3">{game.description}</p>

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs font-bold text-gray-500"><HelpCircle size={11}/> {game.questions}</span>
              <span className="flex items-center gap-1 text-xs font-bold text-gray-500"><Clock size={11}/> {game.time}s</span>
            </div>
            {game.available
              ? <span className="flex items-center gap-1 text-xs font-bold" style={{ color }}><Play size={11} className="fill-current"/> Jugar</span>
              : <span className="flex items-center gap-1 text-xs font-bold text-gray-600"><Lock size={11}/> Bloqueado</span>
            }
          </div>
        </div>
      </motion.div>

      {/* Tooltip "No disponible" */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none"
          >
            <div className="bg-[#0f1425] border border-white/25 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-xl whitespace-nowrap">
              <Lock size={11} className="text-gray-400"/>
              <span className="text-xs font-bold text-gray-300">No disponible</span>
            </div>
            <div className="w-2 h-2 bg-[#0f1425] border-r border-b border-white/20 rotate-45 mx-auto -mt-1"/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── HELPERS ── */
function SectionTitle({ title, color }: { title: string; color: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <h2 className="font-['Press_Start_2P'] text-xl whitespace-nowrap" style={{ color }}>{title}</h2>
      <div className="h-1 flex-1 rounded-full" style={{ background: `${color}30` }} />
    </div>
  );
}

function ModeCard({ badge, title, desc, icon, color, isHot, isNew }: any) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative bg-[#1a1f35] border border-white/10 p-6 rounded-xl hover:bg-[#0f1425] transition-all cursor-pointer group"
      onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
    >
      <div className={cn(
        "absolute top-3 right-3 px-2 py-0.5 font-['Press_Start_2P'] text-[8px] rounded",
        isHot ? "bg-[#ff1b8d] text-white" : isNew ? "bg-[#00ff88] text-[#0f1425]" : "bg-[#00d9ff] text-[#0f1425]"
      )}>{badge}</div>
      <div className="flex items-center gap-4">
        <div style={{ color }} className="group-hover:scale-110 transition-transform">{icon}</div>
        <div>
          <h3 className="font-['Press_Start_2P'] text-sm text-white mb-1">{title}</h3>
          <p className="text-gray-400 text-xs leading-snug">{desc}</p>
        </div>
      </div>
    </motion.div>
  );
}

function DiffCard({ title, icon, level, color }: any) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="bg-[#1a1f35] border border-white/10 p-5 rounded-xl flex items-center justify-between cursor-pointer transition-all"
      onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
    >
      <div className="flex items-center gap-3">
        <div className="text-white">{icon}</div>
        <h3 className="font-['Press_Start_2P'] text-xs" style={{ color }}>{title}</h3>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3].map(i => (
          <div key={i} className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: i <= level ? color : "rgba(255,255,255,0.15)" }} />
        ))}
      </div>
    </motion.div>
  );
}
