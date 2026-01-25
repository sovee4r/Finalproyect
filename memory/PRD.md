# Trivia Pixel - Product Requirements Document

## Problema Original
El usuario quiere construir un juego de trivia multijugador en línea con una estética retro pixel-art.

## Idioma Preferido
Español

## Tech Stack
- **Frontend:** React, Tailwind CSS, axios, socket.io-client
- **Backend:** FastAPI, motor (async MongoDB), JWT, WebSockets
- **Database:** MongoDB
- **Auth:** JWT local + Google OAuth (Emergent Auth)

---

## Requisitos del Producto

### 1. UI/UX
- [x] Tema pixel-art con colores púrpura/rosa/fucsia
- [x] Fuente "Press Start 2P" 
- [x] Layout: área principal de juego + panel lateral para amigos/chat
- [x] Banner de "Modo Desarrollo" cuando auth está deshabilitado

### 2. Autenticación
- [x] Sistema de login con email/password (Backend completo)
- [x] Login con Google OAuth (Backend completo)
- [x] Almacenamiento de usuario con username, email, password, character, friends, game history
- [ ] **PENDIENTE:** Fix del loop de redirección en frontend

### 3. Sistema Social
- [x] Sistema de amigos con identificador único `username#tag`
- [x] Lista de amigos en el dashboard
- [x] Agregar amigos (mock en modo dev)
- [ ] Chat en tiempo real (WebSocket implementado en backend)

### 4. Gameplay (Trivia)
- [x] Crear salas de juego con configuración:
  - Max jugadores (2-8)
  - Modo de juego (Normal/Competencia)  
  - Materia (Matemáticas, Lengua, Ciencias, Sociales)
  - Grado (10°, 11°, 12°)
  - Tiempo por pregunta (15-90s)
  - Cantidad de preguntas (5-25)
- [x] Preguntas de opción múltiple (4 opciones, 1 correcta)
- [x] Timer funcionando
- [x] Feedback visual de respuesta correcta/incorrecta
- [x] Pantalla de resultados finales
- [ ] Multiplayer real-time (WebSocket implementado, pendiente integración completa)

---

## Estado Actual

### Modo Desarrollo (ACTIVO)
La autenticación está temporalmente deshabilitada para permitir trabajar en las features del juego. Todas las funciones usan datos mockeados localmente.

### Lo que Funciona en Modo Dev:
- Dashboard con usuario mock (DevUser#0000)
- Crear salas de juego (datos locales)
- Agregar amigos (datos locales)
- Juego de trivia completo con preguntas locales
- Editar personaje (datos locales)

### Lo que NO Funciona (Requiere Auth Real):
- Login/Register real
- Persistencia de datos en MongoDB
- WebSocket para chat y multiplayer
- Sincronización entre jugadores

---

## Issues Conocidos

### Issue #1: Loop de Redirección en Login (P1 - BLOQUEADO)
**Descripción:** Cuando el usuario intenta hacer login, hay un loop de redirección que impide llegar al dashboard.

**Análisis del Problema:**
1. El login guarda el token en `localStorage` y `sessionStorage`
2. La redirección usa `window.location.href = '/dashboard'`
3. Al cargar Dashboard, intentaba llamar APIs del backend que requerían auth
4. Si fallaba, redirigía de vuelta a login

**Posibles Causas Identificadas:**
- El Dashboard hacía fetch de `/users/me/character`, `/friends`, etc. que fallaban sin token válido
- La verificación del token en el backend puede estar rechazando tokens válidos
- Cookies de sesión no se envían correctamente (`withCredentials: true`)

**Estado:** Bloqueado por decisión del usuario (modo dev activo)

### Issue #2: Funciones Rotas en Modo Dev (P0 - RESUELTO)
**Descripción:** Crear salas y agregar amigos no funcionaban porque dependían de auth real.

**Solución Implementada (19/01/2025):**
- Dashboard.js: Datos mockeados para usuario, amigos y salas
- GameRoom.js: Juego completo con preguntas locales, sin necesidad de backend
- Ambos archivos tienen banner de "MODO DESARROLLO"

---

## Arquitectura de Archivos

```
/app/
├── backend/
│   ├── .env                 # Variables de entorno
│   ├── requirements.txt     # Dependencias Python
│   └── server.py           # FastAPI app completa
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.js    # Panel principal (modificado para dev mode)
│   │   │   ├── GameRoom.js     # Sala de juego (modificado para dev mode)
│   │   │   ├── Login.js        # Página de login
│   │   │   ├── Register.js     # Página de registro
│   │   │   └── AuthCallback.js # Callback de Google OAuth
│   │   ├── App.js              # Router principal
│   │   └── index.css           # Estilos globales + pixel font
│   └── .env                    # REACT_APP_BACKEND_URL
└── memory/
    └── PRD.md                  # Este documento
```

---

## API Endpoints (Backend)

### Auth
- `POST /api/auth/register` - Registro con email/password
- `POST /api/auth/login` - Login tradicional
- `GET /api/auth/session` - Procesar sesión de Google OAuth
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/logout` - Cerrar sesión

### Users & Character
- `GET /api/users/me/character` - Obtener personaje
- `PUT /api/users/me/character` - Actualizar personaje
- `POST /api/users/me/score` - Actualizar puntuación

### Friends
- `GET /api/friends` - Lista de amigos
- `POST /api/friends/add` - Agregar amigo (username#tag)

### Game Rooms
- `GET /api/rooms` - Listar salas disponibles
- `POST /api/rooms` - Crear sala
- `POST /api/rooms/{id}/join` - Unirse a sala
- `POST /api/rooms/{id}/leave` - Salir de sala
- `POST /api/rooms/{id}/start` - Iniciar juego

### Game Sessions
- `GET /api/sessions/{id}/question/{num}` - Obtener pregunta
- `POST /api/sessions/{id}/answer` - Enviar respuesta
- `GET /api/sessions/{id}/results` - Resultados finales

### WebSocket
- `WS /ws/{room_id}?token=xxx` - Chat y eventos del juego

---

## Schema de Base de Datos (MongoDB)

### users
```json
{
  "user_id": "user_xxx",
  "username": "string",
  "user_tag": "0000-9999",
  "email": "string",
  "password_hash": "string (opcional, solo local auth)",
  "picture": "string (URL)",
  "created_at": "datetime"
}
```

### characters
```json
{
  "character_id": "char_xxx",
  "user_id": "user_xxx",
  "customization": {
    "avatar": "emoji",
    "color": "#hex",
    "accessories": []
  },
  "inventory": [],
  "score": 0
}
```

### friendships
```json
{
  "friendship_id": "friend_xxx",
  "user_id": "user_xxx",
  "friend_id": "user_xxx",
  "status": "accepted",
  "created_at": "datetime"
}
```

### game_rooms
```json
{
  "room_id": "room_xxx",
  "name": "string",
  "host_user_id": "user_xxx",
  "players": ["user_ids"],
  "max_players": 4,
  "game_mode": "normal|competencia",
  "subject": "matematicas|lengua|ciencias|sociales",
  "grade_level": "10|11|12",
  "time_per_question": 30,
  "total_questions": 10,
  "status": "waiting|playing|finished",
  "created_at": "datetime"
}
```

### questions
```json
{
  "question_id": "q_xxx",
  "subject": "string",
  "grade_level": "string",
  "question_text": "string",
  "options": ["4 opciones"],
  "correct_answer": 0-3,
  "difficulty": "easy|medium|hard"
}
```

---

## Tareas Futuras (Backlog)

### P0 - Alta Prioridad
1. [ ] Arreglar login cuando usuario lo solicite
2. [ ] Integración completa de WebSocket para multiplayer

### P1 - Media Prioridad
3. [ ] Poblar base de datos con más preguntas de trivia
4. [ ] Mejorar sistema de puntuación (bonus por velocidad)
5. [ ] Historial de partidas

### P2 - Baja Prioridad
6. [ ] Refactorizar server.py en módulos separados
7. [ ] Componentes reutilizables en frontend
8. [ ] Sistema de logros/achievements
9. [ ] Modo espectador
10. [ ] Leaderboard global

---

## Integraciones de Terceros
- **Google OAuth 2.0:** Login con Google via Emergent Auth
- **Google Fonts:** Fuente "Press Start 2P"

---

## Última Actualización
**Fecha:** 25 de Enero, 2025  
**Cambios:**
- ✅ **AUTENTICACIÓN ACTIVADA** - Login/Register funcionando con MySQL
- ✅ **Migración a MySQL** completada (Railway)
- ✅ **Página de inicio** creada con explicación del juego
- ✅ **Icono de casita** 🏠 agregado en todas las páginas para volver al inicio
- ✅ Juego de trivia funcionando con preguntas de la BD
- Documentación actualizada
