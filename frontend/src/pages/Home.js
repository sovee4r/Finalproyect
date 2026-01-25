import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen bg-slate-900 pixel-bg">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 4px, #a855f7 4px, #a855f7 8px)',
          backgroundSize: '8px 8px'
        }}></div>
        
        <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">
          {/* Logo/Title */}
          <div className="text-center mb-12">
            <h1 className="pixel-font text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-fuchsia-500 mb-4" style={{
              textShadow: '4px 4px 0 #ec4899'
            }}>
              TRIVIA PIXEL
            </h1>
            <p className="text-xl text-purple-300 max-w-2xl mx-auto">
              ¡El juego de trivia multijugador con estilo retro!
            </p>
          </div>

          {/* Game Preview */}
          <div className="flex justify-center mb-12">
            <div className="bg-slate-800/80 border-8 border-purple-500 p-8 max-w-xl" style={{
              boxShadow: '12px 12px 0 0 #a855f7, 24px 24px 0 0 #ec4899'
            }}>
              <div className="flex justify-center gap-4 mb-6">
                <span className="text-5xl">🎮</span>
                <span className="text-5xl">🧠</span>
                <span className="text-5xl">🏆</span>
              </div>
              <p className="text-center text-purple-200 text-lg">
                Compite con tus amigos en preguntas de <span className="text-pink-400 font-bold">Matemáticas</span>, <span className="text-blue-400 font-bold">Ciencias</span>, <span className="text-green-400 font-bold">Lengua</span> y <span className="text-yellow-400 font-bold">Sociales</span>
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              to="/login"
              className="pixel-font px-10 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-700 hover:via-pink-700 hover:to-fuchsia-700 text-white border-4 border-fuchsia-400 text-center"
              style={{ boxShadow: '6px 6px 0 0 #ec4899' }}
              data-testid="login-btn"
            >
              INICIAR SESIÓN
            </Link>
            <Link
              to="/register"
              className="pixel-font px-10 py-4 bg-slate-700 hover:bg-slate-600 text-white border-4 border-purple-500 text-center"
              style={{ boxShadow: '6px 6px 0 0 #a855f7' }}
              data-testid="register-btn"
            >
              REGISTRARSE
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-slate-800/50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="pixel-font text-2xl text-purple-400 text-center mb-12" style={{
            textShadow: '2px 2px 0 #ec4899'
          }}>
            ¿CÓMO FUNCIONA?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-900/80 border-4 border-purple-500 p-6 text-center" style={{
              boxShadow: '6px 6px 0 0 #a855f7'
            }}>
              <div className="text-5xl mb-4">👥</div>
              <h3 className="pixel-font text-sm text-pink-400 mb-3">1. CREA O ÚNETE</h3>
              <p className="text-purple-200 text-sm">
                Crea una sala de juego o únete a una existente. Invita a tus amigos usando tu código único.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/80 border-4 border-pink-500 p-6 text-center" style={{
              boxShadow: '6px 6px 0 0 #ec4899'
            }}>
              <div className="text-5xl mb-4">❓</div>
              <h3 className="pixel-font text-sm text-purple-400 mb-3">2. RESPONDE</h3>
              <p className="text-purple-200 text-sm">
                Responde preguntas de trivia contra el reloj. Elige entre 4 opciones y acumula puntos.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/80 border-4 border-fuchsia-500 p-6 text-center" style={{
              boxShadow: '6px 6px 0 0 #d946ef'
            }}>
              <div className="text-5xl mb-4">🏆</div>
              <h3 className="pixel-font text-sm text-fuchsia-400 mb-3">3. ¡GANA!</h3>
              <p className="text-purple-200 text-sm">
                Los 3 mejores jugadores ganan. Sube en el ranking y demuestra quién es el más listo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Section */}
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="pixel-font text-2xl text-purple-400 text-center mb-12" style={{
            textShadow: '2px 2px 0 #ec4899'
          }}>
            MATERIAS DISPONIBLES
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 border-4 border-blue-500 p-6 text-center" style={{
              boxShadow: '4px 4px 0 0 #3b82f6'
            }}>
              <div className="text-4xl mb-2">📐</div>
              <p className="pixel-font text-xs text-blue-300">MATEMÁTICAS</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-900 to-green-800 border-4 border-green-500 p-6 text-center" style={{
              boxShadow: '4px 4px 0 0 #22c55e'
            }}>
              <div className="text-4xl mb-2">⚗️</div>
              <p className="pixel-font text-xs text-green-300">CIENCIAS</p>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 border-4 border-yellow-500 p-6 text-center" style={{
              boxShadow: '4px 4px 0 0 #eab308'
            }}>
              <div className="text-4xl mb-2">📚</div>
              <p className="pixel-font text-xs text-yellow-300">LENGUA</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-900 to-orange-800 border-4 border-orange-500 p-6 text-center" style={{
              boxShadow: '4px 4px 0 0 #f97316'
            }}>
              <div className="text-4xl mb-2">🗺️</div>
              <p className="pixel-font text-xs text-orange-300">SOCIALES</p>
            </div>
          </div>
        </div>
      </div>

      {/* Game Modes */}
      <div className="bg-slate-800/50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="pixel-font text-2xl text-purple-400 text-center mb-12" style={{
            textShadow: '2px 2px 0 #ec4899'
          }}>
            MODOS DE JUEGO
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-slate-900/80 border-4 border-purple-500 p-8" style={{
              boxShadow: '6px 6px 0 0 #a855f7'
            }}>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">🎯</span>
                <h3 className="pixel-font text-lg text-purple-400">MODO NORMAL</h3>
              </div>
              <p className="text-purple-200">
                Juego relajado para practicar y aprender. Perfecto para estudiar con amigos sin presión.
              </p>
            </div>

            <div className="bg-slate-900/80 border-4 border-pink-500 p-8" style={{
              boxShadow: '6px 6px 0 0 #ec4899'
            }}>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">⚔️</span>
                <h3 className="pixel-font text-lg text-pink-400">COMPETENCIA</h3>
              </div>
              <p className="text-purple-200">
                Modo competitivo intenso. La velocidad cuenta y solo los mejores llegarán al podio.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="py-16 text-center">
        <h2 className="pixel-font text-xl text-purple-400 mb-6">
          ¿LISTO PARA JUGAR?
        </h2>
        <Link
          to="/register"
          className="pixel-font inline-block px-12 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-700 hover:via-pink-700 hover:to-fuchsia-700 text-white border-4 border-fuchsia-400 text-lg"
          style={{ boxShadow: '8px 8px 0 0 #ec4899' }}
        >
          ¡CREAR CUENTA GRATIS!
        </Link>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 border-t-4 border-purple-500 py-6">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="pixel-font text-xs text-purple-400">TRIVIA PIXEL © 2025</p>
          <p className="text-purple-300 text-sm mt-2">Hecho con 💜 para estudiantes</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
