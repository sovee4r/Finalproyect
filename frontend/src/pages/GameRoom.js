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
  const [isPlaying, setIsPlaying] = useState(false);
  const [ws, setWs] = useState(null);
  const [gameSession, setGameSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);
  const [finalResults, setFinalResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const messagesEndRef = useRef(null);
  const timerRef = useRef(null);

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

        const roomResponse = await axios.get(`${API}/rooms/${roomId}`, {
          headers: getAuthHeaders(),
          withCredentials: true
        });
        setRoom(roomResponse.data);

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

  const handleStartGame = async () => {
    try {
      const response = await axios.post(`${API}/rooms/${roomId}/start`, {}, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      
      setGameSession(response.data);
      setIsPlaying(true);
      setQuestionNumber(0);
      
      // Load first question
      loadQuestion(response.data.session_id, 0);
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al iniciar el juego');
    }
  };

  const loadQuestion = async (sessionId, qNum) => {
    try {
      const response = await axios.get(`${API}/sessions/${sessionId}/question/${qNum}`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      setCurrentQuestion(response.data);
      setSelectedAnswer(null);
      setAnswerResult(null);
    } catch (error) {
      console.error('Error loading question:', error);
    }
  };

  const handleAnswerSelect = async (answerIndex) => {
    if (selectedAnswer !== null) return; // Already answered
    
    setSelectedAnswer(answerIndex);
    
    try {
      const response = await axios.post(
        `${API}/sessions/${gameSession.session_id}/answer?question_num=${questionNumber}&answer=${answerIndex}`,
        {},
        {
          headers: getAuthHeaders(),
          withCredentials: true
        }
      );
      
      setAnswerResult(response.data);
      
      // Wait 3 seconds before next question
      setTimeout(() => {
        const nextQuestion = questionNumber + 1;
        if (nextQuestion < gameSession.total_questions) {
          setQuestionNumber(nextQuestion);
          loadQuestion(gameSession.session_id, nextQuestion);
        } else {
          // Game finished, show results
          loadFinalResults();
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const loadFinalResults = async () => {
    try {
      const response = await axios.get(`${API}/sessions/${gameSession.session_id}/results`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      setFinalResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="pixel-font text-2xl text-purple-400">CARGANDO...</div>
      </div>
    );
  }

  const getMateriaEmoji = (subject) => {
    const emojis = {
      'matematicas': '📐',
      'lengua': '📚',
      'ciencias': '⚗️',
      'sociales': '🗺️'
    };
    return emojis[subject] || '📖';
  };

  return (
    <div className="min-h-screen bg-slate-900 pixel-bg p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-slate-800/90 border-4 border-purple-500 p-4 flex justify-between items-center" style={{
          boxShadow: '6px 6px 0 0 #a855f7',
          imageRendering: 'pixelated'
        }}>
          <div>
            <h1 className="pixel-font text-lg text-purple-400">SALA: {room?.name || roomId}</h1>
            {room && (
              <p className="text-xs text-purple-300 mt-1">
                {getMateriaEmoji(room.subject)} {room.subject} - Grado {room.grade_level}° - {room.game_mode}
              </p>
            )}
          </div>
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
            
            {/* Waiting Screen */}
            {!isPlaying && !showResults && (
              <div className="flex flex-col items-center justify-center h-full space-y-8">
                <h2 className="pixel-font text-3xl text-purple-400 leading-loose text-center" style={{
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
            )}

            {/* Question Screen */}
            {isPlaying && !showResults && currentQuestion && (
              <div className="space-y-6">
                {/* Progress */}
                <div className="flex justify-between items-center mb-4">
                  <span className="pixel-font text-xs text-purple-300">
                    PREGUNTA {currentQuestion.question_number}/{currentQuestion.total_questions}
                  </span>
                  <span className="pixel-font text-xs text-pink-400">
                    {getMateriaEmoji(currentQuestion.subject)} {currentQuestion.subject.toUpperCase()}
                  </span>
                </div>

                {/* Question */}
                <div className="bg-slate-900/50 border-4 border-fuchsia-500 p-6 mb-6">
                  <p className="text-white text-lg leading-relaxed">
                    {currentQuestion.question_text}
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    let buttonClass = "bg-slate-700 border-purple-500 text-white hover:bg-slate-600";
                    
                    if (selectedAnswer !== null) {
                      if (index === answerResult?.correct_answer) {
                        buttonClass = "bg-green-600 border-green-400 text-white";
                      } else if (index === selectedAnswer && !answerResult?.is_correct) {
                        buttonClass = "bg-red-600 border-red-400 text-white";
                      } else {
                        buttonClass = "bg-slate-800 border-slate-600 text-slate-400";
                      }
                    } else if (selectedAnswer === index) {
                      buttonClass = "bg-purple-600 border-pink-500 text-white";
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={selectedAnswer !== null}
                        className={`w-full text-left px-6 py-4 border-4 transition-all ${buttonClass}`}
                        style={{ boxShadow: '4px 4px 0 0 rgba(0,0,0,0.3)' }}
                        data-testid={`option-${index}`}
                      >
                        <span className="pixel-font text-xs mr-3">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Answer feedback */}
                {answerResult && (
                  <div className={`p-4 border-4 text-center ${
                    answerResult.is_correct 
                      ? 'bg-green-900/50 border-green-500' 
                      : 'bg-red-900/50 border-red-500'
                  }`}>
                    <p className="pixel-font text-sm text-white mb-2">
                      {answerResult.is_correct ? '✓ CORRECTO!' : '✗ INCORRECTO'}
                    </p>
                    <p className="text-sm text-white">{answerResult.explanation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Results Screen */}
            {showResults && finalResults && (
              <div className="space-y-6">
                <h2 className="pixel-font text-3xl text-center text-purple-400 mb-6" style={{
                  textShadow: '3px 3px 0 #ec4899'
                }}>
                  RESULTADOS FINALES
                </h2>

                {/* Winner */}
                {finalResults.winner && (
                  <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 border-4 border-yellow-400 p-6 text-center mb-6">
                    <p className="pixel-font text-2xl text-white mb-2">🏆 GANADOR 🏆</p>
                    <p className="pixel-font text-xl text-white">{finalResults.winner.username}</p>
                    <p className="text-white text-lg mt-2">
                      {finalResults.winner.score}/{finalResults.winner.total_questions} correctas
                    </p>
                  </div>
                )}

                {/* All results */}
                <div className="space-y-3">
                  {finalResults.results.map((result, index) => (
                    <div 
                      key={result.user_id}
                      className={`border-4 p-4 flex justify-between items-center ${
                        index === 0 
                          ? 'bg-yellow-900/30 border-yellow-500' 
                          : 'bg-slate-700 border-purple-500'
                      }`}
                      style={{ boxShadow: '3px 3px 0 0 rgba(0,0,0,0.3)' }}
                    >
                      <div>
                        <span className="pixel-font text-lg mr-3">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                        </span>
                        <span className="text-white">{result.username}</span>
                      </div>
                      <span className="pixel-font text-xl text-white">
                        {result.score}/{result.total_questions}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/dashboard')}
                  className="pixel-font w-full px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white border-4 border-pink-500 text-sm mt-6"
                  style={{ boxShadow: '6px 6px 0 0 #ec4899' }}
                >
                  VOLVER AL LOBBY
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
