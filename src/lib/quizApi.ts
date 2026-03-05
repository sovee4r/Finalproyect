// ══════════════════════════════════════════════
//  quizApi.ts — Conexión al backend con Railway MySQL
//  Host:     turntable.proxy.rlwy.net
//  Port:     43192
//  Database: railway
// ══════════════════════════════════════════════

export interface Pregunta {
  id: number;
  pregunta: string;
  opcion_a: string;
  opcion_b: string;
  opcion_c: string;
  opcion_d: string;
  respuesta_correcta: "A" | "B" | "C" | "D";
}

// URL base del backend Express
// En desarrollo: http://localhost:3000
// En producción: reemplaza con tu URL de Render/Railway
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const quizApi = {
  /**
   * Obtiene preguntas filtradas por grado y materia
   * GET /api/preguntas?grado=4&materia=lengua&cantidad=20
   */
  async getPreguntas(
    grado: number,
    materia: string,
    cantidad: number = 20
  ): Promise<Pregunta[]> {
    const url = `${API_BASE}/api/preguntas?grado=${grado}&materia=${encodeURIComponent(materia)}&cantidad=${cantidad}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
};
