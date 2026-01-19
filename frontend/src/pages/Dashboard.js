import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(location.state?.user || null);
  const [character, setCharacter] = useState(null);
  const [friends, setFriends] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showEditCharacter, setShowEditCharacter] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomConfig, setRoomConfig] = useState({
    maxPlayers: 4,
    gameMode: 'normal',
    subject: 'matematicas',
    gradeLevel: '10',
    timePerQuestion: 30,
    totalQuestions: 10
  });
  const [friendEmail, setFriendEmail] = useState('');
  const [characterCustomization, setCharacterCustomization] = useState({
    avatar: '👤',
    color: '#a855f7',
    accessories: []
  });
  const [hasInitialized, setHasInitialized] = useState(false);

  const getAuthHeaders = () => {
    // Usar token mock para desarrollo
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || 'dev-token';
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    if (hasInitialized) return;
    
    const fetchData = async () => {
      try {
        console.log('[Dashboard] DEV MODE - Auth disabled');
        
        // Usuario mock para desarrollo
        const mockUser = {
          user_id: 'dev_user_123',
          username: 'DevUser',
          user_tag: '0000',
          email: 'dev@test.com',
          picture: null
        };
        
        setUser(mockUser);
        
        // Character mock
        const mockCharacter = {
          character_id: 'dev_char_123',
          user_id: 'dev_user_123',
          customization: {
            avatar: '👤',
            color: '#a855f7',
            accessories: []
          },
          inventory: [],
          score: 0
        };
        
        setCharacter(mockCharacter);
        setCharacterCustomization(mockCharacter.customization);
        setFriends([]);
        setRooms([]);
        setIsLoading(false);
        setHasInitialized(true);
        
        console.log('[Dashboard] DEV MODE - Ready to work!');
        
      } catch (error) {
        console.error('[Dashboard] Error:', error);
      }
    };

    fetchData();
  }, [hasInitialized]);

  const handleLogout = async () => {
    // DEV MODE - Solo recarga la página
    console.log('[Dashboard] Logout (dev mode)');
    window.location.href = '/dashboard';
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    
    // Crear sala mock en dev mode
    const newRoom = {
      room_id: `room_${Date.now()}`,
      name: roomName,
      host_user_id: user.user_id,
      players: [user.user_id],
      max_players: roomConfig.maxPlayers,
      game_mode: roomConfig.gameMode,
      subject: roomConfig.subject,
      grade_level: roomConfig.gradeLevel,
      time_per_question: roomConfig.timePerQuestion,
      total_questions: roomConfig.totalQuestions,
      status: 'waiting',
      created_at: new Date()
    };
    
    setRooms([...rooms, newRoom]);
    setShowCreateRoom(false);
    setRoomName('');
    setRoomConfig({
      maxPlayers: 4,
      gameMode: 'normal',
      subject: 'matematicas',
      gradeLevel: '10',
      timePerQuestion: 30,
      totalQuestions: 10
    });
    // Pasar datos de la sala al navegar
    navigate(`/room/${newRoom.room_id}`, { state: { room: newRoom } });
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    
    // Validar formato username#tag
    if (!friendEmail.includes('#')) {
      alert('Por favor usa el formato: usuario#1234');
      return;
    }
    
    const [username, tag] = friendEmail.split('#');
    
    if (!tag || tag.length !== 4) {
      alert('El código debe tener 4 dígitos. Ejemplo: usuario#1234');
      return;
    }
    
    // Crear amigo mock en dev mode
    const newFriend = {
      user_id: `friend_${Date.now()}`,
      username: username,
      user_tag: tag,
      picture: null
    };
    
    // Verificar que no sea el mismo usuario
    if (username === user.username && tag === user.user_tag) {
      alert('No puedes agregarte a ti mismo');
      return;
    }
    
    // Verificar que no esté ya agregado
    const alreadyFriend = friends.find(f => f.username === username && f.user_tag === tag);
    if (alreadyFriend) {
      alert('Ya son amigos');
      return;
    }
    
    setFriends([...friends, newFriend]);
    setShowAddFriend(false);
    setFriendEmail('');
    
    alert(`✓ Amigo agregado: ${username}#${tag}`);
  };

  const handleUpdateCharacter = async (e) => {
    e.preventDefault();
    
    // Update mock character
    const updatedCharacter = {
      ...character,
      customization: characterCustomization
    };
    
    setCharacter(updatedCharacter);
    setShowEditCharacter(false);
  };

  const handleJoinRoom = async (roomId) => {
    try {
      await axios.post(
        `${API}/rooms/${roomId}/join`,
        {},
        {
          headers: getAuthHeaders(),
          withCredentials: true
        }
      );
      navigate(`/room/${roomId}`);
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al unirse a la sala');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="pixel-font text-2xl text-purple-400">CARGANDO...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pixel-bg p-6">
      {/* DEV MODE Banner */}
      <div className="fixed top-0 left-0 right-0 bg-yellow-600 text-black text-center py-2 z-50">
        <p className="pixel-font text-xs">
          🛠️ MODO DESARROLLO - Autenticación desactivada temporalmente
        </p>
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 mt-12">
        <div className="bg-slate-800/90 border-4 border-purple-500 p-4 flex justify-between items-center" style={{
          boxShadow: '6px 6px 0 0 #a855f7',
          imageRendering: 'pixelated'
        }}>
          <div className="flex items-center gap-4">
            <span className="text-4xl">{character?.customization.avatar}</span>
            <div>
              <h2 className="pixel-font text-lg text-purple-400">
                {user?.username}#{user?.user_tag}
              </h2>
              <p className="text-sm text-purple-300">Score: {character?.score || 0}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="pixel-font px-4 py-2 bg-red-600 hover:bg-red-700 text-white border-4 border-red-400 text-xs"
            style={{ boxShadow: '4px 4px 0 0 #dc2626' }}
            data-testid="logout-button"
          >
            SALIR
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Game Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Character Section */}
          <div className="bg-slate-800/90 border-4 border-purple-500 p-6" style={{
            boxShadow: '6px 6px 0 0 #a855f7',
            imageRendering: 'pixelated'
          }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="pixel-font text-base text-purple-400">TU PERSONAJE</h3>
              <button
                onClick={() => setShowEditCharacter(true)}
                className="pixel-font px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white border-4 border-purple-500 text-xs"
                style={{ boxShadow: '3px 3px 0 0 #a855f7' }}
                data-testid="edit-character-button"
              >
                EDITAR
              </button>
            </div>
            <div className="flex items-center justify-center py-8">
              <div className="w-32 h-32 flex items-center justify-center border-4 border-fuchsia-500 bg-slate-900" style={{
                borderRadius: '50%',
                backgroundColor: character?.customization.color
              }}>
                <span className="text-6xl">{character?.customization.avatar}</span>
              </div>
            </div>
          </div>

          {/* Game Rooms */}
          <div className="bg-slate-800/90 border-4 border-purple-500 p-6" style={{
            boxShadow: '6px 6px 0 0 #a855f7',
            imageRendering: 'pixelated'
          }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="pixel-font text-base text-purple-400">SALAS DE JUEGO</h3>
              <button
                onClick={() => setShowCreateRoom(true)}
                className="pixel-font px-3 py-2 bg-green-600 hover:bg-green-700 text-white border-4 border-green-400 text-xs"
                style={{ boxShadow: '3px 3px 0 0 #22c55e' }}
                data-testid="create-room-button"
              >
                + CREAR
              </button>
            </div>
            <div className="space-y-3">
              {rooms.length === 0 ? (
                <p className="text-purple-300 text-center py-4">No hay salas disponibles</p>
              ) : (
                rooms.map(room => (
                  <div key={room.room_id} className="bg-slate-700 border-4 border-purple-400 p-3" style={{ boxShadow: '3px 3px 0 0 #a855f7' }}>
                    <div className="flex justify-between items-center mb-2">
                      <p className="pixel-font text-sm text-white">{room.name}</p>
                      <span className="text-xs px-2 py-1 bg-purple-600 text-white">{room.game_mode.toUpperCase()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-purple-300 mb-2">
                      <span>👥 {room.players.length}/{room.max_players}</span>
                      <span>📚 {room.subject}</span>
                      <span>🎓 Grado {room.grade_level}</span>
                      <span>⏱️ {room.time_per_question}s</span>
                      <span className="col-span-2">❓ {room.total_questions} preguntas</span>
                    </div>
                    <button
                      onClick={() => handleJoinRoom(room.room_id)}
                      className="pixel-font w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white border-4 border-pink-500 text-xs mt-2"
                      style={{ boxShadow: '2px 2px 0 0 #ec4899' }}
                      data-testid={`join-room-${room.room_id}`}
                    >
                      UNIRSE
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Friends Sidebar */}
        <div className="bg-slate-800/90 border-4 border-pink-500 p-6 pixel-dither" style={{
          boxShadow: '6px 6px 0 0 #ec4899',
          imageRendering: 'pixelated'
        }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="pixel-font text-xs text-white">AMIGOS</h3>
            <button
              onClick={() => setShowAddFriend(true)}
              className="pixel-font px-2 py-1 bg-pink-600 hover:bg-pink-700 text-white border-4 border-purple-500 text-xs"
              style={{ boxShadow: '2px 2px 0 0 #a855f7' }}
              data-testid="add-friend-button"
            >
              +
            </button>
          </div>
          <div className="space-y-3">
            {friends.length === 0 ? (
              <p className="text-purple-300 text-center text-sm py-4">Sin amigos aún</p>
            ) : (
              friends.map(friend => (
                <div key={friend.user_id} className="bg-slate-700 border-4 border-purple-500 px-3 py-2" style={{ boxShadow: '2px 2px 0 0 #a855f7' }}>
                  <p className="pixel-font text-xs text-purple-300">
                    {friend.username}#{friend.user_tag}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto p-4" onClick={() => setShowCreateRoom(false)}>
          <div className="bg-slate-900 border-8 border-purple-500 p-8 max-w-2xl w-full my-8" style={{ boxShadow: '12px 12px 0 0 #a855f7' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="pixel-font text-xl text-purple-400 mb-6 text-center">CREAR SALA</h3>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              {/* Nombre de la sala */}
              <div>
                <label className="pixel-font text-xs text-purple-300 block mb-2">NOMBRE DE LA SALA</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Mi Sala Épica"
                  className="w-full bg-slate-800 border-4 border-purple-400 px-4 py-3 text-white"
                  required
                  data-testid="room-name-input"
                />
              </div>

              {/* Cantidad de jugadores */}
              <div>
                <label className="pixel-font text-xs text-purple-300 block mb-2">JUGADORES MAXIMOS</label>
                <select
                  value={roomConfig.maxPlayers}
                  onChange={(e) => setRoomConfig({...roomConfig, maxPlayers: parseInt(e.target.value)})}
                  className="w-full bg-slate-800 border-4 border-purple-400 px-4 py-3 text-white"
                >
                  <option value="2">2 Jugadores</option>
                  <option value="3">3 Jugadores</option>
                  <option value="4">4 Jugadores</option>
                  <option value="6">6 Jugadores</option>
                  <option value="8">8 Jugadores</option>
                </select>
              </div>

              {/* Modo de juego */}
              <div>
                <label className="pixel-font text-xs text-purple-300 block mb-2">MODO DE JUEGO</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRoomConfig({...roomConfig, gameMode: 'normal'})}
                    className={`pixel-font px-4 py-3 border-4 text-xs ${
                      roomConfig.gameMode === 'normal' 
                        ? 'bg-purple-600 border-pink-500 text-white' 
                        : 'bg-slate-800 border-purple-400 text-purple-300'
                    }`}
                  >
                    NORMAL
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoomConfig({...roomConfig, gameMode: 'competencia'})}
                    className={`pixel-font px-4 py-3 border-4 text-xs ${
                      roomConfig.gameMode === 'competencia' 
                        ? 'bg-purple-600 border-pink-500 text-white' 
                        : 'bg-slate-800 border-purple-400 text-purple-300'
                    }`}
                  >
                    COMPETENCIA
                  </button>
                </div>
              </div>

              {/* Materia */}
              <div>
                <label className="pixel-font text-xs text-purple-300 block mb-2">MATERIA</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {value: 'matematicas', label: '➕ MATEMATICAS', emoji: '📐'},
                    {value: 'lengua', label: '📖 LENGUA', emoji: '📚'},
                    {value: 'ciencias', label: '🔬 CIENCIAS', emoji: '⚗️'},
                    {value: 'sociales', label: '🌍 SOCIALES', emoji: '🗺️'}
                  ].map(subject => (
                    <button
                      key={subject.value}
                      type="button"
                      onClick={() => setRoomConfig({...roomConfig, subject: subject.value})}
                      className={`pixel-font px-4 py-3 border-4 text-xs ${
                        roomConfig.subject === subject.value 
                          ? 'bg-purple-600 border-pink-500 text-white' 
                          : 'bg-slate-800 border-purple-400 text-purple-300'
                      }`}
                    >
                      {subject.emoji} {subject.value.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grado */}
              <div>
                <label className="pixel-font text-xs text-purple-300 block mb-2">GRADO (SECUNDARIA)</label>
                <div className="grid grid-cols-3 gap-3">
                  {['10', '11', '12'].map(grade => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setRoomConfig({...roomConfig, gradeLevel: grade})}
                      className={`pixel-font px-4 py-3 border-4 text-xs ${
                        roomConfig.gradeLevel === grade 
                          ? 'bg-purple-600 border-pink-500 text-white' 
                          : 'bg-slate-800 border-purple-400 text-purple-300'
                      }`}
                    >
                      GRADO {grade}°
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiempo por pregunta */}
              <div>
                <label className="pixel-font text-xs text-purple-300 block mb-2">TIEMPO POR PREGUNTA</label>
                <select
                  value={roomConfig.timePerQuestion}
                  onChange={(e) => setRoomConfig({...roomConfig, timePerQuestion: parseInt(e.target.value)})}
                  className="w-full bg-slate-800 border-4 border-purple-400 px-4 py-3 text-white"
                >
                  <option value="15">15 segundos</option>
                  <option value="20">20 segundos</option>
                  <option value="30">30 segundos</option>
                  <option value="45">45 segundos</option>
                  <option value="60">60 segundos</option>
                  <option value="90">90 segundos</option>
                </select>
              </div>

              {/* Cantidad de preguntas */}
              <div>
                <label className="pixel-font text-xs text-purple-300 block mb-2">CANTIDAD DE PREGUNTAS</label>
                <select
                  value={roomConfig.totalQuestions}
                  onChange={(e) => setRoomConfig({...roomConfig, totalQuestions: parseInt(e.target.value)})}
                  className="w-full bg-slate-800 border-4 border-purple-400 px-4 py-3 text-white"
                >
                  <option value="5">5 preguntas</option>
                  <option value="10">10 preguntas</option>
                  <option value="15">15 preguntas</option>
                  <option value="20">20 preguntas</option>
                  <option value="25">25 preguntas</option>
                </select>
              </div>

              <button
                type="submit"
                className="pixel-font w-full px-6 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-700 hover:via-pink-700 hover:to-fuchsia-700 text-white border-4 border-pink-500 text-xs mt-4"
                style={{ boxShadow: '6px 6px 0 0 #ec4899' }}
              >
                &gt; CREAR SALA &lt;
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowAddFriend(false)}>
          <div className="bg-slate-900 border-8 border-purple-500 p-8 max-w-md" style={{ boxShadow: '12px 12px 0 0 #a855f7' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="pixel-font text-xl text-purple-400 mb-4 text-center">AGREGAR AMIGO</h3>
            <p className="text-purple-300 text-sm mb-4 text-center">
              Usa el formato: usuario#1234
            </p>
            <form onSubmit={handleAddFriend} className="space-y-4">
              <input
                type="text"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                placeholder="Ej: JugadorPro#1234"
                className="w-full bg-slate-800 border-4 border-purple-400 px-4 py-3 text-white"
                required
                pattern="^[a-zA-Z0-9_]+#[0-9]{4}$"
                title="Formato: usuario#1234"
                data-testid="friend-email-input"
              />
              <button
                type="submit"
                className="pixel-font w-full px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white border-4 border-purple-500 text-xs"
                style={{ boxShadow: '6px 6px 0 0 #a855f7' }}
              >
                AGREGAR
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Character Modal */}
      {showEditCharacter && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowEditCharacter(false)}>
          <div className="bg-slate-900 border-8 border-purple-500 p-8 max-w-md" style={{ boxShadow: '12px 12px 0 0 #a855f7' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="pixel-font text-xl text-purple-400 mb-4 text-center">EDITAR PERSONAJE</h3>
            <form onSubmit={handleUpdateCharacter} className="space-y-4">
              <div>
                <label className="pixel-font text-xs text-purple-300 block mb-2">AVATAR</label>
                <div className="grid grid-cols-5 gap-2">
                  {['👤', '👾', '🤖', '👽', '🚀', '🎮', '🏆', '⭐', '🔥', '⚡'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setCharacterCustomization({...characterCustomization, avatar: emoji})}
                      className={`text-3xl p-2 border-4 ${characterCustomization.avatar === emoji ? 'border-pink-500' : 'border-purple-500'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="pixel-font text-xs text-purple-300 block mb-2">COLOR</label>
                <input
                  type="color"
                  value={characterCustomization.color}
                  onChange={(e) => setCharacterCustomization({...characterCustomization, color: e.target.value})}
                  className="w-full h-12 bg-slate-800 border-4 border-purple-400"
                />
              </div>
              <button
                type="submit"
                className="pixel-font w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white border-4 border-pink-500 text-xs"
                style={{ boxShadow: '6px 6px 0 0 #ec4899' }}
              >
                GUARDAR
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;