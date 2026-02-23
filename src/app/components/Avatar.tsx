import React from "react";
import { motion } from "motion/react";
import { User, Edit2 } from "lucide-react";

export function Avatar() {
  return (
    <div className="flex flex-col items-center w-full px-4 py-8">
      <h1 className="font-['Press_Start_2P'] text-[#00ff88] text-3xl mb-12 text-center drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]">
        TU AVATAR
      </h1>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1a1f35] border-4 border-[#00d9ff] rounded-2xl p-8 max-w-md w-full flex flex-col items-center relative"
      >
        <button className="absolute top-4 right-4 p-2 text-[#00d9ff] hover:bg-[#00d9ff]/10 rounded-full transition-colors">
          <Edit2 size={20} />
        </button>

        <div className="w-40 h-40 bg-[#0f1425] rounded-full border-4 border-[#00ff88] flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,255,136,0.3)]">
          <User size={80} className="text-[#00ff88]" />
        </div>

        <h2 className="font-['Press_Start_2P'] text-xl text-white mb-2">JUGADOR</h2>
        <div className="text-[#ffd700] font-['Press_Start_2P'] text-sm mb-6">NIVEL 5</div>

        <div className="w-full space-y-4">
          <div className="bg-[#0f1425] p-3 rounded border border-white/10">
            <div className="text-xs text-gray-400 mb-1">SKIN ACTUAL</div>
            <div className="font-bold text-[#00d9ff]">Neon Cyberpunk</div>
          </div>
          <div className="bg-[#0f1425] p-3 rounded border border-white/10">
            <div className="text-xs text-gray-400 mb-1">ACCESORIOS</div>
            <div className="font-bold text-[#ff1b8d]">Gafas VR</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
