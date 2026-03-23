import React, { useState } from "react";
import { User, Camera, Save, X, Loader2, Upload, Link } from "lucide-react";
import { useAuth } from "../AuthContext";

const API = "https://finalproyect-production-3837.up.railway.app";

const PAISES = [
  "Argentina","Bolivia","Brasil","Chile","Colombia","Costa Rica","Cuba",
  "Ecuador","El Salvador","España","Guatemala","Honduras","Mexico",
  "Nicaragua","Panama","Paraguay","Peru","Puerto Rico","Republica Dominicana",
  "Uruguay","Venezuela","Otro",
];

function comprimirImagen(file: File, maxSize: number, calidad: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; }
      } else {
        if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; }
      }
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas error")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", calidad));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Error de imagen")); };
    img.src = url;
  });
}

function InfoForm({ user, login }: { user: any; login: (u: any) => void }) {
  const [bio,     setBio]     = useState(user.bio  ?? "");
  const [pais,    setPais]    = useState(user.pais ?? "");
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  async function guardar() {
    setSaving(true);
    setError("");
    try {
      const res  = await fetch(`${API}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, nombre: user.nombre, bio, foto: user.foto, pais }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al guardar"); return; }
      login(data.user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("No se pudo conectar al servidor");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">Nombre</label>
        <div className="px-4 py-3 rounded-xl bg-white/3 border border-white/8 text-white text-sm font-bold">
          {user.nombre}
        </div>
      </div>

      <div>
        <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">Email</label>
        <div className="px-4 py-3 rounded-xl bg-white/3 border border-white/8 text-white text-sm font-bold truncate">
          {user.email}
        </div>
      </div>

      <div>
        <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">Pais</label>
        <select
          value={pais}
          onChange={e => setPais(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-[#0f1425] border border-white/10 focus:border-[#00ff88]/50 text-white text-sm outline-none transition-colors cursor-pointer">
          <option value="">Selecciona tu pais...</option>
          {PAISES.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">Descripcion</label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="Cuentanos algo sobre ti..."
          maxLength={200}
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-[#0f1425] border border-white/10 focus:border-[#00ff88]/50 text-white text-sm outline-none transition-colors resize-none placeholder:text-gray-600"
        />
        <p className="text-[10px] text-gray-600 text-right mt-1">{bio.length}/200</p>
      </div>

      {error   && <p className="text-[#ff4757] text-xs font-bold">{error}</p>}
      {success && <p className="text-[#00ff88] text-xs font-bold">✅ Informacion actualizada</p>}

      <button onClick={guardar} disabled={saving}
        className="w-full py-3 rounded-xl font-['Press_Start_2P'] text-xs text-black disabled:opacity-40 transition-all flex items-center justify-center gap-2 hover:brightness-110"
        style={{ background: "linear-gradient(135deg,#00ff88,#00d9ff)", boxShadow: "0 4px 16px rgba(0,255,136,0.2)" }}>
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}

export function Avatar() {
  const { user, login } = useAuth();

  const [editando,   setEditando]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [urlInput,   setUrlInput]   = useState(user?.foto ?? "");
  const [previewUrl, setPreviewUrl] = useState(user?.foto ?? "");
  const [urlError,   setUrlError]   = useState("");
  const [modo,       setModo]       = useState<"url" | "archivo">("url");
  const [uploading,  setUploading]  = useState(false);

  if (!user) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-gray-400 font-['Press_Start_2P'] text-xs">Inicia sesion para ver tu avatar</p>
    </div>
  );

  async function guardarFoto(fotoUrl: string) {
    if (!fotoUrl.trim()) return;
    setSaving(true);
    setUrlError("");
    try {
      const res  = await fetch(`${API}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, nombre: user.nombre, bio: user.bio, foto: fotoUrl }),
      });
      const data = await res.json();
      if (!res.ok) { setUrlError(data.error || "Error al guardar"); return; }
      login(data.user);
      setPreviewUrl(fotoUrl);
      setSuccess(true);
      setEditando(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setUrlError("No se pudo conectar al servidor");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUrlError("Solo se permiten imagenes");
      return;
    }
    setUploading(true);
    setUrlError("");
    try {
      const base64 = await comprimirImagen(file, 300, 0.75);
      setPreviewUrl(base64);
      setUrlInput(base64);
    } catch {
      setUrlError("Error al procesar la imagen");
    } finally {
      setUploading(false);
    }
  }

  function cancelarEdicion() {
    setEditando(false);
    setUrlInput(user.foto ?? "");
    setPreviewUrl(user.foto ?? "");
    setUrlError("");
  }

  const fotoActual = previewUrl || user.foto;

  return (
    <div className="flex flex-col items-center w-full px-4 py-8 max-w-lg mx-auto">
      <h1 className="font-['Press_Start_2P'] text-[#00ff88] text-2xl mb-10 text-center drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]">
        TU AVATAR
      </h1>

      {success && (
        <div className="w-full mb-4 px-4 py-3 rounded-xl text-xs font-bold text-[#00ff88] border border-[#00ff88]/30 bg-[#00ff88]/10">
          ✅ Foto de perfil actualizada correctamente
        </div>
      )}

      {/* Tarjeta avatar */}
      <div className="w-full bg-[#1a1f35] border-2 border-[#00ff88]/30 rounded-2xl p-8 flex flex-col items-center mb-6"
        style={{ boxShadow: "0 0 30px rgba(0,255,136,0.08)" }}>

        <div className="relative mb-6">
          <div className="w-36 h-36 rounded-full flex items-center justify-center overflow-hidden bg-[#0f1425]"
            style={{ border: "4px solid #00ff88", boxShadow: "0 0 24px rgba(0,255,136,0.3)" }}>
            {fotoActual
              ? <img src={fotoActual} alt="Avatar" className="w-full h-full object-cover"
                  onError={() => setPreviewUrl("")} />
              : <User size={64} className="text-[#00ff88]" />
            }
          </div>
          <button onClick={() => setEditando(true)}
            className="absolute bottom-1 right-1 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-[#00ff88]"
            style={{ boxShadow: "0 0 12px rgba(0,255,136,0.5)" }}>
            <Camera size={18} className="text-black" />
          </button>
        </div>

        <h2 className="font-['Press_Start_2P'] text-lg text-white mb-1">{user.nombre}</h2>
        <p className="text-[#00ff88] text-xs font-bold mb-1">{user.email}</p>
        {user.bio && <p className="text-gray-400 text-xs text-center mt-2 max-w-xs">{user.bio}</p>}

        <button onClick={() => setEditando(true)}
          className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl font-['Press_Start_2P'] text-xs text-black transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg,#00ff88,#00d9ff)", boxShadow: "0 4px 16px rgba(0,255,136,0.3)" }}>
          <Camera size={14} /> Cambiar foto
        </button>
      </div>

      {/* Modal editar foto */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0f1425] border-2 border-[#00ff88]/30 rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}>

            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <p className="font-['Press_Start_2P'] text-xs text-[#00ff88]">Cambiar foto de perfil</p>
              <button onClick={cancelarEdicion} className="text-gray-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#00ff88]/50 bg-[#1a1f35] flex items-center justify-center">
                  {previewUrl || urlInput
                    ? <img src={previewUrl || urlInput} alt="preview"
                        className="w-full h-full object-cover"
                        onError={() => setUrlError("URL de imagen invalida")} />
                    : <User size={36} className="text-gray-600" />
                  }
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <button onClick={() => { setModo("url"); setUrlError(""); }}
                  className="flex-1 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  style={{
                    borderColor: modo === "url" ? "#00ff88" : "rgba(255,255,255,0.1)",
                    background:  modo === "url" ? "rgba(0,255,136,0.1)" : "transparent",
                    color:       modo === "url" ? "#00ff88" : "#6b7280",
                  }}>
                  <Link size={12} /> URL
                </button>
                <button onClick={() => { setModo("archivo"); setUrlError(""); }}
                  className="flex-1 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  style={{
                    borderColor: modo === "archivo" ? "#00d9ff" : "rgba(255,255,255,0.1)",
                    background:  modo === "archivo" ? "rgba(0,217,255,0.1)" : "transparent",
                    color:       modo === "archivo" ? "#00d9ff" : "#6b7280",
                  }}>
                  <Upload size={12} /> Subir archivo
                </button>
              </div>

              {modo === "url" && (
                <div className="mb-4">
                  <input
                    type="url"
                    value={urlInput.startsWith("data:") ? "" : urlInput}
                    onChange={e => {
                      setUrlInput(e.target.value);
                      setPreviewUrl(e.target.value);
                      setUrlError("");
                    }}
                    placeholder="https://ejemplo.com/foto.jpg"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#00ff88]/50 transition-colors placeholder:text-gray-600"
                  />
                </div>
              )}

              {modo === "archivo" && (
                <div className="mb-4">
                  <label
                    className="w-full flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-[#00d9ff]/50"
                    style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.02)" }}>
                    {uploading
                      ? <Loader2 size={24} className="text-[#00d9ff] animate-spin" />
                      : <Upload size={24} className="text-gray-500" />
                    }
                    <span className="text-xs text-gray-500 font-bold">
                      {uploading ? "Procesando..." : "Haz clic para seleccionar una imagen"}
                    </span>
                    <span className="text-[10px] text-gray-600">PNG, JPG, GIF — max 5MB</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleArchivo} />
                  </label>
                </div>
              )}

              {urlError && <p className="text-[#ff4757] text-xs mb-4 font-bold">{urlError}</p>}

              <div className="flex gap-3">
                <button onClick={cancelarEdicion}
                  className="flex-1 py-3 rounded-xl border border-white/15 text-gray-400 text-xs font-bold hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                  <X size={13} /> Cancelar
                </button>
                <button
                  onClick={() => guardarFoto(urlInput)}
                  disabled={saving || uploading || !urlInput.trim()}
                  className="flex-1 py-3 rounded-xl text-black text-xs font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#00ff88,#00d9ff)" }}>
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  {saving ? "Guardando..." : "Guardar foto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Informacion */}
      <div className="w-full bg-[#1a1f35] border border-white/10 rounded-2xl p-5">
        <p className="font-['Press_Start_2P'] text-[10px] text-white mb-4">INFORMACION</p>
        <InfoForm user={user} login={login} />
      </div>
    </div>
  );
}
