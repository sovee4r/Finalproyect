// src/lib/useGameSocket.ts
// Re-exporta useSocket para que los minijuegos usen el mismo protocolo que el quiz
// El backend solo soporta: crear_sala / unirse_sala / iniciar_juego / salir_sala

export {
  useSocket           as useGameSocket,
  type MultiState     as GameSocketState,
  type SalaInfo       as SalaJuego,
  type JugadorPublico as JugadorJuego,
  type RankingItem,
} from "./useSocket";
