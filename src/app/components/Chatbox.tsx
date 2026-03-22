import { useState, useRef, useEffect } from "react";

// ─── Types ───────────────────────────────────────────────
interface Message {
  id: string;
  role: "bot" | "user";
  content: string;
  time: string;
  isHtml?: boolean;
}

// ─── Constants ───────────────────────────────────────────
const SYSTEM_PROMPT = `Eres "Profe IA", el asistente virtual de Saberix — una plataforma educativa gamificada para estudiantes dominicanos de primaria (4to, 5to y 6to grado).

Tu función es brindar soporte al usuario sobre la plataforma Saberix y sus funciones, y también responder preguntas educativas dentro del currículo de primaria dominicano (Matemáticas, Lengua Española, Ciencias Naturales, Ciencias Sociales).

INFORMACIÓN CLAVE SOBRE SABERIX:
- Plataforma educativa gamificada para estudiantes de primaria del currículo dominicano (4to, 5to y 6to grado)
- Materia disponible actualmente: Lengua Española (4to grado). Próximamente: Matemáticas, Ciencias Naturales y Ciencias Sociales para 4to, 5to y 6to.
- Modos de juego: Solitario y Multijugador
- Modo Multijugador: selecciona un juego → elige Multijugador → crea sala → comparte código de 6 dígitos con amigos → el host inicia la partida
- Monedas: se ganan respondiendo preguntas correctamente. Más rápido = más monedas. Rachas de respuestas correctas dan bonificaciones.
- Subir de nivel: acumulas XP jugando y respondiendo correctamente. Al alcanzar ciertos umbrales subes de nivel automáticamente. Niveles altos desbloquean avatares y beneficios.
- Guardado de resultados: Sí, todos los resultados se guardan en los servidores. El historial y estadísticas están en la sección de Perfil.
- Conexión a internet: el modo solitario requiere conexión para cargar preguntas. El multijugador siempre requiere conexión. Se trabaja en un modo offline para futuras versiones.

REGLAS DE COMPORTAMIENTO:
1. Responde SIEMPRE en español.
2. Responde preguntas sobre Saberix (plataforma, juegos, funciones, cuenta, monedas, niveles, etc.)
3. Responde preguntas educativas de nivel primaria (matemáticas básicas, lengua, ciencias, sociales) — eres como un tutor.
4. Mantén un tono amigable, motivador y juvenil, usando emojis con moderación.
5. Si alguien pregunta algo inapropiado, fuera de contexto educativo (política, contenido adulto, violencia, etc.), responde: "Lo siento, no puedo ayudarte con eso. Estoy aquí para apoyarte con Saberix y tus estudios. 😊"
6. Sé conciso pero completo. Usa listas o formato cuando sea útil.
7. Nunca salgas del rol de asistente educativo de Saberix.`;

const SUGGESTIONS = [
  "¿Cómo funciona el multijugador?",
  "¿Cómo gano monedas?",
  "¿Qué materias hay disponibles?",
  "¿Cómo subo de nivel?",
];

// ─── Helpers ─────────────────────────────────────────────
const now = () =>
  new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Component ───────────────────────────────────────────
export default function AIChatbox() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: "bot",
      content:
        "¡Hola, estudiante! 👾 Soy tu <strong>Profe IA</strong> de Saberix. Puedo responder tus preguntas sobre la plataforma y ayudarte con tus estudios.<br/><br/>¿En qué puedo ayudarte hoy?",
      time: "Ahora",
      isHtml: true,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const [xp, setXp] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const toggle = () => {
    setOpen((v) => !v);
    setShowBadge(false);
  };

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { id: uid(), role: "user", content, time: now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setShowSuggestions(false);
    setLoading(true);

    const history = [...messages, userMsg]
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.isHtml ? m.content.replace(/<[^>]+>/g, "") : m.content,
      }))
      .filter((m) => m.role === "user" || m.role === "assistant");

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: history,
        }),
      });

      const data = await response.json();
      const reply =
        data.content?.find((b: { type: string }) => b.type === "text")?.text ??
        "Lo siento, hubo un error. Intenta de nuevo. 😅";

      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "bot", content: reply, time: now() },
      ]);
      setXp((prev) => Math.min(100, prev + 10));
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "bot",
          content: "Hubo un problema de conexión. ¡Inténtalo de nuevo! 🔌",
          time: now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: uid(),
        role: "bot",
        content: "¡Chat reiniciado! 🎮 Estoy listo para ayudarte. ¿Qué quieres saber?",
        time: now(),
        isHtml: true,
      },
    ]);
    setShowSuggestions(true);
    setXp(0);
  };

  useEffect(() => {
    if (xp >= 100) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "bot",
            content: "🏆 <strong>¡Subiste de nivel!</strong> +50 monedas ganadas. ¡Sigue así, campeón!",
            time: now(),
            isHtml: true,
          },
        ]);
        setXp(0);
      }, 500);
    }
  }, [xp]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rajdhani:wght@400;500;600;700&display=swap');

        :root {
          --bg-dark: #0d1117;
          --bg-card: #161b27;
          --bg-panel: #1a2035;
          --cyan: #00f5d4;
          --yellow: #f5c518;
          --pink: #ff2d78;
          --purple: #7c3aed;
          --text: #c9d1d9;
          --text-dim: #6e7681;
          --border: #21262d;
        }

        .saberix-chat * { box-sizing: border-box; margin: 0; padding: 0; }

        .chat-toggle-btn {
          position: fixed; bottom: 28px; right: 28px;
          width: 60px; height: 60px;
          background: linear-gradient(135deg, var(--cyan), var(--purple));
          border: none; border-radius: 50%; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 20px rgba(0,245,212,.45), 0 0 40px rgba(124,58,237,.25);
          transition: transform .2s, box-shadow .2s; z-index: 1000;
        }
        .chat-toggle-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 0 30px rgba(0,245,212,.65), 0 0 60px rgba(124,58,237,.4);
        }
        .chat-toggle-btn svg { width: 26px; height: 26px; color: #fff; }
        .chat-badge {
          position: absolute; top: -2px; right: -2px;
          width: 18px; height: 18px;
          background: var(--pink); border-radius: 50%;
          font-family: 'Press Start 2P', monospace; font-size: 7px; color: #fff;
          display: flex; align-items: center; justify-content: center;
          animation: pulseBadge 1.5s ease-in-out infinite;
        }
        @keyframes pulseBadge {
          0%,100% { transform: scale(1); } 50% { transform: scale(1.2); }
        }

        .chat-panel {
          position: fixed; bottom: 100px; right: 28px;
          width: 380px; height: 560px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          display: flex; flex-direction: column; overflow: hidden;
          z-index: 999;
          box-shadow: 0 0 0 1px rgba(0,245,212,.15), 0 20px 60px rgba(0,0,0,.6), 0 0 40px rgba(0,245,212,.08);
          transform: translateY(20px) scale(.95); opacity: 0; pointer-events: none;
          transition: transform .3s cubic-bezier(.34,1.56,.64,1), opacity .25s ease;
          font-family: 'Rajdhani', sans-serif;
        }
        .chat-panel.open {
          transform: translateY(0) scale(1); opacity: 1; pointer-events: all;
        }
        .chat-panel::before {
          content: ''; position: absolute; inset: 0;
          background: repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.04) 2px,rgba(0,0,0,.04) 4px);
          pointer-events: none; z-index: 10; border-radius: 16px;
        }

        .chat-header {
          background: linear-gradient(90deg, #0d2033 0%, #1a1233 100%);
          padding: 14px 16px; display: flex; align-items: center; gap: 12px;
          border-bottom: 1px solid var(--border); position: relative; overflow: hidden;
        }
        .chat-header::after {
          content: ''; position: absolute; bottom: 0; left: 0;
          width: 100%; height: 2px;
          background: linear-gradient(90deg, var(--cyan), var(--purple), var(--pink));
        }
        .avatar-bot {
          width: 42px; height: 42px;
          background: linear-gradient(135deg, var(--cyan) 0%, var(--purple) 100%);
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0; position: relative;
        }
        .avatar-bot::after {
          content: ''; position: absolute; bottom: -2px; right: -2px;
          width: 10px; height: 10px; background: #22c55e;
          border: 2px solid var(--bg-card); border-radius: 50%;
        }
        .header-info { flex: 1; }
        .header-info h3 {
          font-family: 'Press Start 2P', monospace; font-size: 9px;
          color: var(--cyan); line-height: 1.4; letter-spacing: .5px;
        }
        .header-info span { font-size: 12px; color: var(--text-dim); font-weight: 500; }
        .header-actions { display: flex; gap: 6px; }
        .header-btn {
          background: transparent; border: 1px solid var(--border); border-radius: 6px;
          width: 30px; height: 30px; cursor: pointer; color: var(--text-dim);
          display: flex; align-items: center; justify-content: center;
          transition: all .2s; font-size: 12px;
        }
        .header-btn:hover {
          background: rgba(0,245,212,.1); border-color: var(--cyan); color: var(--cyan);
        }

        .messages {
          flex: 1; padding: 16px; overflow-y: auto;
          display: flex; flex-direction: column; gap: 14px;
          scrollbar-width: thin; scrollbar-color: var(--border) transparent;
        }
        .msg { display: flex; gap: 10px; animation: msgIn .3s ease; }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .msg.user { flex-direction: row-reverse; }
        .msg-avatar {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; flex-shrink: 0; align-self: flex-end;
        }
        .msg.bot .msg-avatar  { background: linear-gradient(135deg,var(--cyan),var(--purple)); }
        .msg.user .msg-avatar { background: linear-gradient(135deg,var(--yellow),var(--pink)); }
        .msg-bubble {
          max-width: 78%; padding: 10px 14px; border-radius: 14px;
          font-size: 14px; line-height: 1.6; font-weight: 500; position: relative;
        }
        .msg.bot .msg-bubble {
          background: var(--bg-panel); border: 1px solid var(--border);
          color: var(--text); border-bottom-left-radius: 4px;
        }
        .msg.user .msg-bubble {
          background: linear-gradient(135deg, rgba(0,245,212,.2), rgba(124,58,237,.2));
          border: 1px solid rgba(0,245,212,.25); color: #e2e8f0;
          border-bottom-right-radius: 4px;
        }
        .msg-time {
          font-size: 10px; color: var(--text-dim); margin-top: 4px;
          display: block; text-align: right;
        }
        .msg.bot .msg-time { text-align: left; }

        .typing-dots { display: flex; gap: 4px; padding: 4px 0; }
        .typing-dots span {
          width: 7px; height: 7px; background: var(--cyan);
          border-radius: 50%; animation: dot 1.2s ease-in-out infinite;
        }
        .typing-dots span:nth-child(2) { animation-delay: .2s; background: var(--purple); }
        .typing-dots span:nth-child(3) { animation-delay: .4s; background: var(--pink); }
        @keyframes dot {
          0%,80%,100% { transform: scale(.6); opacity: .4; }
          40% { transform: scale(1); opacity: 1; }
        }

        .suggestions {
          padding: 0 14px 10px; display: flex; flex-wrap: wrap; gap: 6px;
        }
        .suggestion-btn {
          background: transparent; border: 1px solid var(--border); color: var(--text-dim);
          padding: 5px 10px; border-radius: 20px; font-size: 11px;
          font-family: 'Rajdhani', sans-serif; font-weight: 600; cursor: pointer;
          transition: all .2s;
        }
        .suggestion-btn:hover {
          background: rgba(0,245,212,.08); border-color: var(--cyan); color: var(--cyan);
          transform: translateY(-1px);
        }

        .chat-input-area {
          padding: 12px 14px; border-top: 1px solid var(--border);
          background: var(--bg-panel); display: flex; gap: 8px; align-items: flex-end;
        }
        .input-wrapper {
          flex: 1; background: var(--bg-dark); border: 1px solid var(--border);
          border-radius: 12px; padding: 8px 12px; display: flex;
          align-items: center; gap: 8px; transition: border-color .2s, box-shadow .2s;
        }
        .input-wrapper:focus-within {
          border-color: var(--cyan); box-shadow: 0 0 0 3px rgba(0,245,212,.1);
        }
        .chat-textarea {
          flex: 1; background: transparent; border: none; outline: none;
          color: var(--text); font-family: 'Rajdhani', sans-serif;
          font-size: 14px; font-weight: 500; resize: none; max-height: 80px;
          line-height: 1.4;
        }
        .chat-textarea::placeholder { color: var(--text-dim); }
        .btn-send {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, var(--cyan), var(--purple));
          border: none; border-radius: 10px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: transform .2s, box-shadow .2s;
          box-shadow: 0 0 12px rgba(0,245,212,.3);
        }
        .btn-send:hover { transform: scale(1.08); box-shadow: 0 0 20px rgba(0,245,212,.5); }
        .btn-send:disabled { opacity: .5; cursor: not-allowed; transform: none; }
        .btn-send svg { width: 18px; height: 18px; color: #fff; }

        .xp-bar { height: 3px; background: var(--border); position: relative; overflow: hidden; }
        .xp-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--cyan), var(--purple), var(--pink));
          transition: width 1s ease; box-shadow: 0 0 8px var(--cyan);
        }

        .msg-bubble p { margin-bottom: 6px; }
        .msg-bubble p:last-child { margin-bottom: 0; }
        .msg-bubble ul { padding-left: 16px; margin-top: 4px; }
        .msg-bubble li { margin-bottom: 2px; }

        @media (max-width: 440px) {
          .chat-panel { width: calc(100vw - 24px); right: 12px; }
        }
      `}</style>

      <div className="saberix-chat">
        <button className="chat-toggle-btn" onClick={toggle}>
          {showBadge && <span className="chat-badge">1</span>}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <circle cx="9" cy="10" r=".5" fill="currentColor"/>
            <circle cx="12" cy="10" r=".5" fill="currentColor"/>
            <circle cx="15" cy="10" r=".5" fill="currentColor"/>
          </svg>
        </button>

        <div className={`chat-panel ${open ? "open" : ""}`}>
          <div className="chat-header">
            <div className="avatar-bot">🤖</div>
            <div className="header-info">
              <h3>PROFE IA</h3>
              <span>Asistente Saberix · En línea</span>
            </div>
            <div className="header-actions">
              <button className="header-btn" title="Reiniciar chat" onClick={resetChat}>↺</button>
              <button className="header-btn" title="Cerrar" onClick={toggle}>✕</button>
            </div>
          </div>

          <div className="messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`msg ${msg.role}`}>
                {msg.role === "bot" && <div className="msg-avatar">🤖</div>}
                <div>
                  <div
                    className="msg-bubble"
                    {...(msg.isHtml
                      ? { dangerouslySetInnerHTML: { __html: msg.content } }
                      : { children: <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span> }
                    )}
                  />
                  <span className="msg-time">{msg.time}</span>
                </div>
                {msg.role === "user" && <div className="msg-avatar">🎮</div>}
              </div>
            ))}

            {loading && (
              <div className="msg bot">
                <div className="msg-avatar">🤖</div>
                <div className="msg-bubble" style={{ padding: "12px 14px" }}>
                  <div className="typing-dots">
                    <span/><span/><span/>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {showSuggestions && (
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="suggestion-btn" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="chat-input-area">
            <div className="input-wrapper">
              <textarea
                ref={textareaRef}
                className="chat-textarea"
                placeholder="Pregunta lo que quieras..."
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
                }}
                onKeyDown={handleKey}
              />
            </div>
            <button className="btn-send" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>

          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${xp}%` }} />
          </div>
        </div>
      </div>
    </>
  );
}