import React, { useState, useEffect } from "react";
import { Users, Search, Check, X, UserPlus, Clock, Loader2, Eye, MessageCircle, User } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router";

const API = "https://finalproyect-production-3837.up.railway.app";

interface Amigo     { id: number; nombre: string; foto: string | null; }
interface Solicitud { id: number; usuario_id: number; nombre: string; foto: string | null; }
interface Usuario   { id: number; nombre: string; foto: string | null; relacion: "amigo" | "enviado" | "recibido" | "ninguno"; }

function AvatarUser({ foto, nombre }: { foto?: string | null; nombre: string }) {
  return foto
    ? <img src={foto} alt={nombre} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
    : <div className="w-10 h-10 rounded-full bg-[#0f1425] border-2 border-[#ff1b8d] flex items-center justify-center font-bold text-[#ff1b8d] text-sm flex-shrink-0">
        {nombre[0]?.toUpperCase()}
      </div>;
}

function ModalAvatar({ nombre, foto, onClose }: { nombre: string; foto: string | null; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}>
      <div className="flex flex-col items-center px-8" onClick={e => e.stopPropagation()}>
        <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-[#ff1b8d] mb-4"
          style={{ boxShadow: "0 0 40px rgba(255,27,141,0.4)" }}>
          {foto
            ? <img src={foto} alt={nombre} className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-[#0f1425] flex items-center justify-center">
                <User size={64} className="text-[#ff1b8d]" />
              </div>
          }
        </div>
        <p className="font-['Press_Start_2P'] text-white text-sm mb-2">{nombre}</p>
        <p className="text-gray-500 text-[10px] mb-6">Avatar del jugador</p>
        <button onClick={onClose}
          className="px-6 py-2.5 rounded-xl border border-white/20 text-gray-400 text-xs font-bold hover:bg-white/5 transition-all">
          Cerrar
        </button>
      </div>
    </div>
  );
}

export function Friends() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab]                 = useState<"amigos" | "solicitudes" | "buscar">("amigos");
  const [amigos, setAmigos]           = useState<Amigo[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [busqueda, setBusqueda]       = useState("");
  const [resultados, setResultados]   = useState<Usuario[]>([]);
  const [loading, setLoading]         = useState(false);
  const [buscando, setBuscando]       = useState(false);
  const [enviados, setEnviados]       = useState<Set<number>>(new Set());
  const [avatarModal, setAvatarModal] = useState<{ nombre: string; foto: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    cargarAmigos();
    cargarSolicitudes();
  }, [user]);

  async function cargarAmigos() {
    if (!user) return;
    try {
      const res  = await fetch(`${API}/api/amigos/${user.id}`);
      const data = await res.json();
      if (data.ok) setAmigos(data.amigos);
    } catch {}
  }

  async function cargarSolicitudes() {
    if (!user) return;
    try {
      const res  = await fetch(`${API}/api/amigos/${user.id}/solicitudes`);
      const data = await res.json();
      if (data.ok) setSolicitudes(data.solicitudes);
    } catch {}
  }

  async function buscar() {
    if (!busqueda.trim() || !user) return;
    setBuscando(true);
    setResultados([]);
    try {
      const res  = await fetch(`${API}/api/amigos/buscar?q=${encodeURIComponent(busqueda)}&userId=${user.id}`);
      const data = await res.json();
      if (data.ok) setResultados(data.usuarios);
    } finally {
      setBuscando(false);
    }
  }

  async function enviarSolicitud(amigoId: number) {
    if (!user) return;
    try {
      const res  = await fetch(`${API}/api/amigos/solicitud`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId: user.id, amigoId }),
      });
      const data = await res.json();
      if (data.ok) {
        setEnviados(prev => new Set([...prev, amigoId]));
        setResultados(prev => prev.map(u => u.id === amigoId ? { ...u, relacion: "enviado" as const } : u));
      }
    } catch {}
  }

  async function responderSolicitud(id: number, accion: "aceptar" | "rechazar") {
    setLoading(true);
    try {
      await fetch(`${API}/api/amigos/solicitud/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion }),
      });
      await cargarSolicitudes();
      if (accion === "aceptar") await cargarAmigos();
    } finally {
      setLoading(false);
    }
  }

  if (!user) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-gray-400 font-['Press_Start_2P'] text-xs">Inicia sesion para ver tus amigos</p>
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full px-4 py-8 max-w-2xl mx-auto">

      {/* Modal avatar */}
      {avatarModal && (
        <ModalAvatar
          nombre={avatarModal.nombre}
          foto={avatarModal.foto}
          onClose={() => setAvatarModal(null)}
        />
      )}

      <h1 className="font-['Press_Start_2P'] text-[#ff1b8d] text-2xl mb-8 text-center drop-shadow-[0_0_10px_rgba(255,27,141,0.5)]">
        AMIGOS
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 w-full mb-6">
        {([
          { key: "amigos",      label: `Amigos (${amigos.length})` },
          { key: "solicitudes", label: `Solicitudes${solicitudes.length > 0 ? ` (${solicitudes.length})` : ""}` },
          { key: "buscar",      label: "Buscar" },
        ] as const).map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className="flex-1 py-2.5 rounded-xl font-['Press_Start_2P'] text-[9px] transition-all border"
            style={{
              background:  tab === tb.key ? "rgba(255,27,141,0.15)" : "transparent",
              borderColor: tab === tb.key ? "#ff1b8d" : "rgba(255,255,255,0.1)",
              color:       tab === tb.key ? "#ff1b8d" : "#6b7280",
            }}>
            {tb.label}
          </button>
        ))}
      </div>

      <div key={tab} className="w-full">

        {/* AMIGOS */}
        {tab === "amigos" && (
          <div className="space-y-3">
            {amigos.length === 0 ? (
              <div className="text-center py-16">
                <Users size={48} className="text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 font-['Press_Start_2P'] text-[10px]">Aun no tienes amigos</p>
                <p className="text-gray-600 text-xs mt-2">Buscalos en la pestana Buscar</p>
              </div>
            ) : amigos.map(a => (
              <div key={a.id}
                className="bg-[#1a1f35] border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-colors">
                {/* Avatar clickeable */}
                <button onClick={() => setAvatarModal({ nombre: a.nombre, foto: a.foto })}
                  className="relative group flex-shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#ff1b8d]/50">
                    {a.foto
                      ? <img src={a.foto} alt={a.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      : <div className="w-full h-full bg-[#0f1425] flex items-center justify-center font-bold text-[#ff1b8d] text-sm">
                          {a.nombre[0]?.toUpperCase()}
                        </div>
                    }
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <div className="flex-1">
                  <p className="font-bold text-white">{a.nombre}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#00ff88]" />
                    <span className="text-xs text-[#00ff88]">En linea</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/chat?userId=${a.id}&nombre=${encodeURIComponent(a.nombre)}`)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88]/20 transition-all">
                    <MessageCircle size={15} />
                  </button>
                  <button onClick={() => navigate(`/profile?userId=${a.id}`)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#00d9ff]/10 border border-[#00d9ff]/30 text-[#00d9ff] hover:bg-[#00d9ff]/20 transition-all">
                    <Eye size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SOLICITUDES */}
        {tab === "solicitudes" && (
          <div className="space-y-3">
            {solicitudes.length === 0 ? (
              <div className="text-center py-16">
                <Clock size={48} className="text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 font-['Press_Start_2P'] text-[10px]">No tienes solicitudes pendientes</p>
              </div>
            ) : solicitudes.map(s => (
              <div key={s.id}
                className="bg-[#1a1f35] border border-white/10 rounded-xl p-4 flex items-center gap-4">
                <button onClick={() => setAvatarModal({ nombre: s.nombre, foto: s.foto })}
                  className="relative group flex-shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#ff1b8d]/50">
                    {s.foto
                      ? <img src={s.foto} alt={s.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      : <div className="w-full h-full bg-[#0f1425] flex items-center justify-center font-bold text-[#ff1b8d] text-sm">
                          {s.nombre[0]?.toUpperCase()}
                        </div>
                    }
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <div className="flex-1">
                  <p className="font-bold text-white">{s.nombre}</p>
                  <p className="text-xs text-gray-500">Quiere ser tu amigo</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => responderSolicitud(s.id, "aceptar")} disabled={loading}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88]/20 transition-all disabled:opacity-50">
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
                  </button>
                  <button onClick={() => responderSolicitud(s.id, "rechazar")} disabled={loading}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#ff4757]/10 border border-[#ff4757]/30 text-[#ff4757] hover:bg-[#ff4757]/20 transition-all disabled:opacity-50">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BUSCAR */}
        {tab === "buscar" && (
          <div className="w-full">
            <div className="flex gap-2 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text" value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && buscar()}
                  placeholder="Buscar por nombre o email..."
                  className="w-full bg-[#0f1425] border-2 border-[#ff1b8d]/30 focus:border-[#ff1b8d] rounded-xl py-3 pl-11 pr-4 text-white outline-none transition-colors text-sm font-semibold placeholder:text-gray-600"
                />
              </div>
              <button onClick={buscar} disabled={buscando || !busqueda.trim()}
                className="px-5 py-3 rounded-xl font-['Press_Start_2P'] text-[10px] text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                style={{ background: "linear-gradient(135deg,#ff1b8d,#a0115e)", boxShadow: "0 4px 16px rgba(255,27,141,0.3)" }}>
                {buscando ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                Buscar
              </button>
            </div>

            <div className="space-y-3">
              {buscando ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={24} className="text-[#ff1b8d] animate-spin" />
                </div>
              ) : resultados.length === 0 ? (
                <div className="text-center py-10">
                  <Search size={40} className="text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    {busqueda ? "No se encontraron usuarios" : "Escribe un nombre y presiona Buscar"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {resultados.map(u => (
                    <div key={u.id}
                      className="bg-[#1a1f35] border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-colors">
                      <button onClick={() => setAvatarModal({ nombre: u.nombre, foto: u.foto })}
                        className="relative group flex-shrink-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#ff1b8d]/50">
                          {u.foto
                            ? <img src={u.foto} alt={u.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            : <div className="w-full h-full bg-[#0f1425] flex items-center justify-center font-bold text-[#ff1b8d] text-sm">
                                {u.nombre[0]?.toUpperCase()}
                              </div>
                          }
                        </div>
                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate">{u.nombre}</p>
                        <p className="text-[10px] mt-0.5">
                          {(u.relacion === "enviado" || enviados.has(u.id)) &&
                            <span className="text-[#ffd700]">Solicitud enviada</span>}
                          {u.relacion === "amigo" &&
                            <span className="text-[#00ff88]">Ya son amigos</span>}
                          {u.relacion === "recibido" &&
                            <span className="text-[#a78bfa]">Te envio solicitud</span>}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => navigate(`/profile?userId=${u.id}`)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#00d9ff]/10 border border-[#00d9ff]/30 text-[#00d9ff] hover:bg-[#00d9ff]/20 transition-all">
                          <Eye size={15} />
                        </button>
                        {u.relacion === "amigo" && (
                          <button onClick={() => navigate(`/chat?userId=${u.id}&nombre=${encodeURIComponent(u.nombre)}`)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88]/20 transition-all">
                            <MessageCircle size={15} />
                          </button>
                        )}
                        {u.relacion === "ninguno" && !enviados.has(u.id) && (
                          <button onClick={() => enviarSolicitud(u.id)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#ff1b8d]/10 border border-[#ff1b8d]/30 text-[#ff1b8d] hover:bg-[#ff1b8d]/20 transition-all">
                            <UserPlus size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
