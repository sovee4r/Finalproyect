import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../app/AuthContext";

const API = "https://finalproyect-da83.onrender.com";

export function useMonedas() {
  const { user } = useAuth();
  const [monedas, setMonedas] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API}/api/experiencia/${user.id}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setMonedas(d.monedas ?? 0); })
      .catch(() => {});
  }, [user?.id]);

  const actualizarMonedas = useCallback(async (delta: number) => {
    if (!user?.id) return;
    try {
      await fetch(`${API}/api/monedas/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });
    } catch (_) {}
  }, [user?.id]);

  const agregarMonedas = useCallback((cantidad: number) => {
    if (cantidad <= 0) return;
    setMonedas(m => m + cantidad);
    actualizarMonedas(cantidad);
  }, [actualizarMonedas]);

  const gastarMonedas = useCallback((cantidad: number): boolean => {
    if (monedas < cantidad) return false;
    setMonedas(m => m - cantidad);
    actualizarMonedas(-cantidad);
    return true;
  }, [monedas, actualizarMonedas]);

  return { monedas, agregarMonedas, gastarMonedas };
}
