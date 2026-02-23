import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { X } from "lucide-react";
import loginBg from "figma:asset/8192cdc8f3d56f90793caa80c9d862ce5c1f4ad0.png"; // Using the same asset as background placeholder or use a color if image not suitable for BG. 
// Note: The user provided "fondo login" in CSS but didn't upload a separate image for it. 
// I will use a dark gradient + blur effect instead to match the description.

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    console.log("Login with:", email, password);
    navigate("/");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black font-['Press_Start_2P']">
      {/* Background with blur */}
      <div 
        className="absolute inset-0 z-0 opacity-40 transform scale-110 blur-sm"
        style={{
          background: "url(https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop) center/cover no-repeat"
        }}
      />
      
      <Link to="/" className="absolute top-8 right-8 text-white text-2xl hover:text-[#00d9ff] transition-colors z-20">✕</Link>

      <motion_container className="relative z-10 bg-[#0d0d1a]/80 backdrop-blur-md border-[3px] border-[#00f2ff] p-10 w-full max-w-md text-center shadow-[0_0_20px_rgba(0,242,255,0.3)] animate-appear">
        <h1 className="text-[#00f2ff] text-base mb-8 drop-shadow-[2px_2px_#8a2be2]">INICIAR SESIÓN</h1>
        
        <form onSubmit={handleSubmit} className="text-left">
          <div className="mb-5">
            <label className="text-[#00f2ff] text-[9px] block mb-2">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Introduce tu email" 
              required
              className="w-full bg-white/5 border-2 border-[#00f2ff] p-3 text-white font-sans outline-none focus:bg-white/10 transition-colors"
            />
          </div>
          
          <div className="mb-5">
            <label className="text-[#00f2ff] text-[9px] block mb-2">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********" 
              required
              className="w-full bg-white/5 border-2 border-[#00f2ff] p-3 text-white font-sans outline-none focus:bg-white/10 transition-colors"
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-[#8a2be2] text-white py-4 text-xs shadow-[4px_4px_0px_#00f2ff] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#00f2ff] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all my-5 cursor-pointer"
          >
            ENTRAR
          </button>
        </form>

        <div className="border-t border-[#00f2ff]/30 my-5" />

        <div className="text-[8px]">
          <Link to="/register" className="text-[#00f2ff] hover:text-white transition-colors animate-pulse">
            Crear cuenta gratis
          </Link>
        </div>
      </motion_container>
    </div>
  );
}

// Simple animation wrapper
const motion_container = ({ children, className }: any) => (
  <div className={`${className} animate-in fade-in slide-in-from-bottom-8 duration-500`}>
    {children}
  </div>
);
