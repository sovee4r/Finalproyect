# 🚀 Guía de Deployment - Proyecto para 24 de Marzo

## 📅 Timeline de Deployment

```
HOY → 7 Feb: Configuración inicial
7-21 Feb: Desarrollo + Testing  
21 Feb-7 Mar: Deployment + Ajustes
7-24 Mar: Testing final + Buffer
```

---

## 🎯 Opciones de Deployment

### ✅ OPCIÓN 1: Emergent Native Deployment (MÁS FÁCIL)

**Ventajas:**
- Setup automático
- Zero configuración
- Todo en un solo lugar
- Perfecto para demos

**Pasos:**
1. En Emergent, busca "Deploy" o "Publish"
2. Tu app quedará en: `https://tu-app.emergentagent.com`
3. Funcional 24/7

**Limitaciones:**
- Dependes de la plataforma Emergent
- Menos control sobre configuración

**¿Cuándo usar?**
- Si necesitas algo rápido y funcional
- Para demos o presentaciones
- Si no tienes experiencia con deployment

---

### ✅ OPCIÓN 2: Vercel + Railway (RECOMENDADO)

**Por qué es mejor para entrega de proyecto:**
- URLs profesionales propias
- Más control
- Portafolio profesional
- Gratis para estudiantes

#### 🔵 Backend en Railway

**Railway** es perfecto para FastAPI + MongoDB.

**Setup:**

1. **Crear cuenta en Railway:**
   - Ve a: https://railway.app
   - Regístrate con GitHub

2. **Crear nuevo proyecto:**
   - Click "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Conecta tu repositorio (backend)

3. **Configurar variables de entorno:**
   ```
   MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/
   DB_NAME=game_database
   SECRET_KEY=tu-secret-key-super-segura
   CORS_ORIGINS=https://tu-frontend.vercel.app
   ```

4. **Railway detectará automáticamente:**
   - `requirements.txt`
   - Usará uvicorn para correr

5. **Obtén tu URL:**
   - Railway te dará: `https://tu-app.railway.app`

**Costo:** Gratis con $5 de crédito mensual (suficiente para desarrollo)

---

#### 🟢 Frontend en Vercel

**Vercel** es perfecto para React.

**Setup:**

1. **Crear cuenta:**
   - Ve a: https://vercel.com
   - Regístrate con GitHub

2. **Deploy:**
   - Click "New Project"
   - Importa tu repositorio (frontend)
   - Vercel detecta React automáticamente

3. **Configurar variables:**
   ```
   REACT_APP_BACKEND_URL=https://tu-app.railway.app
   ```

4. **Deploy:**
   - Click "Deploy"
   - En 2 minutos: `https://tu-proyecto.vercel.app`

**Costo:** GRATIS para siempre

---

### ✅ OPCIÓN 3: Todo en Render (Alternativa simple)

**Render** puede hostear backend + frontend en un solo lugar.

**Pasos:**

1. **Crear cuenta:** https://render.com

2. **Deploy Backend (Web Service):**
   - New → Web Service
   - Conectar GitHub repo (backend)
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - Variables: MONGO_URL, SECRET_KEY, etc.

3. **Deploy Frontend (Static Site):**
   - New → Static Site
   - Conectar GitHub repo (frontend)
   - Build Command: `yarn build`
   - Publish Directory: `build`
   - Variable: REACT_APP_BACKEND_URL

**Costo:** Gratis con limitaciones (suficiente para proyecto)

---

## 🗄️ Base de Datos: MongoDB Atlas

**OBLIGATORIO para cualquier opción de deployment.**

### Setup rápido:

1. **Crear cluster gratis:**
   - https://mongodb.com/cloud/atlas/register
   - M0 Sandbox (512MB gratis)

2. **Configurar acceso:**
   - Database Access → Crear usuario
   - Network Access → Allow 0.0.0.0/0

3. **Connection String:**
   ```
   mongodb+srv://usuario:password@cluster.mongodb.net/?retryWrites=true&w=majority
   ```

4. **Actualizar .env:**
   ```
   MONGO_URL="mongodb+srv://..."
   DB_NAME="game_database"
   ```

---

## 📦 Preparar Código para Deployment

### 1. Estructura de archivos:

```
/proyecto-juego/
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   └── .env.example      ← Crear este
├── frontend/
│   ├── src/
│   ├── package.json
│   └── .env.example      ← Crear este
└── README.md             ← Documentación
```

### 2. Crear .env.example:

**backend/.env.example:**
```env
MONGO_URL=mongodb+srv://user:password@cluster.mongodb.net/
DB_NAME=game_database
SECRET_KEY=change-this-secret-key
CORS_ORIGINS=https://your-frontend.vercel.app
```

**frontend/.env.example:**
```env
REACT_APP_BACKEND_URL=https://your-backend.railway.app
```

### 3. .gitignore:

```gitignore
# Environment
.env
backend/.env
frontend/.env

# Dependencies
node_modules/
__pycache__/
*.pyc

# Build
build/
dist/
```

---

## 🔧 Configuración de CORS

**IMPORTANTE:** Tu backend debe permitir requests del frontend.

En `backend/server.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "https://tu-frontend.vercel.app",
        "http://localhost:3000"  # Para desarrollo local
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

O en `.env`:
```
CORS_ORIGINS=https://tu-frontend.vercel.app,http://localhost:3000
```

---

## 🧪 Testing Pre-Deployment

### Checklist antes de hacer deploy:

- [ ] Backend corre localmente sin errores
- [ ] Frontend conecta al backend local
- [ ] MongoDB Atlas está configurado
- [ ] Variables de entorno están en .env.example
- [ ] .gitignore tiene .env
- [ ] README.md tiene instrucciones de setup
- [ ] Todas las funciones principales funcionan
- [ ] Sistema de amigos username#tag funciona
- [ ] Chat en tiempo real funciona
- [ ] WebSocket conecta correctamente

---

## 📋 Plan de Deployment Paso a Paso

### Semana 1 (HOY - 7 Feb):

**Día 1-2:**
- [x] Configurar MongoDB Atlas
- [ ] Migrar datos actuales
- [ ] Probar conexión desde local

**Día 3-5:**
- [ ] Guardar código en GitHub
- [ ] Crear .env.example
- [ ] Actualizar README.md

**Día 6-7:**
- [ ] Deploy backend en Railway
- [ ] Deploy frontend en Vercel
- [ ] Testing básico

---

### Semana 2-4 (7 Feb - 7 Mar):

**Desarrollo de funcionalidades adicionales:**
- Implementar lógica del juego
- Mejorar UI/UX
- Testing exhaustivo
- Correcciones de bugs

---

### Semana 5-6 (7-21 Mar):

**Testing final:**
- Testing con múltiples usuarios
- Performance testing
- Testing en diferentes dispositivos
- Corrección de bugs finales

---

### Semana 7 (21-24 Mar):

**Buffer y preparación:**
- Documentación final
- Video demo
- Preparar presentación

---

## 🌐 URLs Finales

Después del deployment tendrás:

```
Frontend:  https://tu-juego.vercel.app
Backend:   https://tu-api.railway.app
Database:  MongoDB Atlas (cloud)
```

**Comparte solo la URL del frontend** - el backend es interno.

---

## 🎓 Para tu Entrega Académica

### Lo que debes incluir:

1. **URL de la aplicación funcionando**
2. **Repositorio GitHub:**
   - Código completo
   - README con instrucciones
   - .env.example
3. **Documentación:**
   - Cómo funciona
   - Tecnologías usadas
   - Arquitectura
4. **Video demo (opcional pero recomendado)**

### Ejemplo de README.md:

```markdown
# Juego Multijugador - Proyecto [Tu Curso]

## 🎮 Demo en Vivo
https://tu-juego.vercel.app

## 🚀 Tecnologías
- Frontend: React + Tailwind CSS
- Backend: FastAPI (Python)
- Database: MongoDB Atlas
- Real-time: WebSockets

## 📦 Setup Local

1. Clonar repo:
   \`\`\`bash
   git clone https://github.com/tu-usuario/tu-proyecto
   \`\`\`

2. Backend:
   \`\`\`bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env  # Configurar variables
   uvicorn server:app --reload
   \`\`\`

3. Frontend:
   \`\`\`bash
   cd frontend
   yarn install
   cp .env.example .env  # Configurar variables
   yarn start
   \`\`\`

## 🎯 Funcionalidades
- ✅ Autenticación (JWT + Google OAuth)
- ✅ Sistema de amigos (username#tag)
- ✅ Salas de juego multijugador
- ✅ Chat en tiempo real
- ✅ Personalización de personajes
```

---

## 💰 Costos

### Totales mensuales:
- MongoDB Atlas (M0): **GRATIS**
- Vercel (Frontend): **GRATIS**
- Railway (Backend): **GRATIS** (con límites)

**Costo total: $0/mes** 🎉

---

## 🆘 Troubleshooting

### Problema: CORS errors
```javascript
// Verifica CORS_ORIGINS en backend
CORS_ORIGINS=https://tu-frontend.vercel.app
```

### Problema: WebSocket no conecta
```javascript
// Usa wss:// en producción
const WS_URL = BACKEND_URL.replace('https', 'wss');
```

### Problema: 404 en rutas de React
**En Vercel:** Automático
**En otros:** Crear `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

---

## 📞 Siguiente Paso

¿Qué quieres hacer ahora?

1. **Configurar MongoDB Atlas** → Empezar migración
2. **Guardar en GitHub** → Preparar deployment
3. **Deploy inmediato** → Railway + Vercel ahora
4. **Seguir desarrollando** → Agregar más funcionalidades

¡Dime qué prefieres y te guío paso a paso!
