import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Contenedor principal */}
      <div className="w-full max-w-4xl">
        {/* Panel central del juego */}
        <div 
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-8 md:p-12"
          data-testid="game-panel"
        >
          {/* Bienvenida */}
          <div className="text-center space-y-6">
            <div className="inline-block p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
              <svg 
                className="w-12 h-12 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            
            <h1 
              className="text-4xl md:text-5xl font-bold text-white mb-4"
              data-testid="welcome-title"
            >
              ¡Bienvenido a la Zona de Juegos!
            </h1>
            
            <p 
              className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto"
              data-testid="welcome-subtitle"
            >
              Prepárate para disfrutar de una experiencia única de entretenimiento
            </p>
            
            {/* Área de contenido del juego */}
            <div 
              className="mt-8 p-6 bg-gray-900/50 rounded-xl border border-gray-700/30 min-h-[300px] flex items-center justify-center"
              data-testid="game-content-area"
            >
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">🎮</div>
                <p className="text-gray-400 text-lg">
                  Aquí se presentará tu juego
                </p>
                <button 
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg transform transition hover:scale-105"
                  data-testid="start-game-button"
                >
                  Comenzar a Jugar
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Desarrollado con ❤️ en Emergent
          </p>
        </div>
      </div>
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
