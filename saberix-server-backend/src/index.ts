import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

import { testConnection } from "./db/connection";
import { apiRouter }      from "./routes/api";
import { registerEvents } from "./socket/gameEvents";
import { ClientToServerEvents, ServerToClientEvents } from "./socket/types";
import { register } from "module";
import { registerMiniGameEvents } from "./socket/miniGameEvents";

dotenv.config();

const PORT          = Number(process.env.PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

/* ─── Express ─── */
const app = express();
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use("/api", apiRouter);

/* ─── HTTP + Socket.IO ─── */
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin:      CLIENT_ORIGIN,
    methods:     ["GET", "POST"],
    credentials: true,
  },
  pingTimeout:  60_000,
  pingInterval: 25_000,
});

/* ─── Eventos de cada conexión ─── */
io.on("connection", (socket) => {
  console.log(`🔌 Conectado: ${socket.id}`);
  registerEvents(io, socket);
  registerMiniGameEvents(io, socket);
});
/* ─── Arranque ─── */
async function main() {
  try {
    await testConnection();
    httpServer.listen(PORT, () => {
      console.log(`\n🚀 Saberix Server corriendo en puerto ${PORT}`);
      console.log(`   CORS: ${CLIENT_ORIGIN}\n`);
    });
  } catch (err) {
    console.error("❌ No se pudo conectar a la base de datos:", err);
    process.exit(1);
  }
}

main();
