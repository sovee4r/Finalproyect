import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu, Gamepad2, User, Users, Target,
  ChevronDown, Coins, Star, LogIn, Home,
  LogOut, Settings, HelpCircle, UserCircle, Palette
} from "lucide-react";
import { cn } from "../../lib/utils";
import logoImg from "../../assets/logo.png";
import { PixelBackground } from "./PixelBackground";
import { useAuth } from "../AuthContext";
import { useTranslation } from "react-i18next";

const API = "https://finalproyect-production-3837.up.railway.app";

export function Layout() {
  const { t, i18n } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGamesDropdownOpen, setIsGamesDropdownOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [nivel, setNivel] = useState<number | null>(null);
  const [xpActual, setXpActual] = useState(0);
  const [xpSiguiente, setXpSiguiente] = useState(500);
  const [monedas, setMonedas] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => { setIsSidebarOpen(window.innerWidth >= 768); };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API}/api/experiencia/${user.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setNivel(d.nivel);
          setXpActual(d.xp_actual);
          setXpSiguiente(d.xp_siguiente);
          setMonedas(d.monedas ?? d.total_correctas * 10 ?? 0);
        }
      })
      .catch(() => {});
  }, [user, location.key]);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate("/login");
  };

  const RUTAS_JUEGO = [
    "/quiz/", "/ahorcado", "/completa", "/sopa", "/conecta", "/periodista",
    "/cadena", "/animales", "/celula", "/laberinto",
    "/memoria", "/linea",
    "/math/quiz", "/math/cohetes", "/math/rana", "/math/tetris",
    "/science/quiz", "/social/quiz",
    "/chat",
  ];
  const isGameActive = RUTAS_JUEGO.some(r => location.pathname.includes(r));

  if (isGameActive) {
    return (
      <div className="min-h-screen bg-[#1a1f35] text-white overflow-hidden">
        <PixelBackground />
        <Outlet />
      </div>
    );
  }

  const xpPct = Math.min((xpActual / xpSiguiente) * 100, 100);

  return (
    <div className="h-screen bg-[#1a1f35] text-white font-['Inter'] flex flex-col overflow-hidden">
      <PixelBackground />

      {/* ═══ HEADER ═══ */}
      <header className="h-16 bg-[#0f1425] border-b-4 border-[#00d9ff] flex items-center justify-between px-4 shadow-[0_4px_20px_rgba(0,217,255,0.2)] shrink-0 z-50 relative">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-[#00d9ff]">
            <Menu size={24} />
          </button>
        <Link to="/" className="flex items-center M
        -1 group">
    <div className="w-24 h-16 md:w-28 md:h-20 relative mt-3">
              <img src={logoImg} alt="Saberix Logo"
                className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(0,255,136,0.6)] group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="font-['Press_Start_2P'] text-base md:text-xl text-white tracking-widest drop-shadow-[2px_2px_0_#000] hidden sm:block">
              SABERIX
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          {user && (
            <div className="hidden sm:flex items-center gap-3">
              {/* MONEDAS — clickeable */}
              <Link to="/monedas">
                <div className="flex items-center bg-[#1a1f35] border border-[#ffd700] rounded-md px-3 py-1.5 shadow-[0_0_8px_rgba(255,215,0,0.2)] hover:bg-[#ffd700]/10 hover:border-[#ffd700] transition-all cursor-pointer">
                  <Coins size={14} className="text-[#ffd700] mr-2" />
                  <span className="font-['Press_Start_2P'] text-[10px] text-white">{monedas.toLocaleString()}</span>
                </div>
              </Link>
              <div className="flex items-center bg-[#1a1f35] border border-[#ff1b8d] rounded-md px-3 py-1.5 shadow-[0_0_8px_rgba(255,27,141,0.2)]">
                <Star size={14} className="text-[#ff1b8d] mr-2" />
                <span className="font-['Press_Start_2P'] text-[10px] text-white">LVL {nivel ?? "..."}</span>
              </div>
            </div>
          )}

          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(v => !v)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/10 transition-all">
                <div className="w-8 h-8 rounded-full border-2 border-[#00d9ff] overflow-hidden flex items-center justify-center bg-[#1a1f35]"
                  style={{ boxShadow: "0 0 8px rgba(0,217,255,0.4)" }}>
                  {user.foto
                    ? <img src={user.foto} alt="foto" className="w-full h-full object-cover" />
                    : <User size={16} className="text-[#00d9ff]" />}
                </div>
                <span className="font-['Press_Start_2P'] text-[10px] text-white hidden sm:block max-w-[80px] truncate">
                  {user.nombre}
                </span>
                <ChevronDown size={12} className={cn("text-gray-400 transition-transform", isUserMenuOpen ? "rotate-180" : "")} />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden z-[100]"
                    style={{
                      background: "rgba(12,10,26,0.97)",
                      border: "1.5px solid rgba(0,217,255,0.25)",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
                      backdropFilter: "blur(20px)",
                    }}>
                    <div className="px-4 py-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-[#00d9ff] overflow-hidden flex items-center justify-center bg-[#1a1f35] flex-shrink-0">
                          {user.foto
                            ? <img src={user.foto} alt="foto" className="w-full h-full object-cover" />
                            : <User size={20} className="text-[#00d9ff]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-['Press_Start_2P'] text-[10px] text-white truncate">{user.nombre}</p>
                          <p className="text-[9px] text-gray-500 truncate mt-0.5">{user.email}</p>
                          {nivel && (
                            <>
                              <p className="text-[9px] text-[#ff1b8d] font-bold mt-1">{t("nivel")} {nivel}</p>
                              <div className="w-full h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                                <div className="h-full rounded-full"
                                  style={{ width: `${xpPct}%`, background: "linear-gradient(90deg,#ff1b8d,#a0115e)" }} />
                              </div>
                              <p className="text-[8px] text-gray-600 mt-0.5">{xpActual}/{xpSiguiente} XP</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <MenuDropdownItem icon={<UserCircle size={15} />} label={t("perfil")}        to="/profile"  onClick={() => setIsUserMenuOpen(false)} color="#00d9ff" />
                      <MenuDropdownItem icon={<Palette size={15} />}    label={t("avatar")}        to="/avatar"   onClick={() => setIsUserMenuOpen(false)} color="#00ff88" />
                      <MenuDropdownItem icon={<Coins size={15} />}      label="Monedas"            to="/monedas"  onClick={() => setIsUserMenuOpen(false)} color="#ffd700" />
                      <MenuDropdownItem icon={<Settings size={15} />}   label={t("configuracion")} to="/settings" onClick={() => setIsUserMenuOpen(false)} color="#a78bfa" />
                      <div className="h-px bg-white/10 my-1.5" />
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-[#ff4757] hover:bg-[#ff4757]/10 transition-all">
                        <LogOut size={15} />
                        {t("cerrarSesion")}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/login">
              <button className="flex items-center gap-2 font-['Press_Start_2P'] text-[10px] md:text-xs bg-[#ff1b8d] hover:bg-[#d01570] text-white px-4 py-2 rounded shadow-[2px_2px_0_#a0115e] active:shadow-none active:translate-y-0.5 transition-all">
                <LogIn size={12} /> <span className="hidden sm:inline">{t("login")}</span>
              </button>
            </Link>
          )}
        </div>
      </header>

      {/* ═══ BODY ═══ */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ═══ SIDEBAR ═══ */}
        <motion.aside
          initial={false}
          animate={{ width: isSidebarOpen ? 260 : 0, opacity: isSidebarOpen ? 1 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "bg-[#0f1425] border-r border-[#00d9ff]/20 flex flex-col flex-shrink-0 h-full z-40",
            "absolute md:relative left-0 top-0 bottom-0 shadow-2xl md:shadow-none"
          )}
          style={{ overflow: "hidden" }}>
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 w-[260px]">
            <div className="flex flex-col gap-1">
              <NavItem to="/" icon={<Home size={20} />} label={t("inicio")} active={location.pathname === "/"} />

              <div className="my-1">
                <button onClick={() => setIsGamesDropdownOpen(!isGamesDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left group text-gray-300 hover:text-[#00d9ff]">
                  <div className="flex items-center gap-3 font-bold text-sm">
                    <Gamepad2 size={20} /> {t("juegos")}
                  </div>
                  <ChevronDown size={16} className={cn("transition-transform duration-200", isGamesDropdownOpen ? "rotate-180" : "")} />
                </button>
                <AnimatePresence>
                  {isGamesDropdownOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="ml-9 border-l border-white/10 pl-2 mt-1 flex flex-col gap-1">
                        <SubNavItem to="/games"          label={t("verTodos")}    color="#00ff88" active={location.pathname === "/games"} />
                        <SubNavItem to="/games/math"     label={t("matematicas")} color="#4169E1" active={location.pathname === "/games/math"} />
                        <SubNavItem to="/games/science"  label={t("ciencias")}    color="#228B22" active={location.pathname === "/games/science"} />
                        <SubNavItem to="/games/language" label={t("lengua")}      color="#DAA520" active={location.pathname === "/games/language"} />
                        <SubNavItem to="/games/social"   label={t("sociales")}    color="#DC143C" active={location.pathname === "/games/social"} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="h-px bg-white/10 my-2 mx-2" />
              <NavItem to="/monedas"  icon={<Coins size={20} />}      label="Monedas"            active={location.pathname === "/monedas"} />
              <NavItem to="/avatar"   icon={<Palette size={20} />}    label={t("avatar")}        active={location.pathname === "/avatar"} />
              <NavItem to="/friends"  icon={<Users size={20} />}      label={t("amigos")}        active={location.pathname === "/friends"} />
              <NavItem to="/profile"  icon={<Target size={20} />}     label={t("perfil")}        active={location.pathname === "/profile"} />
              <div className="h-px bg-white/10 my-2 mx-2" />
              <NavItem to="/settings" icon={<Settings size={20} />}   label={t("configuracion")} active={location.pathname === "/settings"} />
              <NavItem to="/help"     icon={<HelpCircle size={20} />} label={t("ayuda")}         active={location.pathname === "/help"} />
            </div>
          </div>
          <div className="p-4 border-t border-white/10 bg-[#0a0e1b] w-[260px]">
            <button onClick={handleLogout} className="flex items-center gap-3 text-gray-400 hover:text-[#ff1b8d] transition-colors w-full">
              <LogOut size={18} />
              <span className="text-xs font-bold">{t("cerrarSesion")}</span>
            </button>
          </div>
        </motion.aside>

        {/* Backdrop móvil */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden absolute inset-0 bg-black/50 z-30 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)} />
          )}
        </AnimatePresence>

        {/* ═══ MAIN ═══ */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#1a1f35] flex flex-col w-full">
          <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
          <footer className="bg-[#0f1425] border-t border-[#00d9ff]/30 py-8 px-6 mt-auto w-full">
            <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left">
                <div className="font-['Press_Start_2P'] text-[#00ff88] text-xs mb-2">SABERIX</div>
                <p className="text-gray-500 text-[10px]">{t("derechos")}</p>
              </div>
              <div className="hidden md:flex gap-6 text-[10px] text-gray-500">
                <a href="/nosotros.html" target="_blank" className="hover:text-[#00d9ff] transition-colors">{t("sobreNosotros")}</a>
                <a href="/terminos.html" target="_blank" className="hover:text-[#00d9ff] transition-colors">{t("terminosDeUso")}</a>
                <a href="/terminos.html#privacidad" target="_blank" className="hover:text-[#00d9ff] transition-colors">{t("privacidad")}</a>
              </div>
              <div className="flex gap-3">
                <SocialBtn href="https://www.facebook.com/share/18Do35dCD3/" bg="#1877f2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </SocialBtn>
                <SocialBtn href="https://x.com/Saberixedu" bg="#000" border="#333">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </SocialBtn>
                <SocialBtn href="https://www.instagram.com/saberixedu/" bg="linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </SocialBtn>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

const MenuDropdownItem = ({ icon, label, to, onClick, color }: { icon: React.ReactNode; label: string; to: string; onClick: () => void; color: string }) => (
  <Link to={to} onClick={onClick}
    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-all">
    <span style={{ color }}>{icon}</span>
    {label}
  </Link>
);

const NavItem = ({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active?: boolean }) => (
  <Link to={to} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative", active ? "bg-[#00d9ff]/10 text-[#00d9ff]" : "text-gray-400 hover:bg-white/5 hover:text-white")}>
    <div className={cn("transition-colors", active ? "text-[#00d9ff]" : "text-gray-400 group-hover:text-[#00d9ff]")}>{icon}</div>
    <span className="font-bold text-sm">{label}</span>
    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#00d9ff] rounded-r-full" />}
  </Link>
);

const SubNavItem = ({ to, label, color, active }: { to: string; label: string; color: string; active?: boolean }) => (
  <Link to={to} className={cn("block px-3 py-2 text-xs font-medium rounded transition-colors flex items-center gap-2", active ? "text-white bg-white/5" : "text-gray-500 hover:text-gray-300 hover:bg-white/5")}>
    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
    <span>{label}</span>
  </Link>
);

const SocialBtn = ({ href, bg, border, children }: { href: string; bg: string; border?: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer"
    className="w-8 h-8 flex items-center justify-center rounded text-white hover:scale-110 transition-transform"
    style={{ background: bg, border: border ? `1px solid ${border}` : "none" }}>
    {children}
  </a>
);




