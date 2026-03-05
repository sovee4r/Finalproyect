import React from "react";
import { motion } from "motion/react";
import { Users, Search, MessageCircle } from "lucide-react";

export function Friends() {
  return (
    <div className="flex flex-col items-center w-full px-4 py-8">
      <h1 className="font-['Press_Start_2P'] text-[#ff1b8d] text-3xl mb-8 text-center drop-shadow-[0_0_10px_rgba(255,27,141,0.5)]">
        AMIGOS
      </h1>

      <div className="w-full max-w-2xl mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar amigos..." 
            className="w-full bg-[#0f1425] border-2 border-[#ff1b8d]/50 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#ff1b8d] transition-colors font-['Press_Start_2P'] text-xs"
          />
        </div>
      </div>

      <div className="w-full max-w-2xl space-y-4">
        {[1, 2, 3].map((i) => (
          <motion.div 
            key={i}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#1a1f35] border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-[#1a1f35]/80 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#0f1425] flex items-center justify-center border border-[#ff1b8d]">
                <Users size={20} className="text-[#ff1b8d]" />
              </div>
              <div>
                <div className="font-bold text-white">Amigo {i}</div>
                <div className="text-xs text-[#00ff88]">En línea</div>
              </div>
            </div>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <MessageCircle size={20} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
