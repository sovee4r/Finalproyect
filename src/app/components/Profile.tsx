import React, { useEffect, useState } from "react";
import { Target, TrendingUp, Trophy, User, Star, Zap, MessageCircle, UserPlus, Check, Globe2 } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useSearchParams, useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";

const API = "https://finalproyect-production-3837.up.railway.app";

interface Stats       { partidas: number; victorias: number; mejor_puntuacion: number; }
interface XpInfo      { xp: number; nivel: number; xp_actual: number; xp_siguiente: number; partidas: number; mejor_puntuacion: number; total_correctas: number; }
interface ProfileUser { id: number; nombre: string; email: string; foto: string | null; bio: string | null; pais?: string | null; }

const NIVELES = [
  { nivel: 1,  nombre: "Aprendiz",   nombreEn: "Apprentice", color: "#6b7280" },
  { nivel: 5,  nombre: "Explorador", nombreEn: "Explorer",   color: "#00ff88" },
  { nivel: 10, nombre: "Aventurero", nombreEn: "Adventurer", color: "#00d9ff" },
  { nivel: 20, nombre: "Experto",    nombreEn: "Expert",     color: "#a78bfa" },
  { nivel: 30, nombre: "Maestro",    nombreEn: "Master",     color: "#ffd700" },
  { nivel: 50, nombre: "Leyenda",    nombreEn: "Legend",     color: "#ff1b8d" },
];

function getNivelInfo(nivel: number) {
  let info = NIVELES[0];
  for (const n of NIVELES) { if (nivel >= n.nivel) info = n; }
  return info;
}

export function Profile() {
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const viewUserId   = searchParams.get("userId");
  const isOwnProfile = !viewUserId || Number(viewUserId) === user?.id;

  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [xpInfo,   setXpInfo]   = useState<XpInfo | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [relacion, setRelacion] = useState<"amigo" | "enviado" | "recibido" | "ninguno">("ninguno");
  const [enviando, setEnviando] = useState(false);
  const [verFoto,  setVerFoto]  = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const uid = viewUserId ?? user?.id;
        if (!uid) return;

        if (isOwnProfile && user) {
          setProfileUser(user as ProfileUser);
        } else {
          const res  = await fetch(`${API}/api/perfil/${uid}`);
          const data = await res.json();
          if (data.ok) {
            setProfileUser(data.user);

            // Verificar relacion con este usuario
            if (user) {
              const rRes  = await fetch(`${API}/api/amigos/buscar?q=${encodeURIComponent(data.user.nombre)}&userId=${user.id}`);
              const rData = await rRes.json();
              if (rData.ok) {
                const encontrado = rData.usuarios.find((u: any) => u.id === Number(uid));
                if (encontrado) setRelacion(encontrado.relacion);
              }
            }
          }
        }

        const [sRes, xRes] = await Promise.all([
          fetch(`${API}/api/perfil/${uid}/stats`),
          fetch(`${API}/api/experiencia/${uid}`),
        ]);
        const sData = await sRes.json();
        const xData = await xRes.json();
        if (sData.ok) setStats(sData.stats);
        if (xData.ok) setXpInfo(xData);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [viewUserId, user, location.key]);

  async function enviarSolicitud() {
    if (!user || !profileUser) return;
    setEnviando(true);
    try {
      await fetch(`${API}/api/amigos/solicitud`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId: user.id, amigoId: profileUser.id }),
      });
      setRelacion("enviado");
    } finally {
      setEnviando(false);
    }
  }

  if (!user && isOwnProfile) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-gray-400 font-['Press_Start_2P'] text-xs">Inicia sesion para ver tu perfil</p>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-[#ffd700]/30 border-t-[#ffd700] rounded-full animate-spin" />
    </div>
  );

  if (!profileUser) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-gray-400 font-['Press_Start_2P'] text-xs">Usuario no encontrado</p>
    </div>
  );

  const nivelInfo   = getNivelInfo(xpInfo?.nivel ?? 1);
  const xpPct       = Math.min(((xpInfo?.xp_actual ?? 0) / (xpInfo?.xp_siguiente ?? 500)) * 100, 100);
  const isEn        = i18n.language === "en";
  const nombreRango = isEn ? nivelInfo.nombreEn : nivelInfo.nombre;

  const statCards = [
    { icon: <Target size={22} />,     label: t("partidas"),   value: xpInfo?.partidas         ?? 0, color: "#00d9ff" },
    { icon: <Trophy size={22} />,     label: t("nivel"),      value: xpInfo?.nivel            ?? 1, color: "#ffd700" },
    { icon: <TrendingUp size={22} />, label: t("correctas"),  value: xpInfo?.total_correctas  ?? 0, color: "#00ff88" },
    { icon: <Star size={22} />,       label: t("mejorScore"), value: xpInfo?.mejor_puntuacion ?? 0, color: "#ff1b8d" },
  ];

  return (
    <div className="flex flex-col items-center w-full px-4 py-8 max-w-2xl mx-auto">

      {/* Modal foto grande */}
      {verFoto && profileUser.foto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setVerFoto(false)}>
          <div className="flex flex-col items-center px-8" onClick={e => e.stopPropagation()}>
            <div className="w-64 h-64 rounded-full overflow-hidden border-4 mb-4"
              style={{ borderColor: nivelInfo.color, boxShadow: `0 0 40px ${nivelInfo.color}66` }}>
              <img src={profileUser.foto} alt={profileUser.nombre} className="w-full h-full object-cover" />
            </div>
            <p className="font-['Press_Start_2P'] text-white text-sm mb-2">{profileUser.nombre}</p>
            <p className="text-gray-500 text-[10px] mb-6">Toca para cerrar</p>
            <button onClick={() => setVerFoto(false)}
              className="px-6 py-2.5 rounded-xl border border-white/20 text-gray-400 text-xs font-bold hover:bg-white/5 transition-all">
              Cerrar
            </button>
          </div>
        </div>
      )}

      <h1 className="font-['Press_Start_2P'] text-[#ffd700] text-xl mb-8 text-center drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
        {isOwnProfile ? t("tuPerfil") : t("perfilUsuario")}
      </h1>

      {/* Tarjeta usuario */}
      <div className="w-full bg-[#1a1f35] border border-white/10 rounded-2xl overflow-hidden mb-6">
        <div className="h-20 w-full"
          style={{ background: `linear-gradient(135deg,${nivelInfo.color}22,#ff1b8d22,#00d9ff22)` }} />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-4">

            {/* Avatar clickeable para ver en grande */}
            <button
              onClick={() => profileUser.foto && setVerFoto(true)}
              className="relative group flex-shrink-0"
              disabled={!profileUser.foto}>
              <div className="w-20 h-20 rounded-full bg-[#0f1425] border-4 flex items-center justify-center overflow-hidden"
                style={{ borderColor: nivelInfo.color, boxShadow: `0 0 20px ${nivelInfo.color}66` }}>
                {profileUser.foto
                  ? <img src={profileUser.foto} alt="Avatar"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  : <User size={36} style={{ color: nivelInfo.color }} />}
              </div>
              {profileUser.foto && (
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-[9px] font-bold">Ver</span>
                </div>
              )}
            </button>

            <div className="mb-2 flex-1">
              <h2 className="font-['Press_Start_2P'] text-white text-base leading-relaxed">{profileUser.nombre}</h2>
              <p className="text-gray-500 text-[10px] mt-1">{profileUser.email}</p>

              {/* País */}
              {profileUser.pais && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Globe2 size={11} className="text-gray-500" />
                  <span className="text-[10px] text-gray-400">{profileUser.pais}</span>
                </div>
              )}

              <div className="flex items-center gap-2 mt-2">
                <span className="font-['Press_Start_2P'] text-[9px] px-2 py-1 rounded-full"
                  style={{ background: `${nivelInfo.color}18`, color: nivelInfo.color, border: `1px solid ${nivelInfo.color}40` }}>
                  {nombreRango}
                </span>
                <span className="text-[10px] text-gray-500">{t("nivel")} {xpInfo?.nivel ?? 1}</span>
              </div>
              {profileUser.bio && <p className="text-gray-400 text-xs mt-2">{profileUser.bio}</p>}
            </div>
          </div>

          {/* Botones accion perfil ajeno */}
          {!isOwnProfile && user && (
            <div className="flex gap-3 mt-2 flex-wrap">
              <button
                onClick={() => navigate(`/chat?userId=${profileUser.id}&nombre=${encodeURIComponent(profileUser.nombre)}`)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#00d9ff]/10 border border-[#00d9ff]/30 text-[#00d9ff] hover:bg-[#00d9ff]/20 transition-all">
                <MessageCircle size={14} /> {t("enviarMensaje")}
              </button>

              {relacion === "ninguno" && (
                <button onClick={enviarSolicitud} disabled={enviando}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#ff1b8d]/10 border border-[#ff1b8d]/30 text-[#ff1b8d] hover:bg-[#ff1b8d]/20 transition-all disabled:opacity-50">
                  <UserPlus size={14} /> {enviando ? t("enviando") : t("agregarAmigo")}
                </button>
              )}

              {relacion === "enviado" && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-[#ffd700]/30 text-[#ffd700]">
                  <Check size={14} /> {t("solicitudEnviada")}
                </div>
              )}

              {relacion === "amigo" && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-[#00ff88]/30 text-[#00ff88]">
                  <Check size={14} /> Ya son amigos
                </div>
              )}

              {relacion === "recibido" && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-[#a78bfa]/30 text-[#a78bfa]">
                  <UserPlus size={14} /> Te envio solicitud
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 w-full mb-6">
        {statCards.map((s, i) => (
          <div key={i}
            className="bg-[#1a1f35] border border-white/10 rounded-xl p-5 flex items-center gap-4 hover:border-white/20 transition-colors">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}40` }}>
              {s.icon}
            </div>
            <div>
              <div className="text-[9px] text-gray-400 font-bold mb-1">{s.label}</div>
              <div className="font-['Press_Start_2P'] text-white text-lg">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Barra XP */}
      <div className="w-full bg-[#1a1f35] border border-white/10 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: nivelInfo.color }} />
            <span className="font-['Press_Start_2P'] text-[10px] text-white">
              {t("nivel")} {xpInfo?.nivel ?? 1} — {nombreRango}
            </span>
          </div>
          <span className="text-[10px] text-gray-500">
            {xpInfo?.xp_actual ?? 0} / {xpInfo?.xp_siguiente ?? 500} XP
          </span>
        </div>
        <div className="w-full h-3 bg-[#0f1425] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${xpPct}%`,
              background: `linear-gradient(90deg,${nivelInfo.color},#ff8c00)`,
              boxShadow: `0 0 8px ${nivelInfo.color}66`,
            }} />
        </div>
        <div className="flex justify-between mt-2">
          <p className="text-[10px] text-gray-600">{xpInfo?.partidas ?? 0} {t("partidasJugadas")}</p>
          <p className="text-[10px] text-gray-600">{t("mejorScoreLabel")} {xpInfo?.mejor_puntuacion ?? 0}</p>
        </div>
      </div>

      {/* Rangos */}
      <div className="w-full bg-[#1a1f35] border border-white/10 rounded-xl p-5">
        <p className="font-['Press_Start_2P'] text-[10px] text-white mb-4 flex items-center gap-2">
          <Trophy size={12} className="text-[#ffd700]" /> RANGOS
        </p>
        <div className="grid grid-cols-3 gap-2">
          {NIVELES.map((n) => {
            const actual = (xpInfo?.nivel ?? 1) >= n.nivel;
            return (
              <div key={n.nivel}
                className="rounded-xl p-3 text-center border transition-all"
                style={{
                  background:  actual ? `${n.color}12` : "rgba(255,255,255,0.02)",
                  borderColor: actual ? `${n.color}40`  : "rgba(255,255,255,0.06)",
                  opacity:     actual ? 1 : 0.4,
                }}>
                <p className="font-['Press_Start_2P'] text-[9px] mb-1"
                  style={{ color: actual ? n.color : "#6b7280" }}>
                  {isEn ? n.nombreEn : n.nombre}
                </p>
                <p className="text-[9px] text-gray-600">Lv. {n.nivel}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
