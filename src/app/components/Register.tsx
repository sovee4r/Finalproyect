import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle2, Calculator, FlaskConical, BookOpen, Globe2, Pencil, Atom, Ruler, PenTool } from "lucide-react";
import logoImg from "../../assets/logo.png";

const FloatingIcon = ({ Icon, className, delay, size = 40 }: { Icon: any; className?: string; delay: number; size?: number }) => (
  <motion.div
    animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay }}
    className={`absolute pointer-events-none hidden md:block ${className}`}
  >
    <Icon size={size} />
  </motion.div>
);

export function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: "", email: "", password: "", confirmPassword: ""
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("https://finalproyect-production-3837.up.railway.app/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al registrarse");
        return;
      }
      login(data.user);
      navigate("/");
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const passMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

  const fields = [
    { label: "Nombre de usuario", name: "username", type: "text",  placeholder: "Tu nombre",    icon: <User size={15} /> },
    { label: "Email",             name: "email",    type: "email", placeholder: "tu@email.com", icon: <Mail size={15} /> },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse 120% 100% at 50% 0%, #040d1e 0%, #07091a 50%, #000 100%)" }}>

      <FloatingIcon Icon={Calculator}   className="top-[8%]    left-[6%]   text-[#00e5ff]/20" delay={0}   size={48} />
      <FloatingIcon Icon={BookOpen}     className="top-[15%]   right-[8%]  text-[#ffd700]/20" delay={1}   size={44} />
      <FloatingIcon Icon={Pencil}       className="top-[60%]   left-[4%]   text-[#00ff88]/20" delay={2}   size={40} />
      <FloatingIcon Icon={FlaskConical} className="bottom-[12%] right-[6%] text-[#ff4757]/20" delay={1.5} size={48} />
      <FloatingIcon Icon={Globe2}       className="bottom-[25%] left-[12%] text-[#a78bfa]/20" delay={0.8} size={36} />
      <FloatingIcon Icon={Atom}         className="top-[35%]   right-[4%]  text-[#00e5ff]/15" delay={2.2} size={52} />
      <FloatingIcon Icon={Ruler}        className="top-[75%]   right-[15%] text-[#ffd700]/15" delay={3}   size={36} />
      <FloatingIcon Icon={PenTool}      className="top-[45%]   left-[3%]   text-[#ff9800]/15" delay={1.8} size={40} />

      {[...Array(8)].map((_, i) => (
        <motion.div key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 3 + (i % 3) * 2, height: 3 + (i % 3) * 2,
            left: `${5 + i * 12}%`, top: `${10 + (i % 5) * 18}%`,
            background: ["#00e5ff","#0096ff","#00e5ff","#9b44ff","#00ff88","#00e5ff","#ff4757","#a78bfa"][i],
          }}
          animate={{ y: [0, -30, 0], opacity: [0.15, 0.6, 0.15] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
        />
      ))}

      <motion.div
        animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.05, 1] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute pointer-events-none"
        style={{
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,229,255,0.08) 0%, rgba(155,68,255,0.06) 40%, transparent 70%)",
          top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        }}
      />

      <Link to="/" className="absolute top-6 right-6 z-20 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
        <span className="text-gray-400 hover:text-white text-sm font-bold">✕</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="h-px w-full"
          style={{ background: "linear-gradient(90deg, transparent, #00e5ff 30%, #9b44ff 70%, transparent)" }} />

        <div className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(12, 10, 26, 0.92)",
            backdropFilter: "blur(24px)",
            border: "1.5px solid rgba(0,229,255,0.2)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04) inset",
          }}>

          <div className="px-8 pt-5 pb-4 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 20 }}
              className="flex justify-center mb-3"
            >
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(0,229,255,0.3) 0%, transparent 70%)", transform: "scale(1.6)" }}
                />
                <img src={logoImg} alt="Saberix" className="w-10 h-10 object-contain relative z-10"
                  style={{ filter: "drop-shadow(0 0 12px rgba(0,229,255,0.6))" }} />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <div className="flex items-center justify-center gap-1 mb-1">
                {["S","A","B","E","R","I","X"].map((l, i) => {
                  const cols = ["#ff4757","#ff9800","#ffd700","#00ff88","#00e5ff","#a78bfa","#ff4757"];
                  return (
                    <span key={i} className="font-['Press_Start_2P'] text-sm font-black"
                      style={{ color: cols[i], textShadow: `0 0 10px ${cols[i]}99` }}>
                      {l}
                    </span>
                  );
                })}
              </div>
              <p className="text-gray-500 text-[10px] font-bold tracking-widest uppercase mt-1">Crear Cuenta</p>
            </motion.div>
          </div>

          <div className="mx-8 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />

          <div className="px-8 py-4">
          {error && (
  <div
    className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-4 text-xs font-bold text-[#ff4757]"
    style={{ background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.25)" }}
  >
    <AlertCircle size={14} className="flex-shrink-0" />
    {error}
  </div>
)}

            <form onSubmit={handleSubmit} className="space-y-3">
              {fields.map(f => (
                <div key={f.name}>
                  <label className="block text-[10px] font-extrabold text-gray-400 tracking-widest uppercase mb-1.5">{f.label}</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">{f.icon}</div>
                    <input
                      type={f.type} name={f.name}
                      value={formData[f.name as keyof typeof formData]}
                      onChange={handleChange}
                      placeholder={f.placeholder} required
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl text-white text-sm font-semibold outline-none placeholder:text-gray-600"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)" }}
                      onFocus={e => (e.target.style.borderColor = "rgba(0,229,255,0.5)")}
                      onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                    />
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 tracking-widest uppercase mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input
                    type={showPass ? "text" : "password"} name="password"
                    value={formData.password} onChange={handleChange}
                    placeholder="••••••••" required
                    className="w-full pl-11 pr-12 py-2.5 rounded-xl text-white text-sm font-semibold outline-none placeholder:text-gray-600"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)" }}
                    onFocus={e => (e.target.style.borderColor = "rgba(0,229,255,0.5)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 tracking-widest uppercase mb-1.5">Confirmar Contraseña</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input
                    type={showConfirm ? "text" : "password"} name="confirmPassword"
                    value={formData.confirmPassword} onChange={handleChange}
                    placeholder="••••••••" required
                    className="w-full pl-11 pr-12 py-2.5 rounded-xl text-white text-sm font-semibold outline-none placeholder:text-gray-600"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: `1.5px solid ${formData.confirmPassword ? (passMatch ? "rgba(0,255,136,0.4)" : "rgba(255,71,87,0.4)") : "rgba(255,255,255,0.08)"}`,
                    }}
                    onFocus={e => (e.target.style.borderColor = "rgba(0,229,255,0.5)")}
                    onBlur={e => (e.target.style.borderColor = formData.confirmPassword ? (passMatch ? "rgba(0,255,136,0.4)" : "rgba(255,71,87,0.4)") : "rgba(255,255,255,0.08)")}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {formData.confirmPassword && (
                      passMatch
                        ? <CheckCircle2 size={14} className="text-[#00ff88]" />
                        : <AlertCircle size={14} className="text-[#ff4757]" />
                    )}
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="text-gray-500 hover:text-gray-300 transition-colors">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              <motion.button type="submit" disabled={loading}
                whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-xl font-['Press_Start_2P'] text-xs text-white mt-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #00e5ff, #0096ff)", boxShadow: "0 4px 20px rgba(0,229,255,0.35)" }}>
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : "Registrarme"}
              </motion.button>
            </form>
          </div>

          <div className="mx-8 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="px-8 py-3 text-center">
            <span className="text-gray-600 text-xs">¿Ya tienes cuenta? </span>
            <Link to="/login"
              className="text-xs font-bold transition-colors"
              style={{ color: "#00e5ff" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={e => (e.currentTarget.style.color = "#00e5ff")}>
              Iniciar sesión
            </Link>
          </div>
        </div>

        <div className="h-px w-full"
          style={{ background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.4) 50%, transparent)" }} />
      </motion.div>
    </div>
  );
}
