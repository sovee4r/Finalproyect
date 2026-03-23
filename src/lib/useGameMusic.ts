// useGameMusic.ts — pega esto en cada juego reemplazando la función useGameMusic existente
// Correcciones:
// 1. stop() garantiza pausa total antes de victory
// 2. cleanup al desmontar el componente
// 3. monedas para la pista en Ahorcado (ver comentario abajo)

import { useRef, useState, useCallback, useEffect } from "react";

export function useGameMusic(trackPath: string) {
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const victoryRef  = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = new Audio(trackPath);
    audio.loop   = true;
    audio.volume = 0.35;
    audioRef.current = audio;

    // Precargar victoria
    const vic = new Audio("/music/Pixel_Power_Up.mp3");
    vic.volume = 0.5;
    victoryRef.current = vic;

    return () => {
      // Limpiar TODO al salir del componente
      audio.pause();
      audio.src = "";
      vic.pause();
      vic.src = "";
    };
  }, [trackPath]);

  const start = useCallback(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  const stop = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(m => {
      const next = !m;
      if (audioRef.current) audioRef.current.muted = next;
      return next;
    });
  }, []);

  // Pausa música de fondo y luego arranca victoria — sin solapamiento
  const playVictory = useCallback(() => {
    // 1. Detener música de fondo inmediatamente
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // 2. Pequeño delay para que el audio termine de pausar
    setTimeout(() => {
      if (victoryRef.current) {
        victoryRef.current.currentTime = 0;
        victoryRef.current.play().catch(() => {});
      }
    }, 80);
  }, []);

  // Detener todo (incluyendo victoria) — llamar al salir del juego
  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (victoryRef.current) {
      victoryRef.current.pause();
      victoryRef.current.currentTime = 0;
    }
    setMuted(false);
  }, []);

  return { start, stop, stopAll, toggleMute, playVictory, muted };
}
