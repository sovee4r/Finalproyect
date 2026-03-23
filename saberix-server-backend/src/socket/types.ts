import { Pregunta } from "../db/queries";

/* ─── Estado de un jugador dentro de una sala ─── */
export interface Jugador {
  socketId:   string;
  nombre:     string;
  puntos:     number;
  correctas:  number;
  incorrectas: number;
  respondio:  boolean;   // si ya contestó la pregunta actual
  terminado:  boolean;   // si ya acabó el juego (timeout o todas respondidas)
}

/* ─── Estado completo de una sala ─── */
export interface Sala {
  codigo:        string;
  nombre:        string;
  hostSocketId:  string;
  materia:       string;
  grado:         number;
  preguntas:     Pregunta[];
  preguntaActual: number;
  estado:        "esperando" | "jugando" | "finalizada";
  jugadores:     Map<string, Jugador>;
  cantPreguntas:     number;
  timerHandle:   ReturnType<typeof setTimeout> | null;
  tiempoPorPregunta: number;
}

/* ──────────────────────────────────────────
   EVENTOS  cliente → servidor
────────────────────────────────────────── */
export interface ClientToServerEvents {
  crear_sala:    (data: CrearSalaData)   => void;
  unirse_sala:   (data: UnirseSalaData)  => void;
  iniciar_juego: (data: IniciarJuegoData) => void;
  responder:     (data: ResponderData)   => void;
  salir_sala:    () => void;
}

/* ──────────────────────────────────────────
   EVENTOS  servidor → cliente
────────────────────────────────────────── */
export interface ServerToClientEvents {
  sala_creada:       (data: SalaInfo)              => void;
  sala_unido:        (data: SalaInfo)              => void;
  jugador_unio:      (data: { jugador: JugadorPublico }) => void;
  jugador_salio:     (data: { nombre: string })    => void;
  juego_iniciado:    (data: JuegoIniciado)         => void;
  nueva_pregunta:    (data: NuevaPregunta)         => void;
  resultado_respuesta: (data: ResultadoRespuesta)  => void;
  ranking_parcial:   (data: { ranking: RankingItem[] }) => void;
  juego_terminado:   (data: JuegoTerminado)        => void;
  error_sala:        (data: { mensaje: string })   => void;
  tiempo_agotado:    (data: { preguntaIdx: number }) => void;
}

/* ─── Payloads de eventos del cliente ─── */
export interface CrearSalaData {
  nombre:       string;
  nombreJugador: string;
  materia:      string;
  grado:        number;
  tiempoPorPregunta: number;
  cantPreguntas:     number;
}
export interface UnirseSalaData  { codigo: string; nombreJugador: string }
export interface IniciarJuegoData { codigo: string }
export interface ResponderData   { codigo: string; respuesta: "A"|"B"|"C"|"D"; tiempoRestante: number }

/* ─── Payloads de eventos del servidor ─── */
export interface JugadorPublico {
  nombre:     string;
  puntos:     number;
  correctas:  number;
  incorrectas: number;
}

export interface SalaInfo {
  codigo:       string;
  nombre:       string;
  materia:      string;
  grado:        number;
  jugadores:    JugadorPublico[];
  cantPreguntas: number;
  tiempoPorPregunta: number;
}

export interface JuegoIniciado {
  preguntas:    PreguntaPublica[];  // sin respuesta_correcta para el cliente
  tiempoPorPregunta: number;
}

export interface PreguntaPublica {
  id:       number;
  pregunta: string;
  opcion_a: string;
  opcion_b: string;
  opcion_c: string;
  opcion_d: string;
  // respuesta_correcta se omite intencionalmente
}

export interface NuevaPregunta {
  idx:       number;
  pregunta:  PreguntaPublica;
  tiempoRestante: number;
}

export interface ResultadoRespuesta {
  correcto:          boolean;
  respuestaCorrecta: "A"|"B"|"C"|"D";
  puntosGanados:     number;
  tusPuntos:         number;
}

export interface RankingItem {
  nombre:   string;
  puntos:   number;
  correctas: number;
}

export interface JuegoTerminado {
  ranking: RankingItem[];
}
