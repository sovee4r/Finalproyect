import { Server, Socket } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents, PreguntaPublica } from "./types";
import * as rm from "./roomManager";
import { getPreguntas, saveResult } from "../db/queries";

type IO   = Server<ClientToServerEvents, ServerToClientEvents>;
type Sock = Socket<ClientToServerEvents, ServerToClientEvents>;

function toPublica(p: any): PreguntaPublica {
  const { respuesta_correcta, ...pub } = p;
  return pub;
}

function calcPuntos(correcto: boolean, tiempoRestante: number): number {
  if (!correcto) return 0;
  return Math.max(10, tiempoRestante * 10);
}

export function registerEvents(io: IO, socket: Sock) {

  socket.on("crear_sala", async (data) => {
    try {
      const sala = rm.crearSala(
        socket.id, data.nombre, data.nombreJugador,
        data.materia, data.grado, data.tiempoPorPregunta, data.cantPreguntas
      );
      (sala as any)._cantPreguntas = data.cantPreguntas;
      socket.join(sala.codigo);
      socket.emit("sala_creada", {
        codigo: sala.codigo, nombre: sala.nombre, materia: sala.materia, grado: sala.grado,
        jugadores: [...sala.jugadores.values()].map(j => ({
          nombre: j.nombre, puntos: j.puntos, correctas: j.correctas, incorrectas: j.incorrectas
        })),
        cantPreguntas: data.cantPreguntas, tiempoPorPregunta: sala.tiempoPorPregunta,
      });
      console.log(`🏠 Sala ${sala.codigo} creada por ${data.nombreJugador}`);
    } catch (err) {
      socket.emit("error_sala", { mensaje: "Error al crear sala" });
    }
  });

  socket.on("unirse_sala", ({ codigo, nombreJugador }) => {
    const { sala, error } = rm.unirseASala(socket.id, codigo, nombreJugador);
    if (!sala || error) { socket.emit("error_sala", { mensaje: error ?? "Error desconocido" }); return; }
    socket.join(codigo);
    socket.emit("sala_unido", {
      codigo: sala.codigo, nombre: sala.nombre, materia: sala.materia, grado: sala.grado,
      jugadores: [...sala.jugadores.values()].map(j => ({
        nombre: j.nombre, puntos: j.puntos, correctas: j.correctas, incorrectas: j.incorrectas
      })),
      cantPreguntas: (sala as any)._cantPreguntas ?? 8, tiempoPorPregunta: sala.tiempoPorPregunta,
    });
    socket.to(codigo).emit("jugador_unio", {
      jugador: { nombre: nombreJugador, puntos: 0, correctas: 0, incorrectas: 0 }
    });
    console.log(`👤 ${nombreJugador} se unio a sala ${codigo}`);
  });

  socket.on("iniciar_juego", async ({ codigo }) => {
    const sala = rm.getSala(codigo);
    if (!sala) { socket.emit("error_sala", { mensaje: "Sala no encontrada" }); return; }
    if (sala.hostSocketId !== socket.id) { socket.emit("error_sala", { mensaje: "Solo el host puede iniciar" }); return; }
    if (sala.estado !== "esperando") return;

    try {
      const cantSolicitadas = (sala as any)._cantPreguntas ?? 8;
      const cant = Math.max(1, cantSolicitadas);
      const qs = await getPreguntas(sala.grado, sala.materia, cant);

      // ✅ FIX TypeScript: cast a any para evitar error de tipo con placeholder
      if (qs.length > 0) {
        sala.preguntas = qs;
      } else {
        (sala as any).preguntas = [{
          id: 0, pregunta: "placeholder",
          opcion_a: "a", opcion_b: "b", opcion_c: "c", opcion_d: "d",
          respuesta_correcta: "A",
        }];
      }

      sala.preguntaActual = 0;
      sala.estado = "jugando";

      for (const j of sala.jugadores.values()) {
        j.puntos = 0; j.correctas = 0; j.incorrectas = 0;
        j.respondio = false; j.terminado = false;
      }

      const publicQs = sala.preguntas.map(toPublica);
      io.to(codigo).emit("juego_iniciado", {
        preguntas: publicQs, tiempoPorPregunta: sala.tiempoPorPregunta,
      });

      console.log(`▶️  Sala ${codigo} iniciada (${sala.preguntas.length} preguntas, ${sala.tiempoPorPregunta}s)`);

      // ✅ FIX: no lanzar timer para minijuegos (tiempoPorPregunta:9999)
      if (sala.tiempoPorPregunta > 0 && sala.tiempoPorPregunta < 9999) {
        iniciarTimerPregunta(io, sala);
      }
    } catch (err) {
      console.error("Error al iniciar juego:", err);
      socket.emit("error_sala", { mensaje: "Error al cargar preguntas" });
    }
  });

  socket.on("responder", ({ codigo, respuesta, tiempoRestante }) => {
    const sala    = rm.getSala(codigo);
    const jugador = sala?.jugadores.get(socket.id);
    if (!sala || !jugador || jugador.respondio || sala.estado !== "jugando") return;

    jugador.respondio = true;
    const pregActual  = sala.preguntas[sala.preguntaActual];
    const correcto    = respuesta === pregActual.respuesta_correcta;
    const pts         = calcPuntos(correcto, tiempoRestante);

    if (correcto) { jugador.puntos += pts; jugador.correctas += 1; }
    else          { jugador.incorrectas += 1; }

    socket.emit("resultado_respuesta", {
      correcto, respuestaCorrecta: pregActual.respuesta_correcta,
      puntosGanados: pts, tusPuntos: jugador.puntos,
    });
    io.to(codigo).emit("ranking_parcial", { ranking: rm.getRanking(sala) });

    if (rm.todosRespondieron(sala)) {
      if (sala.timerHandle) clearTimeout(sala.timerHandle);
      setTimeout(() => avanzarPregunta(io, sala), 1800);
    }
  });

  socket.on("salir_sala",  () => handleDisconnect(io, socket));
  socket.on("disconnect",  () => handleDisconnect(io, socket));
}

function iniciarTimerPregunta(io: IO, sala: rm.Sala) {
  if (sala.timerHandle) clearTimeout(sala.timerHandle);
  if (sala.tiempoPorPregunta <= 0 || sala.tiempoPorPregunta >= 9999) return;

  sala.timerHandle = setTimeout(() => {
    io.to(sala.codigo).emit("tiempo_agotado", { preguntaIdx: sala.preguntaActual });
    for (const j of sala.jugadores.values()) {
      if (!j.respondio) { j.incorrectas += 1; j.respondio = true; }
    }
    io.to(sala.codigo).emit("ranking_parcial", { ranking: rm.getRanking(sala) });
    setTimeout(() => avanzarPregunta(io, sala), 1800);
  }, sala.tiempoPorPregunta * 1000);
}

function avanzarPregunta(io: IO, sala: rm.Sala) {
  if (sala.estado !== "jugando") return;
  rm.resetRespuestas(sala);
  sala.preguntaActual += 1;

  if (sala.preguntaActual >= sala.preguntas.length) {
    finalizarJuego(io, sala);
    return;
  }

  io.to(sala.codigo).emit("nueva_pregunta", {
    idx:            sala.preguntaActual,
    pregunta:       toPublica(sala.preguntas[sala.preguntaActual]),
    tiempoRestante: sala.tiempoPorPregunta,
  });
  iniciarTimerPregunta(io, sala);
}

async function finalizarJuego(io: IO, sala: rm.Sala) {
  sala.estado = "finalizada";
  if (sala.timerHandle) clearTimeout(sala.timerHandle);

  const ranking = rm.getRanking(sala);
  io.to(sala.codigo).emit("juego_terminado", { ranking });

  for (const j of sala.jugadores.values()) {
    if (j.correctas === 0 && j.incorrectas === 0 && j.puntos === 0) continue;
    try {
      await saveResult({
        sala_codigo: sala.codigo, jugador: j.nombre,
        materia: sala.materia, grado: sala.grado,
        correctas: j.correctas, incorrectas: j.incorrectas, puntos: j.puntos,
      });
    } catch (e) { console.error("Error guardando resultado:", e); }
  }
  console.log(`🏁 Sala ${sala.codigo} finalizada. Ganador: ${ranking[0]?.nombre}`);
}

function handleDisconnect(io: IO, socket: Socket) {
  const { sala, nombre } = rm.eliminarJugador(socket.id);
  if (!sala || !nombre) return;
  socket.to(sala.codigo).emit("jugador_salio", { nombre });
  console.log(`👋 ${nombre} salio de sala ${sala.codigo}`);
  if (sala.estado === "jugando" && sala.jugadores.size < 2) finalizarJuego(io, sala);
}
