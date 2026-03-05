import React from "react";
import { motion } from "motion/react";
import {
  Calculator,
  FlaskConical,
  BookOpen,
  Globe2,
  Star,
  Brain,
  Puzzle,
  Lightbulb,
  Users,
  Gamepad2,
  HelpCircle,
  Trophy,
  Play,
  Smile,
  Zap,
} from "lucide-react";
import { cn } from "../../lib/utils";

export function Home() {
  return (
    <div className="flex flex-col items-center w-full px-4 md:px-8 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center w-full max-w-6xl mx-auto py-20">
        {/* Floating Icons */}
        <FloatingIcon Icon={Calculator} className="top-[15%] left-[5%] text-white/20" delay={0} />
        <FloatingIcon Icon={FlaskConical} className="top-[25%] right-[10%] text-white/20" delay={1} />
        <FloatingIcon Icon={BookOpen} className="bottom-[20%] left-[8%] text-white/20" delay={2} />
        <FloatingIcon Icon={Globe2} className="bottom-[15%] right-[5%] text-white/20" delay={3} />
        <FloatingIcon Icon={Star} className="top-[10%] left-[45%] text-white/20" delay={1.5} />
        <FloatingIcon Icon={Brain} className="top-[60%] right-[20%] text-white/20" delay={2.5} />
        <FloatingIcon Icon={Puzzle} className="bottom-[30%] left-[15%] text-white/20" delay={0.5} />
        <FloatingIcon Icon={Lightbulb} className="top-[40%] right-[5%] text-white/20" delay={1.2} />

        <div className="relative z-10 mb-12">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#00ff88]/20 blur-[60px] rounded-full animate-pulse pointer-events-none" />
          
          <motion.h1 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="font-['Press_Start_2P'] text-5xl md:text-7xl lg:text-8xl text-[#00ff88] mb-6 drop-shadow-[0_0_20px_rgba(0,255,136,0.8)] relative z-10"
          >
            SABERIX
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="font-['Press_Start_2P'] text-lg md:text-xl text-[#ffd700] drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]"
          >
            ¡APRENDE JUGANDO!
          </motion.p>
        </div>

        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mb-16 z-10"
        >
            <StatCard icon={<Users size={24} />} value="131" label="ONLINE" color="#ff1b8d" />
            <StatCard icon={<Gamepad2 size={24} />} value="137" label="PARTIDAS" color="#00d9ff" />
            <StatCard icon={<HelpCircle size={24} />} value="342" label="PREGUNTAS" color="#ffd700" />
            <StatCard icon={<Trophy size={24} />} value="91" label="GANADORES" color="#00ff88" />
        </motion.div>

        <motion.button
            whileHover={{ scale: 1.05, translateY: -5 }}
            whileTap={{ scale: 0.95 }}
            className="font-['Press_Start_2P'] text-white bg-gradient-to-r from-[#ff1b8d] to-[#ff8c00] px-8 py-4 rounded-lg shadow-[0_0_20px_rgba(255,27,141,0.5)] border-b-4 border-[#a0115e] active:border-b-0 active:translate-y-1 transition-all flex items-center gap-4 text-sm md:text-base z-20 group"
        >
            ¡COMENZAR A JUGAR!
            <Play className="fill-white group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </section>

      {/* How It Works Section */}
      <Section title="¿CÓMO FUNCIONA?">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard 
                icon={<Users size={32} />} 
                title="1. CREA O ÚNETE" 
                desc="Crea una sala de juego o únete a una existente. Invita a tus amigos usando tu código único."
                color="#00d9ff"
            />
            <FeatureCard 
                icon={<HelpCircle size={32} />} 
                title="2. RESPONDE" 
                desc="Responde preguntas de trivia contra el reloj. Elige entre 4 opciones y acumula monedas."
                color="#ff8c00"
            />
            <FeatureCard 
                icon={<Trophy size={32} />} 
                title="3. ¡GANA!" 
                desc="Los 3 mejores jugadores ganan. Sube en el ranking y demuestra quién es más listo."
                color="#ffd700"
            />
        </div>
      </Section>

      {/* Subjects Section */}
      <Section title="MATERIAS DISPONIBLES">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            <SubjectCard icon={<Calculator size={40} />} title="MATEMÁTICAS" color="#4169E1" />
            <SubjectCard icon={<FlaskConical size={40} />} title="CIENCIAS" color="#228B22" />
            <SubjectCard icon={<BookOpen size={40} />} title="LENGUA" color="#DAA520" />
            <SubjectCard icon={<Globe2 size={40} />} title="SOCIALES" color="#DC143C" />
        </div>
      </Section>

      {/* Modes Section */}
      <Section title="MODOS DE JUEGO">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto">
            <ModeCard 
                badge="RELAX" 
                icon={<Smile size={32} />} 
                title="MODO NORMAL" 
                desc="Juego relajado para practicar y aprender. Perfecto para estudiar con amigos sin presión."
                color="#00d9ff"
            />
            <ModeCard 
                badge="HARDCORE" 
                icon={<Zap size={32} />} 
                title="COMPETENCIA" 
                desc="Modo competitivo intenso. La velocidad cuenta y solo los mejores llegarán al podio."
                color="#ff1b8d"
                isHot
            />
        </div>
      </Section>

    </div>
  );
}

// Components

const FloatingIcon = ({ Icon, className, delay }: { Icon: any; className?: string; delay: number }) => (
    <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay }}
        className={cn("absolute hidden md:block", className)}
    >
        <Icon size={48} />
    </motion.div>
);

const StatCard = ({ icon, value, label, color }: { icon: any; value: string; label: string; color: string }) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className="bg-[#0f1425] border-2 md:border-4 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 shadow-lg hover:shadow-xl transition-all"
        style={{ borderColor: color }}
    >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[#0f1425]" style={{ backgroundColor: color }}>
            {icon}
        </div>
        <div>
            <div className="font-['Press_Start_2P'] text-lg md:text-xl mb-1">{value}</div>
            <div className="font-['Inter'] text-[10px] font-bold text-gray-400">{label}</div>
        </div>
    </motion.div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-6xl mb-24"
    >
        <h2 className="font-['Press_Start_2P'] text-center text-[#00ff88] text-2xl md:text-3xl mb-12 drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]">
            {title}
        </h2>
        {children}
    </motion.div>
);

const FeatureCard = ({ icon, title, desc, color }: { icon: any; title: string; desc: string; color: string }) => (
    <motion.div 
        whileHover={{ scale: 1.03 }}
        className="bg-[#1a1f35] border-4 rounded-xl p-8 text-center flex flex-col items-center shadow-lg"
        style={{ borderColor: color }}
    >
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 text-[#1a1f35]" style={{ backgroundColor: color }}>
            {icon}
        </div>
        <h3 className="font-['Press_Start_2P'] text-sm mb-4" style={{ color }}>{title}</h3>
        <p className="text-gray-300 text-sm leading-relaxed">{desc}</p>
    </motion.div>
);

const subjectRoutes: Record<string, string> = {
    "MATEMÁTICAS": "/games/math",
    "CIENCIAS":    "/games/science",
    "LENGUA":      "/games/language",
    "SOCIALES":    "/games/social",
};

const SubjectCard = ({ icon, title, color }: { icon: any; title: string; color: string }) => (
    <motion.a
        href={subjectRoutes[title] ?? "#"}
        whileHover={{ y: -8 }}
        className="bg-[#1a1f35] border-4 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-6 shadow-lg group cursor-pointer"
        style={{ borderColor: color }}
    >
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-white transition-transform group-hover:scale-110" style={{ backgroundColor: color }}>
            {icon}
        </div>
        <h3 className="font-['Press_Start_2P'] text-sm" style={{ color }}>{title}</h3>
    </motion.a>
);

const ModeCard = ({ badge, icon, title, desc, color, isHot }: { badge: string; icon: any; title: string; desc: string; color: string; isHot?: boolean }) => (
    <motion.div 
        whileHover={{ y: -8 }}
        className="relative bg-[#0f1425] border-4 rounded-xl p-10 text-center shadow-lg overflow-hidden group"
        style={{ borderColor: color }}
    >
        <div 
            className={cn(
                "absolute top-4 right-4 px-3 py-1 font-['Press_Start_2P'] text-[10px] rounded-full text-white",
                isHot ? "bg-gradient-to-r from-[#ff8c00] to-[#DC143C]" : "bg-[#00d9ff] text-[#0f1425]"
            )}
        >
            {badge}
        </div>
        
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-[#0f1425]" style={{ backgroundColor: color }}>
            {icon}
        </div>
        
        <h3 className="font-['Press_Start_2P'] text-lg mb-4" style={{ color }}>{title}</h3>
        <p className="text-gray-300 text-sm leading-relaxed">{desc}</p>
    </motion.div>
);
