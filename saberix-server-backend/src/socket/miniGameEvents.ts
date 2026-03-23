// ══════════════════════════════════════════════════
//  AGREGAR AL FINAL DE gameEvents.ts
//  Eventos de socket para los minijuegos
// ══════════════════════════════════════════════════

// Estructura en memoria para salas de minijuegos
const salasJuego = new Map<string, {
  codigo:     string;
  nombre:     string;
  juego:      string;
  grado:      number;
  hostNombre: string;
  jugadores:  Map<string, { nombre: string; puntos: number; listo: boolean; socketId: string }>;
  estado:     "esperando" | "jugando" | "terminada";
}>();

function generarCodigoJuego(): string {
  let code: string;
  do { code = String(Math.floor(100000 + Math.random() * 900000)); }
  while (salasJuego.has(code));
  return code;
}

export function registerMiniGameEvents(io: any, socket: any) {

  // ── CREAR SALA ──
  socket.on("crear_sala_juego", ({ nombre, nombreJugador, juego, grado }: any) => {
    const codigo = generarCodigoJuego();
    const sala = {
      codigo, nombre, juego, grado,
      hostNombre: nombreJugador,
      jugadores: new Map([[socket.id, { nombre: nombreJugador, puntos: 0, listo: false, socketId: socket.id }]]),
      estado: "esperando" as const,
    };
    salasJuego.set(codigo, sala);
    socket.join(codigo);

    const salaInfo = {
      codigo, nombre, juego, grado,
      hostNombre: nombreJugador,
      jugadores: [...sala.jugadores.values()].map(j => ({ nombre: j.nombre, puntos: j.puntos, listo: j.listo })),
    };
    socket.emit("sala_juego_creada", salaInfo);
    console.log(`🎮 Sala juego ${codigo} creada (${juego}) por ${nombreJugador}`);
  });

  // ── UNIRSE ──
  socket.on("unirse_sala_juego", ({ codigo, nombreJugador }: any) => {
    const sala = salasJuego.get(codigo);
    if (!sala) { socket.emit("error_sala_juego", { mensaje: "Sala no encontrada" }); return; }
    if (sala.estado !== "esperando") { socket.emit("error_sala_juego", { mensaje: "El juego ya inició" }); return; }
    if (sala.jugadores.size >= 8) { socket.emit("error_sala_juego", { mensaje: "Sala llena (máx 8)" }); return; }

    sala.jugadores.set(socket.id, { nombre: nombreJugador, puntos: 0, listo: false, socketId: socket.id });
    socket.join(codigo);

    const salaInfo = {
      codigo, nombre: sala.nombre, juego: sala.juego, grado: sala.grado,
      hostNombre: sala.hostNombre,
      jugadores: [...sala.jugadores.values()].map(j => ({ nombre: j.nombre, puntos: j.puntos, listo: j.listo })),
    };
    socket.emit("sala_juego_unido", salaInfo);
    socket.to(codigo).emit("jugador_juego_unio", { nombre: nombreJugador, puntos: 0, listo: false });
    console.log(`👤 ${nombreJugador} se unió a sala juego ${codigo}`);
  });

  // ── INICIAR ──
  socket.on("iniciar_minijuego", ({ codigo }: any) => {
    const sala = salasJuego.get(codigo);
    if (!sala) return;
    sala.estado = "jugando";
    io.to(codigo).emit("juego_minijuego_iniciado");
    console.log(`▶️ Minijuego iniciado en sala ${codigo}`);
  });

  // ── ACTUALIZAR PUNTOS ──
  socket.on("actualizar_puntos_juego", ({ codigo, puntos }: any) => {
    const sala = salasJuego.get(codigo);
    if (!sala) return;
    const j = sala.jugadores.get(socket.id);
    if (j) j.puntos = puntos;
    io.to(codigo).emit("sync_puntos_juego", {
      jugadores: [...sala.jugadores.values()].map(j => ({ nombre: j.nombre, puntos: j.puntos, listo: j.listo })),
    });
  });

  // ── TERMINAR ──
  socket.on("terminar_minijuego", ({ codigo, puntos }: any) => {
    const sala = salasJuego.get(codigo);
    if (!sala) return;
    const j = sala.jugadores.get(socket.id);
    if (j) { j.puntos = puntos; j.listo = true; }

    const todosListos = [...sala.jugadores.values()].every(j => j.listo);
    if (todosListos) {
      sala.estado = "terminada";
      const ranking = [...sala.jugadores.values()]
        .sort((a, b) => b.puntos - a.puntos)
        .map(j => ({ nombre: j.nombre, puntos: j.puntos, listo: j.listo }));
      io.to(codigo).emit("juego_minijuego_terminado", { ranking });
      console.log(`🏁 Minijuego terminado en sala ${codigo}`);
    }
  });

  // ── SALIR ──
  socket.on("salir_sala_juego", () => {
    for (const [codigo, sala] of salasJuego.entries()) {
      if (sala.jugadores.has(socket.id)) {
        const j = sala.jugadores.get(socket.id)!;
        sala.jugadores.delete(socket.id);
        socket.to(codigo).emit("jugador_juego_salio", { nombre: j.nombre });
        if (sala.jugadores.size === 0) salasJuego.delete(codigo);
        break;
      }
    }
  });
}
