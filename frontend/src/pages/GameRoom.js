import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const WS_URL = BACKEND_URL.replace('http', 'ws').replace('https', 'wss');

function GameRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [players, setPlayers] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ws, setWs] = useState(null);
  const messagesEndRef = useRef(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const getToken = () => {
    const token = localStorage.getItem('access_token');
    return token || '';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await axios.get(`${API}/auth/me`, {
          headers: getAuthHeaders(),
          withCredentials: true
        });
        setUser(userResponse.data);

        const messagesResponse = await axios.get(`${API}/rooms/${roomId}/messages`, {
          headers: getAuthHeaders(),
          withCredentials: true
        });
        setMessages(messagesResponse.data);

      } catch (error) {
        console.error('Error loading room:', error);
        navigate('/dashboard');
      }
    };

    fetchData();
  }, [roomId, navigate]);

  useEffect(() => {
    if (!user) return;

    const token = getToken();
    const websocket = new WebSocket(`${WS_URL}/ws/${roomId}?token=${token}`);

    websocket.onopen = () => {
      console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'chat') {
        setMessages(prev => [...prev, {
          message_id: data.message_id || `msg_${Date.now()}`,
          user_id: data.user_id,
          username: data.username,
          message: data.message,
          timestamp: data.timestamp
        }]);
      } else if (data.type === 'user_joined') {
        setMessages(prev => [...prev, {
          message_id: `sys_${Date.now()}`,
          user_id: 'system',
          username: 'Sistema',
          message: `${data.username} se unió a la sala`,
          timestamp: new Date().toISOString()
        }]);
      } else if (data.type === 'user_left') {
        setMessages(prev => [...prev, {
          message_id: `sys_${Date.now()}`,
          user_id: 'system',
          username: 'Sistema',
          message: `${data.username} salió de la sala`,
          timestamp: new Date().toISOString()
        }]);
      } else if (data.type === 'game_action') {
        // Handle game actions
        console.log('Game action:', data);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [user, roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !ws) return;

    ws.send(JSON.stringify({
      type: 'chat',
      message: newMessage
    }));

    setNewMessage('');
  };

  const handleLeaveRoom = async () => {
    try {
      await axios.post(`${API}/rooms/${roomId}/leave`, {}, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error leaving room:', error);
      navigate('/dashboard');
    }
  };

  const handleStartGame = () => {
    setIsPlaying(true);
    if (ws) {
      ws.send(JSON.stringify({
        type: 'game_action',
        action: 'start_game'
      }));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="pixel-font text-2xl text-purple-400">CARGANDO...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pixel-bg p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-slate-800/90 border-4 border-purple-500 p-4 flex justify-between items-center" style={{
          boxShadow: '6px 6px 0 0 #a855f7',
          imageRendering: 'pixelated'
        }}>
          <h1 className="pixel-font text-lg text-purple-400">SALA: {roomId}</h1>
          <button
            onClick={handleLeaveRoom}
            className="pixel-font px-4 py-2 bg-red-600 hover:bg-red-700 text-white border-4 border-red-400 text-xs"
            style={{ boxShadow: '4px 4px 0 0 #dc2626' }}
            data-testid="leave-room-button"
          >
            SALIR
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Area */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800/90 border-8 border-purple-500 p-8 min-h-[500px] pixel-dither" style={{
            boxShadow: '8px 8px 0 0 #a855f7, 16px 16px 0 0 #ec4899',
            imageRendering: 'pixelated'
          }} data-testid="game-area">
            {!isPlaying ? (
              <div className="flex flex-col items-center justify-center h-full space-y-8">
                <h2 className="pixel-font text-3xl text-purple-400 leading-loose" style={{
                  textShadow: '3px 3px 0 #ec4899'
                }}>
                  ESPERANDO<br/>JUGADORES
                </h2>
                <div className="text-6xl">🎮</div>
                <button
                  onClick={handleStartGame}
                  className="pixel-font px-12 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-700 hover:via-pink-700 hover:to-fuchsia-700 text-white border-8 border-fuchsia-400 text-sm leading-loose"
                  style={{
                    boxShadow: '8px 8px 0 0 #ec4899',
                    imageRendering: 'pixelated'
                  }}
                  data-testid="start-game-button"
                >
                  &gt; INICIAR JUEGO &lt;
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <h2 className="pixel-font text-2xl text-purple-400">JUEGO ACTIVO</h2>
                <div className="w-full max-w-md bg-slate-900 border-4 border-fuchsia-500 p-6 text-center">
                  <p className="text-purple-300 mb-4">Área de juego multijugador</p>
                  <p className="pixel-font text-xs text-pink-400">Implementa tu lógica de juego aquí</p>
                </div>
                <button
                  onClick={() => setIsPlaying(false)}
                  className="pixel-font px-8 py-3 bg-pink-600 hover:bg-pink-700 text-white border-4 border-purple-500 text-xs"
                  style={{ boxShadow: '4px 4px 0 0 #a855f7' }}
                >
                  DETENER JUEGO
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="bg-slate-800/90 border-4 border-pink-500 flex flex-col pixel-dither" style={{
          boxShadow: '6px 6px 0 0 #ec4899',
          imageRendering: 'pixelated',
          height: '600px'
        }}>
          {/* Chat Header */}
          <div className="bg-purple-600 border-b-4 border-fuchsia-400 p-3">
            <h3 className="pixel-font text-xs text-white text-center">CHAT EN VIVO</h3>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="chat-messages">
            {messages.map(msg => (
              <div 
                key={msg.message_id} 
                className={`${msg.user_id === 'system' ? 'text-center' : ''}`}
              >
                {msg.user_id === 'system' ? (
                  <p className="text-purple-300 text-xs italic">{msg.message}</p>
                ) : (
                  <div className={`${msg.user_id === user?.user_id ? 'text-right' : ''}`}>
                    <span className="pixel-font text-xs text-pink-400">{msg.username}:</span>
                    <p className="text-white text-sm mt-1 bg-slate-700/50 inline-block px-2 py-1 rounded">
                      {msg.message}
                    </p>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="border-t-4 border-purple-500 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-slate-900 border-4 border-purple-400 px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-400"
                data-testid="chat-input"
              />
              <button
                type="submit"
                className="pixel-font px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white border-4 border-purple-500 text-xs"
                style={{ boxShadow: '3px 3px 0 0 #a855f7' }}
                data-testid="send-message-button"
              >
                &gt;
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default GameRoom;
