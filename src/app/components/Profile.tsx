import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Target, TrendingUp, Clock, Trophy } from "lucide-react";
import { db } from "../../lib/db";

export function Profile() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Simular carga
    const loadData = async () => {
      await db.query("SELECT stats FROM user WHERE id = 1");
      setStats({
        gamesPlayed: 42,
        winRate: "68%",
        avgTime: "12m"
      });
    };
    loadData();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto pb-20">
      <div className="text-center mb-10">
        <h1 className="font-['Press_Start_2P'] text-[#ffd700] text-2xl md:text-3xl mb-2 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
            TU PERFIL
        </h1>
        <p className="text-gray-400 text-xs md:text-sm">Estadísticas de tu rendimiento en Saberix</p>
      </div>

      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatBox icon={<Target size={32} />} label="PARTIDAS JUGADAS" value={stats.gamesPlayed} color="#00d9ff" />
          <StatBox icon={<Trophy size={32} />} label="TASA DE VICTORIA" value={stats.winRate} color="#ffd700" />
          <StatBox icon={<Clock size={32} />} label="TIEMPO PROMEDIO" value={stats.avgTime} color="#ff1b8d" />
        </div>
      ) : (
        <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-[#00d9ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-gray-400 font-['Press_Start_2P'] text-xs">Cargando datos...</div>
        </div>
      )}

      {/* Sección adicional para llenar espacio */}
      <div className="mt-12 bg-[#0f1425] border-2 border-dashed border-white/10 rounded-xl p-8 text-center">
        <h3 className="font-['Press_Start_2P'] text-white text-sm mb-4">LOGROS RECIENTES</h3>
        <div className="flex justify-center gap-4">
            <div className="w-16 h-16 bg-[#1a1f35] rounded-lg border border-[#ffd700] flex items-center justify-center text-2xl" title="Primer Lugar">🥇</div>
            <div className="w-16 h-16 bg-[#1a1f35] rounded-lg border border-[#00ff88] flex items-center justify-center text-2xl" title="Racha de 5">🔥</div>
            <div className="w-16 h-16 bg-[#1a1f35] rounded-lg border border-[#ff1b8d] flex items-center justify-center text-2xl" title="Experto">🧠</div>
        </div>
      </div>
    </div>
  );
}

const StatBox = ({ icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) => (
  <motion.div 
    initial={{ scale: 0.95, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    whileHover={{ y: -5 }}
    className="bg-[#0f1425] border-b-4 rounded-xl p-6 flex flex-col items-center text-center shadow-lg transition-all"
    style={{ borderColor: color }}
  >
    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-[#0f1425] shadow-[0_0_15px_currentColor]" style={{ backgroundColor: color, color: '#0f1425' }}>
      {icon}
    </div>
    <div className="text-3xl font-['Press_Start_2P'] text-white mb-2">{value}</div>
    <div className="text-xs font-bold tracking-wider opacity-80" style={{ color }}>{label}</div>
  </motion.div>
);
