import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../AuthContext";
import { Eye, EyeOff, Mail, Lock, AlertCircle, Calculator, FlaskConical, BookOpen, Globe2, Pencil, Atom, Ruler, PenTool } from "lucide-react";
import logoImg from "../../assets/logo.png";

const FloatingIcon = ({ Icon, className, delay, size = 40 }: { Icon: any; className?: string; delay: number; size?: number }) => (
  <div
    className={`absolute pointer-events-none hidden md:block ${className}`}
    style={{ animation: `floatIcon 6s ease-in-out infinite`, animationDelay: `${delay}s` }}
  >
    <Icon size={size} />
  </div>
);

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("https://finalproyect-production-3837.up.railway.app/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
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

  const handleGoogleLogin = () => {
    window.location.href = "https://finalproyect-production-3837.up.railway.app/api/auth/google";
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse 120% 100% at 50% 0%, #040d1e 0%, #07091a 50%, #000 100%)" }}
    >
      <FloatingIcon Icon={Calculator}   className="top-[8%]    left-[6%]   text-[#00e5ff]/20" delay={0}   size={48} />
      <FloatingIcon Icon={BookOpen}     className="top-[15%]   right-[8%]  text-[#ffd700]/20" delay={1}   size={44} />
      <FloatingIcon Icon={Pencil}       className="top-[60%]   left-[4%]   text-[#00ff88]/20" delay={2}   size={40} />
      <FloatingIcon Icon={FlaskConical} className="bottom-[12%] right-[6%] text-[#ff4757]/20" delay={1.5} size={48} />
      <FloatingIcon Icon={Globe2}       className="bottom-[25%] left-[12%] text-[#a78bfa]/20" delay={0.8} size={36} />
      <FloatingIcon Icon={Atom}         className="top-[35%]   right-[4%]  text-[#00e5ff]/15" delay={2.2} size={52} />
      <FloatingIcon Icon={Ruler}        className="top-[75%]   right-[15%] text-[#ffd700]/15" delay={3}   size={36} />
      <FloatingIcon Icon={PenTool}      className="top-[45%]   left-[3%]   text-[#ff9800]/15" delay={1.8} size={40} />

      {[...Array(8)].map((_, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none"
          style={{
            width: 3 + (i % 3) * 2, height: 3 + (i % 3) * 2,
            left: `${5 + i * 12}%`, top: `${10 + (i % 5) * 18}%`,
            background: ["#00e5ff","#0096ff","#00e5ff","#9b44ff","#00ff88","#00e5ff","#ff4757","#a78bfa"][i],
            animation: `floatParticle ${3 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}

      <div className="absolute pointer-events-none"
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

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="h-px w-full"
          style={{ background: "linear-gradient(90deg, transparent, #00e5ff 30%, #9b44ff 70%, transparent)" }} />

        <div className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(12, 10, 26, 0.92)",
            backdropFilter: "blur(24px)",
            border: "1.5px solid rgba(0,229,255,0.2)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04) inset",
          }}>

          <div className="px-8 pt-8 pb-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(0,229,255,0.3) 0%, transparent 70%)", transform: "scale(1.6)" }} />
                <img src={logoImg} alt="Saberix" className="w-16 h-16 object-contain relative z-10"
                  style={{ filter: "drop-shadow(0 0 16px rgba(0,229,255,0.6))" }} />
              </div>
            </div>
            <div className="flex items-center justify-center gap-1 mb-1">
              {["S","A","B","E","R","I","X"].map((l, i) => {
                const cols = ["#ff4757","#ff9800","#ffd700","#00ff88","#00e5ff","#a78bfa","#ff4757"];
                return (
                  <span key={i} className="font-['Press_Start_2P'] text-lg font-black"
                    style={{ color: cols[i], textShadow: `0 0 12px ${cols[i]}99` }}>
                    {l}
                  </span>
                );
              })}
            </div>
            <p className="text-gray-500 text-xs font-bold tracking-widest uppercase mt-1">Iniciar Sesión</p>
          </div>

          <div className="mx-8 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />

          <div className="px-8 py-6">
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-5 text-xs font-bold text-[#ff4757]"
                style={{ background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.25)" }}>
                <AlertCircle size={14} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-gray-400 tracking-widest uppercase mb-2">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com" required
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white text-sm font-semibold outline-none placeholder:text-gray-600"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)" }}
                    onFocus={e => (e.target.style.borderColor = "rgba(0,229,255,0.5)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-400 tracking-widest uppercase mb-2">Contraseña</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl text-white text-sm font-semibold outline-none placeholder:text-gray-600"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)" }}
                    onFocus={e => (e.target.style.borderColor = "rgba(0,229,255,0.5)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-xl font-['Press_Start_2P'] text-xs text-white mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg, #00e5ff, #0096ff)", boxShadow: "0 4px 20px rgba(0,229,255,0.35)" }}>
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : "Entrar"}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
              <span className="text-gray-600 text-[10px] font-bold tracking-widest">O</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
            </div>

            <button onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-xs font-bold text-gray-300 transition-all hover:opacity-90"
              style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.1)" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.35)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}>
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>
          </div>

          <div className="mx-8 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="px-8 py-5 text-center">
            <span className="text-gray-600 text-xs">¿No tienes cuenta? </span>
            <Link to="/register" className="text-xs font-bold transition-colors" style={{ color: "#00e5ff" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={e => (e.currentTarget.style.color = "#00e5ff")}>
              Crear cuenta gratis
            </Link>
          </div>
        </div>

        <div className="h-px w-full"
          style={{ background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.4) 50%, transparent)" }} />
      </div>
    </div>
  );
}
