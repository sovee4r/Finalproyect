# 📊 Guía Completa de Base de Datos MongoDB

## 🔍 Ver la Base de Datos Actual

### Opción 1: Desde la Terminal (dentro de Emergent)

```bash
# Conectar a MongoDB
mongosh

# Ver todas las bases de datos
show dbs

# Usar tu base de datos
use test_database

# Ver todas las colecciones (tablas)
show collections

# Ver usuarios (sin mostrar contraseñas)
db.users.find({}, {password_hash: 0, _id: 0}).pretty()

# Ver personajes
db.characters.find({}, {_id: 0}).pretty()

# Ver salas de juego
db.game_rooms.find({}, {_id: 0}).pretty()

# Ver mensajes de chat
db.chat_messages.find({}, {_id: 0}).limit(20).pretty()

# Ver amistades
db.friendships.find({}, {_id: 0}).pretty()

# Contar documentos
db.users.countDocuments()
```

### Opción 2: MongoDB Compass (GUI)

**MongoDB Compass** es una aplicación visual para ver y gestionar bases de datos.

1. **Descargar MongoDB Compass:**
   - Ve a: https://www.mongodb.com/try/download/compass
   - Descarga e instala

2. **Obtener la URL de conexión:**
   ```bash
   cat /app/backend/.env | grep MONGO_URL
   ```
   
   Resultado: `MONGO_URL="mongodb://localhost:27017"`

3. **Conectar desde tu PC:**
   
   ⚠️ **PROBLEMA:** `localhost:27017` solo funciona dentro del contenedor de Emergent.
   
   **SOLUCIÓN:** Ver siguiente sección "Conexión Externa"

---

## 🌐 Conectar Base de Datos desde App Externa

### Opción A: Usar MongoDB Atlas (RECOMENDADO para producción)

**MongoDB Atlas** es la versión cloud gratuita de MongoDB.

#### Pasos:

1. **Crear cuenta gratis:**
   - Ve a: https://www.mongodb.com/cloud/atlas/register
   - Regístrate (es gratis)

2. **Crear un cluster:**
   - Selecciona "M0 Sandbox" (gratis, 512MB)
   - Región: Elige la más cercana (ejemplo: US East)
   - Nombre: "GameProject"

3. **Configurar acceso:**
   - Database Access → Add New User
     - Username: `gameadmin`
     - Password: Genera una fuerte (guárdala)
   - Network Access → Add IP Address
     - Selecciona "Allow Access from Anywhere" (0.0.0.0/0)

4. **Obtener Connection String:**
   - Click en "Connect" en tu cluster
   - Elige "Connect your application"
   - Copia el string:
     ```
     mongodb+srv://gameadmin:<password>@gameproject.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```

5. **Actualizar tu aplicación:**
   
   En `/app/backend/.env`:
   ```env
   MONGO_URL="mongodb+srv://gameadmin:TU_PASSWORD@gameproject.xxxxx.mongodb.net/?retryWrites=true&w=majority"
   DB_NAME="game_database"
   ```

6. **Migrar datos existentes (opcional):**
   ```bash
   # Exportar datos actuales
   mongodump --db test_database --out /tmp/backup
   
   # Importar a Atlas (desde tu PC)
   mongorestore --uri "mongodb+srv://gameadmin:PASSWORD@gameproject.xxxxx.mongodb.net/" --db game_database /tmp/backup/test_database
   ```

#### Ventajas de MongoDB Atlas:
- ✅ Accesible desde cualquier lugar
- ✅ Backups automáticos
- ✅ 512MB gratis permanentemente
- ✅ Perfecto para tu entrega del 24 de marzo
- ✅ No necesitas mantener servidor

---

### Opción B: Exponer MongoDB local (Solo para desarrollo)

⚠️ **NO RECOMENDADO para producción**

Si quieres acceder a la MongoDB dentro de Emergent desde tu PC:

1. **Configurar túnel SSH (si Emergent lo permite):**
   ```bash
   ssh -L 27017:localhost:27017 user@emergent-server
   ```

2. **Conectar con Compass:**
   ```
   mongodb://localhost:27017
   ```

---

## 📱 Conectar desde Otras Apps

### Desde Python:
```python
from pymongo import MongoClient

# Para MongoDB Atlas
client = MongoClient("mongodb+srv://gameadmin:PASSWORD@gameproject.xxxxx.mongodb.net/")

# Seleccionar base de datos
db = client["game_database"]

# Ver usuarios
usuarios = list(db.users.find({}, {"password_hash": 0, "_id": 0}))
print(usuarios)
```

### Desde Node.js:
```javascript
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://gameadmin:PASSWORD@gameproject.xxxxx.mongodb.net/";
const client = new MongoClient(uri);

async function run() {
  await client.connect();
  const db = client.db("game_database");
  const usuarios = await db.collection("users").find({}).toArray();
  console.log(usuarios);
}
run();
```

### Desde cualquier lenguaje:
Busca "MongoDB driver para [tu lenguaje]"

---

## 🗄️ Estructura de tu Base de Datos

### Colección: `users`
```javascript
{
  user_id: "user_abc123",
  username: "JugadorPro",
  user_tag: "1234",           // ← NUEVO: Código único
  email: "jugador@example.com",
  password_hash: "$2b$12$...",  // Solo para usuarios con password
  picture: "https://...",        // Para usuarios de Google
  created_at: ISODate("2024-01-18T...")
}
```

### Colección: `characters`
```javascript
{
  character_id: "char_xyz789",
  user_id: "user_abc123",
  customization: {
    avatar: "👾",
    color: "#a855f7",
    accessories: []
  },
  inventory: ["item1", "item2"],
  score: 150
}
```

### Colección: `friendships`
```javascript
{
  friendship_id: "friend_def456",
  user_id: "user_abc123",
  friend_id: "user_xyz789",
  status: "accepted",
  created_at: ISODate("2024-01-18T...")
}
```

### Colección: `game_rooms`
```javascript
{
  room_id: "room_abc123",
  name: "Sala Épica",
  host_user_id: "user_abc123",
  players: ["user_abc123", "user_xyz789"],
  max_players: 4,
  status: "playing",  // "waiting", "playing", "finished"
  created_at: ISODate("2024-01-18T...")
}
```

### Colección: `chat_messages`
```javascript
{
  message_id: "msg_abc123",
  room_id: "room_abc123",
  user_id: "user_abc123",
  username: "JugadorPro",
  message: "Hola a todos!",
  timestamp: ISODate("2024-01-18T...")
}
```

---

## 🔐 Seguridad

### Para Producción (Atlas):
1. ✅ Usa contraseñas fuertes
2. ✅ Limita acceso por IP si es posible
3. ✅ Nunca compartas las credenciales en GitHub
4. ✅ Usa variables de entorno (.env)

### Credenciales seguras:
```bash
# En .env (NUNCA subir a GitHub)
MONGO_URL="mongodb+srv://user:password@cluster.mongodb.net/"

# En .gitignore
.env
backend/.env
```

---

## 📊 Consultas Útiles

### Buscar usuario por username#tag:
```javascript
db.users.findOne({
  username: "JugadorPro",
  user_tag: "1234"
})
```

### Ver amigos de un usuario:
```javascript
db.friendships.aggregate([
  { $match: { user_id: "user_abc123" } },
  { $lookup: {
    from: "users",
    localField: "friend_id",
    foreignField: "user_id",
    as: "friend_info"
  }}
])
```

### Ver salas activas:
```javascript
db.game_rooms.find({
  status: { $in: ["waiting", "playing"] }
})
```

### Top 10 jugadores por score:
```javascript
db.characters.find().sort({ score: -1 }).limit(10)
```

---

## 🚀 Migración para Entrega (24 de Marzo)

### Plan Recomendado:

**Semana 1-2 (Antes del 7 de Febrero):**
- Configura MongoDB Atlas
- Migra datos
- Prueba la conexión

**Semana 3-4 (7-21 de Febrero):**
- Desarrolla funcionalidades adicionales
- Prueba todo con Atlas

**Semana 5-6 (21 de Febrero - 7 de Marzo):**
- Deployment en Vercel/Railway
- Testing completo

**Semana 7-8 (7-24 de Marzo):**
- Buffer para bugs
- Preparar presentación

---

## ❓ FAQ

**P: ¿Los datos se perderán si cierro Emergent?**
R: Los datos en MongoDB local pueden persistir, pero es mejor usar Atlas para garantía.

**P: ¿Cuántos usuarios soporta MongoDB Atlas gratis?**
R: Miles. El límite es 512MB de almacenamiento, no usuarios.

**P: ¿Puedo cambiar de MongoDB local a Atlas sin perder datos?**
R: Sí, con `mongodump` y `mongorestore`.

**P: ¿Atlas es realmente gratis?**
R: Sí, el tier M0 es gratis para siempre. Sin tarjeta de crédito requerida.

---

## 📞 Próximos Pasos

¿Quieres que te ayude con:
1. Configurar MongoDB Atlas paso a paso?
2. Migrar tus datos actuales?
3. Deployment completo para tu entrega?
4. Agregar nuevas funcionalidades?

¡Solo dime qué necesitas!
