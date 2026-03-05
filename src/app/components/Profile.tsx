import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Target, TrendingUp, Clock, Trophy } from "lucide-react";
import { db } from "../../lib/db"; // Usando nuestra simulación de DB

export function Profile() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Simular carga de datos desde "MySQL"
    const loadData = async () => {
      // En una app real: const data = await db.query('SELECT * FROM stats WHERE user_id = ?', [1]);
      // Aquí simulamos la llamada:
      await db.query("SELECT stats FROM user WHERE id = 1");
      setStats({
        gamesPlayed: 42,
        winRate: "68%",
        avgTime: "12m",
        rank: "Plata III"
      });
    };
    loadData();
  }, []);

  return (
    <div className="flex flex-col items-center w-full px-4 py-8">
      <h1 className="font-['Press_Start_2P'] text-[#ffd700] text-3xl mb-12 text-center drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
        TU PERFIL
      </h1>

      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          <StatBox icon={<Target size={24} />} label="PARTIDAS JUGADAS" value={stats.gamesPlayed} color="#00d9ff" />
          <StatBox icon={<Trophy size={24} />} label="TASA DE VICTORIA" value={stats.winRate} color="#ffd700" />
          <StatBox icon={<Clock size={24} />} label="TIEMPO PROMEDIO" value={stats.avgTime} color="#ff1b8d" />
          <StatBox icon={<TrendingUp size={24} />} label="RANGO ACTUAL" value={stats.rank} color="#00ff88" />
        </div>
      ) : (
        <div className="text-gray-400 animate-pulse font-['Press_Start_2P'] text-xs">Cargando datos del servidor...</div>
      )}
    </div>
  );
}

const StatBox = ({ icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) => (
  <motion.div 
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="bg-[#1a1f35] border-l-4 rounded-r-xl p-6 flex items-center justify-between shadow-lg"
    style={{ borderColor: color }}
  >
    <div>
      <div className="text-xs text-gray-400 mb-1 font-bold">{label}</div>
      <div className="text-2xl font-['Press_Start_2P'] text-white">{value}</div>
    </div>
    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#0f1425]" style={{ color }}>
      {icon}
    </div>
  </motion.div>
);
