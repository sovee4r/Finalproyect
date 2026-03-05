// src/lib/useSocket.ts
import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";

/* ─── Tipos públicos ─── */
export interface JugadorPublico {
  nombre:      string;
  puntos:      number;
  correctas:   number;
  incorrectas: number;
}

export interface SalaInfo {
  codigo:            string;
  nombre:            string;
  materia:           string;
  grado:             number;
  jugadores:         JugadorPublico[];
  cantPreguntas:     number;
  tiempoPorPregunta: number;
}

export interface PreguntaPublica {
  id:       number;
  pregunta: string;
  opcion_a: string;
  opcion_b: string;
  opcion_c: string;
  opcion_d: string;
}

export interface ResultadoRespuesta {
  correcto:          boolean;
  respuestaCorrecta: "A"|"B"|"C"|"D";
  puntosGanados:     number;
  tusPuntos:         number;
}

export interface RankingItem {
  nombre:    string;
  puntos:    number;
  correctas: number;
}

export type EstadoMulti =
  | "desconectado"
  | "conectando"
  | "lobby"
  | "jugando"
  | "resultados"
  | "error";

export interface MultiState {
  estado:        EstadoMulti;
  sala:          SalaInfo | null;
  preguntas:     PreguntaPublica[];
  preguntaIdx:   number;
  resultado:     ResultadoRespuesta | null;
  ranking:       RankingItem[];
  rankingFinal:  RankingItem[];
  errorMsg:      string;
  tiempoAgotado: boolean;
}

const SERVIDOR = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:3001";

/* ── Socket GLOBAL — persiste fuera del ciclo de React ── */
let globalSocket: Socket | null = null;

/* ══════════════════════════════════════════════════
   HOOK PRINCIPAL
══════════════════════════════════════════════════ */
export function useSocket() {
  const pendingRef  = useRef<(() => void) | null>(null);
  const setStateRef = useRef<React.Dispatch<React.SetStateAction<MultiState>> | null>(null);

  const [state, setState] = useState<MultiState>({
    estado:        "desconectado",
    sala:          null,
    preguntas:     [],
    preguntaIdx:   0,
    resultado:     null,
    ranking:       [],
    rankingFinal:  [],
    errorMsg:      "",
    tiempoAgotado: false,
  });

  // Guardar setState en ref para usarlo desde listeners globales
  useEffect(() => { setStateRef.current = setState; }, []);

  /* ─── Inicializar socket global al montar ─── */
  useEffect(() => {
    if (!globalSocket) {
      console.log("🔌 Creando socket global...");
      globalSocket = io(SERVIDOR, {
        transports:           ["websocket", "polling"],
        reconnectionAttempts: 10,
        reconnectionDelay:    1000,
        timeout:              10000,
        autoConnect:          true,
      });
    }

    const s = globalSocket;

    // Registrar todos los listeners apuntando al setState actual
    s.off("connect");
    s.off("disconnect");
    s.off("connect_error");
    s.off("sala_creada");
    s.off("sala_unido");
    s.off("jugador_unio");
    s.off("jugador_salio");
    s.off("juego_iniciado");
    s.off("nueva_pregunta");
    s.off("resultado_respuesta");
    s.off("ranking_parcial");
    s.off("tiempo_agotado");
    s.off("juego_terminado");
    s.off("error_sala");

    s.on("connect", () => {
      console.log("✅ Socket conectado:", s.id);
      if (pendingRef.current) {
        console.log("📤 Ejecutando acción pendiente...");
        pendingRef.current();
        pendingRef.current = null;
      }
    });

    s.on("disconnect", () => {
      console.log("❌ Socket desconectado");
    });

    s.on("connect_error", (err) => {
      console.error("❌ Error de conexión:", err.message);
      setStateRef.current?.(prev => ({
        ...prev,
        estado:   "error",
        errorMsg: "No se pudo conectar al servidor. ¿Está corriendo?",
      }));
    });

    s.on("sala_creada", (data) => {
      console.log("🏠 sala_creada:", data.codigo);
      setStateRef.current?.(prev => ({ ...prev, estado: "lobby", sala: data, errorMsg: "" }));
    });

    s.on("sala_unido", (data) => {
      console.log("🏠 sala_unido:", data.codigo);
      setStateRef.current?.(prev => ({ ...prev, estado: "lobby", sala: data, errorMsg: "" }));
    });

    s.on("jugador_unio", ({ jugador }) => {
      setStateRef.current?.(prev => {
        if (!prev.sala) return prev;
        return { ...prev, sala: { ...prev.sala, jugadores: [...prev.sala.jugadores, jugador] } };
      });
    });

    s.on("jugador_salio", ({ nombre }) => {
      setStateRef.current?.(prev => {
        if (!prev.sala) return prev;
        return { ...prev, sala: { ...prev.sala, jugadores: prev.sala.jugadores.filter(j => j.nombre !== nombre) } };
      });
    });

    s.on("juego_iniciado", ({ preguntas, tiempoPorPregunta }) => {
      console.log("▶️ juego_iniciado, preguntas:", preguntas.length);
      setStateRef.current?.(prev => ({
        ...prev,
        estado:        "jugando",
        preguntas,
        preguntaIdx:   0,
        resultado:     null,
        ranking:       [],
        tiempoAgotado: false,
        sala:          prev.sala ? { ...prev.sala, tiempoPorPregunta } : prev.sala,
      }));
    });

    s.on("nueva_pregunta", ({ idx }) => {
      setStateRef.current?.(prev => ({ ...prev, preguntaIdx: idx, resultado: null, tiempoAgotado: false }));
    });

    s.on("resultado_respuesta", (res) => {
      setStateRef.current?.(prev => ({ ...prev, resultado: res }));
    });

    s.on("ranking_parcial", ({ ranking }) => {
      setStateRef.current?.(prev => ({ ...prev, ranking }));
    });

    s.on("tiempo_agotado", () => {
      setStateRef.current?.(prev => ({ ...prev, tiempoAgotado: true }));
    });

    s.on("juego_terminado", ({ ranking }) => {
      setStateRef.current?.(prev => ({ ...prev, estado: "resultados", rankingFinal: ranking }));
    });

    s.on("error_sala", ({ mensaje }) => {
      console.error("❌ error_sala:", mensaje);
      setStateRef.current?.(prev => ({ ...prev, estado: "error", errorMsg: mensaje }));
    });

    // NO desconectar al desmontar
  }, []);

  /* ─── Emitir cuando esté conectado ─── */
  function emitWhenReady(action: () => void) {
    if (globalSocket?.connected) {
      action();
    } else {
      console.warn("⚠️ Socket no conectado, guardando acción pendiente...");
      pendingRef.current = action;
      if (!globalSocket?.active) globalSocket?.connect();
      setTimeout(() => {
        if (pendingRef.current) {
          pendingRef.current = null;
          setStateRef.current?.(prev => ({
            ...prev,
            estado:   "error",
            errorMsg: "No se pudo conectar al servidor.",
          }));
        }
      }, 8000);
    }
  }

  /* ─── ACCIONES ─── */

  const crearSala = useCallback((data: {
    nombre: string; nombreJugador: string; materia: string;
    grado: number; tiempoPorPregunta: number; cantPreguntas: number;
  }) => {
    console.log("📤 crearSala — connected:", globalSocket?.connected, "id:", globalSocket?.id);
    emitWhenReady(() => globalSocket?.emit("crear_sala", data));
  }, []);

  const unirseASala = useCallback((codigo: string, nombreJugador: string) => {
    console.log("📤 unirseASala — connected:", globalSocket?.connected);
    emitWhenReady(() => globalSocket?.emit("unirse_sala", { codigo, nombreJugador }));
  }, []);

  const iniciarJuego = useCallback((codigo: string) => {
    console.log("📤 iniciarJuego — connected:", globalSocket?.connected, "id:", globalSocket?.id, "codigo:", codigo);
    emitWhenReady(() => globalSocket?.emit("iniciar_juego", { codigo }));
  }, []);

  const responder = useCallback((codigo: string, respuesta: "A"|"B"|"C"|"D", tiempoRestante: number) => {
    globalSocket?.emit("responder", { codigo, respuesta, tiempoRestante });
  }, []);

  const salirSala = useCallback(() => {
    globalSocket?.emit("salir_sala");
    pendingRef.current = null;
    setState(prev => ({
      ...prev,
      estado:       "desconectado",
      sala:         null,
      preguntas:    [],
      preguntaIdx:  0,
      resultado:    null,
      ranking:      [],
      rankingFinal: [],
      errorMsg:     "",
    }));
  }, []);

  const resetError = useCallback(() => {
    pendingRef.current = null;
    setState(prev => ({ ...prev, estado: "desconectado", errorMsg: "" }));
  }, []);

  return {
    state,
    socketId: globalSocket?.id,
    crearSala,
    unirseASala,
    iniciarJuego,
    responder,
    salirSala,
    resetError,
  };
}
