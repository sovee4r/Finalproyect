import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sword, Wand2, Target, Skull, Shield, Moon, CheckCircle, RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";

const characters = [
  {
    id: 1,
    name: "Guerrero",
    emoji: "⚔️",
    icon: <Sword size={28} />,
    description: "Fuerte en combate cuerpo a cuerpo",
    color: "#4169E1",
    stats: { fuerza: 95, magia: 20, velocidad: 60, defensa: 80 },
  },
  {
    id: 2,
    name: "Mago",
    emoji: "🧙",
    icon: <Wand2 size={28} />,
    description: "Domina la magia elemental",
    color: "#8a2be2",
    stats: { fuerza: 30, magia: 95, velocidad: 55, defensa: 40 },
  },
  {
    id: 3,
    name: "Arquero",
    emoji: "🏹",
    icon: <Target size={28} />,
    description: "Preciso ataque a distancia",
    color: "#228B22",
    stats: { fuerza: 55, magia: 40, velocidad: 90, defensa: 50 },
  },
  {
    id: 4,
    name: "Asesino",
    emoji: "🗡️",
    icon: <Skull size={28} />,
    description: "Rápido y sigiloso",
    color: "#DC143C",
    stats: { fuerza: 70, magia: 30, velocidad: 95, defensa: 35 },
  },
  {
    id: 5,
    name: "Paladín",
    emoji: "⛑️",
    icon: <Shield size={28} />,
    description: "Defensor con poderes divinos",
    color: "#DAA520",
    stats: { fuerza: 75, magia: 60, velocidad: 40, defensa: 95 },
  },
  {
    id: 6,
    name: "Nigromante",
    emoji: "💀",
    icon: <Moon size={28} />,
    description: "Controla las fuerzas oscuras",
    color: "#00d9ff",
    stats: { fuerza: 45, magia: 90, velocidad: 65, defensa: 45 },
  },
];

const StatBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="mb-3">
    <div className="flex justify-between mb-1">
      <span className="font-['Press_Start_2P'] text-[9px] text-gray-400">{label}</span>
      <span className="font-['Press_Start_2P'] text-[9px]" style={{ color }}>{value}</span>
    </div>
    <div className="h-2 bg-[#0f1425] rounded-full overflow-hidden border border-white/10">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
      />
    </div>
  </div>
);

export function Character() {
  const [selected, setSelected] = useState<typeof characters[0] | null>(null);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedData = localStorage.getItem("saberix_character");
    if (savedData) {
      const found = characters.find((c) => c.id === JSON.parse(savedData).id);
      if (found) setSelected(found);
    }
  }, []);

  const handleSave = () => {
    if (!selected) return;
    localStorage.setItem("saberix_character", JSON.stringify({ id: selected.id }));
    setSaved(true);
    setMessage(`¡${selected.name} guardado!`);
    setTimeout(() => {
      setSaved(false);
      setMessage("");
    }, 3000);
  };

  const handleClear = () => {
    setSelected(null);
    localStorage.removeItem("saberix_character");
    setMessage("Selección limpiada");
    setTimeout(() => setMessage(""), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-20">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center py-10"
      >
        <h1 className="font-['Press_Start_2P'] text-3xl md:text-4xl text-[#00ff88] mb-3 drop-shadow-[0_0_20px_rgba(0,255,136,0.8)]">
          SELECTOR DE
        </h1>
        <h1 className="font-['Press_Start_2P'] text-3xl md:text-4xl text-[#00ff88] mb-6 drop-shadow-[0_0_20px_rgba(0,255,136,0.8)]">
          PERSONAJES
        </h1>
        <p className="font-['Press_Start_2P'] text-xs text-[#00d9ff] drop-shadow-[0_0_5px_rgba(0,217,255,0.5)]">
          Elige tu guerrero favorito
        </p>
      </motion.div>

      {/* Mensaje */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center font-['Press_Start_2P'] text-xs text-[#00ff88] mb-6 drop-shadow-[0_0_10px_rgba(0,255,136,0.8)]"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layout principal */}
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Grid de personajes */}
        <div className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {characters.map((char, i) => (
              <motion.div
                key={char.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -5 }}
                onClick={() => setSelected(char)}
                className={cn(
                  "relative bg-[#0f1425] border-2 rounded-xl p-5 cursor-pointer transition-all overflow-hidden group",
                  selected?.id === char.id
                    ? "border-[var(--col)] shadow-[0_0_25px_var(--col-shadow)]"
                    : "border-white/10 hover:border-[var(--col)]"
                )}
                style={{
                  "--col": char.color,
                  "--col-shadow": `${char.color}60`,
                } as any}
              >
                {/* Indicador de seleccionado */}
                {selected?.id === char.id && (
                  <motion.div
                    layoutId="selectedBadge"
                    className="absolute top-2 right-2 text-[#00ff88]"
                  >
                    <CheckCircle size={16} />
                  </motion.div>
                )}

                {/* Fondo decorativo */}
                <div
                  className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity"
                  style={{ backgroundColor: char.color }}
                />

                {/* Emoji grande */}
                <div className="text-5xl text-center mb-3 filter drop-shadow-lg">
                  {char.emoji}
                </div>

                <h3
                  className="font-['Press_Start_2P'] text-xs text-center mb-2"
                  style={{ color: char.color }}
                >
                  {char.name}
                </h3>
                <p className="text-gray-500 text-[9px] text-center leading-relaxed font-['Inter']">
                  {char.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Panel de preview */}
        <div className="w-full lg:w-80 shrink-0">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0f1425] rounded-xl overflow-hidden sticky top-4"
                style={{ borderWidth: 3, borderStyle: "solid", borderColor: selected.color, boxShadow: `0 0 30px ${selected.color}40` }}
              >
                {/* Header del preview */}
                <div
                  className="p-6 text-center"
                  style={{ background: `linear-gradient(135deg, ${selected.color}20, transparent)` }}
                >
                  <div className="text-7xl mb-4 filter drop-shadow-lg">{selected.emoji}</div>
                  <h2
                    className="font-['Press_Start_2P'] text-lg mb-2"
                    style={{ color: selected.color, textShadow: `0 0 15px ${selected.color}` }}
                  >
                    {selected.name}
                  </h2>
                  <p className="text-gray-400 text-xs font-['Inter']">{selected.description}</p>
                </div>

                {/* Stats */}
                <div className="p-6 border-t border-white/10">
                  <h3 className="font-['Press_Start_2P'] text-[10px] text-[#00d9ff] mb-4">
                    ESTADÍSTICAS
                  </h3>
                  <StatBar label="FUERZA" value={selected.stats.fuerza} color={selected.color} />
                  <StatBar label="MAGIA" value={selected.stats.magia} color={selected.color} />
                  <StatBar label="VELOCIDAD" value={selected.stats.velocidad} color={selected.color} />
                  <StatBar label="DEFENSA" value={selected.stats.defensa} color={selected.color} />
                </div>

                {/* Botones */}
                <div className="p-4 border-t border-white/10 flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    className="flex-1 font-['Press_Start_2P'] text-[9px] py-3 rounded text-white transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${selected.color}, ${selected.color}aa)`,
                      boxShadow: `0 4px 15px ${selected.color}50`,
                    }}
                  >
                    {saved ? "✓ GUARDADO" : "GUARDAR"}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClear}
                    className="px-4 py-3 rounded bg-[#1a1f35] border border-white/10 text-gray-400 hover:text-[#ff1b8d] hover:border-[#ff1b8d] transition-all"
                  >
                    <RefreshCw size={14} />
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#0f1425] border-2 border-dashed border-white/20 rounded-xl p-10 text-center sticky top-4"
              >
                <div className="text-5xl mb-4 opacity-30">⚔️</div>
                <p className="font-['Press_Start_2P'] text-[10px] text-gray-500 leading-relaxed">
                  Selecciona un personaje para ver sus detalles
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Info seleccionado bottom */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-8 p-4 border-2 rounded-xl text-center font-['Press_Start_2P'] text-xs"
            style={{ borderColor: selected.color, backgroundColor: `${selected.color}15` }}
          >
            Has seleccionado:{" "}
            <span style={{ color: selected.color, textShadow: `0 0 10px ${selected.color}` }}>
              {selected.name}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
