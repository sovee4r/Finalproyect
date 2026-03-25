import { Router, Request, Response } from "express";
import { getPreguntas, getLeaderboard } from "../db/queries";
import { pool } from "../db/connection";
import crypto from "crypto";

export const apiRouter = Router();

function hashPassword(pass: string): string {
  return crypto.createHash("sha256").update(pass + "saberix_salt").digest("hex");
}

/* GET /api/preguntas */
apiRouter.get("/preguntas", async (req: Request, res: Response) => {
  try {
    const grado    = Number(req.query.grado    ?? 4);
    const materia  = String(req.query.materia  ?? "lengua");
    const cantidad = Number(req.query.cantidad ?? 20);
    const preguntas = await getPreguntas(grado, materia, cantidad);
    res.json(preguntas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener preguntas" });
  }
});

/* GET /api/leaderboard */
apiRouter.get("/leaderboard", async (req: Request, res: Response) => {
  try {
    const materia = req.query.materia ? String(req.query.materia) : undefined;
    const data    = await getLeaderboard(materia);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener leaderboard" });
  }
});

/* GET /api/leaderboard-global */
apiRouter.get("/leaderboard-global", async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.execute(
      `SELECT u.nombre, u.foto,
       u.monedas as score,
       COUNT(r.id) as partidas,
       COALESCE(SUM(r.correctas), 0) as correctas
       FROM usuarios u
       LEFT JOIN resultados_juegos r ON r.user_id = u.id
       GROUP BY u.id, u.nombre, u.foto, u.monedas
       ORDER BY score DESC
       LIMIT 10`
    );
    res.json({ ok: true, jugadores: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

/* GET /api/health */
apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

/* GET /api/stats/usuarios */
apiRouter.get("/stats/usuarios", async (_req, res) => {
  try {
    const [rows]: any = await pool.execute("SELECT COUNT(*) as total FROM usuarios");
    res.json({ total: Number((rows as any[])[0].total) });
  } catch { res.status(500).json({ total: 0 }); }
});

/* GET /api/stats/partidas */
apiRouter.get("/stats/partidas", async (_req, res) => {
  try {
    const [rows]: any = await pool.execute(
      "SELECT COUNT(*) as total, COUNT(DISTINCT user_id) as ganadores FROM resultados_juegos"
    );
    res.json({
      total:     Number((rows as any[])[0].total),
      ganadores: Number((rows as any[])[0].ganadores),
    });
  } catch { res.status(500).json({ total: 0, ganadores: 0 }); }
});

/* GET /api/stats/preguntas */
apiRouter.get("/stats/preguntas", async (_req, res) => {
  try {
    const [rows]: any = await pool.execute("SELECT COUNT(*) as total FROM preguntas");
    res.json({ total: Number((rows as any[])[0].total) });
  } catch { res.status(500).json({ total: 0 }); }
});

/* POST /api/resultados_juegos */
apiRouter.post("/resultados_juegos", async (req: Request, res: Response) => {
  try {
    const { jugador, juego, materia, grado, puntos, correctas, incorrectas, tiempo_seg, modo, user_id } = req.body;
    await pool.execute(
      `INSERT INTO resultados_juegos (jugador, juego, materia, grado, puntos, correctas, incorrectas, tiempo_seg, modo, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [jugador || "Anonimo", juego || "desconocido", materia || "general", grado || 4, puntos || 0, correctas || 0, incorrectas || 0, tiempo_seg || 0, modo || "solo", user_id || null]
    );
    if (user_id) {
      const total = (correctas || 0) + (incorrectas || 0);
      const monedasGanadas = total > 0
        ? Math.max(50, Math.round((correctas / total) * 250))
        : 50;
      await pool.execute(
        "UPDATE usuarios SET monedas = monedas + ? WHERE id = ?",
        [monedasGanadas, user_id]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

/* ════════════════════════════════════════
   AUTH
════════════════════════════════════════ */

apiRouter.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password)
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    const [existing]: any = await pool.execute(
      "SELECT id FROM usuarios WHERE email = ?", [email]
    );
    if ((existing as any[]).length > 0)
      return res.status(409).json({ error: "El correo ya esta registrado" });
    const hashed = hashPassword(password);
    const [result]: any = await pool.execute(
      "INSERT INTO usuarios (nombre, email, password_hash, created_at) VALUES (?, ?, ?, NOW())",
      [nombre, email, hashed]
    );
    const user = { id: (result as any).insertId, nombre, email, foto: null, bio: null, pais: null };
    return res.status(201).json({ ok: true, user });
  } catch (err) {
    console.error("Error register:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

apiRouter.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email y contrasena requeridos" });
    const hashed = hashPassword(password);
    const [rows]: any = await pool.execute(
      "SELECT id, nombre, email, foto, bio, pais FROM usuarios WHERE email = ? AND password_hash = ?",
      [email, hashed]
    );
    if ((rows as any[]).length === 0)
      return res.status(401).json({ error: "Credenciales incorrectas" });
    const user = (rows as any[])[0];
    // Marcar como online al hacer login
    await pool.execute(
      "UPDATE usuarios SET online = 1, last_seen = NOW() WHERE id = ?",
      [user.id]
    );
    return res.json({ ok: true, user });
  } catch (err) {
    console.error("Error login:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

apiRouter.post("/auth/logout", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ ok: false });
    await pool.execute(
      "UPDATE usuarios SET online = 0, last_seen = NOW() WHERE id = ?",
      [userId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});

/* Heartbeat — el frontend llama esto cada 30s para mantenerse online */
apiRouter.post("/auth/heartbeat", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ ok: false });
    await pool.execute(
      "UPDATE usuarios SET online = 1, last_seen = NOW() WHERE id = ?",
      [userId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});

/* GET /api/online/:userId — consultar si un usuario está online */
apiRouter.get("/online/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const [rows]: any = await pool.execute(
      "SELECT online, last_seen FROM usuarios WHERE id = ?",
      [userId]
    );
    if ((rows as any[]).length === 0) return res.json({ ok: false });
    const u = (rows as any[])[0];
    // Si last_seen fue hace más de 2 minutos, considerarlo offline aunque diga online
    const lastSeen  = u.last_seen ? new Date(u.last_seen).getTime() : 0;
    const diffMin   = (Date.now() - lastSeen) / 1000 / 60;
    const isOnline  = u.online === 1 && diffMin < 2;
    res.json({ ok: true, online: isOnline, last_seen: u.last_seen });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});

/* GET /api/online-bulk — consultar varios usuarios a la vez */
apiRouter.post("/online-bulk", async (req: Request, res: Response) => {
  try {
    const { userIds } = req.body as { userIds: number[] };
    if (!userIds?.length) return res.json({ ok: true, estados: {} });
    const placeholders = userIds.map(() => "?").join(",");
    const [rows]: any = await pool.execute(
      `SELECT id, online, last_seen FROM usuarios WHERE id IN (${placeholders})`,
      userIds
    );
    const estados: Record<number, boolean> = {};
    for (const u of rows as any[]) {
      const lastSeen = u.last_seen ? new Date(u.last_seen).getTime() : 0;
      const diffMin  = (Date.now() - lastSeen) / 1000 / 60;
      estados[u.id]  = u.online === 1 && diffMin < 2;
    }
    res.json({ ok: true, estados });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});

apiRouter.get("/auth/google", (req: Request, res: Response) => {
  const clientId    = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3001/api/auth/google/callback";
  if (!clientId)
    return res.status(500).send("GOOGLE_CLIENT_ID no configurado en .env");
  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: "code",
    scope:         "openid email profile",
    prompt:        "select_account",
  });
  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

apiRouter.get("/auth/google/callback", async (req: Request, res: Response) => {
  const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
  const { code, error } = req.query;
  if (error || !code)
    return res.redirect(`${clientOrigin}/auth/google/callback?error=google_failed`);
  try {
    const clientId     = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri  = process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3001/api/auth/google/callback";
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code), client_id: clientId, client_secret: clientSecret,
        redirect_uri: redirectUri, grant_type: "authorization_code",
      }),
    });
    const tokenData: any = await tokenRes.json();
    if (!tokenData.access_token)
      return res.redirect(`${clientOrigin}/auth/google/callback?error=token_failed`);
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser: any = await userRes.json();
    const [existing]: any = await pool.execute(
      "SELECT id, nombre, email, foto, bio, pais FROM usuarios WHERE email = ?",
      [googleUser.email]
    );
    let user: any;
    if ((existing as any[]).length > 0) {
      user = (existing as any[])[0];
      await pool.execute(
        "UPDATE usuarios SET foto = ?, online = 1, last_seen = NOW() WHERE id = ?",
        [googleUser.picture ?? null, user.id]
      );
      user.foto = googleUser.picture ?? null;
    } else {
      const [result]: any = await pool.execute(
        "INSERT INTO usuarios (nombre, email, foto, password_hash, online, last_seen, created_at) VALUES (?, ?, ?, ?, 1, NOW(), NOW())",
        [googleUser.name, googleUser.email, googleUser.picture ?? null, "google_oauth"]
      );
      user = { id: (result as any).insertId, nombre: googleUser.name, email: googleUser.email, foto: googleUser.picture ?? null, bio: null, pais: null };
    }
    const encoded = encodeURIComponent(JSON.stringify(user));
    return res.redirect(`${clientOrigin}/auth/google/callback?user=${encoded}`);
  } catch (err) {
    console.error("Error Google callback:", err);
    return res.redirect(`${clientOrigin}/auth/google/callback?error=server_error`);
  }
});

apiRouter.put("/auth/profile", async (req: Request, res: Response) => {
  try {
    const { id, nombre, bio, foto, pais } = req.body;
    if (!id) return res.status(400).json({ error: "ID requerido" });
    await pool.execute(
      "UPDATE usuarios SET nombre = ?, bio = ?, foto = ?, pais = ? WHERE id = ?",
      [nombre, bio ?? null, foto ?? null, pais ?? null, id]
    );
    const [rows]: any = await pool.execute(
      "SELECT id, nombre, email, foto, bio, pais FROM usuarios WHERE id = ?", [id]
    );
    return res.json({ ok: true, user: (rows as any[])[0] });
  } catch (err) {
    console.error("Error update profile:", err);
    return res.status(500).json({ error: "Error interno" });
  }
});

apiRouter.post("/auth/change-password", async (req: Request, res: Response) => {
  try {
    const { userId, passwordActual, passwordNueva } = req.body;
    const hashedActual = hashPassword(passwordActual);
    const [rows]: any = await pool.execute(
      "SELECT id FROM usuarios WHERE id = ? AND password_hash = ?", [userId, hashedActual]
    );
    if ((rows as any[]).length === 0)
      return res.status(401).json({ error: "Contrasena actual incorrecta" });
    const hashedNueva = hashPassword(passwordNueva);
    await pool.execute("UPDATE usuarios SET password_hash = ? WHERE id = ?", [hashedNueva, userId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

apiRouter.delete("/auth/delete-account", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    await pool.execute("DELETE FROM amigos   WHERE usuario_id = ? OR amigo_id = ?",  [userId, userId]);
    await pool.execute("DELETE FROM mensajes WHERE de_id = ? OR para_id = ?",        [userId, userId]);
    await pool.execute("DELETE FROM usuarios WHERE id = ?",                           [userId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

/* ════════════════════════════════════════
   PERFIL
════════════════════════════════════════ */

apiRouter.get("/perfil/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const [rows]: any = await pool.execute(
      "SELECT id, nombre, email, foto, bio, pais FROM usuarios WHERE id = ?", [userId]
    );
    if ((rows as any[]).length === 0) return res.status(404).json({ ok: false });
    res.json({ ok: true, user: (rows as any[])[0] });
  } catch (err) {
    console.error("Error perfil:", err);
    res.status(500).json({ ok: false });
  }
});

apiRouter.get("/perfil/:userId/stats", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const [rows]: any = await pool.execute(
      `SELECT COUNT(*) as partidas, MAX(puntos) as mejor_puntuacion FROM resultados_juegos WHERE user_id = ?`,
      [userId]
    );
    const s = (rows as any[])[0];
    res.json({ ok: true, stats: { partidas: s.partidas ?? 0, victorias: 0, mejor_puntuacion: s.mejor_puntuacion ?? 0 } });
  } catch (err) {
    console.error("Error stats:", err);
    res.status(500).json({ ok: false, stats: { partidas: 0, victorias: 0, mejor_puntuacion: 0 } });
  }
});

apiRouter.get("/experiencia/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const [rows]: any = await pool.execute(
      `SELECT COUNT(*) as partidas, COALESCE(SUM(puntos),0) as xp_total,
       COALESCE(MAX(puntos),0) as mejor_puntuacion, COALESCE(SUM(correctas),0) as total_correctas
       FROM resultados_juegos WHERE user_id = ?`,
      [userId]
    );
    const [mRows]: any = await pool.execute(
      "SELECT monedas FROM usuarios WHERE id = ?", [userId]
    );
    const s            = (rows as any[])[0];
    const xp           = Number(s.xp_total ?? 0);
    const nivel        = Math.floor(xp / 500) + 1;
    const xp_actual    = xp % 500;
    const xp_siguiente = 500;
    const monedas      = Number((mRows as any[])[0]?.monedas ?? 0);
    res.json({
      ok: true, xp, nivel, xp_actual, xp_siguiente, monedas,
      partidas:         Number(s.partidas         ?? 0),
      mejor_puntuacion: Number(s.mejor_puntuacion ?? 0),
      total_correctas:  Number(s.total_correctas  ?? 0),
    });
  } catch (err) {
    console.error("Error experiencia:", err);
    res.status(500).json({ ok: false });
  }
});

/* ════════════════════════════════════════
   AMIGOS
════════════════════════════════════════ */

apiRouter.get("/amigos/buscar", async (req: Request, res: Response) => {
  try {
    const q      = String(req.query.q ?? "");
    const userId = Number(req.query.userId ?? 0);
    if (!q.trim()) return res.json({ ok: true, usuarios: [] });
    const [rows]: any = await pool.execute(
      `SELECT u.id, u.nombre, u.foto,
        CASE
          WHEN a.estado = 'aceptado' THEN 'amigo'
          WHEN a.estado = 'pendiente' AND a.usuario_id = ? THEN 'enviado'
          WHEN a.estado = 'pendiente' AND a.amigo_id   = ? THEN 'recibido'
          ELSE 'ninguno'
        END as relacion
       FROM usuarios u
       LEFT JOIN amigos a ON (
         (a.usuario_id = ? AND a.amigo_id = u.id) OR
         (a.amigo_id   = ? AND a.usuario_id = u.id)
       )
       WHERE (u.nombre LIKE ? OR u.email LIKE ?) AND u.id != ?
       LIMIT 10`,
      [userId, userId, userId, userId, `%${q}%`, `%${q}%`, userId]
    );
    return res.json({ ok: true, usuarios: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false });
  }
});

apiRouter.get("/amigos/:userId/solicitudes", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const [rows]: any = await pool.execute(
      `SELECT a.id, u.id as usuario_id, u.nombre, u.foto
       FROM amigos a JOIN usuarios u ON u.id = a.usuario_id
       WHERE a.amigo_id = ? AND a.estado = 'pendiente'`,
      [userId]
    );
    res.json({ ok: true, solicitudes: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

apiRouter.get("/amigos/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const [rows]: any = await pool.execute(
      `SELECT u.id, u.nombre, u.email, u.foto
       FROM amigos a
       JOIN usuarios u ON (u.id = CASE WHEN a.usuario_id = ? THEN a.amigo_id ELSE a.usuario_id END)
       WHERE (a.usuario_id = ? OR a.amigo_id = ?) AND a.estado = 'aceptado'`,
      [userId, userId, userId]
    );
    res.json({ ok: true, amigos: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

apiRouter.post("/amigos/solicitud", async (req: Request, res: Response) => {
  try {
    const { usuarioId, amigoId } = req.body;
    const [existing]: any = await pool.execute(
      `SELECT id FROM amigos WHERE (usuario_id = ? AND amigo_id = ?) OR (usuario_id = ? AND amigo_id = ?)`,
      [usuarioId, amigoId, amigoId, usuarioId]
    );
    if ((existing as any[]).length > 0)
      return res.status(409).json({ ok: false, error: "Ya existe una solicitud" });
    await pool.execute(
      `INSERT INTO amigos (usuario_id, amigo_id, estado, created_at) VALUES (?, ?, 'pendiente', NOW())`,
      [usuarioId, amigoId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

apiRouter.put("/amigos/solicitud/:id", async (req: Request, res: Response) => {
  try {
    const { id }     = req.params;
    const { accion } = req.body;
    if (accion === "aceptar") {
      await pool.execute(`UPDATE amigos SET estado = 'aceptado' WHERE id = ?`, [id]);
    } else {
      await pool.execute(`DELETE FROM amigos WHERE id = ?`, [id]);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

/* ════════════════════════════════════════
   MENSAJES / CHAT
════════════════════════════════════════ */

apiRouter.get("/mensajes/:userId/no-leidos", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const [rows]: any = await pool.execute(
      `SELECT m.de_id, u.nombre, u.foto, COUNT(*) as total
       FROM mensajes m JOIN usuarios u ON u.id = m.de_id
       WHERE m.para_id = ? AND m.leido = 0
       GROUP BY m.de_id, u.nombre, u.foto`,
      [userId]
    );
    res.json({ ok: true, noLeidos: rows });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});

apiRouter.get("/mensajes/:userId/:amigoId", async (req: Request, res: Response) => {
  try {
    const { userId, amigoId } = req.params;
    const [rows]: any = await pool.execute(
      `SELECT m.*, u.nombre as de_nombre, u.foto as de_foto
       FROM mensajes m JOIN usuarios u ON u.id = m.de_id
       WHERE (m.de_id = ? AND m.para_id = ?) OR (m.de_id = ? AND m.para_id = ?)
       ORDER BY m.created_at ASC LIMIT 100`,
      [userId, amigoId, amigoId, userId]
    );
    await pool.execute(
      "UPDATE mensajes SET leido = 1 WHERE de_id = ? AND para_id = ?",
      [amigoId, userId]
    );
    res.json({ ok: true, mensajes: rows });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});

apiRouter.post("/mensajes", async (req: Request, res: Response) => {
  try {
    const { deId, paraId, contenido } = req.body;
    if (!contenido?.trim()) return res.status(400).json({ ok: false });
    const [result]: any = await pool.execute(
      "INSERT INTO mensajes (de_id, para_id, contenido, leido, created_at) VALUES (?, ?, ?, 0, NOW())",
      [deId, paraId, contenido.trim()]
    );
    const [rows]: any = await pool.execute(
      `SELECT m.*, u.nombre as de_nombre, u.foto as de_foto
       FROM mensajes m JOIN usuarios u ON u.id = m.de_id WHERE m.id = ?`,
      [(result as any).insertId]
    );
    res.json({ ok: true, mensaje: (rows as any[])[0] });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});

/* Editar mensaje */
apiRouter.put("/mensajes/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { contenido, userId } = req.body;
    if (!contenido?.trim()) return res.status(400).json({ ok: false });
    await pool.execute(
      "UPDATE mensajes SET contenido = ? WHERE id = ? AND de_id = ?",
      [contenido.trim(), id, userId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});

/* Borrar mensaje */
apiRouter.delete("/mensajes/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    await pool.execute(
      "DELETE FROM mensajes WHERE id = ? AND de_id = ?",
      [id, userId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});

/* Marcar como leido */
apiRouter.put("/mensajes/leer/:deId/:paraId", async (req: Request, res: Response) => {
  try {
    const { deId, paraId } = req.params;
    await pool.execute(
      "UPDATE mensajes SET leido = 1 WHERE de_id = ? AND para_id = ?",
      [deId, paraId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});
// ════════════════════════════════════
// REEMPLAZA el bloque "// Sumar monedas" al final del archivo routes.ts
// por este bloque completo:
// ════════════════════════════════════

/* POST /api/monedas/:userId — sumar o restar monedas (cantidad negativa = gastar) */
apiRouter.post("/monedas/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { cantidad } = req.body;
  if (!userId || cantidad === undefined || isNaN(Number(cantidad))) 
    return res.status(400).json({ ok: false, error: "userId y cantidad requeridos" });
  try {
    const amount = Number(cantidad);
    // Si es negativo verificar saldo suficiente
    if (amount < 0) {
      const [rows]: any = await pool.execute(
        "SELECT monedas FROM usuarios WHERE id = ?", [userId]
      );
      const saldo = Number((rows as any[])[0]?.monedas ?? 0);
      if (saldo + amount < 0)
        return res.status(400).json({ ok: false, error: "Saldo insuficiente", saldo });
    }
    await pool.execute(
      "UPDATE usuarios SET monedas = GREATEST(0, monedas + ?) WHERE id = ?",
      [amount, userId]
    );
    const [updated]: any = await pool.execute(
      "SELECT monedas FROM usuarios WHERE id = ?", [userId]
    );
    res.json({ ok: true, monedas: Number((updated as any[])[0]?.monedas ?? 0) });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

/* PATCH /api/monedas/:userId — alias de POST para compatibilidad */
apiRouter.patch("/monedas/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { cantidad, delta } = req.body;
  req.body.cantidad = cantidad ?? delta;
  // redirigir a la misma lógica
  const amount = Number(cantidad ?? delta ?? 0);
  if (!userId || isNaN(amount))
    return res.status(400).json({ ok: false });
  try {
    if (amount < 0) {
      const [rows]: any = await pool.execute("SELECT monedas FROM usuarios WHERE id = ?", [userId]);
      const saldo = Number((rows as any[])[0]?.monedas ?? 0);
      if (saldo + amount < 0)
        return res.status(400).json({ ok: false, error: "Saldo insuficiente", saldo });
    }
    await pool.execute(
      "UPDATE usuarios SET monedas = GREATEST(0, monedas + ?) WHERE id = ?",
      [amount, userId]
    );
    const [updated]: any = await pool.execute("SELECT monedas FROM usuarios WHERE id = ?", [userId]);
    res.json({ ok: true, monedas: Number((updated as any[])[0]?.monedas ?? 0) });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});
