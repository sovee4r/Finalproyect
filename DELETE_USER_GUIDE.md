# 🗑️ Guía para Eliminar Usuarios de MongoDB

## ✅ Sí, es TOTALMENTE posible eliminar usuarios

### Método 1: Desde la Terminal (mongosh)

#### Eliminar un usuario específico por email:
```bash
mongosh
use test_database

# Ver el usuario antes de eliminar
db.users.findOne({email: "usuario@ejemplo.com"})

# Eliminar usuario
db.users.deleteOne({email: "usuario@ejemplo.com"})

# También eliminar sus datos relacionados
db.characters.deleteOne({user_id: "user_abc123"})
db.friendships.deleteMany({$or: [{user_id: "user_abc123"}, {friend_id: "user_abc123"}]})
db.user_sessions.deleteMany({user_id: "user_abc123"})
```

#### Eliminar por username#tag:
```bash
db.users.deleteOne({
  username: "JugadorTest",
  user_tag: "1234"
})
```

#### Eliminar todos los usuarios de prueba:
```bash
# Eliminar usuarios con email de prueba
db.users.deleteMany({email: /test\.com$/})

# O eliminar usuarios creados en una fecha específica
db.users.deleteMany({
  created_at: {
    $gte: ISODate("2024-01-18T00:00:00Z"),
    $lt: ISODate("2024-01-19T00:00:00Z")
  }
})
```

### Método 2: Script completo para eliminar usuario y todos sus datos

```javascript
// En mongosh
use test_database

function eliminarUsuarioCompleto(email) {
  // 1. Encontrar el usuario
  const usuario = db.users.findOne({email: email});
  
  if (!usuario) {
    print("Usuario no encontrado");
    return;
  }
  
  const userId = usuario.user_id;
  print(`Eliminando usuario: ${usuario.username}#${usuario.user_tag}`);
  
  // 2. Eliminar personaje
  const charResult = db.characters.deleteMany({user_id: userId});
  print(`Personajes eliminados: ${charResult.deletedCount}`);
  
  // 3. Eliminar amistades
  const friendResult = db.friendships.deleteMany({
    $or: [{user_id: userId}, {friend_id: userId}]
  });
  print(`Amistades eliminadas: ${friendResult.deletedCount}`);
  
  // 4. Eliminar sesiones
  const sessionResult = db.user_sessions.deleteMany({user_id: userId});
  print(`Sesiones eliminadas: ${sessionResult.deletedCount}`);
  
  // 5. Salir de salas
  db.game_rooms.updateMany(
    {players: userId},
    {$pull: {players: userId}}
  );
  print("Usuario removido de salas");
  
  // 6. Eliminar mensajes
  const msgResult = db.chat_messages.deleteMany({user_id: userId});
  print(`Mensajes eliminados: ${msgResult.deletedCount}`);
  
  // 7. Finalmente, eliminar usuario
  const userResult = db.users.deleteOne({user_id: userId});
  print(`Usuario eliminado: ${userResult.deletedCount}`);
  
  print("✅ Usuario completamente eliminado");
}

// Usar la función
eliminarUsuarioCompleto("test@example.com");
```

### Método 3: Desde MongoDB Compass (GUI)

1. Abre MongoDB Compass
2. Conecta a tu base de datos
3. Selecciona la colección "users"
4. Busca el usuario (filtra por email o username)
5. Click derecho → "Delete Document"
6. Confirmar

### Método 4: Desde tu Backend (API)

Puedo agregar un endpoint de administración:

```python
# Solo para administradores
@api_router.delete("/admin/users/{user_id}")
async def delete_user_admin(user_id: str, admin_key: str):
    """Delete user and all related data - ADMIN ONLY"""
    if admin_key != os.environ.get("ADMIN_KEY", "change-this-admin-key"):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # Delete all related data
    await db.characters.delete_many({"user_id": user_id})
    await db.friendships.delete_many({
        "$or": [{"user_id": user_id}, {"friend_id": user_id}]
    })
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.chat_messages.delete_many({"user_id": user_id})
    await db.game_rooms.update_many(
        {"players": user_id},
        {"$pull": {"players": user_id}}
    )
    
    # Delete user
    result = await db.users.delete_one({"user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}
```

### ⚠️ IMPORTANTE: Backup antes de eliminar

```bash
# Hacer backup antes de eliminar
mongodump --db test_database --out /tmp/backup_$(date +%Y%m%d)

# Si te equivocas, puedes restaurar
mongorestore /tmp/backup_20240118
```

### Comandos Útiles

```javascript
// Contar usuarios
db.users.countDocuments()

// Ver últimos 5 usuarios creados
db.users.find().sort({created_at: -1}).limit(5)

// Ver usuarios inactivos (sin sesiones recientes)
db.users.aggregate([
  {
    $lookup: {
      from: "user_sessions",
      localField: "user_id",
      foreignField: "user_id",
      as: "sessions"
    }
  },
  {
    $match: {
      sessions: {$size: 0}
    }
  }
])

// Eliminar usuarios sin personajes (incompletos)
db.users.aggregate([
  {
    $lookup: {
      from: "characters",
      localField: "user_id",
      foreignField: "user_id",
      as: "character"
    }
  },
  {
    $match: {
      character: {$size: 0}
    }
  }
]).forEach(user => {
  db.users.deleteOne({user_id: user.user_id});
  print(`Deleted incomplete user: ${user.username}`);
});
```

### Consejo de Seguridad

En producción, es mejor "desactivar" usuarios en lugar de eliminarlos:

```javascript
// Agregar campo "active" a usuarios
db.users.updateOne(
  {email: "usuario@ejemplo.com"},
  {$set: {active: false, deactivated_at: new Date()}}
)

// En tu backend, filtrar solo usuarios activos
db.users.find({active: {$ne: false}})
```

---

## 🎯 Resumen

✅ **SÍ puedes eliminar usuarios**
✅ Usa mongosh para control total
✅ Compass para GUI visual
✅ Siempre haz backup primero
✅ Elimina datos relacionados también

¿Necesitas que implemente el endpoint de administración para eliminar usuarios desde la web?
