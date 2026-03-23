# Saberix Multijugador — Guía de Setup

## Estructura de archivos entregados

```
saberix-server/              ← NUEVO: servidor Node.js
├── package.json
├── tsconfig.json
├── .env.example             ← copiar a .env y llenar
├── create_tabla_resultados.sql
└── src/
    ├── index.ts             ← punto de entrada
    ├── db/
    │   ├── connection.ts    ← pool MySQL
    │   └── queries.ts       ← consultas SQL
    ├── routes/
    │   └── api.ts           ← REST endpoints
    └── socket/
        ├── types.ts         ← tipos compartidos
        ├── roomManager.ts   ← gestión de salas en memoria
        └── gameEvents.ts    ← toda la lógica de juego

saberix_final/src/           ← MODIFICADO: frontend
├── lib/
│   └── useSocket.ts         ← NUEVO: hook Socket.IO
└── app/components/
    ├── MultiLobby.tsx       ← NUEVO: sala de espera + ranking
    └── QuizLengua4.tsx      ← MODIFICADO: integración multi
```

---

## Paso 1: Base de datos

Ejecuta este SQL en tu Railway MySQL una sola vez:

```sql
-- (contenido de create_tabla_resultados.sql)
CREATE TABLE IF NOT EXISTS resultados (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  sala_codigo VARCHAR(10)  NOT NULL,
  jugador     VARCHAR(50)  NOT NULL,
  materia     VARCHAR(50)  NOT NULL,
  grado       TINYINT      NOT NULL,
  correctas   INT          NOT NULL DEFAULT 0,
  incorrectas INT          NOT NULL DEFAULT 0,
  puntos      INT          NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## Paso 2: Instalar dependencias del servidor

```bash
cd saberix-server
npm install
```

---

## Paso 3: Configurar variables de entorno del servidor

```bash
cp .env.example .env
```

Edita `.env`:
```env
DB_HOST=turntable.proxy.rlwy.net
DB_PORT=43192
DB_USER=root
DB_PASS=TU_PASSWORD_REAL
DB_NAME=railway
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
```

---

## Paso 4: Instalar socket.io-client en el frontend

```bash
cd saberix_final
npm install socket.io-client
```

---

## Paso 5: Configurar variable de entorno del frontend

En `saberix_final/.env` (créalo si no existe):
```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

---

## Paso 6: Probar en local

Terminal 1 — servidor:
```bash
cd saberix-server
npm run dev
# Debe mostrar:
# ✅ MySQL conectado
# 🚀 Saberix Server corriendo en puerto 3001
```

Terminal 2 — frontend:
```bash
cd saberix_final
npm run dev
# http://localhost:5173
```

Prueba multijugador abriendo **2 pestañas**:
1. Tab 1: nombre "Jugador1" → Multijugador → Crear sala → Crear
2. Tab 2: nombre "Jugador2" → Multijugador → Unirse → pegar código → Unirse
3. Tab 1: botón "Iniciar juego"

---

## Paso 7: Deploy en Railway

### 7a. Subir el servidor a GitHub
```bash
cd saberix-server
git init
git add .
git commit -m "saberix server"
git remote add origin https://github.com/TU_USER/saberix-server.git
git push -u origin main
```

### 7b. En Railway dashboard
1. New Service → GitHub repo → selecciona `saberix-server`
2. Variables de entorno:
   - `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASS` / `DB_NAME` → mismos de tu MySQL
   - `PORT` → `3001`
   - `CLIENT_ORIGIN` → URL de tu frontend en Railway (ej: `https://saberix.up.railway.app`)
3. Railway auto-detecta el `npm run build && npm start`

### 7c. Actualizar el frontend para producción
En `saberix_final/.env.production`:
```env
VITE_API_URL=https://tu-servidor.railway.app
VITE_SOCKET_URL=https://tu-servidor.railway.app
```

---

## Flujo del juego multijugador

```
Jugador A                    Servidor                   Jugador B
    │                           │                           │
    │── crear_sala ────────────►│                           │
    │◄─ sala_creada (código) ───│                           │
    │                           │◄────────── unirse_sala ───│
    │◄─ jugador_unio ───────────│── sala_unido ────────────►│
    │                           │                           │
    │── iniciar_juego ─────────►│                           │
    │◄─ juego_iniciado ─────────┼──── juego_iniciado ──────►│
    │                           │                           │
    │── responder(A, tiempo) ──►│                           │
    │◄─ resultado_respuesta ────│                           │
    │◄─ ranking_parcial ────────┼──── ranking_parcial ─────►│
    │                           │◄────────── responder ─────│
    │◄─ ranking_parcial ────────┼──── ranking_parcial ─────►│
    │                           │                           │
    │   (timeout o todos resp.) │                           │
    │◄─ nueva_pregunta ─────────┼──── nueva_pregunta ──────►│
    │         ...               │          ...              │
    │◄─ juego_terminado ────────┼──── juego_terminado ─────►│
```

---

## Eventos Socket.IO — referencia rápida

| Evento (cliente→servidor) | Datos |
|---|---|
| `crear_sala` | nombre, nombreJugador, materia, grado, tiempoPorPregunta, cantPreguntas |
| `unirse_sala` | codigo, nombreJugador |
| `iniciar_juego` | codigo |
| `responder` | codigo, respuesta ("A"/"B"/"C"/"D"), tiempoRestante |
| `salir_sala` | — |

| Evento (servidor→cliente) | Cuándo |
|---|---|
| `sala_creada` | Al host cuando crea |
| `sala_unido` | Al jugador que se une |
| `jugador_unio` | A los demás cuando alguien entra |
| `jugador_salio` | A los demás cuando alguien sale |
| `juego_iniciado` | A todos cuando host inicia |
| `nueva_pregunta` | A todos al pasar pregunta |
| `resultado_respuesta` | Solo al jugador que respondió |
| `ranking_parcial` | A todos tras cada respuesta |
| `tiempo_agotado` | A todos si se acaba el tiempo |
| `juego_terminado` | A todos al terminar |
| `error_sala` | Al jugador que causó el error |
