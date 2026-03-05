import React, { useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Calculator,
  FlaskConical,
  BookOpen,
  Globe2,
  Brain,
  Trophy,
  Users,
  Shield,
  Rocket,
  Sword,
  Coins,
  Clock,
  X
} from "lucide-react";
import { cn } from "../../lib/utils";

// Mock data
const LEADERBOARD = [
  { rank: 1, name: "AlexMaster", subject: "Matemáticas", score: 1250 },
  { rank: 2, name: "SaraGenius", subject: "Ciencias", score: 1180 },
  { rank: 3, name: "LuisPro", subject: "Lengua", score: 1050 },
  { rank: 4, name: "MariaBrain", subject: "Sociales", score: 980 },
  { rank: 5, name: "CarlosSmart", subject: "Matemáticas", score: 920 },
];

export function GamesHub() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = (subject: string) => {
    setSelectedGame(subject);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedGame(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-20">
      {/* Hero Section */}
      <section className="text-center py-10 md:py-16 relative overflow-hidden mb-8">
        <div className="relative z-10">
          <motion.h1 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-['Press_Start_2P'] text-3xl md:text-5xl lg:text-6xl text-[#00ff88] mb-4 drop-shadow-[0_0_20px_rgba(0,255,136,0.6)]"
          >
            SELECCIONA<br />TU JUEGO
          </motion.h1>
          <p className="text-[#ffd700] font-['Press_Start_2P'] text-xs md:text-sm max-w-2xl mx-auto leading-relaxed drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]">
            Elige una materia y demuestra tus conocimientos para ganar monedas
          </p>
        </div>
      </section>

      {/* Subjects Grid */}
      <section id="materias" className="mb-16">
        <div className="flex items-center gap-4 mb-8">
            <h2 className="font-['Press_Start_2P'] text-xl text-[#00ff88]">MATERIAS</h2>
            <div className="h-1 flex-1 bg-[#00ff88]/20 rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GameCard 
            title="MATEMÁTICAS" 
            desc="Números & Lógica"
            coins={250}
            time="15m"
            color="#4169E1"
            icon={<Calculator size={32} />}
            onClick={() => openModal("Matemáticas")}
          />
          <GameCard 
            title="CIENCIAS" 
            desc="Química & Física"
            coins={200}
            time="12m"
            color="#228B22"
            icon={<FlaskConical size={32} />}
            onClick={() => openModal("Ciencias")}
          />
          <GameCard 
            title="LENGUA" 
            desc="Gramática & Letras"
            coins={180}
            time="10m"
            color="#DAA520"
            icon={<BookOpen size={32} />}
            onClick={() => openModal("Lengua")}
          />
          <GameCard 
            title="SOCIALES" 
            desc="Historia & Geografía"
            coins={220}
            time="13m"
            color="#DC143C"
            icon={<Globe2 size={32} />}
            onClick={() => openModal("Sociales")}
          />
        </div>
      </section>

      {/* Game Modes */}
      <section className="mb-16">
        <div className="flex items-center gap-4 mb-8">
            <h2 className="font-['Press_Start_2P'] text-xl text-[#00d9ff]">MODOS</h2>
            <div className="h-1 flex-1 bg-[#00d9ff]/20 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ModeCard 
            badge="POPULAR"
            title="NORMAL"
            desc="Sin presión de tiempo."
            icon={<Brain size={28} />}
            color="#00d9ff"
          />
          <ModeCard 
            badge="HOT"
            title="COMPETENCIA"
            desc="Ranking mundial en vivo."
            icon={<Trophy size={28} />}
            color="#ff1b8d"
            isHot
          />
          <ModeCard 
            badge="NEW"
            title="MULTIJUGADOR"
            desc="Desafía a tus amigos."
            icon={<Users size={28} />}
            color="#00ff88"
            isNew
          />
        </div>
      </section>

      {/* Difficulty Levels */}
      <section className="mb-16">
        <div className="flex items-center gap-4 mb-8">
            <h2 className="font-['Press_Start_2P'] text-xl text-[#ff1b8d]">DIFICULTAD</h2>
            <div className="h-1 flex-1 bg-[#ff1b8d]/20 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DifficultyCard title="FÁCIL" icon={<Shield size={32} />} level={1} color="#00ff88" />
          <DifficultyCard title="MEDIO" icon={<Rocket size={32} />} level={2} color="#ffd700" />
          <DifficultyCard title="DIFÍCIL" icon={<Sword size={32} />} level={3} color="#DC143C" />
        </div>
      </section>

      {/* Leaderboard */}
      <section>
        <div className="bg-[#0f1425] border-4 border-[#00d9ff] rounded-xl p-6 shadow-[0_0_30px_rgba(0,217,255,0.15)]">
          <h2 className="font-['Press_Start_2P'] text-center text-lg text-[#00ff88] mb-6">TOP JUGADORES</h2>
          <div className="space-y-3">
            {LEADERBOARD.map((player, index) => (
                <div 
                key={index}
                className={cn(
                    "flex items-center p-3 rounded-lg border transition-all hover:translate-x-1",
                    index === 0 ? "border-[#ffd700] bg-[#ffd700]/10" :
                    index === 1 ? "border-gray-400 bg-gray-400/10" :
                    index === 2 ? "border-[#cd7f32] bg-[#cd7f32]/10" :
                    "border-white/10 bg-[#1a1f35]"
                )}
                >
                <div className="w-10 text-center font-['Press_Start_2P'] text-lg">
                    {index === 0 ? "1" : index === 1 ? "2" : index === 2 ? "3" : index + 1}
                </div>
                <div className="flex-1 px-3">
                    <div className="font-['Press_Start_2P'] text-[10px] md:text-xs text-white">{player.name}</div>
                    <div className="text-[10px] text-gray-400">{player.subject}</div>
                </div>
                <div className="flex items-center gap-1.5 font-['Press_Start_2P'] text-[10px] text-[#00ff88]">
                    <Coins size={12} className="text-[#ffd700]" />
                    {player.score}
                </div>
                </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f1425] border-4 border-[#00d9ff] w-full max-w-md rounded-xl shadow-[0_0_40px_rgba(0,217,255,0.5)] overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b-2 border-[#00d9ff]">
                <h2 className="font-['Press_Start_2P'] text-xs text-[#00ff88]">CONFIGURAR JUEGO</h2>
                <button onClick={closeModal} className="text-[#ff1b8d] hover:scale-110 transition-transform">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="font-['Press_Start_2P'] text-[10px] text-[#00d9ff] mb-2">MATERIA</h3>
                  <div className="bg-[#ffd700]/10 border border-[#ffd700] p-3 rounded text-center font-['Press_Start_2P'] text-sm text-[#ffd700]">
                    {selectedGame}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h3 className="font-['Press_Start_2P'] text-[10px] text-[#00d9ff] mb-2">MODO</h3>
                        <div className="flex flex-col gap-2">
                            {["Normal", "Ranked"].map(m => (
                            <button key={m} className="bg-[#1a1f35] border border-white/20 text-white text-[10px] py-2 rounded hover:border-[#00d9ff] hover:text-[#00d9ff] transition-colors font-['Press_Start_2P'] text-left px-3">
                                {m}
                            </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-['Press_Start_2P'] text-[10px] text-[#00d9ff] mb-2">DIFICULTAD</h3>
                        <div className="flex flex-col gap-2">
                            {["Fácil", "Difícil"].map(d => (
                            <button key={d} className="bg-[#1a1f35] border border-white/20 text-white text-[10px] py-2 rounded hover:border-[#00d9ff] hover:text-[#00d9ff] transition-colors font-['Press_Start_2P'] text-left px-3">
                                {d}
                            </button>
                            ))}
                        </div>
                    </div>
                </div>
              </div>

              <div className="p-4 border-t-2 border-[#00d9ff]">
                <button 
                  onClick={() => alert("¡Iniciando juego! (Simulación)")}
                  className="w-full bg-gradient-to-r from-[#ff1b8d] to-[#ff8c00] text-white font-['Press_Start_2P'] py-3 rounded text-xs shadow-lg hover:brightness-110 transition-all"
                >
                  ¡JUGAR!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-components for GamesHub

const GameCard = ({ title, desc, coins, time, color, icon, onClick }: any) => (
  <motion.div
    whileHover={{ y: -5 }}
    onClick={onClick}
    className="group relative bg-[#0f1425] border-2 border-transparent hover:border-[var(--color)] rounded-xl p-6 cursor-pointer overflow-hidden transition-all shadow-lg hover:shadow-[0_0_20px_var(--color-shadow)]"
    style={{ '--color': color, '--color-shadow': `${color}40` } as any}
  >
    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        {React.cloneElement(icon, { size: 60 })}
    </div>

    <div className="relative z-10 flex flex-col h-full">
      <div 
        className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-white shadow-lg"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      
      <h3 className="font-['Press_Start_2P'] text-sm mb-1 text-white">{title}</h3>
      <p className="text-gray-400 text-xs mb-4 font-['Inter']">{desc}</p>
      
      <div className="mt-auto flex items-center gap-4 text-xs font-bold text-[#00d9ff]">
        <span className="flex items-center gap-1"><Coins size={12} /> {coins}</span>
        <span className="flex items-center gap-1"><Clock size={12} /> {time}</span>
      </div>
    </div>
  </motion.div>
);

const ModeCard = ({ badge, title, desc, icon, color, isHot, isNew }: any) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="relative bg-[#1a1f35] border border-white/10 p-5 rounded-xl hover:bg-[#0f1425] hover:border-[var(--color)] transition-all cursor-pointer group"
    style={{ '--color': color } as any}
  >
    <div 
      className={cn(
        "absolute top-3 right-3 px-2 py-0.5 font-['Press_Start_2P'] text-[8px] rounded",
        isHot ? "bg-[#ff1b8d] text-white" :
        isNew ? "bg-[#00ff88] text-[#0f1425]" :
        "bg-[#00d9ff] text-[#0f1425]"
      )}
    >
      {badge}
    </div>
    
    <div className="flex items-center gap-4">
        <div className="text-[var(--color)] group-hover:scale-110 transition-transform" style={{ color }}>
            {icon}
        </div>
        <div>
            <h3 className="font-['Press_Start_2P'] text-xs text-white mb-1">{title}</h3>
            <p className="text-gray-400 text-[10px] leading-tight">{desc}</p>
        </div>
    </div>
  </motion.div>
);

const DifficultyCard = ({ title, icon, level, color }: any) => (
  <motion.div
    whileHover={{ y: -3 }}
    className="bg-[#1a1f35] border border-white/10 p-5 rounded-xl flex items-center justify-between cursor-pointer hover:border-[var(--color)] transition-all"
    style={{ '--color': color } as any}
  >
    <div className="flex items-center gap-3">
        <div className="text-white">{icon}</div>
        <h3 className="font-['Press_Start_2P'] text-xs text-white" style={{ color }}>{title}</h3>
    </div>
    <div className="flex gap-1">
      {[1, 2, 3].map((i) => (
        <div 
          key={i} 
          className={cn(
            "w-2 h-2 rounded-full",
            i <= level ? "opacity-100" : "opacity-20 bg-white"
          )}
          style={{ backgroundColor: i <= level ? color : undefined }}
        />
      ))}
    </div>
  </motion.div>
);
