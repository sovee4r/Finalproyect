import React from "react";
import { useParams } from "react-router";
import { motion } from "motion/react";
import { Calculator, FlaskConical, BookOpen, Globe2, ArrowLeft } from "lucide-react";
import { Link } from "react-router";

const subjectConfig: Record<string, { title: string; color: string; icon: any }> = {
  math: { title: "MATEMÁTICAS", color: "#4169E1", icon: Calculator },
  science: { title: "CIENCIAS", color: "#228B22", icon: FlaskConical },
  language: { title: "LENGUA", color: "#DAA520", icon: BookOpen },
  social: { title: "SOCIALES", color: "#DC143C", icon: Globe2 },
};

export function Games() {
  const { subject } = useParams();
  const config = subjectConfig[subject || "math"] || subjectConfig.math;
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center w-full px-4 py-8">
      <div className="w-full max-w-4xl mb-8 flex items-center gap-4">
        <Link to="/" className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="font-['Press_Start_2P'] text-2xl md:text-3xl" style={{ color: config.color }}>
          {config.title}
        </h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* Placeholder cards for games */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div 
            key={i}
            className="bg-[#1a1f35] border-2 rounded-xl p-6 hover:translate-y-[-4px] transition-transform cursor-pointer shadow-lg group"
            style={{ borderColor: config.color }}
          >
            <div className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center text-white" style={{ backgroundColor: config.color }}>
              <Icon size={24} />
            </div>
            <h3 className="font-['Press_Start_2P'] text-sm mb-2 text-white group-hover:text-[var(--color)]" style={{ '--color': config.color } as any}>
              NIVEL {i}
            </h3>
            <p className="text-gray-400 text-xs">Desbloquea este desafío para ganar monedas.</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
