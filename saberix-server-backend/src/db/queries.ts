import { pool } from "./connection";

export interface Pregunta {
  id:                  number;
  pregunta:            string;
  opcion_a:            string;
  opcion_b:            string;
  opcion_c:            string;
  opcion_d:            string;
  respuesta_correcta:  "A" | "B" | "C" | "D";
}

export async function getPreguntas(
  grado: number,
  materia: string,
  cantidad = 20
): Promise<Pregunta[]> {
  const [rows] = await pool.execute(
    `SELECT id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta
     FROM preguntas
     WHERE grado = ? AND materia = ?
     ORDER BY RAND()
     LIMIT ${Number(cantidad)}`,
    [grado, materia]
  );
  return rows as Pregunta[];
}
/* ─── Guardar resultado de una partida ─── */
export async function saveResult(data: {
  sala_codigo: string;
  jugador:     string;
  materia:     string;
  grado:       number;
  correctas:   number;
  incorrectas: number;
  puntos:      number;
}) {
  await pool.execute(
    `INSERT INTO resultados
      (sala_codigo, jugador, materia, grado, correctas, incorrectas, puntos, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      data.sala_codigo,
      data.jugador,
      data.materia,
      data.grado,
      data.correctas,
      data.incorrectas,
      data.puntos,
    ]
  );
}

/* ─── Top 10 leaderboard ─── */
export async function getLeaderboard(materia?: string) {
  const where = materia ? "WHERE materia = ?" : "";
  const params = materia ? [materia] : [];
  const [rows] = await pool.execute(
    `SELECT jugador, materia, MAX(puntos) as puntos
     FROM resultados
     ${where}
     GROUP BY jugador, materia
     ORDER BY puntos DESC
     LIMIT 10`,
    params
  );
  return rows;
}
