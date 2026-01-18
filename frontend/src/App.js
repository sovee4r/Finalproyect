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
      <div className="min-h-screen bg-slate-900 pixel-bg flex items-center justify-center p-8" data-testid="game-fullscreen">
        <div className="text-center space-y-8">
          <h1 className="pixel-font text-3xl md:text-4xl text-purple-400 mb-8 leading-loose" style={{
            textShadow: '4px 0 0 #ec4899, -4px 0 0 #ec4899, 0 4px 0 #ec4899, 0 -4px 0 #ec4899, 4px 4px 0 #a855f7',
            imageRendering: 'pixelated'
          }}>
            JUEGO EN<br/>PROGRESO
          </h1>
          <div className="bg-slate-800 border-8 border-purple-500 p-12 min-h-[500px] flex items-center justify-center pixel-dither" style={{
            boxShadow: '8px 8px 0 0 #a855f7, 16px 16px 0 0 #ec4899',
            imageRendering: 'pixelated'
          }}>
            <div className="space-y-4">
              <div className="text-6xl">🎮</div>
              <p className="pixel-font text-base text-fuchsia-400">GAME AREA</p>
            </div>
          </div>
          <button
            onClick={() => setIsPlaying(false)}
            className="pixel-font px-8 py-4 bg-purple-700 hover:bg-purple-600 text-pink-300 border-4 border-pink-500 transition-all text-xs uppercase"
            style={{
              boxShadow: '6px 6px 0 0 #ec4899',
              imageRendering: 'pixelated'
            }}
            data-testid="exit-game-button"
          >
            &lt; SALIR &gt;
          </button>
        </div>
      </div>
    );
  }

  // Vista del lobby principal - PIXEL ART
  return (
    <div className="min-h-screen bg-slate-900 pixel-bg p-6 relative overflow-hidden">
      {/* Patrón de píxeles de fondo */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(168, 85, 247, 0.1) 8px, rgba(168, 85, 247, 0.1) 16px),
          repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(236, 72, 153, 0.1) 8px, rgba(236, 72, 153, 0.1) 16px)
        `,
        imageRendering: 'pixelated'
      }}></div>

      {/* Icono de casa - PIXEL ART */}
      <div className="absolute top-6 left-6 z-20">
        <button 
          className="p-4 bg-purple-600 hover:bg-purple-500 border-4 border-fuchsia-400 transition-colors"
          style={{
            boxShadow: '4px 4px 0 0 #ec4899, 8px 8px 0 0 #a855f7',
            imageRendering: 'pixelated'
          }}
          data-testid="home-button"
        >
          <div className="text-2xl" style={{ imageRendering: 'pixelated' }}>🏠</div>
        </button>
      </div>

      {/* Contenedor principal */}
      <div className="max-w-7xl mx-auto pt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          
          {/* Sección Principal - PIXEL ART */}
          <div className="lg:col-span-2 bg-slate-800/90 border-8 border-purple-500 p-8 pixel-dither" style={{
            boxShadow: '8px 8px 0 0 #a855f7, 16px 16px 0 0 #ec4899',
            imageRendering: 'pixelated'
          }} data-testid="main-game-area">
            
            {/* Logo - PIXEL ART */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex gap-2">
                <div className="w-4 h-12 bg-purple-500 border-2 border-purple-300" style={{ imageRendering: 'pixelated' }}></div>
                <div className="w-4 h-12 bg-pink-500 border-2 border-pink-300" style={{ imageRendering: 'pixelated' }}></div>
                <div className="w-4 h-12 bg-fuchsia-500 border-2 border-fuchsia-300" style={{ imageRendering: 'pixelated' }}></div>
              </div>
              <h2 className="pixel-font text-xl text-purple-400 leading-loose" style={{
                textShadow: '3px 3px 0 #ec4899',
                imageRendering: 'pixelated'
              }}>
                LOGO
              </h2>
            </div>

            {/* Área del personaje - PIXEL ART */}
            <div className="flex flex-col items-center justify-center space-y-8 py-12">
              <div className="relative">
                {/* Personaje pixelado */}
                <div className="w-64 h-64 relative flex items-center justify-center" data-testid="character-circle">
                  {/* Crear círculo con píxeles */}
                  <div className="absolute inset-0" style={{
                    background: `
                      radial-gradient(circle, 
                        #701a75 0%, 
                        #701a75 45%, 
                        #a21caf 45%,
                        #a21caf 50%,
                        transparent 50%
                      )
                    `,
                    imageRendering: 'pixelated'
                  }}></div>
                  
                  {/* Borde pixelado del círculo */}
                  <div className="absolute inset-0 border-8 border-fuchsia-500" style={{
                    borderRadius: '50%',
                    boxShadow: 'inset 0 0 0 4px #ec4899',
                    imageRendering: 'pixelated'
                  }}></div>
                  
                  {/* Centro con ícono */}
                  <div className="relative z-10 w-24 h-24 bg-purple-700 border-4 border-pink-400 flex items-center justify-center" style={{
                    borderRadius: '50%',
                    imageRendering: 'pixelated'
                  }}>
                    <span className="text-5xl" style={{ imageRendering: 'pixelated' }}>👤</span>
                  </div>
                </div>
                
                {/* Botón editar - PIXEL ART */}
                <button
                  onClick={() => setIsEditingCharacter(!isEditingCharacter)}
                  className="absolute -bottom-2 -right-2 p-3 bg-pink-600 hover:bg-pink-500 border-4 border-purple-500 transition-all"
                  style={{
                    boxShadow: '4px 4px 0 0 #a855f7',
                    imageRendering: 'pixelated'
                  }}
                  data-testid="edit-character-button"
                >
                  <span className="text-xl" style={{ imageRendering: 'pixelated' }}>✏️</span>
                </button>
              </div>

              <p className="pixel-font text-base text-fuchsia-400 leading-loose" style={{
                textShadow: '2px 2px 0 #a855f7',
                imageRendering: 'pixelated'
              }}>
                PERSONAJE
              </p>

              {/* Botón inicio - PIXEL ART */}
              <button
                onClick={() => setIsPlaying(true)}
                className="pixel-font px-12 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-700 hover:via-pink-700 hover:to-fuchsia-700 text-white border-8 border-fuchsia-400 transition-all transform hover:scale-105 text-sm leading-loose"
                style={{
                  boxShadow: '8px 8px 0 0 #ec4899, 12px 12px 0 0 #a855f7',
                  imageRendering: 'pixelated'
                }}
                data-testid="start-button"
              >
                &gt; INICIO &lt;
              </button>
            </div>
          </div>

          {/* Sidebar - PIXEL ART */}
          <div className="bg-slate-800/90 border-8 border-pink-500 p-6 flex flex-col pixel-dither" style={{
            boxShadow: '8px 8px 0 0 #ec4899, 16px 16px 0 0 #a855f7',
            imageRendering: 'pixelated'
          }} data-testid="friends-sidebar">
            
            {/* Título */}
            <div className="bg-purple-600 border-4 border-fuchsia-400 p-4 mb-6 text-center" style={{
              boxShadow: '4px 4px 0 0 #a855f7',
              imageRendering: 'pixelated'
            }}>
              <h3 className="pixel-font text-xs text-white leading-relaxed">LISTA DE<br/>AMIGOS</h3>
            </div>

            {/* Lista de amigos - PIXEL ART */}
            <div className="space-y-4 flex-1">
              {/* Tu usuario */}
              <div className="bg-gradient-to-r from-purple-700 to-pink-700 border-4 border-fuchsia-400 px-4 py-4 text-center" style={{
                boxShadow: '4px 4px 0 0 #a855f7',
                imageRendering: 'pixelated'
              }} data-testid="your-user">
                <p className="pixel-font text-xs text-white leading-relaxed">TU USUARIO</p>
              </div>

              {/* Amigo 1 */}
              <div className="bg-slate-700 hover:bg-slate-600 border-4 border-purple-500 px-4 py-4 text-center transition-colors cursor-pointer" style={{
                boxShadow: '3px 3px 0 0 #a855f7',
                imageRendering: 'pixelated'
              }} data-testid="friend-1">
                <p className="pixel-font text-xs text-purple-300 leading-relaxed">AMIGO</p>
              </div>

              {/* Amigo 2 */}
              <div className="bg-slate-700 hover:bg-slate-600 border-4 border-purple-500 px-4 py-4 text-center transition-colors cursor-pointer" style={{
                boxShadow: '3px 3px 0 0 #a855f7',
                imageRendering: 'pixelated'
              }} data-testid="friend-2">
                <p className="pixel-font text-xs text-purple-300 leading-relaxed">AMIGO</p>
              </div>
            </div>

            {/* Botón agregar amigo - PIXEL ART */}
            <button
              className="pixel-font mt-6 bg-pink-600 hover:bg-pink-700 border-4 border-purple-500 px-4 py-4 text-white text-xs transition-all transform hover:scale-105 leading-relaxed"
              style={{
                boxShadow: '4px 4px 0 0 #a855f7',
                imageRendering: 'pixelated'
              }}
              data-testid="add-friend-button"
            >
              + AGREGAR +
            </button>
          </div>

        </div>
      </div>

      {/* Modal - PIXEL ART */}
      {isEditingCharacter && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setIsEditingCharacter(false)}>
          <div className="bg-slate-900 border-8 border-purple-500 p-10 max-w-md pixel-dither" style={{
            boxShadow: '12px 12px 0 0 #a855f7, 20px 20px 0 0 #ec4899',
            imageRendering: 'pixelated'
          }} onClick={(e) => e.stopPropagation()} data-testid="edit-character-modal">
            <h3 className="pixel-font text-lg text-purple-400 mb-6 text-center leading-loose" style={{
              textShadow: '3px 3px 0 #ec4899',
              imageRendering: 'pixelated'
            }}>
              EDITAR<br/>PERSONAJE
            </h3>
            <p className="text-purple-300 mb-8 text-center text-sm">
              Personaliza tu personaje aqui...
            </p>
            <button
              onClick={() => setIsEditingCharacter(false)}
              className="pixel-font w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 text-pink-300 border-4 border-pink-500 transition-all text-xs leading-relaxed"
              style={{
                boxShadow: '6px 6px 0 0 #ec4899',
                imageRendering: 'pixelated'
              }}
            >
              &lt; CERRAR &gt;
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
