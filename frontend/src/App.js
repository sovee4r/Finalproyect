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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-8" data-testid="game-fullscreen">
        <div className="text-center space-y-6">
          <h1 className="pixel-font text-4xl md:text-5xl text-white mb-8" style={{textShadow: '4px 4px 0px #a855f7'}}>
            Juego en Progreso
          </h1>
          <div className="bg-slate-800 border-4 border-purple-500 p-12 min-h-[500px] flex items-center justify-center" style={{boxShadow: '8px 8px 0px #a855f7'}}>
            <p className="pixel-font text-xl text-purple-300">Aqui va tu juego...</p>
          </div>
          <button
            onClick={() => setIsPlaying(false)}
            className="pixel-font px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white border-4 border-pink-500 transition-all text-sm"
            style={{boxShadow: '6px 6px 0px #ec4899'}}
            data-testid="exit-game-button"
          >
            Salir
          </button>
        </div>
      </div>
    );
  }

  // Vista del lobby principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-6">
      {/* Icono de casa en esquina superior izquierda */}
      <div className="absolute top-6 left-6 z-20">
        <button 
          className="p-3 bg-purple-600 hover:bg-purple-700 border-4 border-pink-500 transition-colors"
          style={{boxShadow: '4px 4px 0px #ec4899'}}
          data-testid="home-button"
        >
          <span className="text-2xl">🏠</span>
        </button>
      </div>

      {/* Contenedor principal con dos secciones */}
      <div className="max-w-7xl mx-auto pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          
          {/* Sección Principal (Izquierda - Juego) */}
          <div className="lg:col-span-2 bg-slate-900/80 border-4 border-purple-500 p-8" style={{boxShadow: '8px 8px 0px #a855f7'}} data-testid="main-game-area">
            
            {/* Logo/título con colores */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex gap-2">
                <div className="w-3 h-10 bg-purple-500"></div>
                <div className="w-3 h-10 bg-pink-500"></div>
                <div className="w-3 h-10 bg-fuchsia-500"></div>
              </div>
              <h2 className="pixel-font text-2xl text-purple-400" style={{textShadow: '3px 3px 0px #ec4899'}}>
                LOGO
              </h2>
            </div>

            {/* Área del personaje */}
            <div className="flex flex-col items-center justify-center space-y-8 py-12">
              <div className="relative">
                {/* Círculo grande del personaje */}
                <div className="w-64 h-64 bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center border-4 border-fuchsia-500 relative" 
                     style={{
                       clipPath: 'circle(50%)',
                       boxShadow: '0 0 40px rgba(168, 85, 247, 0.6)'
                     }} 
                     data-testid="character-circle">
                  {/* Círculo pequeño interno con ícono */}
                  <div className="w-24 h-24 bg-purple-700 border-4 border-pink-400 flex items-center justify-center" style={{clipPath: 'circle(50%)'}}>
                    <span className="text-5xl">👤</span>
                  </div>
                </div>
                
                {/* Botón de editar personaje (lápiz) */}
                <button
                  onClick={() => setIsEditingCharacter(!isEditingCharacter)}
                  className="absolute bottom-4 right-4 p-3 bg-pink-600 hover:bg-pink-700 border-4 border-purple-500 transition-all"
                  style={{boxShadow: '4px 4px 0px #a855f7'}}
                  data-testid="edit-character-button"
                >
                  <span className="text-xl">✏️</span>
                </button>
              </div>

              <p className="pixel-font text-lg text-purple-400" style={{textShadow: '2px 2px 0px #ec4899'}}>
                Personaje
              </p>

              {/* Botón de inicio */}
              <button
                onClick={() => setIsPlaying(true)}
                className="pixel-font px-12 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-700 hover:via-pink-700 hover:to-fuchsia-700 text-white border-4 border-pink-400 transition-all transform hover:scale-105 text-sm"
                style={{boxShadow: '8px 8px 0px #ec4899'}}
                data-testid="start-button"
              >
                INICIO
              </button>
            </div>
          </div>

          {/* Sección Derecha (Lista de amigos) */}
          <div className="bg-slate-900/80 border-4 border-pink-500 p-6 flex flex-col" style={{boxShadow: '8px 8px 0px #ec4899'}} data-testid="friends-sidebar">
            
            {/* Título de la lista */}
            <div className="bg-purple-600 border-4 border-fuchsia-400 p-3 mb-6 text-center" style={{boxShadow: '4px 4px 0px #a855f7'}}>
              <h3 className="pixel-font text-xs text-white">Lista de amigos</h3>
            </div>

            {/* Lista de amigos */}
            <div className="space-y-4 flex-1">
              {/* Tu usuario */}
              <div className="bg-gradient-to-r from-purple-700 to-pink-700 border-4 border-fuchsia-400 px-5 py-4 text-center" style={{boxShadow: '4px 4px 0px #a855f7'}} data-testid="your-user">
                <p className="pixel-font text-xs text-white">tu usuario</p>
              </div>

              {/* Amigo 1 */}
              <div className="bg-slate-800 hover:bg-slate-700 border-4 border-purple-500 px-5 py-4 text-center transition-colors cursor-pointer" style={{boxShadow: '3px 3px 0px #a855f7'}} data-testid="friend-1">
                <p className="pixel-font text-xs text-purple-300">amigo</p>
              </div>

              {/* Amigo 2 */}
              <div className="bg-slate-800 hover:bg-slate-700 border-4 border-purple-500 px-5 py-4 text-center transition-colors cursor-pointer" style={{boxShadow: '3px 3px 0px #a855f7'}} data-testid="friend-2">
                <p className="pixel-font text-xs text-purple-300">amigo</p>
              </div>
            </div>

            {/* Botón agregar amigo */}
            <button
              className="pixel-font mt-6 bg-pink-600 hover:bg-pink-700 border-4 border-purple-500 px-5 py-4 text-white text-xs transition-all transform hover:scale-105"
              style={{boxShadow: '4px 4px 0px #a855f7'}}
              data-testid="add-friend-button"
            >
              Agregar amigo
            </button>
          </div>

        </div>
      </div>

      {/* Modal de edición de personaje */}
      {isEditingCharacter && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setIsEditingCharacter(false)}>
          <div className="bg-slate-900 border-4 border-purple-500 p-10 max-w-md" style={{boxShadow: '12px 12px 0px #a855f7'}} onClick={(e) => e.stopPropagation()} data-testid="edit-character-modal">
            <h3 className="pixel-font text-xl text-purple-400 mb-6 text-center" style={{textShadow: '3px 3px 0px #ec4899'}}>
              Editar Personaje
            </h3>
            <p className="text-purple-300 mb-8 text-center">
              Personaliza tu personaje aqui...
            </p>
            <button
              onClick={() => setIsEditingCharacter(false)}
              className="pixel-font w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white border-4 border-pink-500 transition-all text-xs"
              style={{boxShadow: '6px 6px 0px #ec4899'}}
            >
              Cerrar
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
