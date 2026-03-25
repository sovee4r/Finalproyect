import React, { useState, useEffect, useCallback } from "react";
import { Users, Search, Check, X, UserPlus, Clock, Loader2, MessageCircle } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router";

const API = "https://finalproyect-production-3837.up.railway.app";

interface Amigo     { id: number; nombre: string; foto: string | null; online?: boolean; }
interface Solicitud { id: number; usuario_id: number; nombre: string; foto: string | null; }
interface Usuario   { id: number; nombre: string; foto: string | null; relacion: "amigo" | "enviado" | "recibido" | "ninguno"; }

function OnlineDot({ online }: { online?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 mt-0.5">
      <div className={`w-2 h-2 rounded-full transition-colors ${online ? "bg-[#00ff88]" : "bg-gray-600"}`} />
      <span className={`text-xs transition-colors ${online ? "text-[#00ff88]" : "text-gray-500"}`}>
        {online ? "En linea" : "Desconectado"}
      </span>
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

  useEffect(() => {
    if (!user) return;
    cargarAmigos();
    cargarSolicitudes();
  }, [user]);

  // Actualizar estados online cada 30 segundos
  useEffect(() => {
    if (!user || amigos.length === 0) return;
    const interval = setInterval(() => actualizarEstadosOnline(amigos), 30_000);
    return () => clearInterval(interval);
  }, [amigos, user]);

  async function actualizarEstadosOnline(lista: Amigo[]) {
    if (!lista.length) return;
    try {
      const res  = await fetch(`${API}/api/online-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: lista.map(a => a.id) }),
      });
      const data = await res.json();
      if (data.ok) {
        setAmigos(prev => prev.map(a => ({ ...a, online: !!data.estados[a.id] })));
      }
    } catch {}
  }

  async function cargarAmigos() {
    if (!user) return;
    try {
      const res  = await fetch(`${API}/api/amigos/${user.id}`);
      const data = await res.json();
      if (data.ok) {
        setAmigos(data.amigos);
        actualizarEstadosOnline(data.amigos);
      }
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

  async function buscar(q: string) {
    if (!q.trim() || !user) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    try {
      const res  = await fetch(`${API}/api/amigos/buscar?q=${encodeURIComponent(q)}&userId=${user.id}`);
      const data = await res.json();
      if (data.ok) setResultados(data.usuarios);
    } finally {
      setBuscando(false);
    }
  }

  // Búsqueda en tiempo real con debounce 400ms
  useEffect(() => {
    const timer = setTimeout(() => buscar(busqueda), 400);
    return () => clearTimeout(timer);
  }, [busqueda]);

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
                <button onClick={() => navigate(`/profile?userId=${a.id}`)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#ff1b8d]/50">
                      {a.foto
                        ? <img src={a.foto} alt={a.nombre} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-[#0f1425] flex items-center justify-center font-bold text-[#ff1b8d] text-sm">
                            {a.nombre[0]?.toUpperCase()}
                          </div>
                      }
                    </div>
                    {/* Indicador online en la foto */}
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1a1f35] ${a.online ? "bg-[#00ff88]" : "bg-gray-600"}`} />
                  </div>
                  <div>
                    <p className="font-bold text-white hover:text-[#00d9ff] transition-colors">{a.nombre}</p>
                    <OnlineDot online={a.online} />
                  </div>
                </button>
                <button onClick={() => navigate(`/chat?userId=${a.id}&nombre=${encodeURIComponent(a.nombre)}`)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88]/20 transition-all flex-shrink-0">
                  <MessageCircle size={15} />
                </button>
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
                <button onClick={() => navigate(`/profile?userId=${s.usuario_id}`)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#ff1b8d]/50 flex-shrink-0">
                    {s.foto
                      ? <img src={s.foto} alt={s.nombre} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-[#0f1425] flex items-center justify-center font-bold text-[#ff1b8d] text-sm">
                          {s.nombre[0]?.toUpperCase()}
                        </div>
                    }
                  </div>
                  <div>
                    <p className="font-bold text-white hover:text-[#00d9ff] transition-colors">{s.nombre}</p>
                    <p className="text-xs text-gray-500">Quiere ser tu amigo</p>
                  </div>
                </button>
                <div className="flex gap-2 flex-shrink-0">
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
            <div className="relative mb-5">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              {buscando && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#ff1b8d] animate-spin" />}
              <input
                type="text" value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Escribe para buscar usuarios..."
                className="w-full bg-[#0f1425] border-2 border-[#ff1b8d]/30 focus:border-[#ff1b8d] rounded-xl py-3 pl-11 pr-10 text-white outline-none transition-colors text-sm font-semibold placeholder:text-gray-600"
                autoFocus
              />
            </div>

            <div className="space-y-3">
              {resultados.length === 0 ? (
                <div className="text-center py-10">
                  <Search size={40} className="text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    {busqueda.length >= 1 ? "No se encontraron usuarios" : "Empieza a escribir para buscar"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {resultados.map(u => (
                    <div key={u.id}
                      className="bg-[#1a1f35] border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-colors">
                      <button onClick={() => navigate(`/profile?userId=${u.id}`)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#ff1b8d]/50 flex-shrink-0">
                          {u.foto
                            ? <img src={u.foto} alt={u.nombre} className="w-full h-full object-cover" />
                            : <div className="w-full h-full bg-[#0f1425] flex items-center justify-center font-bold text-[#ff1b8d] text-sm">
                                {u.nombre[0]?.toUpperCase()}
                              </div>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white hover:text-[#00d9ff] transition-colors truncate">{u.nombre}</p>
                          <p className="text-[10px] mt-0.5">
                            {(u.relacion === "enviado" || enviados.has(u.id)) &&
                              <span className="text-[#ffd700]">Solicitud enviada</span>}
                            {u.relacion === "amigo" &&
                              <span className="text-[#00ff88]">Ya son amigos</span>}
                            {u.relacion === "recibido" &&
                              <span className="text-[#a78bfa]">Te envio solicitud</span>}
                          </p>
                        </div>
                      </button>
                      <div className="flex gap-2 flex-shrink-0">
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
