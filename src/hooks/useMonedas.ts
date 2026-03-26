import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../app/AuthContext";

const API = "https://finalproyect-production-3837.up.railway.app";

export function useMonedas() {
  const { user } = useAuth();
  const [monedas, setMonedas] = useState(0);

  // Cargar saldo real al montar
  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API}/api/experiencia/${user.id}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setMonedas(d.monedas ?? 0); })
      .catch(() => {});
  }, [user?.id]);

  // Escuchar evento global para refrescar (cuando Layout actualiza)
  useEffect(() => {
    const handler = () => {
      if (!user?.id) return;
      fetch(`${API}/api/experiencia/${user.id}`)
        .then(r => r.json())
        .then(d => { if (d.ok) setMonedas(d.monedas ?? 0); })
        .catch(() => {});
    };
    window.addEventListener("saberix:monedas-updated", handler);
    return () => window.removeEventListener("saberix:monedas-updated", handler);
  }, [user?.id]);

  // Llama al backend para sumar o restar monedas
  // El backend espera: POST /api/monedas/:userId  con { cantidad: number }
  const actualizarMonedas = useCallback(async (cantidad: number) => {
    if (!user?.id || cantidad === 0) return;
    try {
      await fetch(`${API}/api/monedas/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cantidad }),
      });
      // Avisar al Layout para que refresque el contador del header
      window.dispatchEvent(new CustomEvent("saberix:monedas-updated"));
    } catch (_) {}
  }, [user?.id]);

  /** Suma monedas al terminar un juego */
  const agregarMonedas = useCallback((cantidad: number) => {
    if (cantidad <= 0) return;
    setMonedas(m => m + cantidad);
    actualizarMonedas(cantidad);
  }, [actualizarMonedas]);

  /** Gasta monedas (pista). Devuelve true si había saldo, false si no. */
  const gastarMonedas = useCallback((cantidad: number): boolean => {
    if (monedas < cantidad) return false;
    setMonedas(m => m - cantidad);
    actualizarMonedas(-cantidad);
    return true;
  }, [monedas, actualizarMonedas]);

  return { monedas, agregarMonedas, gastarMonedas };
}

