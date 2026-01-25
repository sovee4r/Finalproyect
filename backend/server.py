from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import aiomysql
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx
from jose import JWTError
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MySQL Configuration
MYSQL_HOST = os.environ.get('MYSQL_HOST', 'shuttle.proxy.rlwy.net')
MYSQL_PORT = int(os.environ.get('MYSQL_PORT', '30456'))
MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', '')
MYSQL_DATABASE = os.environ.get('MYSQL_DATABASE', 'railway')

# Global connection pool
pool = None

# JWT Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-this-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 90

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.user_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
        self.user_connections[user_id] = websocket
    
    def disconnect(self, websocket: WebSocket, room_id: str, user_id: str):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
        if user_id in self.user_connections:
            del self.user_connections[user_id]
    
    async def broadcast_to_room(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()

# ============ MODELS ============

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class CharacterCustomization(BaseModel):
    avatar: str = "👤"
    color: str = "#a855f7"
    accessories: List[str] = []

# ============ DATABASE HELPERS ============

async def get_db():
    global pool
    if pool is None:
        pool = await aiomysql.create_pool(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            db=MYSQL_DATABASE,
            autocommit=True,
            minsize=1,
            maxsize=10
        )
    return pool

async def execute_query(query: str, params: tuple = None, fetch_one: bool = False, fetch_all: bool = False):
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(query, params)
            if fetch_one:
                return await cursor.fetchone()
            if fetch_all:
                return await cursor.fetchall()
            return cursor.lastrowid

async def init_database():
    """Initialize all MySQL tables"""
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            # Users table
            await cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id VARCHAR(50) UNIQUE NOT NULL,
                    username VARCHAR(100) NOT NULL,
                    user_tag VARCHAR(4) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255),
                    picture TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_email (email),
                    INDEX idx_user_tag (username, user_tag)
                )
            """)
            
            # Characters table
            await cursor.execute("""
                CREATE TABLE IF NOT EXISTS characters (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    character_id VARCHAR(50) UNIQUE NOT NULL,
                    user_id VARCHAR(50) NOT NULL,
                    avatar VARCHAR(10) DEFAULT '👤',
                    color VARCHAR(20) DEFAULT '#a855f7',
                    accessories JSON,
                    inventory JSON,
                    score INT DEFAULT 0,
                    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
                )
            """)
            
            # Friendships table
            await cursor.execute("""
                CREATE TABLE IF NOT EXISTS friendships (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    friendship_id VARCHAR(50) UNIQUE NOT NULL,
                    user_id VARCHAR(50) NOT NULL,
                    friend_id VARCHAR(50) NOT NULL,
                    status VARCHAR(20) DEFAULT 'accepted',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                    FOREIGN KEY (friend_id) REFERENCES users(user_id) ON DELETE CASCADE
                )
            """)
            
            # Game rooms table
            await cursor.execute("""
                CREATE TABLE IF NOT EXISTS game_rooms (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    room_id VARCHAR(50) UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    host_user_id VARCHAR(50) NOT NULL,
                    players JSON,
                    max_players INT DEFAULT 4,
                    game_mode VARCHAR(50) DEFAULT 'normal',
                    subject VARCHAR(100) DEFAULT 'matematicas',
                    grade_level VARCHAR(10) DEFAULT '10',
                    time_per_question INT DEFAULT 30,
                    total_questions INT DEFAULT 10,
                    status VARCHAR(20) DEFAULT 'waiting',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (host_user_id) REFERENCES users(user_id) ON DELETE CASCADE
                )
            """)
            
            # Questions table
            await cursor.execute("""
                CREATE TABLE IF NOT EXISTS questions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    question_id VARCHAR(50) UNIQUE NOT NULL,
                    subject VARCHAR(100) NOT NULL,
                    grade_level VARCHAR(10) NOT NULL,
                    question_text TEXT NOT NULL,
                    options JSON NOT NULL,
                    correct_answer INT NOT NULL,
                    difficulty VARCHAR(20) DEFAULT 'medium',
                    INDEX idx_subject_grade (subject, grade_level)
                )
            """)
            
            # Game sessions table
            await cursor.execute("""
                CREATE TABLE IF NOT EXISTS game_sessions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    session_id VARCHAR(50) UNIQUE NOT NULL,
                    room_id VARCHAR(50) NOT NULL,
                    current_question INT DEFAULT 0,
                    questions JSON,
                    player_scores JSON,
                    player_answers JSON,
                    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(20) DEFAULT 'active'
                )
            """)
            
            # Chat messages table
            await cursor.execute("""
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    message_id VARCHAR(50) UNIQUE NOT NULL,
                    room_id VARCHAR(50) NOT NULL,
                    user_id VARCHAR(50) NOT NULL,
                    username VARCHAR(100) NOT NULL,
                    message TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # User sessions table (for OAuth)
            await cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_sessions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id VARCHAR(50) NOT NULL,
                    session_token VARCHAR(500) NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_session_token (session_token(255))
                )
            """)
            
            await conn.commit()
            print("✅ Database tables initialized!")

# ============ HELPER FUNCTIONS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode = {"sub": user_id, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(request: Request) -> dict:
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check JWT token
    try:
        payload = jwt.decode(session_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await execute_query(
            "SELECT user_id, username, user_tag, email, picture, created_at FROM users WHERE user_id = %s",
            (user_id,), fetch_one=True
        )
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return dict(user)
    except JWTError:
        # Check OAuth session
        session = await execute_query(
            "SELECT user_id, expires_at FROM user_sessions WHERE session_token = %s",
            (session_token,), fetch_one=True
        )
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        if session['expires_at'] < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
        
        user = await execute_query(
            "SELECT user_id, username, user_tag, email, picture, created_at FROM users WHERE user_id = %s",
            (session['user_id'],), fetch_one=True
        )
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return dict(user)

# ============ AUTHENTICATION ROUTES ============

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing = await execute_query(
        "SELECT user_id FROM users WHERE email = %s",
        (user_data.email,), fetch_one=True
    )
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate unique user tag
    import random
    user_tag = None
    for _ in range(10):
        user_tag = f"{random.randint(1000, 9999)}"
        existing_tag = await execute_query(
            "SELECT user_id FROM users WHERE username = %s AND user_tag = %s",
            (user_data.username, user_tag), fetch_one=True
        )
        if not existing_tag:
            break
    
    # Create user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_password = hash_password(user_data.password)
    
    await execute_query(
        """INSERT INTO users (user_id, username, user_tag, email, password_hash) 
           VALUES (%s, %s, %s, %s, %s)""",
        (user_id, user_data.username, user_tag, user_data.email, hashed_password)
    )
    
    # Create default character
    character_id = f"char_{uuid.uuid4().hex[:12]}"
    await execute_query(
        """INSERT INTO characters (character_id, user_id, avatar, color, accessories, inventory, score)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (character_id, user_id, "👤", "#a855f7", "[]", "[]", 0)
    )
    
    token = create_access_token(user_id)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": user_id,
            "username": user_data.username,
            "user_tag": user_tag,
            "email": user_data.email
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await execute_query(
        "SELECT user_id, username, user_tag, email, password_hash, picture FROM users WHERE email = %s",
        (credentials.email,), fetch_one=True
    )
    
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(user['user_id'])
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": user['user_id'],
            "username": user['username'],
            "user_tag": user['user_tag'],
            "email": user['email'],
            "picture": user['picture']
        }
    }

@api_router.get("/auth/session")
async def process_google_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            auth_response.raise_for_status()
            user_data = auth_response.json()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to get session data: {str(e)}")
    
    # Check if user exists
    user = await execute_query(
        "SELECT user_id, username, user_tag FROM users WHERE email = %s",
        (user_data["email"],), fetch_one=True
    )
    
    if user:
        user_id = user['user_id']
        if not user.get('user_tag'):
            import random
            user_tag = f"{random.randint(1000, 9999)}"
            await execute_query(
                "UPDATE users SET user_tag = %s WHERE user_id = %s",
                (user_tag, user_id)
            )
    else:
        import random
        user_tag = f"{random.randint(1000, 9999)}"
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        
        await execute_query(
            """INSERT INTO users (user_id, username, user_tag, email, picture)
               VALUES (%s, %s, %s, %s, %s)""",
            (user_id, user_data["name"], user_tag, user_data["email"], user_data.get("picture"))
        )
        
        # Create default character
        character_id = f"char_{uuid.uuid4().hex[:12]}"
        await execute_query(
            """INSERT INTO characters (character_id, user_id, avatar, color, accessories, inventory, score)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (character_id, user_id, "👤", "#a855f7", "[]", "[]", 0)
        )
    
    # Store session
    session_token = user_data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=90)
    
    await execute_query(
        """INSERT INTO user_sessions (user_id, session_token, expires_at)
           VALUES (%s, %s, %s)""",
        (user_id, session_token, expires_at)
    )
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    user_doc = await execute_query(
        "SELECT user_id, username, user_tag, email, picture FROM users WHERE user_id = %s",
        (user_id,), fetch_one=True
    )
    
    return {"user": dict(user_doc), "session_token": session_token}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await execute_query(
            "DELETE FROM user_sessions WHERE session_token = %s",
            (session_token,)
        )
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============ USER & CHARACTER ROUTES ============

@api_router.get("/users/me/character")
async def get_my_character(user: dict = Depends(get_current_user)):
    character = await execute_query(
        "SELECT character_id, user_id, avatar, color, accessories, inventory, score FROM characters WHERE user_id = %s",
        (user["user_id"],), fetch_one=True
    )
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    result = dict(character)
    result['accessories'] = json.loads(result['accessories']) if result['accessories'] else []
    result['inventory'] = json.loads(result['inventory']) if result['inventory'] else []
    result['customization'] = {
        'avatar': result['avatar'],
        'color': result['color'],
        'accessories': result['accessories']
    }
    return result

@api_router.put("/users/me/character")
async def update_my_character(customization: CharacterCustomization, user: dict = Depends(get_current_user)):
    await execute_query(
        "UPDATE characters SET avatar = %s, color = %s, accessories = %s WHERE user_id = %s",
        (customization.avatar, customization.color, json.dumps(customization.accessories), user["user_id"])
    )
    
    return await get_my_character(user)

# ============ FRIENDS ROUTES ============

@api_router.get("/friends")
async def get_friends(user: dict = Depends(get_current_user)):
    friendships = await execute_query(
        """SELECT user_id, friend_id FROM friendships 
           WHERE user_id = %s OR friend_id = %s""",
        (user["user_id"], user["user_id"]), fetch_all=True
    )
    
    friend_ids = []
    for f in friendships:
        if f['user_id'] == user["user_id"]:
            friend_ids.append(f['friend_id'])
        else:
            friend_ids.append(f['user_id'])
    
    if not friend_ids:
        return []
    
    placeholders = ','.join(['%s'] * len(friend_ids))
    friends = await execute_query(
        f"SELECT user_id, username, user_tag, picture FROM users WHERE user_id IN ({placeholders})",
        tuple(friend_ids), fetch_all=True
    )
    
    return [dict(f) for f in friends]

@api_router.post("/friends/add")
async def add_friend(friend_identifier: str, user: dict = Depends(get_current_user)):
    if '#' not in friend_identifier:
        raise HTTPException(status_code=400, detail="Use format: username#1234")
    
    parts = friend_identifier.split('#')
    if len(parts) != 2:
        raise HTTPException(status_code=400, detail="Invalid format. Use: username#1234")
    
    friend_username, friend_tag = parts
    
    friend = await execute_query(
        "SELECT user_id, username, user_tag, picture FROM users WHERE username = %s AND user_tag = %s",
        (friend_username, friend_tag), fetch_one=True
    )
    
    if not friend:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if friend["user_id"] == user["user_id"]:
        raise HTTPException(status_code=400, detail="No puedes agregarte a ti mismo")
    
    existing = await execute_query(
        """SELECT friendship_id FROM friendships 
           WHERE (user_id = %s AND friend_id = %s) OR (user_id = %s AND friend_id = %s)""",
        (user["user_id"], friend["user_id"], friend["user_id"], user["user_id"]), fetch_one=True
    )
    
    if existing:
        raise HTTPException(status_code=400, detail="Ya son amigos")
    
    friendship_id = f"friend_{uuid.uuid4().hex[:12]}"
    await execute_query(
        """INSERT INTO friendships (friendship_id, user_id, friend_id, status)
           VALUES (%s, %s, %s, %s)""",
        (friendship_id, user["user_id"], friend["user_id"], "accepted")
    )
    
    return {"message": "Amigo agregado exitosamente", "friend": dict(friend)}

# ============ GAME ROOMS ROUTES ============

@api_router.get("/rooms")
async def get_rooms(user: dict = Depends(get_current_user)):
    rooms = await execute_query(
        "SELECT * FROM game_rooms WHERE status IN ('waiting', 'playing')",
        fetch_all=True
    )
    result = []
    for room in rooms:
        r = dict(room)
        r['players'] = json.loads(r['players']) if r['players'] else []
        result.append(r)
    return result

@api_router.post("/rooms")
async def create_room(
    room_name: str,
    max_players: int = 4,
    game_mode: str = "normal",
    subject: str = "matematicas",
    grade_level: str = "10",
    time_per_question: int = 30,
    total_questions: int = 10,
    user: dict = Depends(get_current_user)
):
    room_id = f"room_{uuid.uuid4().hex[:8]}"
    players = json.dumps([user["user_id"]])
    
    await execute_query(
        """INSERT INTO game_rooms (room_id, name, host_user_id, players, max_players, game_mode, 
           subject, grade_level, time_per_question, total_questions, status)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (room_id, room_name, user["user_id"], players, max_players, game_mode,
         subject, grade_level, time_per_question, total_questions, "waiting")
    )
    
    return {
        "room_id": room_id,
        "name": room_name,
        "host_user_id": user["user_id"],
        "players": [user["user_id"]],
        "max_players": max_players,
        "game_mode": game_mode,
        "subject": subject,
        "grade_level": grade_level,
        "time_per_question": time_per_question,
        "total_questions": total_questions,
        "status": "waiting"
    }

@api_router.get("/rooms/{room_id}")
async def get_room(room_id: str, user: dict = Depends(get_current_user)):
    room = await execute_query(
        "SELECT * FROM game_rooms WHERE room_id = %s",
        (room_id,), fetch_one=True
    )
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    result = dict(room)
    result['players'] = json.loads(result['players']) if result['players'] else []
    return result

@api_router.post("/rooms/{room_id}/join")
async def join_room(room_id: str, user: dict = Depends(get_current_user)):
    room = await execute_query(
        "SELECT players, max_players FROM game_rooms WHERE room_id = %s",
        (room_id,), fetch_one=True
    )
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    players = json.loads(room['players']) if room['players'] else []
    
    if len(players) >= room['max_players']:
        raise HTTPException(status_code=400, detail="Room is full")
    
    if user["user_id"] in players:
        raise HTTPException(status_code=400, detail="Already in room")
    
    players.append(user["user_id"])
    
    await execute_query(
        "UPDATE game_rooms SET players = %s WHERE room_id = %s",
        (json.dumps(players), room_id)
    )
    
    return {"message": "Joined room successfully"}

@api_router.post("/rooms/{room_id}/leave")
async def leave_room(room_id: str, user: dict = Depends(get_current_user)):
    room = await execute_query(
        "SELECT players FROM game_rooms WHERE room_id = %s",
        (room_id,), fetch_one=True
    )
    
    if room:
        players = json.loads(room['players']) if room['players'] else []
        if user["user_id"] in players:
            players.remove(user["user_id"])
        
        if not players:
            await execute_query("DELETE FROM game_rooms WHERE room_id = %s", (room_id,))
        else:
            await execute_query(
                "UPDATE game_rooms SET players = %s WHERE room_id = %s",
                (json.dumps(players), room_id)
            )
    
    return {"message": "Left room successfully"}

# ============ QUESTIONS ROUTES ============

@api_router.post("/rooms/{room_id}/start")
async def start_game_session(room_id: str, user: dict = Depends(get_current_user)):
    room = await execute_query(
        "SELECT * FROM game_rooms WHERE room_id = %s",
        (room_id,), fetch_one=True
    )
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if room["host_user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Only host can start game")
    
    # Get questions
    questions = await execute_query(
        "SELECT question_id, question_text, options, correct_answer, subject FROM questions WHERE subject = %s AND grade_level = %s LIMIT 20",
        (room["subject"], room["grade_level"]), fetch_all=True
    )
    
    if not questions:
        questions = await create_default_questions(room["subject"], room["grade_level"])
    
    import random
    questions = list(questions)
    random.shuffle(questions)
    questions = questions[:room["total_questions"]]
    
    session_id = f"session_{uuid.uuid4().hex[:12]}"
    question_ids = [q["question_id"] for q in questions]
    
    players = json.loads(room['players']) if room['players'] else []
    player_scores = {player_id: 0 for player_id in players}
    player_answers = {player_id: [] for player_id in players}
    
    await execute_query(
        """INSERT INTO game_sessions (session_id, room_id, current_question, questions, player_scores, player_answers, status)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (session_id, room_id, 0, json.dumps(question_ids), json.dumps(player_scores), json.dumps(player_answers), "active")
    )
    
    await execute_query(
        "UPDATE game_rooms SET status = 'playing' WHERE room_id = %s",
        (room_id,)
    )
    
    questions_data = []
    for q in questions:
        qd = dict(q)
        qd['options'] = json.loads(qd['options']) if isinstance(qd['options'], str) else qd['options']
        questions_data.append(qd)
    
    return {
        "session_id": session_id,
        "questions": questions_data,
        "total_questions": len(questions)
    }

@api_router.get("/sessions/{session_id}/question/{question_num}")
async def get_question(session_id: str, question_num: int, user: dict = Depends(get_current_user)):
    session = await execute_query(
        "SELECT questions FROM game_sessions WHERE session_id = %s",
        (session_id,), fetch_one=True
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    question_ids = json.loads(session['questions'])
    if question_num >= len(question_ids):
        raise HTTPException(status_code=404, detail="Question not found")
    
    question_id = question_ids[question_num]
    question = await execute_query(
        "SELECT question_id, subject, question_text, options FROM questions WHERE question_id = %s",
        (question_id,), fetch_one=True
    )
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    result = dict(question)
    result['options'] = json.loads(result['options']) if isinstance(result['options'], str) else result['options']
    result['question_number'] = question_num + 1
    result['total_questions'] = len(question_ids)
    
    return result

@api_router.post("/sessions/{session_id}/answer")
async def submit_answer(session_id: str, question_num: int, answer: int, user: dict = Depends(get_current_user)):
    session = await execute_query(
        "SELECT questions, player_scores, player_answers FROM game_sessions WHERE session_id = %s",
        (session_id,), fetch_one=True
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    question_ids = json.loads(session['questions'])
    question_id = question_ids[question_num]
    
    question = await execute_query(
        "SELECT correct_answer, options FROM questions WHERE question_id = %s",
        (question_id,), fetch_one=True
    )
    
    is_correct = answer == question['correct_answer']
    options = json.loads(question['options']) if isinstance(question['options'], str) else question['options']
    
    player_scores = json.loads(session['player_scores'])
    player_answers = json.loads(session['player_answers'])
    
    if is_correct:
        player_scores[user['user_id']] = player_scores.get(user['user_id'], 0) + 1
    
    if user['user_id'] not in player_answers:
        player_answers[user['user_id']] = []
    player_answers[user['user_id']].append(answer)
    
    await execute_query(
        "UPDATE game_sessions SET player_scores = %s, player_answers = %s WHERE session_id = %s",
        (json.dumps(player_scores), json.dumps(player_answers), session_id)
    )
    
    return {
        "is_correct": is_correct,
        "correct_answer": question['correct_answer'],
        "explanation": f"La respuesta correcta es: {options[question['correct_answer']]}"
    }

@api_router.get("/sessions/{session_id}/results")
async def get_game_results(session_id: str, user: dict = Depends(get_current_user)):
    session = await execute_query(
        "SELECT questions, player_scores FROM game_sessions WHERE session_id = %s",
        (session_id,), fetch_one=True
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    player_scores = json.loads(session['player_scores'])
    questions = json.loads(session['questions'])
    player_ids = list(player_scores.keys())
    
    if not player_ids:
        return {"session_id": session_id, "results": [], "winner": None}
    
    placeholders = ','.join(['%s'] * len(player_ids))
    players = await execute_query(
        f"SELECT user_id, username, user_tag FROM users WHERE user_id IN ({placeholders})",
        tuple(player_ids), fetch_all=True
    )
    
    results = []
    for player in players:
        score = player_scores.get(player['user_id'], 0)
        results.append({
            "user_id": player['user_id'],
            "username": f"{player['username']}#{player.get('user_tag', '0000')}",
            "score": score,
            "total_questions": len(questions)
        })
    
    results.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "session_id": session_id,
        "results": results,
        "winner": results[0] if results else None
    }

async def create_default_questions(subject: str, grade_level: str):
    default_questions = {
        "matematicas": {
            "10": [
                {"question_text": "¿Cuál es el resultado de 2³ + 4²?", "options": ["24", "20", "16", "18"], "correct_answer": 0},
                {"question_text": "La ecuación x² - 5x + 6 = 0 tiene como soluciones:", "options": ["x = 2, x = 3", "x = 1, x = 6", "x = -2, x = -3", "x = 2, x = -3"], "correct_answer": 0},
                {"question_text": "¿Cuál es la raíz cuadrada de 144?", "options": ["12", "14", "11", "13"], "correct_answer": 0},
                {"question_text": "Si 3x + 7 = 22, entonces x =", "options": ["5", "7", "4", "6"], "correct_answer": 0},
                {"question_text": "¿Cuánto es 15% de 200?", "options": ["30", "25", "35", "20"], "correct_answer": 0},
            ]
        },
        "lengua": {
            "10": [
                {"question_text": "¿Qué figura literaria se usa en 'Sus ojos eran dos luceros'?", "options": ["Metáfora", "Símil", "Hipérbole", "Personificación"], "correct_answer": 0},
                {"question_text": "¿Cuál es el sinónimo de 'efímero'?", "options": ["Pasajero", "Eterno", "Importante", "Grande"], "correct_answer": 0},
            ]
        },
        "ciencias": {
            "10": [
                {"question_text": "¿Cuál es la fórmula química del agua?", "options": ["H₂O", "CO₂", "O₂", "H₂O₂"], "correct_answer": 0},
                {"question_text": "¿Cuántos planetas hay en el sistema solar?", "options": ["8", "9", "7", "10"], "correct_answer": 0},
            ]
        },
        "sociales": {
            "10": [
                {"question_text": "¿En qué año comenzó la Segunda Guerra Mundial?", "options": ["1939", "1914", "1945", "1940"], "correct_answer": 0},
                {"question_text": "¿Cuál es la capital de Francia?", "options": ["París", "Londres", "Madrid", "Roma"], "correct_answer": 0},
            ]
        }
    }
    
    questions = []
    if subject in default_questions:
        grade_questions = default_questions[subject].get(grade_level, default_questions[subject].get("10", []))
        for q_data in grade_questions:
            question_id = f"q_{uuid.uuid4().hex[:12]}"
            await execute_query(
                """INSERT INTO questions (question_id, subject, grade_level, question_text, options, correct_answer, difficulty)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (question_id, subject, grade_level, q_data["question_text"], json.dumps(q_data["options"]), q_data["correct_answer"], "medium")
            )
            questions.append({
                "question_id": question_id,
                "subject": subject,
                "question_text": q_data["question_text"],
                "options": q_data["options"],
                "correct_answer": q_data["correct_answer"]
            })
    
    return questions

# ============ CHAT ROUTES ============

@api_router.get("/rooms/{room_id}/messages")
async def get_room_messages(room_id: str, user: dict = Depends(get_current_user)):
    messages = await execute_query(
        "SELECT message_id, room_id, user_id, username, message, timestamp FROM chat_messages WHERE room_id = %s ORDER BY timestamp ASC LIMIT 100",
        (room_id,), fetch_all=True
    )
    return [dict(m) for m in messages]

# ============ WEBSOCKET ============

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008)
            return
        
        user = await execute_query(
            "SELECT user_id, username FROM users WHERE user_id = %s",
            (user_id,), fetch_one=True
        )
        if not user:
            await websocket.close(code=1008)
            return
        
    except JWTError:
        session = await execute_query(
            "SELECT user_id FROM user_sessions WHERE session_token = %s",
            (token,), fetch_one=True
        )
        if not session:
            await websocket.close(code=1008)
            return
        
        user = await execute_query(
            "SELECT user_id, username FROM users WHERE user_id = %s",
            (session['user_id'],), fetch_one=True
        )
        if not user:
            await websocket.close(code=1008)
            return
        user_id = user['user_id']
    
    await manager.connect(websocket, room_id, user_id)
    
    await manager.broadcast_to_room(room_id, {
        "type": "user_joined",
        "user_id": user_id,
        "username": user["username"]
    })
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "chat":
                message_id = f"msg_{uuid.uuid4().hex[:12]}"
                timestamp = datetime.now(timezone.utc)
                
                await execute_query(
                    """INSERT INTO chat_messages (message_id, room_id, user_id, username, message, timestamp)
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    (message_id, room_id, user_id, user["username"], data["message"], timestamp)
                )
                
                await manager.broadcast_to_room(room_id, {
                    "type": "chat",
                    "user_id": user_id,
                    "username": user["username"],
                    "message": data["message"],
                    "timestamp": timestamp.isoformat()
                })
            
            elif data["type"] == "game_action":
                await manager.broadcast_to_room(room_id, {
                    "type": "game_action",
                    "user_id": user_id,
                    "action": data["action"],
                    "data": data.get("data", {})
                })
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id, user_id)
        await manager.broadcast_to_room(room_id, {
            "type": "user_left",
            "user_id": user_id,
            "username": user["username"]
        })

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    await init_database()
    print("✅ MySQL Database connected and initialized!")

@app.on_event("shutdown")
async def shutdown_event():
    global pool
    if pool:
        pool.close()
        await pool.wait_closed()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
