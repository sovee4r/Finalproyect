import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Send, User, Loader2, Pencil, Trash2, Check, CheckCheck } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useSearchParams, useNavigate } from "react-router";

const API = "https://finalproyect-production-3837.up.railway.app";

interface Mensaje {
  id: number; de_id: number; para_id: number;
  contenido: string; leido: number;
  created_at: string; de_nombre: string; de_foto: string | null;
}

export function Chat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amigoId     = Number(searchParams.get("userId"));
  const amigoNombre = decodeURIComponent(searchParams.get("nombre") ?? "");

  const [mensajes,   setMensajes]   = useState<Mensaje[]>([]);
  const [texto,      setTexto]      = useState("");
  const [loading,    setLoading]    = useState(true);
  const [enviando,   setEnviando]   = useState(false);
  const [amigoFoto,  setAmigoFoto]  = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editTexto,  setEditTexto]  = useState("");
  const bottomRef   = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (!user || !amigoId) return;
    fetch(`${API}/api/perfil/${amigoId}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setAmigoFoto(d.user.foto); });
    cargarMensajes();
    intervalRef.current = setInterval(cargarMensajes, 3000);
    return () => clearInterval(intervalRef.current);
  }, [user, amigoId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  async function cargarMensajes() {
    if (!user) return;
    try {
      const res  = await fetch(`${API}/api/mensajes/${user.id}/${amigoId}`);
      const data = await res.json();
      if (data.ok) setMensajes(data.mensajes);
    } finally {
      setLoading(false);
    }
  }

  async function enviar() {
    if (!texto.trim() || !user || enviando) return;
    setEnviando(true);
    const textoEnviar = texto.trim();
    setTexto("");
    try {
      const res  = await fetch(`${API}/api/mensajes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deId: user.id, paraId: amigoId, contenido: textoEnviar }),
      });
      const data = await res.json();
      if (data.ok) setMensajes(prev => [...prev, data.mensaje]);
    } finally {
      setEnviando(false);
    }
  }

  async function editarMensaje(id: number) {
    if (!editTexto.trim() || !user) return;
    try {
      await fetch(`${API}/api/mensajes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: editTexto.trim(), userId: user.id }),
      });
      setMensajes(prev => prev.map(m => m.id === id ? { ...m, contenido: editTexto.trim() } : m));
    } catch (err) {
      console.error("Error editando mensaje:", err);
    } finally {
      setEditandoId(null);
      setEditTexto("");
    }
  }

  async function borrarMensaje(id: number) {
    if (!user) return;
    try {
      await fetch(`${API}/api/mensajes/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      setMensajes(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error("Error borrando mensaje:", err);
    }
  }

  function formatHora(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" });
  }

  function formatFecha(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-DO", { day: "numeric", month: "short" });
  }

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-[#06091a] flex flex-col z-50">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#0f1425]"
        style={{ boxShadow: "0 4px 20px rgba(0,217,255,0.1)" }}>
        <button onClick={() => navigate(-1)}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        {/* Click en foto/nombre va al perfil */}
        <button onClick={() => navigate(`/profile?userId=${amigoId}`)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-full border-2 border-[#00d9ff] overflow-hidden flex items-center justify-center bg-[#1a1f35] flex-shrink-0">
            {amigoFoto
              ? <img src={amigoFoto} alt={amigoNombre} className="w-full h-full object-cover" />
              : <User size={18} className="text-[#00d9ff]" />}
          </div>
          <div className="text-left">
            <p className="font-['Press_Start_2P'] text-xs text-white">{amigoNombre}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
              <span className="text-[10px] text-[#00ff88]">En linea</span>
            </div>
          </div>
        </button>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="text-[#00d9ff] animate-spin" />
          </div>
        ) : mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-16 h-16 rounded-full bg-[#1a1f35] border-2 border-white/10 flex items-center justify-center">
              <Send size={24} className="text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm font-bold">Empieza la conversacion</p>
            <p className="text-gray-600 text-xs">Envia tu primer mensaje a {amigoNombre}</p>
          </div>
        ) : (
          <>
            {mensajes.map((m, i) => {
              const esMio = m.de_id === user.id;
              const showFecha = i === 0 || formatFecha(mensajes[i - 1].created_at) !== formatFecha(m.created_at);
              const esUltimo = i === mensajes.length - 1;
              return (
                <React.Fragment key={m.id}>
                  {showFecha && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-white/5" />
                      <span className="text-[10px] text-gray-600 font-bold">{formatFecha(m.created_at)}</span>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex items-end gap-2 ${esMio ? "flex-row-reverse" : "flex-row"}`}>
                    {!esMio && (
                      <div className="w-7 h-7 rounded-full border border-[#00d9ff]/30 overflow-hidden flex items-center justify-center bg-[#1a1f35] flex-shrink-0 mb-1">
                        {amigoFoto
                          ? <img src={amigoFoto} alt="" className="w-full h-full object-cover" />
                          : <User size={12} className="text-[#00d9ff]" />}
                      </div>
                    )}
                    <div className={`max-w-[70%] flex flex-col gap-1 ${esMio ? "items-end" : "items-start"}`}>

                      {editandoId === m.id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            value={editTexto}
                            onChange={e => setEditTexto(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") editarMensaje(m.id); if (e.key === "Escape") { setEditandoId(null); setEditTexto(""); } }}
                            className="bg-[#1a1f35] border border-[#00d9ff]/50 rounded-xl px-3 py-2 text-white text-sm outline-none min-w-[150px]"
                            autoFocus
                          />
                          <button onClick={() => editarMensaje(m.id)} className="text-[#00ff88] hover:opacity-80">
                            <Check size={16} />
                          </button>
                          <button onClick={() => { setEditandoId(null); setEditTexto(""); }} className="text-gray-500 hover:opacity-80 text-xs">✕</button>
                        </div>
                      ) : (
                        <div className="relative group">
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed text-white ${esMio ? "rounded-br-md" : "rounded-bl-md"}`}
                            style={{
                              background: esMio
                                ? "linear-gradient(135deg,#00d9ff,#0096ff)"
                                : "rgba(26,31,53,0.9)",
                              border: esMio ? "none" : "1px solid rgba(255,255,255,0.08)",
                              boxShadow: esMio ? "0 4px 16px rgba(0,217,255,0.2)" : "none",
                            }}>
                            {m.contenido}
                          </div>
                          {/* Botones editar/borrar — solo mis mensajes */}
                          {esMio && (
                            <div className="absolute top-0 right-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button
                                onClick={() => { setEditandoId(m.id); setEditTexto(m.contenido); }}
                                className="w-7 h-7 rounded-lg bg-[#1a1f35] border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#00d9ff] transition-colors">
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={() => borrarMensaje(m.id)}
                                className="w-7 h-7 rounded-lg bg-[#1a1f35] border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#ff4757] transition-colors">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hora + visto */}
                      <div className="flex items-center gap-1 px-1">
                        <span className="text-[10px] text-gray-600">{formatHora(m.created_at)}</span>
                        {esMio && esUltimo && (
                          m.leido === 1
                            ? <CheckCheck size={12} className="text-[#00d9ff]" />
                            : <Check size={12} className="text-gray-600" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                </React.Fragment>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/10 bg-[#0f1425]">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <input
            type="text"
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && enviar()}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-[#1a1f35] border border-white/10 focus:border-[#00d9ff]/50 rounded-2xl px-5 py-3 text-white text-sm outline-none placeholder:text-gray-600 transition-colors"
          />
          <button onClick={enviar} disabled={!texto.trim() || enviando}
            className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#00d9ff,#0096ff)", boxShadow: "0 4px 16px rgba(0,217,255,0.3)" }}>
            {enviando ? <Loader2 size={16} className="animate-spin text-white" /> : <Send size={16} className="text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}


