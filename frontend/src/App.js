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
          <h1 className="text-6xl font-bold text-white mb-8">🎮 Juego en Progreso</h1>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border-2 border-purple-500/30 min-h-[500px] flex items-center justify-center">
            <p className="text-2xl text-purple-300">Aquí va tu juego...</p>
          </div>
          <button
            onClick={() => setIsPlaying(false)}
            className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold rounded-full shadow-lg transform transition hover:scale-105"
            data-testid="exit-game-button"
          >
            Salir del Juego
          </button>
        </div>
      </div>
    );
  }

  // Vista del lobby principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6">
      {/* Icono de casa en esquina superior izquierda */}
      <div className="absolute top-6 left-6">
        <button 
          className="p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
          data-testid="home-button"
        >
          <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
      </div>

      {/* Contenedor principal con dos secciones */}
      <div className="max-w-7xl mx-auto pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          
          {/* Sección Principal (Izquierda - Juego) */}
          <div className="lg:col-span-2 bg-slate-800/30 backdrop-blur-sm rounded-3xl border-2 border-purple-500/20 p-8 shadow-2xl" data-testid="main-game-area">
            
            {/* Logo/título con colores */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex gap-1">
                <div className="w-2 h-8 bg-purple-500 rounded-full transform -rotate-12"></div>
                <div className="w-2 h-8 bg-pink-500 rounded-full"></div>
                <div className="w-2 h-8 bg-fuchsia-500 rounded-full transform rotate-12"></div>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent">
                LOGO
              </h2>
            </div>

            {/* Área del personaje */}
            <div className="flex flex-col items-center justify-center space-y-8 py-12">
              <div className="relative">
                {/* Círculo grande del personaje */}
                <div className="w-64 h-64 bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-full flex items-center justify-center border-4 border-purple-500/30 shadow-2xl" data-testid="character-circle">
                  {/* Círculo pequeño interno con ícono */}
                  <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center border-2 border-purple-400/50">
                    <span className="text-4xl">👤</span>
                  </div>
                </div>
                
                {/* Botón de editar personaje (lápiz) */}
                <button
                  onClick={() => setIsEditingCharacter(!isEditingCharacter)}
                  className="absolute bottom-4 right-4 p-3 bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg transition-all transform hover:scale-110"
                  data-testid="edit-character-button"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>

              <p className="text-purple-300 text-xl font-medium">Personaje</p>

              {/* Botón de inicio */}
              <button
                onClick={() => setIsPlaying(true)}
                className="px-12 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-700 hover:via-pink-700 hover:to-fuchsia-700 text-white text-lg font-bold rounded-full shadow-xl transform transition-all hover:scale-105 hover:shadow-2xl"
                data-testid="start-button"
              >
                Inicio
              </button>
            </div>
          </div>

          {/* Sección Derecha (Lista de amigos) */}
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-3xl border-2 border-purple-500/20 p-6 shadow-2xl flex flex-col" data-testid="friends-sidebar">
            
            {/* Título de la lista */}
            <div className="bg-slate-700/50 rounded-xl p-3 mb-4 text-center border border-purple-500/30">
              <h3 className="text-lg font-semibold text-purple-300">Lista de amigos</h3>
            </div>

            {/* Lista de amigos */}
            <div className="space-y-3 flex-1">
              {/* Tu usuario */}
              <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-full px-5 py-3 text-center border border-purple-400/40" data-testid="your-user">
                <p className="text-white font-medium">"tu usuario"</p>
              </div>

              {/* Amigo 1 */}
              <div className="bg-slate-700/40 hover:bg-slate-700/60 rounded-full px-5 py-3 text-center border border-slate-600 transition-colors cursor-pointer" data-testid="friend-1">
                <p className="text-purple-200">"amigo"</p>
              </div>

              {/* Amigo 2 */}
              <div className="bg-slate-700/40 hover:bg-slate-700/60 rounded-full px-5 py-3 text-center border border-slate-600 transition-colors cursor-pointer" data-testid="friend-2">
                <p className="text-purple-200">"amigo"</p>
              </div>
            </div>

            {/* Botón agregar amigo */}
            <button
              className="mt-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-full px-5 py-3 text-white font-semibold transition-all transform hover:scale-105 shadow-lg"
              data-testid="add-friend-button"
            >
              Agregar amigo
            </button>
          </div>

        </div>
      </div>

      {/* Modal de edición de personaje */}
      {isEditingCharacter && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setIsEditingCharacter(false)}>
          <div className="bg-slate-800 rounded-2xl p-8 border-2 border-purple-500/50 shadow-2xl max-w-md" onClick={(e) => e.stopPropagation()} data-testid="edit-character-modal">
            <h3 className="text-2xl font-bold text-purple-300 mb-4">Editar Personaje</h3>
            <p className="text-slate-300 mb-6">Aquí podrás personalizar tu personaje...</p>
            <button
              onClick={() => setIsEditingCharacter(false)}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all"
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
