# Testing Playbook - Sistema de Autenticación y Juego Multijugador

## Resumen del Sistema

Tu aplicación ahora tiene:
- ✅ Autenticación JWT (email/password)
- ✅ Autenticación Google OAuth (Emergent)
- ✅ Base de datos MongoDB con usuarios, personajes, amigos, salas
- ✅ Sistema de salas de juego
- ✅ Chat en tiempo real con WebSockets
- ✅ Personalización de personajes
- ✅ Sistema de amigos

## Paso 1: Crear Usuario de Prueba Manualmente

```bash
# Crear usuario directamente en MongoDB
mongosh --eval "
use('test_database');
db.users.insertOne({
  user_id: 'user_test123',
  username: 'JugadorTest',
  email: 'jugador@test.com',
  password_hash: '\$2b\$12\$LlQJ.3QZ1Y8Y8p8Y8Y8Y8O8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y',
  picture: null,
  created_at: new Date()
});
db.characters.insertOne({
  character_id: 'char_test123',
  user_id: 'user_test123',
  customization: {
    avatar: '👾',
    color: '#a855f7',
    accessories: []
  },
  inventory: [],
  score: 0
});
print('Usuario de prueba creado');
"
```

## Paso 2: Probar Backend con cURL

### Registro de usuario
```bash
curl -X POST "http://localhost:8001/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "player1", "email": "player1@test.com", "password": "password123"}'
```

### Login
```bash
curl -X POST "http://localhost:8001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "player1@test.com", "password": "password123"}'
```

### Verificar usuario autenticado
```bash
curl -X GET "http://localhost:8001/api/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Obtener personaje
```bash
curl -X GET "http://localhost:8001/api/users/me/character" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Crear sala de juego
```bash
curl -X POST "http://localhost:8001/api/rooms?room_name=Sala%20de%20Prueba&max_players=4" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Listar salas
```bash
curl -X GET "http://localhost:8001/api/rooms" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Paso 3: Probar Frontend

### 3.1 Registro e Inicio de Sesión
1. Abre el navegador en tu aplicación
2. Deberías ver la página de login
3. Haz clic en "¿No tienes cuenta? Regístrate"
4. Completa el formulario:
   - Usuario: `testplayer`
   - Email: `testplayer@example.com`
   - Contraseña: `password123`
5. Haz clic en "REGISTRAR"
6. Deberías ser redirigido al Dashboard

### 3.2 Google OAuth Login
1. Desde la página de login, haz clic en "GOOGLE LOGIN"
2. Serás redirigido a auth.emergentagent.com
3. Inicia sesión con tu cuenta de Google
4. Serás redirigido de vuelta al Dashboard

### 3.3 Dashboard
Una vez en el Dashboard deberías ver:
- Tu personaje en la esquina superior izquierda
- Tu puntuación (inicialmente 0)
- Sección de personalización de personaje
- Lista de salas de juego disponibles
- Lista de amigos (vacía inicialmente)

### 3.4 Personalizar Personaje
1. Haz clic en "EDITAR" en la sección de personaje
2. Selecciona un nuevo avatar (emoji)
3. Cambia el color
4. Haz clic en "GUARDAR"
5. Deberías ver el personaje actualizado

### 3.5 Agregar Amigos
1. Haz clic en el botón "+" en la sección de amigos
2. Ingresa el email de otro usuario (necesitas crear otro usuario primero)
3. Haz clic en "AGREGAR"
4. El amigo debería aparecer en tu lista

### 3.6 Crear y Unirse a Sala
1. Haz clic en "+ CREAR" en la sección de salas
2. Ingresa un nombre: "Mi Primera Sala"
3. Haz clic en "CREAR"
4. Serás redirigido a la sala

### 3.7 Chat en Tiempo Real
Dentro de una sala:
1. Escribe un mensaje en el input de chat
2. Presiona ">" para enviar
3. El mensaje debería aparecer en el chat
4. Abre la misma sala en otra pestaña (con otro usuario)
5. Los mensajes deberían sincronizarse en tiempo real

### 3.8 Juego Multijugador
1. Dentro de una sala, haz clic en "> INICIAR JUEGO <"
2. El área de juego cambiará de estado
3. Aquí es donde puedes implementar tu lógica de juego
4. Los eventos de juego se sincronizan vía WebSocket

## Paso 4: Verificar Base de Datos

```bash
# Ver usuarios
mongosh --eval "use('test_database'); db.users.find({}, {_id: 0, password_hash: 0}).pretty()"

# Ver personajes
mongosh --eval "use('test_database'); db.characters.find({}, {_id: 0}).pretty()"

# Ver salas
mongosh --eval "use('test_database'); db.game_rooms.find({}, {_id: 0}).pretty()"

# Ver mensajes de chat
mongosh --eval "use('test_database'); db.chat_messages.find({}, {_id: 0}).pretty()"

# Ver amistades
mongosh --eval "use('test_database'); db.friendships.find({}, {_id: 0}).pretty()"
```

## Solución de Problemas

### Problema: "Not authenticated" o redirige al login
**Solución:**
1. Verifica que el token se guardó: Abre la consola del navegador → Application → Local Storage → Busca `access_token`
2. Si no hay token, el login no funcionó
3. Revisa los logs del backend: `tail -f /var/log/supervisor/backend.err.log`

### Problema: WebSocket no conecta
**Solución:**
1. Verifica que el backend está corriendo: `sudo supervisorctl status backend`
2. Revisa la URL del WebSocket en la consola del navegador
3. El token debe ser válido para conectarse

### Problema: No se guardan los datos
**Solución:**
1. Verifica que MongoDB está corriendo: `sudo supervisorctl status mongodb`
2. Prueba la conexión: `mongosh --eval "db.serverStatus().ok"`

### Problema: CORS errors
**Solución:**
- Verifica que `CORS_ORIGINS` en `/app/backend/.env` está configurado correctamente
- Por defecto está en `*` que permite todos los orígenes

## Limpiar Datos de Prueba

```bash
mongosh --eval "
use('test_database');
db.users.deleteMany({email: /test\.com/});
db.characters.deleteMany({});
db.game_rooms.deleteMany({});
db.chat_messages.deleteMany({});
db.friendships.deleteMany({});
db.user_sessions.deleteMany({});
print('Datos de prueba eliminados');
"
```

## Siguiente Paso: Implementar Lógica de Juego

Ahora que tienes toda la infraestructura, puedes implementar tu juego en:
- **Frontend:** `/app/frontend/src/pages/GameRoom.js` (en el área de juego)
- **Backend:** Maneja eventos de juego vía WebSocket en `/app/backend/server.py`

Los eventos de juego ya están configurados para sincronizarse automáticamente entre todos los jugadores de una sala.
