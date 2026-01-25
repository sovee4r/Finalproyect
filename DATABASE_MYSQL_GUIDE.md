# 🗄️ Guía de Base de Datos MySQL - Trivia Pixel

## 📌 Credenciales de Conexión

```
Host: shuttle.proxy.rlwy.net
Puerto: 30456
Usuario: root
Contraseña: iUZtmVXKkAuUaehFrxiunyKpoRFXrPuY
Base de datos: railway
```

**URL de conexión completa:**
```
mysql://root:iUZtmVXKkAuUaehFrxiunyKpoRFXrPuY@shuttle.proxy.rlwy.net:30456/railway
```

---

## 🔌 Cómo Conectarse

### Opción 1: MySQL Workbench (Recomendado)
1. Descargar: https://dev.mysql.com/downloads/workbench/
2. Abrir MySQL Workbench
3. Click en "+" para nueva conexión
4. Llenar:
   - Connection Name: `Trivia Pixel - Railway`
   - Hostname: `shuttle.proxy.rlwy.net`
   - Port: `30456`
   - Username: `root`
5. Click "Store in Vault" y poner la contraseña
6. Click "Test Connection" → debería decir "Successfully"
7. Click "OK" y doble click para conectar

### Opción 2: DBeaver (Alternativa gratuita)
1. Descargar: https://dbeaver.io/download/
2. Nueva conexión → MySQL
3. Llenar los datos y conectar

### Opción 3: Línea de comandos
```bash
mysql -h shuttle.proxy.rlwy.net -P 30456 -u root -p railway
```

---

## 📋 Estructura de las Tablas

### 1. `users` - Usuarios
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | ID auto-incrementable |
| user_id | VARCHAR(50) | ID único del usuario |
| username | VARCHAR(100) | Nombre de usuario |
| user_tag | VARCHAR(4) | Código de 4 dígitos (ej: 1234) |
| email | VARCHAR(255) | Email único |
| password_hash | VARCHAR(255) | Contraseña encriptada |
| picture | TEXT | URL de foto de perfil |
| created_at | TIMESTAMP | Fecha de creación |

### 2. `characters` - Personajes de usuarios
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | ID auto-incrementable |
| character_id | VARCHAR(50) | ID único del personaje |
| user_id | VARCHAR(50) | ID del usuario dueño |
| avatar | VARCHAR(10) | Emoji del avatar (ej: 👤, 👾) |
| color | VARCHAR(20) | Color en hex (ej: #a855f7) |
| accessories | JSON | Lista de accesorios |
| inventory | JSON | Inventario del jugador |
| score | INT | Puntuación total |

### 3. `friendships` - Amistades
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | ID auto-incrementable |
| friendship_id | VARCHAR(50) | ID único de la amistad |
| user_id | VARCHAR(50) | Usuario que envió solicitud |
| friend_id | VARCHAR(50) | Usuario que recibió |
| status | VARCHAR(20) | Estado: 'accepted', 'pending' |
| created_at | TIMESTAMP | Fecha de creación |

### 4. `game_rooms` - Salas de juego
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | ID auto-incrementable |
| room_id | VARCHAR(50) | ID único de la sala |
| name | VARCHAR(255) | Nombre de la sala |
| host_user_id | VARCHAR(50) | ID del anfitrión |
| players | JSON | Lista de IDs de jugadores |
| max_players | INT | Máximo de jugadores (2-8) |
| game_mode | VARCHAR(50) | 'normal' o 'competencia' |
| subject | VARCHAR(100) | Materia del trivia |
| grade_level | VARCHAR(10) | Grado: '10', '11', '12' |
| time_per_question | INT | Segundos por pregunta |
| total_questions | INT | Cantidad de preguntas |
| status | VARCHAR(20) | 'waiting', 'playing', 'finished' |
| created_at | TIMESTAMP | Fecha de creación |

### 5. `questions` - Preguntas del trivia ⭐ (IMPORTANTE)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | ID auto-incrementable |
| question_id | VARCHAR(50) | ID único de la pregunta |
| subject | VARCHAR(100) | Materia: 'matematicas', 'lengua', 'ciencias', 'sociales' |
| grade_level | VARCHAR(10) | Grado: '10', '11', '12' |
| question_text | TEXT | Texto de la pregunta |
| options | JSON | Array de 4 opciones |
| correct_answer | INT | Índice de respuesta correcta (0-3) |
| difficulty | VARCHAR(20) | 'easy', 'medium', 'hard' |

### 6. `game_sessions` - Sesiones de juego
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | ID auto-incrementable |
| session_id | VARCHAR(50) | ID único de la sesión |
| room_id | VARCHAR(50) | ID de la sala |
| current_question | INT | Pregunta actual |
| questions | JSON | Lista de IDs de preguntas |
| player_scores | JSON | Puntuaciones: {user_id: score} |
| player_answers | JSON | Respuestas: {user_id: [answers]} |
| started_at | TIMESTAMP | Inicio del juego |
| status | VARCHAR(20) | 'active', 'finished' |

### 7. `chat_messages` - Mensajes del chat
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | ID auto-incrementable |
| message_id | VARCHAR(50) | ID único del mensaje |
| room_id | VARCHAR(50) | ID de la sala |
| user_id | VARCHAR(50) | ID del usuario que envió |
| username | VARCHAR(100) | Nombre del usuario |
| message | TEXT | Contenido del mensaje |
| timestamp | TIMESTAMP | Fecha/hora del mensaje |

### 8. `user_sessions` - Sesiones OAuth
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | ID auto-incrementable |
| user_id | VARCHAR(50) | ID del usuario |
| session_token | VARCHAR(500) | Token de sesión |
| expires_at | TIMESTAMP | Fecha de expiración |
| created_at | TIMESTAMP | Fecha de creación |

---

## 📝 Cómo Agregar Preguntas (Para el equipo de BD)

### Ejemplo de INSERT:
```sql
INSERT INTO questions (question_id, subject, grade_level, question_text, options, correct_answer, difficulty)
VALUES 
  ('q_custom_001', 'matematicas', '10', '¿Cuánto es 5 × 8?', '["40", "35", "45", "30"]', 0, 'easy'),
  ('q_custom_002', 'matematicas', '10', '¿Cuál es el área de un cuadrado de lado 5?', '["25", "20", "15", "10"]', 0, 'easy'),
  ('q_custom_003', 'ciencias', '10', '¿Cuál es el símbolo del Oro?', '["Au", "Ag", "Fe", "Cu"]', 0, 'medium');
```

### Formato del campo `options`:
- Debe ser un JSON array con exactamente 4 opciones
- Ejemplo: `'["Opción A", "Opción B", "Opción C", "Opción D"]'`

### Campo `correct_answer`:
- 0 = Primera opción
- 1 = Segunda opción
- 2 = Tercera opción
- 3 = Cuarta opción

### Materias válidas (`subject`):
- `matematicas`
- `lengua`
- `ciencias`
- `sociales`

### Grados válidos (`grade_level`):
- `10`
- `11`
- `12`

---

## 🔍 Consultas Útiles

### Ver todas las preguntas:
```sql
SELECT * FROM questions;
```

### Ver preguntas por materia:
```sql
SELECT question_text, options, correct_answer 
FROM questions 
WHERE subject = 'matematicas';
```

### Contar preguntas por materia y grado:
```sql
SELECT subject, grade_level, COUNT(*) as total
FROM questions
GROUP BY subject, grade_level;
```

### Ver usuarios registrados:
```sql
SELECT username, user_tag, email, created_at FROM users;
```

### Ver ranking de jugadores:
```sql
SELECT u.username, u.user_tag, c.score
FROM users u
JOIN characters c ON u.user_id = c.user_id
ORDER BY c.score DESC;
```

---

## ⚠️ Notas Importantes

1. **NO modificar** las tablas `users`, `characters`, `friendships` directamente sin consultar primero - pueden romper la autenticación.

2. **La tabla principal para el equipo de BD es `questions`** - aquí pueden agregar todas las preguntas del trivia.

3. **Generar `question_id` únicos** - usar formato `q_TEMA_NUMERO` o similar para evitar duplicados.

4. **El campo `options` debe ser JSON válido** - usar comillas dobles dentro del array.

5. **Hacer backup antes de cambios masivos:**
```sql
CREATE TABLE questions_backup AS SELECT * FROM questions;
```

---

## 📞 Contacto

Si tienen dudas sobre la estructura o necesitan agregar campos, consultar antes de modificar las tablas.

¡Buena suerte con las preguntas! 🎮
