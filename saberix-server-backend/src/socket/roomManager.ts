import { Sala, Jugador } from "./types";
export type { Sala } from "./types";


/* Las salas viven en memoria del servidor.
   En producción con múltiples instancias usarías Redis,
   pero para empezar esto es más que suficiente. */
const salas = new Map<string, Sala>();

/* ─── Generar código único de 6 dígitos ─── */
function generarCodigo(): string {
  let code: string;
  do { code = String(Math.floor(100000 + Math.random() * 900000)); }
  while (salas.has(code));
  return code;
}

/* ─── Crear sala ─── */
export function crearSala(
  hostSocketId: string,
  nombre: string,
  nombreJugador: string,
  materia: string,
  grado: number,
 tiempoPorPregunta: number,
  cantPreguntas:     number
): Sala {
  const codigo = generarCodigo();

  const host: Jugador = {
    socketId:    hostSocketId,
    nombre:      nombreJugador,
    puntos:      0,
    correctas:   0,
    incorrectas: 0,
    respondio:   false,
    terminado:   false,
  };

 const sala: Sala = {
    codigo,
    nombre,
    hostSocketId,
    materia,
    grado,
    cantPreguntas,
    preguntas:      [],
    preguntaActual: 0,
    estado:         "esperando",
    jugadores:      new Map([[hostSocketId, host]]),
    timerHandle:    null,
    tiempoPorPregunta,
  };

  salas.set(codigo, sala);
  return sala;
}

/* ─── Unirse a sala ─── */
export function unirseASala(
  socketId: string,
  codigo: string,
  nombreJugador: string
): { sala: Sala | null; error?: string } {
  const sala = salas.get(codigo);
  if (!sala)              return { sala: null, error: "Sala no encontrada" };
  if (sala.estado !== "esperando") return { sala: null, error: "La partida ya inicio" };
  if (sala.jugadores.size >= 8)    return { sala: null, error: "Sala llena (max 8 jugadores)" };

  const jugador: Jugador = {
    socketId,
    nombre:      nombreJugador,
    puntos:      0,
    correctas:   0,
    incorrectas: 0,
    respondio:   false,
    terminado:   false,
  };
  sala.jugadores.set(socketId, jugador);
  return { sala };
}

/* ─── Obtener sala ─── */
export function getSala(codigo: string): Sala | undefined {
  return salas.get(codigo);
}

/* ─── Sala por socketId ─── */
export function getSalaPorSocket(socketId: string): Sala | undefined {
  for (const sala of salas.values()) {
    if (sala.jugadores.has(socketId)) return sala;
  }
}

/* ─── Eliminar jugador (desconexión) ─── */
export function eliminarJugador(socketId: string): { sala?: Sala; nombre?: string } {
  const sala = getSalaPorSocket(socketId);
  if (!sala) return {};
  const jugador = sala.jugadores.get(socketId);
  sala.jugadores.delete(socketId);

  // Si no quedan jugadores, eliminar la sala
  if (sala.jugadores.size === 0) {
    if (sala.timerHandle) clearTimeout(sala.timerHandle);
    salas.delete(sala.codigo);
  }

  return { sala, nombre: jugador?.nombre };
}

/* ─── Ranking público ─── */
export function getRanking(sala: Sala) {
  return [...sala.jugadores.values()]
    .sort((a, b) => b.puntos - a.puntos)
    .map(j => ({ nombre: j.nombre, puntos: j.puntos, correctas: j.correctas }));
}

/* ─── ¿Todos respondieron? ─── */
export function todosRespondieron(sala: Sala): boolean {
  for (const j of sala.jugadores.values()) {
    if (!j.respondio && !j.terminado) return false;
  }
  return true;
}

/* ─── Resetear respuestas para nueva pregunta ─── */
export function resetRespuestas(sala: Sala) {
  for (const j of sala.jugadores.values()) j.respondio = false;
}
