import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function GameRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameSession, setGameSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);
  const [finalResults, setFinalResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const timerRef = useRef(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const userResponse = await axios.get(`${API}/auth/me`, {
          headers: getAuthHeaders(),
          withCredentials: true
        });
        setUser(userResponse.data);

        // Get room info
        const roomResponse = await axios.get(`${API}/rooms/${roomId}`, {
          headers: getAuthHeaders(),
          withCredentials: true
        });
        setRoom(roomResponse.data);

        setIsLoading(false);
      } catch (error) {
        console.error('[GameRoom] Error:', error);
        navigate('/dashboard');
      }
    };

    fetchData();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [roomId, navigate]);

  const handleLeaveRoom = async () => {
    try {
      await axios.post(`${API}/rooms/${roomId}/leave`, {}, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
    } catch (e) {
      console.log('Error leaving room');
    }
    navigate('/dashboard');
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
      setPlayerScore(0);

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

      // Start timer
      const timePerQ = room?.time_per_question || 30;
      setTimeLeft(timePerQ);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAnswerSelect(-1);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error loading question:', error);
    }
  };

  const handleAnswerSelect = async (answerIndex) => {
    if (selectedAnswer !== null) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setSelectedAnswer(answerIndex);

    if (answerIndex === -1) {
      // Time out
      setAnswerResult({
        is_correct: false,
        correct_answer: 0,
        explanation: "⏰ ¡Se acabó el tiempo!"
      });
    } else {
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
        if (response.data.is_correct) {
          setPlayerScore(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error submitting answer:', error);
      }
    }

    // Next question after delay
    setTimeout(() => {
      const nextQ = questionNumber + 1;
      if (nextQ < gameSession.total_questions) {
        setQuestionNumber(nextQ);
        loadQuestion(gameSession.session_id, nextQ);
      } else {
        loadFinalResults();
      }
    }, 2500);
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
      setShowResults(true);
    }
  };

  const getMateriaEmoji = (subject) => {
    const emojis = {
      'matematicas': '📐',
      'lengua': '📚',
      'ciencias': '⚗️',
      'sociales': '🗺️'
    };
    return emojis[subject] || '📖';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="pixel-font text-2xl text-purple-400">CARGANDO...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pixel-bg p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-4">
        <div className="bg-slate-800/90 border-4 border-purple-500 p-3 flex justify-between items-center" style={{
          boxShadow: '4px 4px 0 0 #a855f7'
        }}>
          <div className="flex items-center gap-3">
            {/* Home button */}
            <Link
              to="/"
              className="w-10 h-10 bg-slate-700 hover:bg-slate-600 border-4 border-purple-400 flex items-center justify-center text-xl"
              style={{ boxShadow: '2px 2px 0 0 #a855f7' }}
              title="Ir al inicio"
            >
              🏠
            </Link>
            <div>
              <h1 className="pixel-font text-base text-purple-400">{room?.name || 'SALA'}</h1>
              <p className="text-xs text-purple-300">
                {getMateriaEmoji(room?.subject)} {room?.subject} | Grado {room?.grade_level}° | ⏱️ {room?.time_per_question}s
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="pixel-font px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white border-4 border-purple-400 text-xs"
              style={{ boxShadow: '2px 2px 0 0 #a855f7' }}
            >
              LOBBY
            </Link>
            <button
              onClick={handleLeaveRoom}
              className="pixel-font px-3 py-2 bg-red-600 hover:bg-red-700 text-white border-4 border-red-400 text-xs"
              style={{ boxShadow: '2px 2px 0 0 #dc2626' }}
              data-testid="leave-room-button"
            >
              SALIR
            </button>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800/90 border-8 border-purple-500 p-6 min-h-[500px]" style={{
          boxShadow: '8px 8px 0 0 #a855f7, 16px 16px 0 0 #ec4899'
        }} data-testid="game-area">

          {/* Waiting Screen */}
          {!isPlaying && !showResults && (
            <div className="flex flex-col items-center justify-center h-full space-y-8 py-16">
              <h2 className="pixel-font text-3xl text-purple-400 text-center" style={{
                textShadow: '3px 3px 0 #ec4899'
              }}>
                ESPERANDO JUGADORES
              </h2>
              
              <div className="text-6xl">🎮</div>
              
              <div className="bg-slate-700/50 border-4 border-purple-500 p-4 text-center">
                <p className="text-purple-300 mb-2">Jugadores en sala:</p>
                <p className="pixel-font text-lg text-white">{room?.players?.length || 1} / {room?.max_players || 4}</p>
              </div>

              {room?.host_user_id === user?.user_id && (
                <button
                  onClick={handleStartGame}
                  className="pixel-font px-12 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-700 hover:via-pink-700 hover:to-fuchsia-700 text-white border-8 border-fuchsia-400 text-sm"
                  style={{ boxShadow: '8px 8px 0 0 #ec4899' }}
                  data-testid="start-game-button"
                >
                  &gt; INICIAR JUEGO &lt;
                </button>
              )}

              {room?.host_user_id !== user?.user_id && (
                <p className="text-purple-300">Esperando que el anfitrión inicie el juego...</p>
              )}
            </div>
          )}

          {/* Question Screen */}
          {isPlaying && !showResults && currentQuestion && (
            <div className="space-y-6">
              {/* Progress and Timer */}
              <div className="flex justify-between items-center">
                <span className="pixel-font text-sm text-purple-300">
                  PREGUNTA {currentQuestion.question_number}/{currentQuestion.total_questions}
                </span>
                <div className="flex items-center gap-3">
                  <span className="pixel-font text-sm text-pink-400">
                    PUNTOS: {playerScore}
                  </span>
                  <div className={`pixel-font text-lg px-4 py-2 border-4 ${
                    timeLeft <= 5 ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-slate-700 border-purple-500'
                  }`}>
                    ⏱️ {timeLeft}s
                  </div>
                </div>
              </div>

              {/* Question */}
              <div className="bg-slate-900/80 border-4 border-fuchsia-500 p-6">
                <p className="text-white text-lg text-center leading-relaxed">
                  {currentQuestion.question_text}
                </p>
              </div>

              {/* Options 2x2 */}
              <div className="grid grid-cols-2 gap-4">
                {currentQuestion.options?.map((option, index) => {
                  const optionLabels = ['A', 'B', 'C', 'D'];
                  let buttonClass = "bg-slate-700 border-purple-500 text-white hover:bg-slate-600";

                  if (selectedAnswer !== null) {
                    if (index === answerResult?.correct_answer) {
                      buttonClass = "bg-green-600 border-green-400 text-white";
                    } else if (index === selectedAnswer && !answerResult?.is_correct) {
                      buttonClass = "bg-red-600 border-red-400 text-white";
                    } else {
                      buttonClass = "bg-slate-800 border-slate-600 text-slate-400";
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={selectedAnswer !== null}
                      className={`flex items-center justify-center gap-2 p-5 border-4 transition-all ${buttonClass}`}
                      style={{ boxShadow: '4px 4px 0 0 rgba(0,0,0,0.3)' }}
                      data-testid={`option-${index}`}
                    >
                      <span className="pixel-font text-base">{optionLabels[index]}.</span>
                      <span className="text-base">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {answerResult && (
                <div className={`p-4 border-4 text-center ${
                  answerResult.is_correct 
                    ? 'bg-green-900/50 border-green-500' 
                    : 'bg-red-900/50 border-red-500'
                }`}>
                  <p className="pixel-font text-lg text-white mb-2">
                    {answerResult.is_correct ? '✓ ¡CORRECTO!' : '✗ INCORRECTO'}
                  </p>
                  <p className="text-sm text-white">{answerResult.explanation}</p>
                </div>
              )}
            </div>
          )}

          {/* Results Screen */}
          {showResults && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              <h2 className="pixel-font text-3xl text-purple-400" style={{
                textShadow: '3px 3px 0 #ec4899'
              }}>
                ¡JUEGO TERMINADO!
              </h2>

              <div className="bg-gradient-to-r from-purple-900 to-pink-900 border-4 border-fuchsia-500 p-6 text-center">
                <p className="pixel-font text-sm text-purple-300 mb-2">TU PUNTUACIÓN</p>
                <p className="pixel-font text-4xl text-white">{playerScore}</p>
                <p className="text-purple-300 mt-2">de {gameSession?.total_questions || '?'} preguntas</p>
              </div>

              {finalResults?.results && finalResults.results.length > 0 && (
                <div className="w-full max-w-md space-y-2">
                  <p className="pixel-font text-sm text-purple-400 text-center mb-4">RANKING</p>
                  {finalResults.results.map((result, index) => (
                    <div 
                      key={result.user_id}
                      className={`border-4 p-3 flex justify-between items-center ${
                        index === 0 ? 'bg-yellow-900/30 border-yellow-500' :
                        index === 1 ? 'bg-gray-700/30 border-gray-400' :
                        index === 2 ? 'bg-orange-900/30 border-orange-500' :
                        'bg-slate-700/30 border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                        </span>
                        <span className="text-white">{result.username}</span>
                      </div>
                      <span className="pixel-font text-lg text-white">{result.score}/{result.total_questions}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <Link
                  to="/"
                  className="pixel-font px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white border-4 border-purple-500 text-sm"
                  style={{ boxShadow: '4px 4px 0 0 #a855f7' }}
                >
                  🏠 INICIO
                </Link>
                <Link
                  to="/dashboard"
                  className="pixel-font px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white border-4 border-pink-500 text-sm"
                  style={{ boxShadow: '4px 4px 0 0 #ec4899' }}
                >
                  VOLVER AL LOBBY
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GameRoom;
