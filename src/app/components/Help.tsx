import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import AIChatbox from './Chatbox';
import {
  HelpCircle, MessageCircle, Mail, Instagram,
  Facebook, Twitter, ChevronDown, BookOpen,
  Gamepad2, Shield, Zap, Users, Star,
  ExternalLink, Phone, Globe
} from "lucide-react";

/* ─── FAQ Data ─── */
const FAQS = [
  {
    q: "¿Cómo funciona el modo multijugador?",
    a: "Selecciona un juego, elige el modo Multijugador y crea una sala. Comparte el código de 6 dígitos con tus amigos para que se unan. Una vez que todos estén listos, el host puede iniciar la partida."
  },
  {
    q: "¿Cómo gano monedas?",
    a: "Ganas monedas al responder preguntas correctamente. Cuanto más rápido respondas, más monedas recibes. También puedes ganar bonificaciones por rachas de respuestas correctas."
  },
  {
    q: "¿Qué materias están disponibles?",
    a: "Actualmente Lengua Española (4to grado) está disponible. Próximamente se añadirán Matemáticas, Ciencias Naturales y Ciencias Sociales para los grados 4to, 5to y 6to."
  },
  {
    q: "¿Para qué grados es Saberix?",
    a: "Saberix está diseñado para estudiantes de educación primaria, específicamente para los grados 4to, 5to y 6to del currículo dominicano."
  },
  {
    q: "¿Puedo jugar sin conexión a internet?",
    a: "El modo solitario requiere conexión para cargar las preguntas desde la base de datos. El modo multijugador siempre requiere conexión. Estamos trabajando en un modo offline para futuras versiones."
  },
  {
    q: "¿Cómo subo de nivel?",
    a: "Acumulas experiencia (XP) jugando y respondiendo correctamente. Al alcanzar ciertos umbrales de XP, subes de nivel automáticamente. Los niveles más altos desbloquean nuevos avatares y beneficios."
  },
  {
    q: "¿Se guardan mis resultados?",
    a: "Sí, todos tus resultados se guardan en nuestros servidores. Puedes ver tu historial y estadísticas en la sección de Perfil."
  },
];

/* ─── Social links ─── */
const SOCIALS = [
  { name: "Instagram",  handle: "@saberix.do",   color: "#e1306c", Icon: Instagram,  url: "#" },
  { name: "Facebook",   handle: "Saberix RD",     color: "#1877f2", Icon: Facebook,   url: "#" },
  { name: "Twitter/X",  handle: "@SaberixRD",     color: "#ffffff", Icon: Twitter,    url: "#" },
  { name: "Web oficial",handle: "saberix.com.do", color: "#00d9ff", Icon: Globe,      url: "#" },
];

/* ─── Support options ─── */
const SUPPORT = [
  { label: "Correo de soporte", value: "soporte@saberix.com.do",  Icon: Mail,    color: "#a78bfa" },
  { label: "WhatsApp",          value: "+1 (809) 555-0123",        Icon: Phone,   color: "#00ff88" },
  { label: "Chat en vivo",      value: "Disponible 8am – 8pm",     Icon: MessageCircle, color: "#00d9ff" },
];

export function Help() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="w-full max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(0,229,255,0.1)", border: "2px solid rgba(0,229,255,0.3)" }}
        >
          <HelpCircle size={30} className="text-[#00d9ff]" />
        </motion.div>
        <h1 className="font-['Press_Start_2P'] text-white text-2xl md:text-3xl mb-2 drop-shadow-[0_0_10px_rgba(0,217,255,0.3)]">
          AYUDA
        </h1>
        <p className="text-gray-400 text-sm">Encuentra respuestas y contacta con nuestro equipo</p>
      </div>

      <div className="space-y-6">

        {/* ─── INICIO RAPIDO ─── */}
        <Section title="INICIO RÁPIDO" icon={<Zap size={18} />} color="#ffd700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
            {[
              { Icon: Gamepad2, title: "Jugar solo",       desc: "Elige una materia, configura y empieza",             color: "#00ff88" },
              { Icon: Users,    title: "Multijugador",     desc: "Crea o únete a una sala con amigos",                  color: "#a78bfa" },
              { Icon: Star,     title: "Ganar monedas",    desc: "Responde rápido y correcto para maximizar monedas",   color: "#ffd700" },
              { Icon: BookOpen, title: "Estudiar",         desc: "Repasa el material antes de un quiz difícil",         color: "#00d9ff" },
            ].map(({ Icon, title, desc, color }) => (
              <div key={title}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}18`, border: `1px solid ${color}40` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div>
                  <p className="font-bold text-sm text-white">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ─── FAQ ─── */}
        <Section title="PREGUNTAS FRECUENTES" icon={<HelpCircle size={18} />} color="#00d9ff">
          <div className="divide-y divide-white/5">
            {FAQS.map((faq, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-white/3 transition-colors"
                >
                  <span className="font-bold text-sm text-white pr-4">{faq.q}</span>
                  <ChevronDown size={16}
                    className="text-[#00d9ff] flex-shrink-0 transition-transform duration-200"
                    style={{ transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-4 text-sm text-gray-400 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </Section>

        {/* ─── REDES SOCIALES ─── */}
        <Section title="SÍGUENOS" icon={<Star size={18} />} color="#ff1b8d">
          <div className="grid grid-cols-2 gap-3 p-4">
            {SOCIALS.map(({ name, handle, color, Icon, url }) => (
              <a key={name} href={url}
                className="flex items-center gap-3 p-3 rounded-xl group transition-all hover:-translate-y-0.5"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}30` }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${color}80`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = `${color}30`)}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}20`, border: `1px solid ${color}50` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-white">{name}</p>
                  <p className="text-xs truncate" style={{ color }}>{handle}</p>
                </div>
                <ExternalLink size={12} className="ml-auto text-gray-600 group-hover:text-gray-400 flex-shrink-0" />
              </a>
            ))}
          </div>
        </Section>

        {/* ─── SOPORTE ─── */}
        <Section title="CONTACTAR SOPORTE" icon={<Shield size={18} />} color="#a78bfa">
          <div className="space-y-0 divide-y divide-white/5">
            {SUPPORT.map(({ label, value, Icon, color }) => (
              <div key={label} className="flex items-center gap-4 px-4 py-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}15`, border: `1px solid ${color}35` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="font-bold text-sm text-white mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              Nuestro equipo de soporte responde en menos de 24 horas en días hábiles.
              Para problemas urgentes usa el WhatsApp o el chat en vivo.
            </p>
          </div>
        </Section>

        {/* ─── ACERCA DE ─── */}
        <div className="rounded-2xl p-6 text-center"
          style={{ background: "linear-gradient(135deg,rgba(0,255,136,0.05),rgba(0,217,255,0.05))", border: "1px solid rgba(0,255,136,0.15)" }}>
          <p className="font-['Press_Start_2P'] text-[#00ff88] text-xs mb-2">SABERIX v1.0</p>
          <p className="text-gray-500 text-xs leading-relaxed max-w-sm mx-auto">
            Plataforma educativa gamificada para estudiantes de primaria en República Dominicana.
            Hecho con dedicación para hacer el aprendizaje divertido.
          </p>
          <p className="text-gray-600 text-[10px] mt-3">© 2026 Saberix · Todos los derechos reservados</p>
        </div>

      </div>
    </div>
  );
}

<AIChatbox />
/* ─── Section wrapper ─── */
function Section({ title, icon, color, children }: {
  title: string; icon: React.ReactNode; color: string; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(15,20,37,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18`, color }}>
          {icon}
        </div>
        <h2 className="font-['Press_Start_2P'] text-xs" style={{ color }}>{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}
