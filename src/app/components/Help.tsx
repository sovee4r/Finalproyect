import React, { useState } from "react";
import { motion } from "motion/react";
import {
  HelpCircle, MessageCircle, Mail,
  Facebook, ChevronDown, BookOpen,
  Gamepad2, Shield, Zap, Users, Star,
  ExternalLink, Phone, Globe
} from "lucide-react";

const FAQS = [
  {
    q: "Como funciona el modo multijugador?",
    a: "Selecciona un juego, elige el modo Multijugador y crea una sala. Comparte el codigo de 6 digitos con tus amigos para que se unan. Una vez que todos esten listos, el host puede iniciar la partida."
  },
  {
    q: "Como gano monedas?",
    a: "Ganas monedas al responder preguntas correctamente. Cuanto mas rapido respondas, mas monedas recibes. Tambien puedes ganar bonificaciones por rachas de respuestas correctas."
  },
  {
    q: "Que materias estan disponibles?",
    a: "Actualmente Lengua Espanola (4to grado) esta disponible. Proximamente se anadiran Matematicas, Ciencias Naturales y Ciencias Sociales para los grados 4to, 5to y 6to."
  },
  {
    q: "Para que grados es Saberix?",
    a: "Saberix esta disenado para estudiantes de educacion primaria, especificamente para los grados 4to, 5to y 6to del curriculo dominicano."
  },
  {
    q: "Puedo jugar sin conexion a internet?",
    a: "El modo solitario requiere conexion para cargar las preguntas desde la base de datos. El modo multijugador siempre requiere conexion. Estamos trabajando en un modo offline para futuras versiones."
  },
  {
    q: "Como subo de nivel?",
    a: "Acumulas experiencia (XP) jugando y respondiendo correctamente. Al alcanzar ciertos umbrales de XP, subes de nivel automaticamente. Los niveles mas altos desbloquean nuevos avatares y beneficios."
  },
  {
    q: "Se guardan mis resultados?",
    a: "Si, todos tus resultados se guardan en nuestros servidores. Puedes ver tu historial y estadisticas en la seccion de Perfil."
  },
];

const SOCIALS = [
  { name: "Instagram",   handle: "@saberixedu",              color: "#e1306c", url: "https://www.instagram.com/saberixedu/",           svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
  { name: "Facebook",    handle: "Saberix Edu",              color: "#1877f2", url: "https://www.facebook.com/share/18Do35dCD3/",       svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  { name: "X (Twitter)", handle: "@Saberixedu",              color: "#ffffff", url: "https://x.com/Saberixedu",                         svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
  { name: "Web oficial", handle: "saberix.com.do",           color: "#00d9ff", url: "#",                                                svg: <Globe size={18} /> },
];

const SUPPORT = [
  { label: "Correo de soporte", value: "saberixedu@gmail.com", Icon: Mail,           color: "#a78bfa" },
  { label: "WhatsApp",          value: "+1 (809) 555-0123",       Icon: Phone,          color: "#00ff88" },
  { label: "Chat en vivo",      value: "Disponible 8am - 8pm",    Icon: MessageCircle,  color: "#00d9ff" },
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
        <Section title="INICIO RAPIDO" icon={<Zap size={18} />} color="#ffd700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
            {[
              { Icon: Gamepad2, title: "Jugar solo",     desc: "Elige una materia, configura y empieza",           color: "#00ff88" },
              { Icon: Users,    title: "Multijugador",   desc: "Crea o unete a una sala con amigos",                color: "#a78bfa" },
              { Icon: Star,     title: "Ganar monedas",  desc: "Responde rapido y correcto para maximizar monedas", color: "#ffd700" },
              { Icon: BookOpen, title: "Estudiar",       desc: "Repasa el material antes de un quiz dificil",       color: "#00d9ff" },
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
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* ─── REDES SOCIALES ─── */}
        <Section title="SIGUENOS" icon={<Star size={18} />} color="#ff1b8d">
          <div className="grid grid-cols-2 gap-3 p-4">
            {SOCIALS.map(({ name, handle, color, url, svg }) => (
              <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl group transition-all hover:-translate-y-0.5"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}30` }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${color}80`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = `${color}30`)}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}20`, border: `1px solid ${color}50`, color }}>
                  {svg}
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
              Nuestro equipo de soporte responde en menos de 24 horas en dias habiles.
              Para problemas urgentes usa el WhatsApp o el chat en vivo.
            </p>
          </div>
        </Section>

        {/* ─── ACERCA DE ─── */}
        <div className="rounded-2xl p-6 text-center"
          style={{ background: "linear-gradient(135deg,rgba(0,255,136,0.05),rgba(0,217,255,0.05))", border: "1px solid rgba(0,255,136,0.15)" }}>
          <p className="font-['Press_Start_2P'] text-[#00ff88] text-xs mb-2">SABERIX v1.0</p>
          <p className="text-gray-500 text-xs leading-relaxed max-w-sm mx-auto">
            Plataforma educativa gamificada para estudiantes de primaria en Republica Dominicana.
            Hecho con dedicacion para hacer el aprendizaje divertido.
          </p>
          <p className="text-gray-600 text-[10px] mt-3">© 2026 Saberix · Todos los derechos reservados</p>
        </div>

      </div>
    </div>
  );
}

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

