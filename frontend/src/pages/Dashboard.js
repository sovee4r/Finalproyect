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
  const [isLoading, setIsLoading] = useState(!location.state?.user);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showEditCharacter, setShowEditCharacter] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [characterCustomization, setCharacterCustomization] = useState({
    avatar: '👤',
    color: '#a855f7',
    accessories: []
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if we have a token
        const token = localStorage.getItem('access_token');
        if (!token && !user) {
          console.log('No token found, redirecting to login');
          navigate('/login');
          return;
        }

        if (!user) {
          const userResponse = await axios.get(`${API}/auth/me`, {
            headers: getAuthHeaders(),
            withCredentials: true
          });
          setUser(userResponse.data);
        }

        const [characterRes, friendsRes, roomsRes] = await Promise.all([
          axios.get(`${API}/users/me/character`, {
            headers: getAuthHeaders(),
            withCredentials: true
          }),
          axios.get(`${API}/friends`, {
            headers: getAuthHeaders(),
            withCredentials: true
          }),
          axios.get(`${API}/rooms`, {
            headers: getAuthHeaders(),
            withCredentials: true
          })
        ]);

        setCharacter(characterRes.data);
        setCharacterCustomization(characterRes.data.customization);
        setFriends(friendsRes.data);
        setRooms(roomsRes.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading dashboard:', error);
        localStorage.removeItem('access_token');
        navigate('/login');
      }
    };

    fetchData();
  }, [navigate, user]);

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      localStorage.removeItem('access_token');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API}/rooms?room_name=${encodeURIComponent(roomName)}&max_players=4`,
        {},
        {
          headers: getAuthHeaders(),
          withCredentials: true
        }
      );
      setRooms([...rooms, response.data]);
      setShowCreateRoom(false);
      setRoomName('');
      navigate(`/room/${response.data.room_id}`);
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API}/friends/add?friend_email=${encodeURIComponent(friendEmail)}`,
        {},
        {
          headers: getAuthHeaders(),
          withCredentials: true
        }
      );
      setFriends([...friends, response.data.friend]);
      setShowAddFriend(false);
      setFriendEmail('');
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al agregar amigo');
    }
  };

  const handleUpdateCharacter = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `${API}/users/me/character`,
        characterCustomization,
        {
          headers: getAuthHeaders(),
          withCredentials: true
        }
      );
      setCharacter(response.data);
      setShowEditCharacter(false);
    } catch (error) {
      console.error('Error updating character:', error);
    }
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
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
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
                  <div key={room.room_id} className="bg-slate-700 border-4 border-purple-400 p-3 flex justify-between items-center" style={{ boxShadow: '3px 3px 0 0 #a855f7' }}>
                    <div>
                      <p className="pixel-font text-sm text-white">{room.name}</p>
                      <p className="text-xs text-purple-300">{room.players.length}/{room.max_players} jugadores</p>
                    </div>
                    <button
                      onClick={() => handleJoinRoom(room.room_id)}
                      className="pixel-font px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white border-4 border-pink-500 text-xs"
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
                  <p className="pixel-font text-xs text-purple-300">{friend.username}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowCreateRoom(false)}>
          <div className="bg-slate-900 border-8 border-purple-500 p-8 max-w-md" style={{ boxShadow: '12px 12px 0 0 #a855f7' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="pixel-font text-xl text-purple-400 mb-4 text-center">CREAR SALA</h3>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Nombre de la sala"
                className="w-full bg-slate-800 border-4 border-purple-400 px-4 py-3 text-white"
                required
                data-testid="room-name-input"
              />
              <button
                type="submit"
                className="pixel-font w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white border-4 border-pink-500 text-xs"
                style={{ boxShadow: '6px 6px 0 0 #ec4899' }}
              >
                CREAR
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
            <form onSubmit={handleAddFriend} className="space-y-4">
              <input
                type="email"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                placeholder="Email del amigo"
                className="w-full bg-slate-800 border-4 border-purple-400 px-4 py-3 text-white"
                required
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