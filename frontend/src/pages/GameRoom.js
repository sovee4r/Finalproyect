import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

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

// Avatares pixel para los jugadores
const PLAYER_AVATARS = ['👤', '👾', '🤖', '👽', '🚀', '🎮', '⭐', '🔥'];
const PLAYER_COLORS = ['#a855f7', '#ec4899', '#3b82f6', '#22c55e', '#eab308', '#f97316', '#06b6d4', '#8b5cf6'];

// Simular otros jugadores para el modo dev
const DEV_PLAYERS = [
  { user_id: 'dev_user_123', username: 'Tú', user_tag: '0000', avatar: '👤', color: '#a855f7', score: 0, isCurrentUser: true },
  { user_id: 'bot_1', username: 'PixelMaster', user_tag: '1234', avatar: '👾', color: '#ec4899', score: 0 },
  { user_id: 'bot_2', username: 'TriviaKing', user_tag: '5678', avatar: '🤖', color: '#3b82f6', score: 0 },
  { user_id: 'bot_3', username: 'BrainWave', user_tag: '9012', avatar: '🚀', color: '#22c55e', score: 0 },
];

function GameRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const roomFromNav = location.state?.room || null;
  
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(roomFromNav);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameSession, setGameSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [devQuestions, setDevQuestions] = useState([]);
  const [players, setPlayers] = useState([...DEV_PLAYERS]);
  const timerRef = useRef(null);

  useEffect(() => {
    console.log('[GameRoom] DEV MODE - Initializing with mock data');
    
    const mockUser = {
      user_id: 'dev_user_123',
      username: 'Tú',
      user_tag: '0000'
    };
    setUser(mockUser);
    
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
  }, [roomId, room]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleLeaveRoom = () => {
    navigate('/dashboard');
  };

  const handleStartGame = () => {
    const subject = room?.subject || 'matematicas';
    const questions = DEV_QUESTIONS[subject] || DEV_QUESTIONS.matematicas;
    const totalQ = Math.min(room?.total_questions || 5, questions.length);
    
    const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, totalQ);
    setDevQuestions(shuffled);
    
    // Reset scores
    setPlayers(DEV_PLAYERS.map(p => ({ ...p, score: 0 })));
    
    const session = {
      session_id: `dev_session_${Date.now()}`,
      room_id: roomId,
      total_questions: totalQ
    };
    
    setGameSession(session);
    setIsPlaying(true);
    setQuestionNumber(0);
    
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
  };

  const simulateBotAnswers = (correctAnswer) => {
    // Simular que los bots responden con diferentes probabilidades de acierto
    setPlayers(prev => {
      const updated = prev.map(player => {
        if (player.isCurrentUser) return player;
        
        // 60% probabilidad de acertar para los bots
        const botCorrect = Math.random() < 0.6;
        return {
          ...player,
          score: player.score + (botCorrect ? 1 : 0)
        };
      });
      
      // Ordenar por score
      return updated.sort((a, b) => b.score - a.score);
    });
  };

  const handleAnswerSelect = (answerIndex) => {
    if (selectedAnswer !== null) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setSelectedAnswer(answerIndex);
    
    const isCorrect = answerIndex === currentQuestion.correct_answer;
    
    // Actualizar puntuación del jugador actual
    if (isCorrect && answerIndex !== -1) {
      setPlayers(prev => {
        const updated = prev.map(player => {
          if (player.isCurrentUser) {
            return { ...player, score: player.score + 1 };
          }
          return player;
        });
        return updated.sort((a, b) => b.score - a.score);
      });
    }
    
    // Simular respuestas de bots
    simulateBotAnswers(currentQuestion.correct_answer);
    
    if (answerIndex === -1) {
      setAnswerResult({
        is_correct: false,
        correct_answer: currentQuestion.correct_answer,
        explanation: "⏰ ¡Se acabó el tiempo!"
      });
    } else {
      setAnswerResult({
        is_correct: isCorrect,
        correct_answer: currentQuestion.correct_answer,
        explanation: `La respuesta correcta es: ${currentQuestion.options[currentQuestion.correct_answer]}`
      });
    }
    
    setTimeout(() => {
      const nextQ = questionNumber + 1;
      if (nextQ < devQuestions.length) {
        setQuestionNumber(nextQ);
        loadDevQuestion(devQuestions, nextQ);
      } else {
        setShowResults(true);
      }
    }, 2500);
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

  const getPositionStyle = (index) => {
    if (index === 0) return 'bg-yellow-500/20 border-yellow-500';
    if (index === 1) return 'bg-gray-400/20 border-gray-400';
    if (index === 2) return 'bg-orange-600/20 border-orange-600';
    return 'bg-slate-700/50 border-slate-600';
  };

  const getPositionIcon = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="pixel-font text-2xl text-purple-400">CARGANDO...</div>
      </div>
    );
  }

  // Ordenar jugadores por puntuación
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-slate-900 pixel-bg">
      {/* DEV MODE Banner */}
      <div className="fixed top-0 left-0 right-0 bg-yellow-600 text-black text-center py-1 z-50">
        <p className="pixel-font text-xs">
          🛠️ MODO DESARROLLO - Juego simulado localmente
        </p>
      </div>

      {/* Header */}
      <div className="pt-10 px-4 pb-2">
        <div className="max-w-7xl mx-auto bg-slate-800/90 border-4 border-purple-500 p-3 flex justify-between items-center" style={{
          boxShadow: '4px 4px 0 0 #a855f7'
        }}>
          <div>
            <h1 className="pixel-font text-base text-purple-400">{room?.name || 'SALA'}</h1>
            <p className="text-xs text-purple-300">
              {getMateriaEmoji(room?.subject)} {room?.subject} | Grado {room?.grade_level}° | ⏱️ {room?.time_per_question}s
            </p>
          </div>
          <button
            onClick={handleLeaveRoom}
            className="pixel-font px-4 py-2 bg-red-600 hover:bg-red-700 text-white border-4 border-red-400 text-xs"
            style={{ boxShadow: '3px 3px 0 0 #dc2626' }}
            data-testid="leave-room-button"
          >
            SALIR
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-12 gap-4" style={{ height: 'calc(100vh - 140px)' }}>
        
        {/* LEFT SIDEBAR - Ranking de Jugadores */}
        <div className="col-span-3">
          <div className="bg-slate-800/90 border-4 border-purple-500 h-full" style={{
            boxShadow: '4px 4px 0 0 #a855f7'
          }}>
            <div className="bg-purple-600 border-b-4 border-purple-400 p-2">
              <h3 className="pixel-font text-xs text-white text-center">JUGADORES</h3>
            </div>
            
            <div className="p-3 space-y-2">
              {sortedPlayers.map((player, index) => (
                <div 
                  key={player.user_id}
                  className={`border-4 p-2 transition-all duration-300 ${getPositionStyle(index)} ${player.isCurrentUser ? 'ring-2 ring-pink-500' : ''}`}
                  style={{ boxShadow: '2px 2px 0 0 rgba(0,0,0,0.3)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getPositionIcon(index)}</span>
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-lg border-2"
                      style={{ backgroundColor: player.color, borderColor: player.color }}
                    >
                      {player.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`pixel-font text-xs truncate ${player.isCurrentUser ? 'text-pink-400' : 'text-white'}`}>
                        {player.username}
                      </p>
                      <p className="text-xs text-purple-300">#{player.user_tag}</p>
                    </div>
                    <div className="pixel-font text-lg text-white">
                      {player.score}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Info de ganadores */}
            {isPlaying && (
              <div className="p-3 border-t-4 border-purple-500">
                <p className="pixel-font text-xs text-purple-300 text-center">
                  🏆 TOP 3 GANAN
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CENTER - Game Area */}
        <div className="col-span-6 flex flex-col gap-3">
          
          {/* Escenario con mesa y jugadores */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-4 border-fuchsia-500 p-4 relative overflow-hidden" style={{
            boxShadow: '4px 4px 0 0 #ec4899',
            minHeight: '200px'
          }}>
            {/* Fondo pixelado decorativo */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 4px, #a855f7 4px, #a855f7 8px)',
              backgroundSize: '8px 8px'
            }}></div>
            
            {/* Mesa redonda en el centro */}
            <div className="relative flex items-center justify-center" style={{ minHeight: '160px' }}>
              {/* Mesa */}
              <div className="absolute w-32 h-32 bg-gradient-to-br from-amber-800 to-amber-900 rounded-full border-8 border-amber-700 shadow-2xl" style={{
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5), 0 8px 0 0 #78350f'
              }}>
                <div className="absolute inset-4 rounded-full bg-amber-700/50"></div>
              </div>
              
              {/* Jugadores alrededor de la mesa */}
              {sortedPlayers.map((player, index) => {
                const angle = (index * (360 / sortedPlayers.length) - 90) * (Math.PI / 180);
                const radius = 90;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                return (
                  <div
                    key={player.user_id}
                    className="absolute transition-all duration-500"
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                    }}
                  >
                    {/* Personaje pixel */}
                    <div className={`relative ${player.isCurrentUser ? 'animate-bounce' : ''}`}>
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl border-4 transition-all"
                        style={{ 
                          backgroundColor: player.color,
                          borderColor: index < 3 ? '#fbbf24' : player.color,
                          boxShadow: `0 4px 0 0 ${player.color}88`
                        }}
                      >
                        {player.avatar}
                      </div>
                      {/* Nombre debajo */}
                      <p className="pixel-font text-xs text-white text-center mt-1 whitespace-nowrap">
                        {player.username.slice(0, 6)}
                      </p>
                      {/* Indicador de posición */}
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center text-xs border-2 border-purple-500">
                        {getPositionIcon(index)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Área de preguntas */}
          <div className="flex-1 bg-slate-800/90 border-4 border-purple-500 p-4" style={{
            boxShadow: '4px 4px 0 0 #a855f7'
          }} data-testid="game-area">
            
            {/* Pantalla de espera */}
            {!isPlaying && !showResults && (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <h2 className="pixel-font text-2xl text-purple-400 text-center" style={{
                  textShadow: '2px 2px 0 #ec4899'
                }}>
                  ESPERANDO JUGADORES
                </h2>
                <div className="text-5xl">🎮</div>
                <button
                  onClick={handleStartGame}
                  className="pixel-font px-10 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-700 hover:via-pink-700 hover:to-fuchsia-700 text-white border-4 border-fuchsia-400 text-sm"
                  style={{ boxShadow: '6px 6px 0 0 #ec4899' }}
                  data-testid="start-game-button"
                >
                  &gt; INICIAR JUEGO &lt;
                </button>
              </div>
            )}

            {/* Pantalla de pregunta */}
            {isPlaying && !showResults && currentQuestion && (
              <div className="h-full flex flex-col">
                {/* Header de pregunta */}
                <div className="flex justify-between items-center mb-3">
                  <span className="pixel-font text-xs text-purple-300">
                    PREGUNTA {currentQuestion.question_number}/{currentQuestion.total_questions}
                  </span>
                  <div className={`pixel-font text-base px-3 py-1 border-4 ${
                    timeLeft <= 5 ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-slate-700 border-purple-500'
                  }`}>
                    ⏱️ {timeLeft}s
                  </div>
                </div>

                {/* Pregunta */}
                <div className="bg-slate-900/80 border-4 border-fuchsia-500 p-4 mb-4">
                  <p className="text-white text-base leading-relaxed text-center">
                    {currentQuestion.question_text}
                  </p>
                </div>

                {/* Opciones 2x2 */}
                <div className="grid grid-cols-2 gap-3 flex-1">
                  {currentQuestion.options.map((option, index) => {
                    let buttonClass = "bg-slate-700 border-purple-500 text-white hover:bg-slate-600";
                    const optionLabels = ['A', 'B', 'C', 'D'];
                    
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
                        className={`flex items-center justify-center gap-2 p-4 border-4 transition-all ${buttonClass}`}
                        style={{ boxShadow: '3px 3px 0 0 rgba(0,0,0,0.3)' }}
                        data-testid={`option-${index}`}
                      >
                        <span className="pixel-font text-sm">{optionLabels[index]}.</span>
                        <span className="text-sm">{option}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Feedback */}
                {answerResult && (
                  <div className={`mt-3 p-3 border-4 text-center ${
                    answerResult.is_correct 
                      ? 'bg-green-900/50 border-green-500' 
                      : 'bg-red-900/50 border-red-500'
                  }`}>
                    <p className="pixel-font text-sm text-white">
                      {answerResult.is_correct ? '✓ CORRECTO!' : '✗ INCORRECTO'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Pantalla de resultados */}
            {showResults && (
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <h2 className="pixel-font text-2xl text-purple-400" style={{
                  textShadow: '2px 2px 0 #ec4899'
                }}>
                  ¡JUEGO TERMINADO!
                </h2>

                {/* Top 3 ganadores */}
                <div className="flex items-end gap-4 my-4">
                  {/* 2do lugar */}
                  {sortedPlayers[1] && (
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl border-4 mb-2"
                        style={{ backgroundColor: sortedPlayers[1].color, borderColor: '#9ca3af' }}>
                        {sortedPlayers[1].avatar}
                      </div>
                      <p className="text-xl">🥈</p>
                      <p className="pixel-font text-xs text-white">{sortedPlayers[1].username}</p>
                      <p className="pixel-font text-lg text-gray-400">{sortedPlayers[1].score} pts</p>
                    </div>
                  )}
                  
                  {/* 1er lugar */}
                  {sortedPlayers[0] && (
                    <div className="text-center -mt-4">
                      <div className="w-20 h-20 rounded-lg flex items-center justify-center text-4xl border-4 mb-2 animate-pulse"
                        style={{ backgroundColor: sortedPlayers[0].color, borderColor: '#fbbf24' }}>
                        {sortedPlayers[0].avatar}
                      </div>
                      <p className="text-2xl">🥇</p>
                      <p className="pixel-font text-sm text-yellow-400">{sortedPlayers[0].username}</p>
                      <p className="pixel-font text-xl text-yellow-400">{sortedPlayers[0].score} pts</p>
                    </div>
                  )}
                  
                  {/* 3er lugar */}
                  {sortedPlayers[2] && (
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl border-4 mb-2"
                        style={{ backgroundColor: sortedPlayers[2].color, borderColor: '#f97316' }}>
                        {sortedPlayers[2].avatar}
                      </div>
                      <p className="text-xl">🥉</p>
                      <p className="pixel-font text-xs text-white">{sortedPlayers[2].username}</p>
                      <p className="pixel-font text-lg text-orange-400">{sortedPlayers[2].score} pts</p>
                    </div>
                  )}
                </div>

                {/* Mensaje si estás en top 3 */}
                {sortedPlayers.findIndex(p => p.isCurrentUser) < 3 && (
                  <div className="bg-green-900/50 border-4 border-green-500 px-6 py-3">
                    <p className="pixel-font text-sm text-green-400">🎉 ¡FELICIDADES! ¡GANASTE!</p>
                  </div>
                )}

                <button
                  onClick={() => navigate('/dashboard')}
                  className="pixel-font px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white border-4 border-pink-500 text-sm mt-4"
                  style={{ boxShadow: '4px 4px 0 0 #ec4899' }}
                >
                  VOLVER AL LOBBY
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR - Anuncio */}
        <div className="col-span-3 flex flex-col gap-3">
          {/* Espacio para anuncio */}
          <div className="bg-slate-800/90 border-4 border-pink-500 flex-1" style={{
            boxShadow: '4px 4px 0 0 #ec4899'
          }}>
            <div className="bg-pink-600 border-b-4 border-pink-400 p-2">
              <h3 className="pixel-font text-xs text-white text-center">PATROCINADOR</h3>
            </div>
            
            <div className="p-4 flex flex-col items-center justify-center h-full">
              {/* Placeholder de anuncio */}
              <div className="w-full aspect-square bg-gradient-to-br from-purple-900 to-pink-900 border-4 border-dashed border-purple-400 flex flex-col items-center justify-center p-4">
                <p className="pixel-font text-xs text-purple-300 text-center mb-2">TU ANUNCIO AQUÍ</p>
                <div className="text-4xl mb-2">📢</div>
                <p className="text-xs text-purple-400 text-center">300x300</p>
              </div>
              
              {/* Info del juego */}
              <div className="mt-4 w-full space-y-2">
                <div className="bg-slate-700/50 border-2 border-purple-500 p-2">
                  <p className="pixel-font text-xs text-purple-300">MATERIA</p>
                  <p className="text-sm text-white">{getMateriaEmoji(room?.subject)} {room?.subject}</p>
                </div>
                <div className="bg-slate-700/50 border-2 border-purple-500 p-2">
                  <p className="pixel-font text-xs text-purple-300">MODO</p>
                  <p className="text-sm text-white">🎮 {room?.game_mode}</p>
                </div>
                {isPlaying && (
                  <div className="bg-slate-700/50 border-2 border-purple-500 p-2">
                    <p className="pixel-font text-xs text-purple-300">PROGRESO</p>
                    <p className="text-sm text-white">❓ {questionNumber + 1}/{devQuestions.length}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameRoom;
