import React from "react";
import { motion } from "motion/react";
import { Volume2, Bell, Shield, LogOut, Moon, Monitor, Keyboard, HelpCircle } from "lucide-react";
import { cn } from "../../lib/utils";

export function Settings() {
  return (
    <div className="w-full max-w-3xl mx-auto pb-20">
      <div className="text-center mb-10">
        <h1 className="font-['Press_Start_2P'] text-white text-2xl md:text-3xl mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            CONFIGURACIÓN
        </h1>
        <p className="text-gray-400 text-xs">Personaliza tu experiencia en Saberix</p>
      </div>

      <div className="space-y-6">
        {/* Audio & Video */}
        <SettingsSection title="AUDIO & VIDEO" icon={<Monitor size={18} />}>
            <ToggleOption label="Música de Fondo" desc="Activar música ambiental tipo arcade" />
            <ToggleOption label="Efectos de Sonido" desc="Sonidos al hacer clic y ganar" defaultChecked />
            <ToggleOption label="Modo Alto Contraste" desc="Mejorar visibilidad de textos" />
        </SettingsSection>

        {/* Notificaciones */}
        <SettingsSection title="NOTIFICACIONES" icon={<Bell size={18} />}>
            <ToggleOption label="Invitaciones de Juego" desc="Recibir alertas cuando amigos te inviten" defaultChecked />
            <ToggleOption label="Nuevos Logros" desc="Avisar cuando desbloquees medallas" defaultChecked />
            <ToggleOption label="Correos de Marketing" desc="Recibir noticias y promociones" />
        </SettingsSection>

        {/* Cuenta */}
        <SettingsSection title="CUENTA & SEGURIDAD" icon={<Shield size={18} />}>
            <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div>
                    <div className="text-sm font-bold text-gray-200">Cambiar Contraseña</div>
                    <div className="text-xs text-gray-500">Último cambio hace 3 meses</div>
                </div>
                <button className="px-4 py-2 bg-[#1a1f35] border border-white/10 rounded text-xs text-white hover:bg-white/5 transition-colors">
                    Editar
                </button>
            </div>
            <div className="flex items-center justify-between py-3">
                <div>
                    <div className="text-sm font-bold text-[#ff1b8d]">Zona de Peligro</div>
                    <div className="text-xs text-gray-500">Borrar cuenta permanentemente</div>
                </div>
                <button className="px-4 py-2 bg-[#ff1b8d]/10 border border-[#ff1b8d]/30 text-[#ff1b8d] rounded text-xs hover:bg-[#ff1b8d] hover:text-white transition-colors">
                    Borrar
                </button>
            </div>
        </SettingsSection>
      </div>

      <div className="mt-8 text-center">
          <button className="flex items-center gap-2 mx-auto text-gray-500 hover:text-[#ff1b8d] transition-colors text-xs font-bold">
              <LogOut size={16} /> CERRAR SESIÓN
          </button>
          <div className="mt-4 text-[10px] text-gray-600 font-mono">
              Saberix v1.0.5 (Build 2026.02.23)
          </div>
      </div>
    </div>
  );
}

const SettingsSection = ({ title, icon, children }: any) => (
    <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-[#0f1425] border border-white/10 rounded-xl overflow-hidden"
    >
        <div className="px-6 py-4 bg-[#1a1f35] border-b border-white/10 flex items-center gap-3">
            <div className="text-[#00d9ff]">{icon}</div>
            <h3 className="font-['Press_Start_2P'] text-xs text-white">{title}</h3>
        </div>
        <div className="p-6 space-y-2">
            {children}
        </div>
    </motion.div>
);

const ToggleOption = ({ label, desc, defaultChecked }: any) => {
    const [checked, setChecked] = React.useState(defaultChecked || false);
    
    return (
        <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
            <div>
                <div className="text-sm font-bold text-gray-200">{label}</div>
                <div className="text-xs text-gray-500">{desc}</div>
            </div>
            <button 
                onClick={() => setChecked(!checked)}
                className={cn(
                    "w-12 h-6 rounded-full relative transition-colors duration-300",
                    checked ? "bg-[#00ff88]" : "bg-gray-700"
                )}
            >
                <div className={cn(
                    "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-md",
                    checked ? "translate-x-6" : "translate-x-0"
                )} />
            </button>
        </div>
    );
}
