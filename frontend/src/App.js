import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEditingCharacter, setIsEditingCharacter] = useState(false);

  const helloWorldApi = async () => {
    try {
      const response = await axios.get(`${API}/`);
      console.log(response.data.message);
    } catch (e) {
      console.error(e, `errored out requesting / api`);
    }
  };

  useEffect(() => {
    helloWorldApi();
  }, []);

  // Vista del juego en pantalla completa
  if (isPlaying) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-8" data-testid="game-fullscreen">
        {/* Efecto scanlines retro */}
        <div className="absolute inset-0 pointer-events-none opacity-10" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00ff00 2px, #00ff00 4px)'
        }}></div>
        
        <div className="text-center space-y-6 relative z-10">
          <h1 className="text-6xl font-bold text-cyan-400 mb-8 tracking-wider" style={{textShadow: '4px 4px 0px #ff00ff, 8px 8px 0px rgba(255,0,255,0.3)'}}>
            █ JUEGO EN PROGRESO █
          </h1>
          <div className="bg-black border-8 border-cyan-400 p-12 min-h-[500px] flex items-center justify-center" style={{boxShadow: '0 0 20px #00ffff, inset 0 0 20px rgba(0,255,255,0.1)'}}>
            <p className="text-3xl text-lime-400 font-bold tracking-widest animate-pulse">▓▓▓ GAME AREA ▓▓▓</p>
          </div>
          <button
            onClick={() => setIsPlaying(false)}
            className="px-10 py-4 bg-magenta-600 hover:bg-magenta-500 text-yellow-300 text-xl font-bold border-4 border-yellow-300 tracking-widest transition-all"
            style={{boxShadow: '6px 6px 0px #ffff00'}}
            data-testid="exit-game-button"
          >
            [[ SALIR ]]
          </button>
        </div>
      </div>
    );
  }

  // Vista del lobby principal - ESTILO RETRO
  return (
    <div className="min-h-screen bg-black relative overflow-hidden p-6">
      {/* Efecto scanlines retro sutil */}
      <div className="absolute inset-0 pointer-events-none opacity-5" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00ff00 2px, #00ff00 4px)'
      }}></div>

      {/* Grid retro de fondo */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(#00ffff 1px, transparent 1px), linear-gradient(90deg, #00ffff 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>

      {/* Icono de casa en esquina superior izquierda - RETRO */}
      <div className="absolute top-6 left-6 z-20">
        <button 
          className="p-3 bg-cyan-500 hover:bg-cyan-400 border-4 border-yellow-300 transition-colors"
          style={{boxShadow: '4px 4px 0px #ffff00'}}
          data-testid="home-button"
        >
          <span className="text-2xl">🏠</span>
        </button>
      </div>

      {/* Contenedor principal con dos secciones */}
      <div className="max-w-7xl mx-auto pt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          
          {/* Sección Principal (Izquierda - Juego) - RETRO */}
          <div className="lg:col-span-2 bg-black border-8 border-cyan-400 p-8" style={{boxShadow: '0 0 30px #00ffff, inset 0 0 20px rgba(0,255,255,0.1)'}} data-testid="main-game-area">
            
            {/* Logo/título con colores RETRO */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex gap-2">
                <div className="w-4 h-12 bg-magenta-500" style={{boxShadow: '0 0 10px #ff00ff'}}></div>
                <div className="w-4 h-12 bg-cyan-400" style={{boxShadow: '0 0 10px #00ffff'}}></div>
                <div className="w-4 h-12 bg-yellow-400" style={{boxShadow: '0 0 10px #ffff00'}}></div>
              </div>
              <h2 className="text-4xl font-bold text-yellow-300 tracking-widest" style={{textShadow: '3px 3px 0px #ff00ff'}}>
                ▓▓ LOGO ▓▓
              </h2>
            </div>

            {/* Área del personaje - RETRO */}
            <div className="flex flex-col items-center justify-center space-y-8 py-12">
              <div className="relative">
                {/* Círculo grande del personaje con estilo retro */}
                <div className="w-64 h-64 bg-black border-8 border-magenta-500 flex items-center justify-center relative" 
                     style={{
                       boxShadow: '0 0 30px #ff00ff, inset 0 0 30px rgba(255,0,255,0.2)',
                       clipPath: 'circle(50%)'
                     }} 
                     data-testid="character-circle">
                  {/* Círculo pequeño interno con ícono */}
                  <div className="w-24 h-24 bg-cyan-500 border-4 border-yellow-300 flex items-center justify-center" style={{clipPath: 'circle(50%)', boxShadow: '0 0 20px #00ffff'}}>
                    <span className="text-5xl">👾</span>
                  </div>
                </div>
                
                {/* Botón de editar personaje (lápiz) - RETRO */}
                <button
                  onClick={() => setIsEditingCharacter(!isEditingCharacter)}
                  className="absolute bottom-4 right-4 p-3 bg-yellow-400 hover:bg-yellow-300 border-4 border-magenta-500 transition-all"
                  style={{boxShadow: '4px 4px 0px #ff00ff'}}
                  data-testid="edit-character-button"
                >
                  <span className="text-2xl">✏️</span>
                </button>
              </div>

              <p className="text-cyan-400 text-2xl font-bold tracking-widest" style={{textShadow: '2px 2px 0px #ff00ff'}}>
                ▒▒ PERSONAJE ▒▒
              </p>

              {/* Botón de inicio - RETRO */}
              <button
                onClick={() => setIsPlaying(true)}
                className="px-16 py-5 bg-magenta-600 hover:bg-magenta-500 text-yellow-300 text-2xl font-bold border-8 border-cyan-400 tracking-widest transition-all transform hover:scale-105"
                style={{boxShadow: '8px 8px 0px #00ffff, 0 0 30px #ff00ff'}}
                data-testid="start-button"
              >
                ► INICIO ◄
              </button>
            </div>
          </div>

          {/* Sección Derecha (Lista de amigos) - RETRO */}
          <div className="bg-black border-8 border-lime-400 p-6 flex flex-col" style={{boxShadow: '0 0 30px #00ff00, inset 0 0 20px rgba(0,255,0,0.1)'}} data-testid="friends-sidebar">
            
            {/* Título de la lista - RETRO */}
            <div className="bg-lime-400 border-4 border-cyan-400 p-4 mb-6 text-center" style={{boxShadow: '4px 4px 0px #00ffff'}}>
              <h3 className="text-xl font-bold text-black tracking-widest">LISTA DE AMIGOS</h3>
            </div>

            {/* Lista de amigos - RETRO */}
            <div className="space-y-4 flex-1">
              {/* Tu usuario */}
              <div className="bg-magenta-600 border-4 border-yellow-300 px-5 py-4 text-center" style={{boxShadow: '4px 4px 0px #ffff00'}} data-testid="your-user">
                <p className="text-yellow-300 font-bold text-lg tracking-wide">★ TU USUARIO ★</p>
              </div>

              {/* Amigo 1 */}
              <div className="bg-cyan-700 hover:bg-cyan-600 border-4 border-lime-400 px-5 py-4 text-center transition-colors cursor-pointer" style={{boxShadow: '3px 3px 0px #00ff00'}} data-testid="friend-1">
                <p className="text-lime-300 font-bold tracking-wide">▸ AMIGO</p>
              </div>

              {/* Amigo 2 */}
              <div className="bg-cyan-700 hover:bg-cyan-600 border-4 border-lime-400 px-5 py-4 text-center transition-colors cursor-pointer" style={{boxShadow: '3px 3px 0px #00ff00'}} data-testid="friend-2">
                <p className="text-lime-300 font-bold tracking-wide">▸ AMIGO</p>
              </div>
            </div>

            {/* Botón agregar amigo - RETRO */}
            <button
              className="mt-6 bg-yellow-400 hover:bg-yellow-300 border-4 border-magenta-500 px-5 py-4 text-black font-bold text-lg tracking-widest transition-all transform hover:scale-105"
              style={{boxShadow: '4px 4px 0px #ff00ff'}}
              data-testid="add-friend-button"
            >
              + AGREGAR AMIGO +
            </button>
          </div>

        </div>
      </div>

      {/* Modal de edición de personaje - RETRO */}
      {isEditingCharacter && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={() => setIsEditingCharacter(false)}>
          <div className="bg-black border-8 border-cyan-400 p-10 max-w-md" style={{boxShadow: '0 0 50px #00ffff'}} onClick={(e) => e.stopPropagation()} data-testid="edit-character-modal">
            <h3 className="text-3xl font-bold text-yellow-300 mb-6 tracking-widest text-center" style={{textShadow: '3px 3px 0px #ff00ff'}}>
              ▓ EDITAR PERSONAJE ▓
            </h3>
            <p className="text-cyan-400 mb-8 text-center text-lg tracking-wide">
              Personaliza tu avatar retro...
            </p>
            <button
              onClick={() => setIsEditingCharacter(false)}
              className="w-full px-6 py-4 bg-magenta-600 hover:bg-magenta-500 text-yellow-300 font-bold text-xl border-4 border-yellow-300 tracking-widest transition-all"
              style={{boxShadow: '6px 6px 0px #ffff00'}}
            >
              [[ CERRAR ]]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />}>
            <Route index element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
