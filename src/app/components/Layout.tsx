import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu,
  Gamepad2,
  User,
  Users,
  Target,
  ChevronDown,
  Coins,
  Star,
  LogIn,
  Facebook,
  Twitter,
  Instagram,
  Home,
  LogOut,
  Settings,
  HelpCircle,
  Sword
} from "lucide-react";
import { cn } from "../../lib/utils";
const logoImg = "/src/assets/logo.png";import { PixelBackground } from "./PixelBackground";

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGamesDropdownOpen, setIsGamesDropdownOpen] = useState(true);
  const location = useLocation();

  // En móvil, cerrar sidebar al navegar
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-screen bg-[#1a1f35] text-white font-['Inter'] flex flex-col overflow-hidden">
      <PixelBackground />
      
      {/* Header - Fixed Height */}
      <header className="h-16 bg-[#0f1425] border-b-4 border-[#00d9ff] flex items-center justify-between px-4 shadow-[0_4px_20px_rgba(0,217,255,0.2)] shrink-0 z-50 relative">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-[#00d9ff]"
          >
            <Menu size={24} />
          </button>
          
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 md:w-10 md:h-10 relative">
                <img 
                    src={logoImg} 
                    alt="Saberix Logo" 
                    className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(0,255,136,0.6)] group-hover:scale-110 transition-transform duration-300"
                />
            </div>
            <span className="font-['Press_Start_2P'] text-lg md:text-xl bg-gradient-to-r from-[#00ff88] to-[#00d9ff] bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(0,255,136,0.8)] hidden sm:block tracking-widest">
              SABERIX
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          {/* Stats - Hidden on very small screens */}
          <div className="hidden sm:flex items-center gap-3">
             <div className="flex items-center bg-[#1a1f35] border border-[#ffd700] rounded-md px-3 py-1.5 shadow-[0_0_8px_rgba(255,215,0,0.2)]">
                <Coins size={18} className="text-[#ffd700] mr-2" />
                <span className="font-['Press_Start_2P'] text-sm text-white">1,250</span>
             </div>

             <div className="flex items-center bg-[#1a1f35] border border-[#ff1b8d] rounded-md px-3 py-1.5 shadow-[0_0_8px_rgba(255,27,141,0.2)]">
                <Star size={18} className="text-[#ff1b8d] mr-2" />
                <span className="font-['Press_Start_2P'] text-sm text-white">LVL 5</span>
             </div>
          </div>

          <Link to="/login">
            <button className="flex items-center gap-2 font-['Press_Start_2P'] text-[10px] md:text-xs bg-[#ff1b8d] hover:bg-[#d01570] text-white px-4 py-2 rounded shadow-[2px_2px_0_#a0115e] active:shadow-none active:translate-y-0.5 transition-all">
                <LogIn size={12} /> <span className="hidden sm:inline">LOGIN</span>
            </button>
          </Link>
        </div>
      </header>

      {/* Main Container - Flex Row to hold Sidebar and Content */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar - Flexible Width */}
        <motion.aside
          initial={false}
          animate={{ 
            width: isSidebarOpen ? 260 : 0,
            opacity: isSidebarOpen ? 1 : 0
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "bg-[#0f1425] border-r border-[#00d9ff]/20 flex flex-col flex-shrink-0 h-full z-40",
            // On mobile, sidebar should be absolute to not squish content
            "absolute md:relative left-0 top-0 bottom-0 shadow-2xl md:shadow-none"
          )}
          style={{ overflow: 'hidden' }} // Prevent content spill when closing
        >
            {/* Scrollable sidebar content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 w-[260px]">
                <div className="flex flex-col gap-1">
                    <NavItem to="/" icon={<Home size={20} />} label="INICIO" active={location.pathname === "/"} />
                    
                    <div className="my-1">
                    <button
                        onClick={() => setIsGamesDropdownOpen(!isGamesDropdownOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left group text-gray-300 hover:text-[#00d9ff]"
                    >
                        <div className="flex items-center gap-3 font-bold text-sm">
                        <Gamepad2 size={20} />
                        JUEGOS
                        </div>
                        <ChevronDown
                        size={16}
                        className={cn("transition-transform duration-200", isGamesDropdownOpen ? "rotate-180" : "")}
                        />
                    </button>
                    
                    <AnimatePresence>
                        {isGamesDropdownOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="ml-9 border-l border-white/10 pl-2 mt-1 flex flex-col gap-1">
                                <SubNavItem to="/games" label="Ver Todos" color="#ffffff" active={location.pathname === "/games"} />
                                <SubNavItem to="/games/math" label="Matemáticas" color="#4169E1" active={location.pathname === "/games/math"} />
                                <SubNavItem to="/games/science" label="Ciencias" color="#228B22" active={location.pathname === "/games/science"} />
                                <SubNavItem to="/games/language" label="Lengua" color="#DAA520" active={location.pathname === "/games/language"} />
                                <SubNavItem to="/games/social" label="Sociales" color="#DC143C" active={location.pathname === "/games/social"} />
                            </div>
                        </motion.div>
                        )}
                    </AnimatePresence>
                    </div>

                    <div className="h-px bg-white/10 my-2 mx-2" />

                    <NavItem to="/avatar" icon={<User size={20} />} label="AVATAR" active={location.pathname === "/avatar"} />
                    <NavItem to="/character" icon={<Sword size={20} />} label="PERSONAJE" active={location.pathname === "/character"} />
                    <NavItem to="/friends" icon={<Users size={20} />} label="AMIGOS" active={location.pathname === "/friends"} />
                    <NavItem to="/profile" icon={<Target size={20} />} label="PERFIL" active={location.pathname === "/profile"} />
                    
                    <div className="h-px bg-white/10 my-2 mx-2" />
                    
                    <NavItem to="/settings" icon={<Settings size={20} />} label="CONFIGURACIÓN" />
                    <NavItem to="/help" icon={<HelpCircle size={20} />} label="AYUDA" />
                </div>
            </div>

            {/* Bottom of sidebar */}
            <div className="p-4 border-t border-white/10 bg-[#0a0e1b] w-[260px]">
                <button className="flex items-center gap-3 text-gray-400 hover:text-[#ff1b8d] transition-colors w-full">
                    <LogOut size={18} />
                    <span className="text-xs font-bold">CERRAR SESIÓN</span>
                </button>
            </div>
        </motion.aside>

        {/* Backdrop for mobile */}
        {isSidebarOpen && (
             <div 
                className="md:hidden absolute inset-0 bg-black/50 z-30 backdrop-blur-sm"
                onClick={() => setIsSidebarOpen(false)}
             />
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#1a1f35] flex flex-col w-full">
            <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
                <Outlet />
            </div>

            {/* Footer */}
            <footer className="bg-[#0f1425] border-t border-[#00d9ff]/30 py-8 px-6 mt-auto">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                         <div className="font-['Press_Start_2P'] text-[#00ff88] text-xs mb-2">SABERIX</div>
                         <p className="text-gray-500 text-[10px]">© 2026 Todos los derechos reservados.</p>
                    </div>

                    <div className="flex gap-4">
                        <SocialButton icon={<Facebook size={16} />} color="#1877f2" />
                        <SocialButton icon={<Twitter size={16} />} color="#000000" borderColor="#333" />
                        <SocialButton icon={<Instagram size={16} />} color="#e1306c" />
                    </div>
                </div>
            </footer>
        </main>
      </div>
    </div>
  );
}

const NavItem = ({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active?: boolean }) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
      active ? "bg-[#00d9ff]/10 text-[#00d9ff]" : "text-gray-400 hover:bg-white/5 hover:text-white"
    )}
  >
    <div className={cn("transition-colors", active ? "text-[#00d9ff]" : "text-gray-400 group-hover:text-[#00d9ff]")}>
      {icon}
    </div>
    <span className="font-bold text-sm">{label}</span>
    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#00d9ff] rounded-r-full" />}
  </Link>
);

const SubNavItem = ({ to, label, color, active }: { to: string; label: string; color: string; active?: boolean }) => (
  <Link
    to={to}
    className={cn(
        "block px-3 py-2 text-xs font-medium rounded transition-colors flex items-center gap-2",
        active ? "text-white bg-white/5" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
    )}
  >
    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span>
    <span>{label}</span>
  </Link>
);

const SocialButton = ({ icon, color, borderColor }: any) => (
    <a 
        href="#" 
        className="w-8 h-8 flex items-center justify-center rounded bg-white/5 hover:scale-110 transition-transform text-white"
        style={{ backgroundColor: color, border: borderColor ? `1px solid ${borderColor}` : 'none' }}
    >
        {icon}
    </a>
);
