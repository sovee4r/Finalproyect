import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Calculator, FlaskConical, BookOpen, Globe2,
  Brain, Trophy, Users, Shield, Rocket, Sword,
  Coins, Clock, Lock, ChevronDown, Play,
  HelpCircle, User
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useTranslation } from "react-i18next";
import { useAuth } from "../AuthContext";

const API = "https://finalproyect-production-3837.up.railway.app";

interface JugadorReal {
  nombre: string;
  foto: string | null;
  score: number;
  partidas: number;
  correctas: number;
}

interface GameEntry {
  id: string; title: string; titleEn: string; description: string; descriptionEn: string;
  grade: 4 | 5 | 6; available: boolean; route?: string;
  difficulty: "Facil" | "Medio" | "Dificil";
  questions: number; time: number; subject: string;
}

const diffColor: Record<string, string> = {
  Facil: "#00ff88", Medio: "#ffd700", Dificil: "#DC143C",
};

type IconComp = React.ComponentType<{ size?: number; className?: string }>;

const subjectCfg: Record<string, { color: string; Icon: IconComp; label: string; labelEn: string; coins: number; time: string }> = {
  math:     { color: "#4169E1", Icon: Calculator,   label: "MATEMATICAS", labelEn: "MATH",           coins: 250, time: "15m" },
  science:  { color: "#228B22", Icon: FlaskConical,  label: "CIENCIAS",   labelEn: "SCIENCE",        coins: 200, time: "12m" },
  language: { color: "#DAA520", Icon: BookOpen,      label: "LENGUA",     labelEn: "LANGUAGE",       coins: 180, time: "10m" },
  social:   { color: "#DC143C", Icon: Globe2,        label: "SOCIALES",   labelEn: "SOCIAL STUDIES", coins: 220, time: "13m" },
};

const ALL_GAMES: GameEntry[] = [
  // ── Lengua ──
  { id:"ql4",  subject:"language", title:"Quiz de Lengua",      titleEn:"Language Quiz",         grade:4, available:true,  route:"/games/language/quiz/4",     description:"Lectura, escritura, gramatica y vocabulario.",       descriptionEn:"Reading, writing, grammar and vocabulary.",        difficulty:"Facil",   questions:6,  time:15 },
  { id:"ah4",  subject:"language", title:"Ahorcado",            titleEn:"Hangman",               grade:4, available:true,  route:"/games/language/ahorcado",   description:"Adivina palabras de Lengua antes de que se borren.", descriptionEn:"Guess Language words before they disappear.",      difficulty:"Facil",   questions:8,  time:0  },
  { id:"co4",  subject:"language", title:"Completa la Oracion", titleEn:"Complete the Sentence", grade:4, available:true,  route:"/games/language/completa",   description:"Arrastra la palabra correcta para completar.",       descriptionEn:"Drag the correct word to complete the sentence.",  difficulty:"Facil",   questions:6,  time:0  },
  { id:"sl4",  subject:"language", title:"Sopa de Letras",      titleEn:"Word Search",           grade:4, available:true,  route:"/games/language/sopa",       description:"Encuentra las palabras escondidas en la sopa.",      descriptionEn:"Find the hidden words in the word search.",        difficulty:"Facil",   questions:8,  time:0  },
  { id:"cs4",  subject:"language", title:"Conecta Sinonimos",   titleEn:"Connect Synonyms",      grade:4, available:true,  route:"/games/language/conecta",    description:"Une cada palabra con su sinonimo correcto.",          descriptionEn:"Match each word with its correct synonym.",        difficulty:"Facil",   questions:6,  time:0  },
  { id:"pe4",  subject:"language", title:"Periodista",          titleEn:"Journalist",            grade:4, available:true,  route:"/games/language/periodista", description:"Redacta una noticia con las 5 preguntas clave.",      descriptionEn:"Write a news story answering the 5 key questions.",difficulty:"Medio",   questions:5,  time:0  },
  { id:"ql5",  subject:"language", title:"Quiz de Lengua",      titleEn:"Language Quiz",         grade:5, available:false,                                      description:"Comprension lectora y redaccion avanzada.",          descriptionEn:"Reading comprehension and advanced writing.",      difficulty:"Medio",   questions:8,  time:20 },
  { id:"ah5",  subject:"language", title:"Ahorcado",            titleEn:"Hangman",               grade:5, available:true,  route:"/games/language/ahorcado",   description:"Adivina palabras de Lengua 5to.",                    descriptionEn:"Guess 5th grade Language words.",                  difficulty:"Medio",   questions:6,  time:0  },
  { id:"co5",  subject:"language", title:"Completa la Oracion", titleEn:"Complete the Sentence", grade:5, available:true,  route:"/games/language/completa",   description:"Completa oraciones con gramatica de 5to.",           descriptionEn:"Complete sentences with 5th grade grammar.",       difficulty:"Medio",   questions:5,  time:0  },
  { id:"ql6",  subject:"language", title:"Quiz de Lengua",      titleEn:"Language Quiz",         grade:6, available:false,                                      description:"Literatura, composicion y comunicacion.",            descriptionEn:"Literature, composition and communication.",       difficulty:"Dificil", questions:10, time:20 },
  { id:"ah6",  subject:"language", title:"Ahorcado",            titleEn:"Hangman",               grade:6, available:true,  route:"/games/language/ahorcado",   description:"Vocabulario avanzado de 6to grado.",                 descriptionEn:"Advanced 6th grade vocabulary.",                   difficulty:"Dificil", questions:6,  time:0  },
  { id:"co6",  subject:"language", title:"Completa la Oracion", titleEn:"Complete the Sentence", grade:6, available:true,  route:"/games/language/completa",   description:"Completa oraciones argumentativas.",                  descriptionEn:"Complete argumentative sentences.",                difficulty:"Dificil", questions:5,  time:0  },

  // ── Matematicas ──
  { id:"qm4",  subject:"math", title:"Quiz de Matematicas",  titleEn:"Math Quiz",          grade:4, available:true,  route:"/games/math/quiz",     description:"Numeracion, geometria y estadistica de 4to.",     descriptionEn:"Numeracy, geometry and statistics for 4th grade.", difficulty:"Facil",   questions:8,  time:0  },
  { id:"qm5",  subject:"math", title:"Quiz de Matematicas",  titleEn:"Math Quiz",          grade:5, available:true,  route:"/games/math/quiz",     description:"Decimales, porcentajes y geometria de 5to.",       descriptionEn:"Decimals, percentages and geometry for 5th.",       difficulty:"Medio",   questions:8,  time:0  },
  { id:"qm6",  subject:"math", title:"Quiz de Matematicas",  titleEn:"Math Quiz",          grade:6, available:true,  route:"/games/math/quiz",     description:"Algebra, circunferencia y volumen de 6to.",        descriptionEn:"Algebra, circumference and volume for 6th.",        difficulty:"Dificil", questions:8,  time:0  },
  { id:"cc4",  subject:"math", title:"Carrera de Cohetes",   titleEn:"Rocket Race",        grade:4, available:true,  route:"/games/math/cohetes",  description:"Responde rapido para impulsar tu cohete a la luna.",descriptionEn:"Answer fast to launch your rocket to the moon.",   difficulty:"Facil",   questions:10, time:0  },
  { id:"cc5",  subject:"math", title:"Carrera de Cohetes",   titleEn:"Rocket Race",        grade:5, available:true,  route:"/games/math/cohetes",  description:"Calculo mental para cohetes de 5to grado.",        descriptionEn:"Mental math rocket race for 5th grade.",            difficulty:"Medio",   questions:10, time:0  },
  { id:"cc6",  subject:"math", title:"Carrera de Cohetes",   titleEn:"Rocket Race",        grade:6, available:true,  route:"/games/math/cohetes",  description:"Operaciones avanzadas en la carrera espacial.",    descriptionEn:"Advanced math operations in the space race.",       difficulty:"Dificil", questions:10, time:0  },
  { id:"rn4",  subject:"math", title:"Rana en Nenufares",    titleEn:"Frog on Lily Pads",  grade:4, available:true,  route:"/games/math/rana",     description:"Salta al nenufar con la respuesta correcta.",      descriptionEn:"Jump to the lily pad with the correct answer.",     difficulty:"Facil",   questions:10, time:0  },
  { id:"rn5",  subject:"math", title:"Rana en Nenufares",    titleEn:"Frog on Lily Pads",  grade:5, available:true,  route:"/games/math/rana",     description:"Fracciones y porcentajes en el estanque.",         descriptionEn:"Fractions and percentages in the pond.",            difficulty:"Medio",   questions:10, time:0  },
  { id:"rn6",  subject:"math", title:"Rana en Nenufares",    titleEn:"Frog on Lily Pads",  grade:6, available:true,  route:"/games/math/rana",     description:"Algebra y geometria entre los nenufares.",         descriptionEn:"Algebra and geometry among the lily pads.",         difficulty:"Dificil", questions:10, time:0  },
  { id:"tm4",  subject:"math", title:"Tetris Matematico",    titleEn:"Math Tetris",        grade:4, available:true,  route:"/games/math/tetris",   description:"Resuelve operaciones antes de que el bloque caiga.",descriptionEn:"Solve operations before the block falls.",          difficulty:"Medio",   questions:12, time:0  },
  { id:"tm5",  subject:"math", title:"Tetris Matematico",    titleEn:"Math Tetris",        grade:5, available:true,  route:"/games/math/tetris",   description:"Potencias y raices contra el reloj.",              descriptionEn:"Powers and roots against the clock.",               difficulty:"Medio",   questions:12, time:0  },
  { id:"tm6",  subject:"math", title:"Tetris Matematico",    titleEn:"Math Tetris",        grade:6, available:true,  route:"/games/math/tetris",   description:"Teorema de Pitagoras y volumen a toda velocidad.",  descriptionEn:"Pythagorean theorem and volume at full speed.",      difficulty:"Dificil", questions:12, time:0  },

  // ── Ciencias ──
  { id:"qc4",  subject:"science", title:"Quiz de Ciencias",    titleEn:"Science Quiz",       grade:4, available:true,  route:"/games/science/quiz",    description:"Sistema Solar, energia y fenomenos naturales.",    descriptionEn:"Solar system, energy and natural phenomena.",       difficulty:"Facil",   questions:8,  time:0  },
  { id:"qc5",  subject:"science", title:"Quiz de Ciencias",    titleEn:"Science Quiz",       grade:5, available:true,  route:"/games/science/quiz",    description:"Celulas, ecosistemas y propiedades de la luz.",    descriptionEn:"Cells, ecosystems and properties of light.",        difficulty:"Medio",   questions:8,  time:0  },
  { id:"qc6",  subject:"science", title:"Quiz de Ciencias",    titleEn:"Science Quiz",       grade:6, available:true,  route:"/games/science/quiz",    description:"Mezclas, enfermedades y tecnologia.",              descriptionEn:"Mixtures, diseases and technology.",                difficulty:"Dificil", questions:8,  time:0  },
  { id:"ca4",  subject:"science", title:"Cadena Alimenticia",  titleEn:"Food Chain",         grade:4, available:true,  route:"/games/science/cadena",  description:"Ordena los eslabones de la cadena alimenticia.",   descriptionEn:"Order the links of the food chain.",               difficulty:"Facil",   questions:6,  time:0  },
  { id:"an4",  subject:"science", title:"Clasifica Animales",  titleEn:"Classify Animals",   grade:4, available:true,  route:"/games/science/animales",description:"Clasifica los animales segun su grupo.",           descriptionEn:"Classify animals according to their group.",        difficulty:"Facil",   questions:8,  time:0  },
  { id:"ce4",  subject:"science", title:"Armar Celula",        titleEn:"Build a Cell",       grade:4, available:true,  route:"/games/science/celula",  description:"Arrastra los organelos a su lugar en la celula.",  descriptionEn:"Drag organelles to their place in the cell.",      difficulty:"Medio",   questions:6,  time:0  },
  { id:"la4",  subject:"science", title:"Laberinto",           titleEn:"Maze",               grade:4, available:true,  route:"/games/laberinto",       description:"Guia al personaje por el laberinto de ciencias.",  descriptionEn:"Guide the character through the science maze.",    difficulty:"Facil",   questions:1,  time:0  },

  // ── Sociales ──
  { id:"qs4",  subject:"social", title:"Quiz de Sociales",    titleEn:"Social Studies Quiz",  grade:4, available:true,  route:"/games/social/quiz",    description:"Poderes del Estado, Constitucion y ciudadania.",   descriptionEn:"State powers, Constitution and citizenship.",       difficulty:"Facil",   questions:8,  time:0  },
  { id:"qs5",  subject:"social", title:"Quiz de Sociales",    titleEn:"Social Studies Quiz",  grade:5, available:true,  route:"/games/social/quiz",    description:"Historia dominicana y derechos fundamentales.",     descriptionEn:"Dominican history and fundamental rights.",         difficulty:"Medio",   questions:8,  time:0  },
  { id:"qs6",  subject:"social", title:"Quiz de Sociales",    titleEn:"Social Studies Quiz",  grade:6, available:true,  route:"/games/social/quiz",    description:"Balaguer, PRD, PLD y organizacion municipal.",      descriptionEn:"Balaguer, political parties and municipal org.",    difficulty:"Dificil", questions:8,  time:0  },
  { id:"ms4",  subject:"social", title:"Memoria",             titleEn:"Memory",               grade:4, available:true,  route:"/games/social/memoria", description:"Empareja poderes del Estado y simbolos patrios.",   descriptionEn:"Match state powers and national symbols.",          difficulty:"Facil",   questions:6,  time:0  },
  { id:"ms5",  subject:"social", title:"Memoria",             titleEn:"Memory",               grade:5, available:true,  route:"/games/social/memoria", description:"Empareja eventos historicos dominicanos.",          descriptionEn:"Match Dominican historical events.",                difficulty:"Medio",   questions:6,  time:0  },
  { id:"ms6",  subject:"social", title:"Memoria",             titleEn:"Memory",               grade:6, available:true,  route:"/games/social/memoria", description:"Empareja partidos, presidentes y poderes.",         descriptionEn:"Match parties, presidents and powers.",             difficulty:"Dificil", questions:6,  time:0  },
  { id:"lt4",  subject:"social", title:"Linea de Tiempo",     titleEn:"Timeline",             grade:4, available:true,  route:"/games/social/linea",   description:"Ordena los eventos historicos en la linea.",        descriptionEn:"Order historical events on the timeline.",          difficulty:"Facil",   questions:6,  time:0  },
];

const GRADES = [4, 5, 6] as const;

export function Games() {
  const { subject } = useParams();
  const navigate    = useNavigate();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const { user } = useAuth();

  const [expanded,    setExpanded]    = useState<Record<number, boolean>>({ 4: true, 5: true, 6: true });
  const [leaderboard, setLeaderboard] = useState<JugadorReal[]>([]);
  const [loadingLb,   setLoadingLb]   = useState(true);

  useEffect(() => {
    fetch(`${API}/api/leaderboard-global`)
      .then(r => r.json())
      .then(d => { if (d.ok) setLeaderboard(d.jugadores); })
      .catch(() => {})
      .finally(() => setLoadingLb(false));
  }, []);

  const filteredGames = subject ? ALL_GAMES.filter(g => g.subject === subject) : ALL_GAMES;
  const pageTitle     = subject
    ? (isEn ? subjectCfg[subject]?.labelEn : subjectCfg[subject]?.label) ?? t("juegosDisponibles")
    : t("todosLosJuegos");

  function handlePlay(game: GameEntry) {
    if (!user) { navigate("/login"); return; }
    if (game.available && game.route) navigate(game.route);
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-20">

      {/* HERO */}
      <section className="text-center py-10 md:py-14 mb-8">
        <h1 className="font-['Press_Start_2P'] text-3xl md:text-5xl text-[#00ff88] mb-4"
          style={{ textShadow: "0 0 20px rgba(0,255,136,0.6)" }}>
          {pageTitle}
        </h1>
        <p className="text-[#ffd700] font-['Press_Start_2P'] text-xs md:text-sm max-w-2xl mx-auto leading-relaxed">
          {isEn ? "Choose a subject and show your knowledge to earn coins" : "Elige una materia y demuestra tus conocimientos para ganar monedas"}
        </p>
      </section>

      {/* MATERIAS */}
      {!subject && (
        <section className="mb-16">
          <SectionTitle title={t("materias")} color="#00ff88" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {Object.entries(subjectCfg).map(([key, cfg]) => (
              <motion.div key={key} whileHover={{ y: -5 }}
                onClick={() => navigate(`/games/${key}`)}
                className="group relative bg-[#0f1425] border-2 rounded-xl p-6 cursor-pointer overflow-hidden transition-all shadow-lg"
                style={{ borderColor: `${cfg.color}40` }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = cfg.color)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = `${cfg.color}40`)}>
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                  <cfg.Icon size={64} />
                </div>
                <div className="relative z-10 flex flex-col gap-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: cfg.color }}>
                    <cfg.Icon size={24} />
                  </div>
                  <h3 className="font-['Press_Start_2P'] text-sm text-white">{isEn ? cfg.labelEn : cfg.label}</h3>
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

      {/* JUEGOS POR GRADO */}
      <section className="mb-16">
        <SectionTitle title={subject ? t("juegosDisponibles") : t("juegosPorGrado")} color="#00d9ff" />
        {Object.entries(subjectCfg)
          .filter(([key]) => !subject || key === subject)
          .map(([subjectKey, cfg]) => {
            const subGames = filteredGames.filter(g => g.subject === subjectKey);
            if (subGames.length === 0) return null;
            return (
              <div key={subjectKey} className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: cfg.color }}>
                    <cfg.Icon size={16} />
                  </div>
                  <h3 className="font-['Press_Start_2P'] text-sm" style={{ color: cfg.color }}>
                    {isEn ? cfg.labelEn : cfg.label}
                  </h3>
                  <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg,${cfg.color}50,transparent)` }} />
                </div>
                {GRADES.map(grade => {
                  const gradeGames = subGames.filter(g => g.grade === grade);
                  if (gradeGames.length === 0) return null;
                  const isOpen = expanded[grade];
                  return (
                    <div key={grade} className="mb-4">
                      <button
                        onClick={() => setExpanded(e => ({ ...e, [grade]: !e[grade] }))}
                        className="flex items-center gap-3 mb-3 w-full group">
                        <span className="text-sm font-extrabold text-gray-500 tracking-widest uppercase group-hover:text-white transition-colors">
                          {grade}° {isEn ? "Grade" : "Grado"}
                        </span>
                        <div className="flex-1 h-px bg-white/10" />
                        <ChevronDown size={14} className="text-gray-600 transition-transform"
                          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                      </button>
                      {isOpen && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-2">
                          {gradeGames.map(game => (
                            <SmallGameCard key={game.id} game={game} color={cfg.color} Icon={cfg.Icon} isEn={isEn}
                              onPlay={() => handlePlay(game)} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
      </section>

      {/* MODOS */}
      <section className="mb-16">
        <SectionTitle title={t("modos")} color="#00d9ff" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ModeCard badge="POPULAR" title={isEn ? "NORMAL"      : "NORMAL"}      desc={isEn ? "No time pressure. Perfect for practice."  : "Sin presion de tiempo. Perfecto para practicar."} icon={<Brain size={28}/>}  color="#00d9ff" />
          <ModeCard badge="HOT"     title={isEn ? "COMPETITION" : "COMPETENCIA"} desc={isEn ? "Live global ranking. Only the best win."   : "Ranking mundial en vivo. Solo los mejores ganan."} icon={<Trophy size={28}/>} color="#ff1b8d" isHot />
          <ModeCard badge="NEW"     title={isEn ? "MULTIPLAYER" : "MULTIJUGADOR"}desc={isEn ? "Challenge your friends in real time."      : "Desafia a tus amigos en tiempo real."}             icon={<Users size={28}/>}  color="#00ff88" isNew />
        </div>
      </section>

      {/* DIFICULTAD */}
      <section className="mb-16">
        <SectionTitle title={t("dificultad")} color="#ff1b8d" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DiffCard title={isEn ? "EASY"   : "FACIL"}   icon={<Shield size={32}/>} level={1} color="#00ff88" />
          <DiffCard title={isEn ? "MEDIUM" : "MEDIO"}   icon={<Rocket size={32}/>} level={2} color="#ffd700" />
          <DiffCard title={isEn ? "HARD"   : "DIFICIL"} icon={<Sword  size={32}/>} level={3} color="#DC143C" />
        </div>
      </section>

      {/* LEADERBOARD REAL */}
      <section>
        <SectionTitle title={t("topJugadores")} color="#ffd700" />
        <div className="bg-[#0f1425] border-4 border-[#00d9ff] rounded-xl p-6 shadow-[0_0_30px_rgba(0,217,255,0.15)]">
          {loadingLb ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#ffd700]/30 border-t-[#ffd700] rounded-full animate-spin" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <Trophy size={40} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-bold">Aun no hay jugadores en el ranking</p>
              <p className="text-gray-600 text-xs mt-1">Juega una partida para aparecer aqui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((player, i) => (
                <div key={i}
                  className={cn(
                    "flex items-center p-3 rounded-lg border transition-all hover:translate-x-1",
                    i === 0 ? "border-[#ffd700] bg-[#ffd700]/10" :
                    i === 1 ? "border-gray-400 bg-gray-400/10" :
                    i === 2 ? "border-[#cd7f32] bg-[#cd7f32]/10" :
                    "border-white/10 bg-[#1a1f35]"
                  )}>
                  <div className="w-8 text-center font-['Press_Start_2P'] text-base flex-shrink-0"
                    style={{ color: i === 0 ? "#ffd700" : i === 1 ? "#aaa" : i === 2 ? "#cd7f32" : "#fff" }}>
                    {i + 1}
                  </div>
                  <div className="w-9 h-9 rounded-full overflow-hidden border-2 flex-shrink-0 mx-2"
                    style={{ borderColor: i === 0 ? "#ffd700" : i === 1 ? "#aaa" : i === 2 ? "#cd7f32" : "rgba(255,255,255,0.2)" }}>
                    {player.foto
                      ? <img src={player.foto} alt={player.nombre} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-[#1a1f35] flex items-center justify-center">
                          <User size={16} className="text-gray-500" />
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-['Press_Start_2P'] text-xs text-white truncate">{player.nombre}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {player.partidas} {isEn ? "games" : "partidas"} · {player.correctas} {isEn ? "correct" : "correctas"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 font-['Press_Start_2P'] text-sm text-[#00ff88] flex-shrink-0">
                    <Coins size={13} className="text-[#ffd700]"/>
                    {Number(player.score).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SmallGameCard({ game, color, Icon, onPlay, isEn }: { game: GameEntry; color: string; Icon: IconComp; onPlay: () => void; isEn: boolean }) {
  const [tooltip, setTooltip] = useState(false);
  const title = isEn ? game.titleEn : game.title;
  const desc  = isEn ? game.descriptionEn : game.description;
  return (
    <div className="relative">
      <motion.div
        whileHover={game.available ? { y: -4, scale: 1.01 } : {}}
        onClick={onPlay}
        onMouseEnter={() => !game.available && setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
        className={cn("relative overflow-hidden rounded-xl border-2 transition-all", game.available ? "cursor-pointer" : "cursor-not-allowed")}
        style={{
          background:  game.available ? `${color}08` : "rgba(255,255,255,0.02)",
          borderColor: game.available ? `${color}50` : "rgba(255,255,255,0.08)",
          boxShadow:   game.available ? `0 4px 20px ${color}20` : "none",
          opacity:     game.available ? 1 : 0.5,
        }}>
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
              {isEn
                ? game.difficulty === "Facil" ? "Easy" : game.difficulty === "Medio" ? "Medium" : "Hard"
                : game.difficulty}
            </span>
          </div>
          <p className="font-['Press_Start_2P'] text-xs mb-1" style={{ color: game.available ? color : "rgba(255,255,255,0.2)" }}>
            {title}
          </p>
          <p className="text-gray-500 text-xs font-bold mb-2">{game.grade}° {isEn ? "Grade" : "Grado"}</p>
          <p className="text-gray-400 text-xs leading-relaxed mb-3">{desc}</p>
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs font-bold text-gray-500"><HelpCircle size={11}/> {game.questions}</span>
              <span className="flex items-center gap-1 text-xs font-bold text-gray-500"><Clock size={11}/> {game.time > 0 ? `${game.time}s` : "∞"}</span>
            </div>
            {game.available
              ? <span className="flex items-center gap-1 text-xs font-bold" style={{ color }}><Play size={11} className="fill-current"/> {isEn ? "Play" : "Jugar"}</span>
              : <span className="flex items-center gap-1 text-xs font-bold text-gray-600"><Lock size={11}/> {isEn ? "Locked" : "Bloqueado"}</span>}
          </div>
        </div>
      </motion.div>
      {tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none">
          <div className="bg-[#0f1425] border border-white/25 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-xl whitespace-nowrap">
            <Lock size={11} className="text-gray-400"/>
            <span className="text-xs font-bold text-gray-300">{isEn ? "Not available" : "No disponible"}</span>
          </div>
          <div className="w-2 h-2 bg-[#0f1425] border-r border-b border-white/20 rotate-45 mx-auto -mt-1"/>
        </div>
      )}
    </div>
  );
}

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
    <motion.div whileHover={{ scale: 1.02 }}
      className="relative bg-[#1a1f35] border border-white/10 p-6 rounded-xl hover:bg-[#0f1425] transition-all cursor-pointer group"
      onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}>
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
    <motion.div whileHover={{ y: -3 }}
      className="bg-[#1a1f35] border border-white/10 p-5 rounded-xl flex items-center justify-between cursor-pointer transition-all"
      onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}>
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
