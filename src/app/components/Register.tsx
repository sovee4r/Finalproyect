import React, { useState } from "react";
import { Link, useNavigate } from "react-router";

export function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    // Simulate register
    console.log("Registering:", formData);
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

      <div className="relative z-10 bg-[#0d0d1a]/80 backdrop-blur-md border-[3px] border-[#00f2ff] p-10 w-full max-w-md text-center shadow-[0_0_20px_rgba(0,242,255,0.3)] animate-in fade-in slide-in-from-bottom-8 duration-500">
        <h1 className="text-[#00f2ff] text-base mb-8 drop-shadow-[2px_2px_#8a2be2]">CREAR CUENTA</h1>
        
        <form onSubmit={handleSubmit} className="text-left">
          <div className="mb-4">
            <label className="text-[#00f2ff] text-[9px] block mb-2">Nombre de Usuario</label>
            <input 
              type="text" 
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Tu nombre" 
              required
              className="w-full bg-white/5 border-2 border-[#00f2ff] p-3 text-white font-sans outline-none focus:bg-white/10 transition-colors"
            />
          </div>

          <div className="mb-4">
            <label className="text-[#00f2ff] text-[9px] block mb-2">Email</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com" 
              required
              className="w-full bg-white/5 border-2 border-[#00f2ff] p-3 text-white font-sans outline-none focus:bg-white/10 transition-colors"
            />
          </div>
          
          <div className="mb-4">
            <label className="text-[#00f2ff] text-[9px] block mb-2">Contraseña</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="********" 
              required
              className="w-full bg-white/5 border-2 border-[#00f2ff] p-3 text-white font-sans outline-none focus:bg-white/10 transition-colors"
            />
          </div>

          <div className="mb-4">
            <label className="text-[#00f2ff] text-[9px] block mb-2">Confirmar Contraseña</label>
            <input 
              type="password" 
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="********" 
              required
              className="w-full bg-white/5 border-2 border-[#00f2ff] p-3 text-white font-sans outline-none focus:bg-white/10 transition-colors"
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-[#8a2be2] text-white py-4 text-xs shadow-[4px_4px_0px_#00f2ff] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#00f2ff] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all my-5 cursor-pointer"
          >
            REGISTRARME
          </button>
        </form>

        <div className="text-[8px]">
          <Link to="/login" className="text-[#00f2ff] hover:text-white transition-colors">
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
