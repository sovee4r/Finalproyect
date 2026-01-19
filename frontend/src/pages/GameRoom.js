import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const WS_URL = BACKEND_URL.replace('http', 'ws').replace('https', 'wss');

// DEV MODE - Preguntas de ejemplo para todas las materias
const DEV_QUESTIONS = {
  matematicas: [
    { question_id: 'q1', question_text: '¿Cuál es el resultado de 2³ + 4²?', options: ['24', '20', '16', '18'], correct_answer: 0 },
    { question_id: 'q2', question_text: 'La ecuación x² - 5x + 6 = 0 tiene como soluciones:', options: ['x = 2, x = 3', 'x = 1, x = 6', 'x = -2, x = -3', 'x = 2, x = -3'], correct_answer: 0 },
    { question_id: 'q3', question_text: '¿Cuál es la raíz cuadrada de 144?', options: ['12', '14', '11', '13'], correct_answer: 0 },
    { question_id: 'q4', question_text: 'Si 3x + 7 = 22, entonces x =', options: ['5', '7', '4', '6'], correct_answer: 0 },
    { question_id: 'q5', question_text: '¿Cuánto es 15% de 200?', options: ['30', '25', '35', '20'], correct_answer: 0 },
  ],
  lengua: [
    { question_id: 'l1', question_text: '¿Qué figura literaria se usa en "Sus ojos eran dos luceros"?', options: ['Metáfora', 'Símil', 'Hipérbole', 'Personificación'], correct_answer: 0 },
    { question_id: 'l2', question_text: '¿Cuál es el sinónimo de "efímero"?', options: ['Pasajero', 'Eterno', 'Importante', 'Grande'], correct_answer: 0 },
    { question_id: 'l3', question_text: '¿Qué tipo de palabra es "rápidamente"?', options: ['Adverbio', 'Adjetivo', 'Sustantivo', 'Verbo'], correct_answer: 0 },
    { question_id: 'l4', question_text: '¿Quién escribió "Don Quijote de la Mancha"?', options: ['Miguel de Cervantes', 'Gabriel García Márquez', 'Pablo Neruda', 'Jorge Luis Borges'], correct_answer: 0 },
    { question_id: 'l5', question_text: '¿Qué es una onomatopeya?', options: ['Palabra que imita sonidos', 'Palabra que exagera', 'Palabra que compara', 'Palabra que describe'], correct_answer: 0 },
  ],
  ciencias: [
    { question_id: 'c1', question_text: '¿Cuál es la fórmula química del agua?', options: ['H₂O', 'CO₂', 'O₂', 'H₂O₂'], correct_answer: 0 },
    { question_id: 'c2', question_text: '¿Cuántos planetas hay en el sistema solar?', options: ['8', '9', '7', '10'], correct_answer: 0 },
    { question_id: 'c3', question_text: '¿Qué órgano bombea la sangre?', options: ['Corazón', 'Pulmón', 'Hígado', 'Riñón'], correct_answer: 0 },
    { question_id: 'c4', question_text: '¿Cuál es el elemento más abundante en la atmósfera?', options: ['Nitrógeno', 'Oxígeno', 'Carbono', 'Hidrógeno'], correct_answer: 0 },
    { question_id: 'c5', question_text: '¿Qué tipo de energía tiene un objeto en movimiento?', options: ['Cinética', 'Potencial', 'Térmica', 'Química'], correct_answer: 0 },
  ],
  sociales: [
    { question_id: 's1', question_text: '¿En qué año comenzó la Segunda Guerra Mundial?', options: ['1939', '1914', '1945', '1940'], correct_answer: 0 },
    { question_id: 's2', question_text: '¿Cuál es la capital de Francia?', options: ['París', 'Londres', 'Madrid', 'Roma'], correct_answer: 0 },
    { question_id: 's3', question_text: '¿Quién pintó la Mona Lisa?', options: ['Leonardo da Vinci', 'Pablo Picasso', 'Vincent van Gogh', 'Miguel Ángel'], correct_answer: 0 },
    { question_id: 's4', question_text: '¿En qué continente está Egipto?', options: ['África', 'Asia', 'Europa', 'Oceanía'], correct_answer: 0 },
    { question_id: 's5', question_text: '¿Quién fue el primer presidente de Estados Unidos?', options: ['George Washington', 'Abraham Lincoln', 'Thomas Jefferson', 'John Adams'], correct_answer: 0 },
  ]
};

function GameRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // DEV MODE - Obtener datos de la sala desde navigation state
  const roomFromNav = location.state?.room || null;
  
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(roomFromNav);
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
  const [devQuestions, setDevQuestions] = useState([]);
  const [playerScore, setPlayerScore] = useState(0);
  const messagesEndRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    // DEV MODE - Usar datos mockeados
    console.log('[GameRoom] DEV MODE - Initializing with mock data');
    
    const mockUser = {
      user_id: 'dev_user_123',
      username: 'DevUser',
      user_tag: '0000'
    };
    setUser(mockUser);
    
    // Si no hay sala en navigation state, crear una mock
    if (!room) {
      const mockRoom = {
        room_id: roomId,
        name: 'Sala de Prueba',
        host_user_id: 'dev_user_123',
        players: ['dev_user_123'],
        max_players: 4,
        game_mode: 'normal',
        subject: 'matematicas',
        grade_level: '10',
        time_per_question: 30,
        total_questions: 5,
        status: 'waiting'
      };
      setRoom(mockRoom);
    }
    
    // Mensaje de bienvenida
    setMessages([{
      message_id: 'sys_welcome',
      user_id: 'system',
      username: 'Sistema',
      message: '🛠️ MODO DESARROLLO - Chat simulado',
      timestamp: new Date().toISOString()
    }]);
    
  }, [roomId, room]);

  // DEV MODE - No WebSocket needed, cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // DEV MODE - Agregar mensaje localmente
    const newMsg = {
      message_id: `msg_${Date.now()}`,
      user_id: user.user_id,
      username: user.username,
      message: newMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');
  };

  const handleLeaveRoom = () => {
    // DEV MODE - Solo navegar de vuelta
    navigate('/dashboard');
  };

  const handleStartGame = () => {
    // DEV MODE - Iniciar juego con preguntas locales
    const subject = room?.subject || 'matematicas';
    const questions = DEV_QUESTIONS[subject] || DEV_QUESTIONS.matematicas;
    const totalQ = Math.min(room?.total_questions || 5, questions.length);
    
    // Barajar preguntas
    const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, totalQ);
    setDevQuestions(shuffled);
    
    const session = {
      session_id: `dev_session_${Date.now()}`,
      room_id: roomId,
      total_questions: totalQ
    };
    
    setGameSession(session);
    setIsPlaying(true);
    setQuestionNumber(0);
    setPlayerScore(0);
    
    // Cargar primera pregunta
    loadDevQuestion(shuffled, 0);
  };

  const loadDevQuestion = (questions, qNum) => {
    const question = questions[qNum];
    if (!question) return;
    
    setCurrentQuestion({
      ...question,
      question_number: qNum + 1,
      total_questions: questions.length,
      subject: room?.subject || 'matematicas'
    });
    setSelectedAnswer(null);
    setAnswerResult(null);
    
    // Iniciar timer
    const timePerQ = room?.time_per_question || 30;
    setTimeLeft(timePerQ);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAnswerSelect(-1); // Tiempo agotado
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnswerSelect = (answerIndex) => {
    if (selectedAnswer !== null) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setSelectedAnswer(answerIndex);
    
    const isCorrect = answerIndex === currentQuestion.correct_answer;
    
    if (answerIndex === -1) {
      setAnswerResult({
        is_correct: false,
        correct_answer: currentQuestion.correct_answer,
        explanation: "⏰ ¡Se acabó el tiempo!"
      });
    } else {
      if (isCorrect) {
        setPlayerScore(prev => prev + 1);
      }
      
      setAnswerResult({
        is_correct: isCorrect,
        correct_answer: currentQuestion.correct_answer,
        explanation: `La respuesta correcta es: ${currentQuestion.options[currentQuestion.correct_answer]}`
      });
    }
    
    // Siguiente pregunta después de 2 segundos
    setTimeout(() => {
      const nextQ = questionNumber + 1;
      if (nextQ < devQuestions.length) {
        setQuestionNumber(nextQ);
        loadDevQuestion(devQuestions, nextQ);
      } else {
        // Mostrar resultados finales
        showFinalResults();
      }
    }, 2000);
  };

  const showFinalResults = () => {
    setFinalResults({
      session_id: gameSession?.session_id,
      results: [{
        user_id: user.user_id,
        username: `${user.username}#${user.user_tag}`,
        score: playerScore + (answerResult?.is_correct ? 1 : 0),
        total_questions: devQuestions.length
      }],
      winner: {
        username: `${user.username}#${user.user_tag}`,
        score: playerScore + (answerResult?.is_correct ? 1 : 0),
        total_questions: devQuestions.length
      }
    });
    setShowResults(true);
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
      {/* DEV MODE Banner */}
      <div className="fixed top-0 left-0 right-0 bg-yellow-600 text-black text-center py-2 z-50">
        <p className="pixel-font text-xs">
          🛠️ MODO DESARROLLO - Juego simulado localmente
        </p>
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 mt-12">
        <div className="bg-slate-800/90 border-4 border-purple-500 p-4 flex justify-between items-center" style={{
          boxShadow: '6px 6px 0 0 #a855f7',
          imageRendering: 'pixelated'
        }}>
          <div>
            <h1 className="pixel-font text-lg text-purple-400">SALA: {room?.name || roomId}</h1>
            {room && (
              <p className="text-xs text-purple-300 mt-1">
                {getMateriaEmoji(room.subject)} {room.subject} - Grado {room.grade_level}° - {room.game_mode} - ⏱️ {room.time_per_question}s - ❓ {room.total_questions}p
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
                {/* Progress and Timer */}
                <div className="flex justify-between items-center mb-4">
                  <span className="pixel-font text-xs text-purple-300">
                    PREGUNTA {currentQuestion.question_number}/{currentQuestion.total_questions}
                  </span>
                  
                  {/* Timer */}
                  <div className="flex items-center gap-2">
                    <span className="pixel-font text-xs text-pink-400">
                      {getMateriaEmoji(currentQuestion.subject)} {currentQuestion.subject.toUpperCase()}
                    </span>
                    <div className={`pixel-font text-lg px-3 py-1 border-4 ${
                      timeLeft <= 5 ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-slate-700 border-purple-500'
                    }`}>
                      ⏱️ {timeLeft}s
                    </div>
                  </div>
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
