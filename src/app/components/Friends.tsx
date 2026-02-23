import React, { useState } from "react";
import { Search, Plus, MessageCircle, User, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

// Datos de prueba estáticos para evitar problemas de carga
const INITIAL_FRIENDS = [
  { id: 1, name: "AnaGamer", status: "online", avatarColor: "#ff1b8d" },
  { id: 2, name: "BetoPro", status: "offline", avatarColor: "#00d9ff" },
  { id: 3, name: "Carla123", status: "request", avatarColor: "#ffd700" },
  { id: 4, name: "DavidWin", status: "online", avatarColor: "#00ff88" },
  { id: 5, name: "LuisaMath", status: "online", avatarColor: "#ff8c00" },
];

export function Friends() {
  const [activeTab, setActiveTab] = useState<"all" | "online" | "requests">("all");
  const [friends] = useState(INITIAL_FRIENDS);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatFriend, setChatFriend] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ text: string; sent: boolean; time: string }[]>([]);
  const [messageInput, setMessageInput] = useState("");

  const filteredFriends = friends.filter((friend) => {
    const matchesSearch = friend.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === "all") return true;
    if (activeTab === "online") return friend.status === "online";
    if (activeTab === "requests") return friend.status === "request";
    return true;
  });

  const handleAddFriend = () => {
    if (!searchQuery.trim()) {
      alert("¡Escribe un nombre primero!");
      return;
    }
    alert(`Solicitud enviada a: ${searchQuery}`);
    setSearchQuery("");
  };

  const openChat = (friendName: string) => {
    setChatFriend(friendName);
    setMessages([{ text: `¡Hola ${friendName}! ¿Jugamos?`, sent: false, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setChatOpen(true);
  };

  const sendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageInput.trim()) return;

    const newMessage = {
      text: messageInput,
      sent: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMessage]);
    setMessageInput("");

    setTimeout(() => {
      setMessages(prev => [...prev, {
        text: "¡Dale! Entra a la sala de Matemáticas 🚀",
        sent: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-20">
       <div className="flex items-center gap-4 mb-8">
            <h2 className="font-['Press_Start_2P'] text-xl md:text-2xl text-[#00ff88]">AMIGOS</h2>
            <div className="h-1 flex-1 bg-[#00ff88]/20 rounded-full"></div>
        </div>

      <div className="bg-[#0f1425] border-4 border-[#00d9ff] rounded-xl p-4 md:p-6 shadow-[0_0_30px_rgba(0,217,255,0.1)]">
        {/* Search & Add */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddFriend()}
              placeholder="Buscar amigo o código..."
              className="w-full bg-[#1a1f35] border border-[#00d9ff]/30 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#00d9ff] transition-colors text-sm"
            />
          </div>
          <button
            onClick={handleAddFriend}
            className="bg-[#00d9ff] hover:bg-[#00b0d0] text-[#0f1425] font-['Press_Start_2P'] text-xs px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <Plus size={16} /> AGREGAR
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-1">
          {(["all", "online", "requests"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "font-['Press_Start_2P'] text-[10px] md:text-xs px-4 py-3 rounded-t-lg transition-all",
                activeTab === tab
                  ? "bg-[#ff1b8d] text-white border-t-2 border-x-2 border-[#ff1b8d] translate-y-[1px]"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              {tab === "all" ? "TODOS" : tab === "online" ? "EN LÍNEA" : "SOLICITUDES"}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="grid grid-cols-1 gap-3">
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="bg-[#1a1f35] border border-white/10 p-4 rounded-lg flex items-center justify-between hover:border-[#00d9ff] transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center border-2 border-white/20 shadow-inner"
                    style={{ backgroundColor: friend.avatarColor }}
                  >
                    <User size={24} className="text-[#0f1425]" />
                  </div>
                  <div>
                    <div className="font-['Press_Start_2P'] text-xs text-white mb-1.5">
                      {friend.name}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full animate-pulse", 
                          friend.status === "online" ? "bg-[#00ff88]" : friend.status === "request" ? "bg-[#ffd700]" : "bg-gray-500"
                        )} />
                        <span className={cn(
                            "text-[10px] font-bold uppercase",
                            friend.status === "online" ? "text-[#00ff88]" : friend.status === "request" ? "text-[#ffd700]" : "text-gray-500"
                        )}>
                            {friend.status === "online" ? "Conectado" : friend.status === "request" ? "Solicitud Pendiente" : "Desconectado"}
                        </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                    {friend.status === "online" && (
                        <button 
                        onClick={() => openChat(friend.name)}
                        className="p-2 md:px-4 md:py-2 bg-[#00d9ff]/10 text-[#00d9ff] border border-[#00d9ff]/50 rounded hover:bg-[#00d9ff] hover:text-[#0f1425] transition-all flex items-center gap-2"
                        title="Chat"
                        >
                        <MessageCircle size={18} />
                        <span className="hidden md:inline font-bold text-xs">CHAT</span>
                        </button>
                    )}
                    
                    {friend.status === "request" && (
                        <>
                        <button className="p-2 bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/50 rounded hover:bg-[#00ff88] hover:text-[#0f1425] transition-colors" title="Aceptar">
                            <Check size={18} />
                        </button>
                        <button className="p-2 bg-[#ff1b8d]/20 text-[#ff1b8d] border border-[#ff1b8d]/50 rounded hover:bg-[#ff1b8d] hover:text-white transition-colors" title="Rechazar">
                            <X size={18} />
                        </button>
                        </>
                    )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-lg">
                <p className="text-gray-400 font-['Press_Start_2P'] text-xs mb-2">No se encontraron resultados</p>
                <p className="text-gray-600 text-xs">Intenta buscar otro nombre o cambiar de pestaña</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 right-4 md:right-8 w-80 md:w-96 bg-[#0f1425] border-x-4 border-t-4 border-[#00d9ff] rounded-t-xl shadow-2xl z-50 flex flex-col"
            style={{ height: "450px" }}
          >
            {/* Header */}
            <div className="bg-[#00d9ff] p-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                 <span className="font-['Press_Start_2P'] text-xs text-[#0f1425] truncate max-w-[150px]">{chatFriend}</span>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                className="text-[#0f1425] hover:bg-white/20 p-1 rounded transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-[#1a1f35] flex flex-col gap-3">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex flex-col max-w-[85%]", msg.sent ? "self-end items-end" : "self-start items-start")}>
                  <div className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium",
                    msg.sent 
                        ? "bg-[#00d9ff] text-[#0f1425] rounded-tr-none" 
                        : "bg-[#0f1425] text-white border border-white/10 rounded-tl-none"
                  )}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-gray-500 mt-1 ml-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-3 bg-[#0f1425] border-t border-[#00d9ff]/30 flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Mensaje..."
                className="flex-1 bg-[#1a1f35] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d9ff] transition-colors"
              />
              <button 
                type="submit"
                className="bg-[#00d9ff] text-[#0f1425] p-2 rounded hover:bg-[#00b0d0] transition-colors"
              >
                <MessageCircle size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
