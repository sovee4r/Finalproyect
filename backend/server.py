from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-this-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 90  # 90 días para evitar re-login frecuente

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}  # room_id: [websockets]
        self.user_connections: Dict[str, WebSocket] = {}  # user_id: websocket
    
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

class User(BaseModel):
    user_id: str
    username: str
    user_tag: Optional[str] = None
    email: str
    picture: Optional[str] = None
    created_at: datetime

class CharacterCustomization(BaseModel):
    avatar: str = "👤"
    color: str = "#a855f7"
    accessories: List[str] = []

class Character(BaseModel):
    character_id: str
    user_id: str
    customization: CharacterCustomization
    inventory: List[str] = []
    score: int = 0

class Friend(BaseModel):
    user_id: str
    username: str
    picture: Optional[str] = None
    status: str  # "pending", "accepted"

class GameRoom(BaseModel):
    room_id: str
    name: str
    host_user_id: str
    players: List[str] = []
    max_players: int = 4
    game_mode: str = "normal"  # "normal" o "competencia"
    subject: str = "matematicas"  # materias: matematicas, lengua, ciencias, sociales
    grade_level: str = "10"  # 10, 11, 12 (últimos 3 años de secundaria)
    time_per_question: int = 30  # segundos por pregunta
    total_questions: int = 10  # cantidad de preguntas
    status: str = "waiting"  # "waiting", "playing", "finished"
    created_at: datetime

class Question(BaseModel):
    question_id: str
    subject: str  # matematicas, lengua, ciencias, sociales
    grade_level: str  # 10, 11, 12
    question_text: str
    options: List[str]  # 4 opciones
    correct_answer: int  # índice de la respuesta correcta (0-3)
    difficulty: str = "medium"  # easy, medium, hard

class GameSession(BaseModel):
    session_id: str
    room_id: str
    current_question: int = 0
    questions: List[str] = []  # IDs de preguntas
    player_scores: Dict[str, int] = {}
    player_answers: Dict[str, List[int]] = {}  # user_id: [respuestas]
    started_at: datetime
    status: str = "active"  # active, finished

class ChatMessage(BaseModel):
    message_id: str
    room_id: str
    user_id: str
    username: str
    message: str
    timestamp: datetime

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
    """Get current user from session_token (cookie or Authorization header)"""
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        # Fallback to Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if it's a JWT token (traditional auth)
    try:
        payload = jwt.decode(session_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user_doc
    except JWTError:
        # Not a JWT, check if it's an Emergent OAuth session
        session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if not session_doc:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        # Check expiry
        expires_at = session_doc["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
        
        user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user_doc

# ============ AUTHENTICATION ROUTES ============

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    """Traditional registration with email/password"""
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate unique user tag (4 digits)
    import random
    user_tag = None
    max_attempts = 10
    for _ in range(max_attempts):
        user_tag = f"{random.randint(1000, 9999)}"
        # Check if username#tag combination exists
        existing_tag = await db.users.find_one({
            "username": user_data.username,
            "user_tag": user_tag
        })
        if not existing_tag:
            break
    
    if not user_tag:
        raise HTTPException(status_code=500, detail="Could not generate unique user tag")
    
    # Create user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_password = hash_password(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "username": user_data.username,
        "user_tag": user_tag,
        "email": user_data.email,
        "password_hash": hashed_password,
        "picture": None,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(user_doc)
    
    # Create default character
    character_doc = {
        "character_id": f"char_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "customization": {
            "avatar": "👤",
            "color": "#a855f7",
            "accessories": []
        },
        "inventory": [],
        "score": 0
    }
    await db.characters.insert_one(character_doc)
    
    # Create token
    token = create_access_token(user_id)
    
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    
    return {"access_token": token, "token_type": "bearer", "user": user_doc}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    """Traditional login with email/password"""
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc or not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(user_doc["user_id"])
    
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    
    return {"access_token": token, "token_type": "bearer", "user": user_doc}

@api_router.get("/auth/session")
async def process_google_session(request: Request, response: Response):
    """Process Google OAuth session from Emergent Auth"""
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Get user data from Emergent Auth
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
    user_doc = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    
    if user_doc:
        user_id = user_doc["user_id"]
        # Update user tag if doesn't exist (for existing users)
        if "user_tag" not in user_doc:
            import random
            user_tag = f"{random.randint(1000, 9999)}"
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"user_tag": user_tag}}
            )
            user_doc["user_tag"] = user_tag
    else:
        # Create new user
        import random
        user_tag = f"{random.randint(1000, 9999)}"
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "username": user_data["name"],
            "user_tag": user_tag,
            "email": user_data["email"],
            "picture": user_data.get("picture"),
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(user_doc)
        
        # Create default character
        character_doc = {
            "character_id": f"char_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "customization": {
                "avatar": "👤",
                "color": "#a855f7",
                "accessories": []
            },
            "inventory": [],
            "score": 0
        }
        await db.characters.insert_one(character_doc)
    
    # Store session with 90 days expiry
    session_token = user_data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=90)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    user_doc.pop("_id", None)
    user_doc.pop("password_hash", None)
    
    return {"user": user_doc, "session_token": session_token}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current authenticated user"""
    user.pop("password_hash", None)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============ USER & CHARACTER ROUTES ============

@api_router.get("/users/me/character")
async def get_my_character(user: dict = Depends(get_current_user)):
    """Get current user's character"""
    character_doc = await db.characters.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not character_doc:
        raise HTTPException(status_code=404, detail="Character not found")
    return character_doc

@api_router.put("/users/me/character")
async def update_my_character(customization: CharacterCustomization, user: dict = Depends(get_current_user)):
    """Update character customization"""
    result = await db.characters.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"customization": customization.model_dump()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Character not found")
    
    character_doc = await db.characters.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return character_doc

@api_router.post("/users/me/score")
async def update_score(score_delta: int, user: dict = Depends(get_current_user)):
    """Update user's score"""
    await db.characters.update_one(
        {"user_id": user["user_id"]},
        {"$inc": {"score": score_delta}}
    )
    character_doc = await db.characters.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {"score": character_doc["score"]}

# ============ FRIENDS ROUTES ============

@api_router.get("/friends")
async def get_friends(user: dict = Depends(get_current_user)):
    """Get user's friends list"""
    friendships = await db.friendships.find(
        {"$or": [{"user_id": user["user_id"]}, {"friend_id": user["user_id"]}]},
        {"_id": 0}
    ).to_list(100)
    
    friend_ids = []
    for friendship in friendships:
        if friendship["user_id"] == user["user_id"]:
            friend_ids.append(friendship["friend_id"])
        else:
            friend_ids.append(friendship["user_id"])
    
    friends = await db.users.find(
        {"user_id": {"$in": friend_ids}},
        {"_id": 0, "user_id": 1, "username": 1, "user_tag": 1, "picture": 1}
    ).to_list(100)
    
    return friends

@api_router.post("/friends/add")
async def add_friend(friend_identifier: str, user: dict = Depends(get_current_user)):
    """Send friend request using username#tag format"""
    # Parse username#tag
    if '#' not in friend_identifier:
        raise HTTPException(status_code=400, detail="Use format: username#1234")
    
    parts = friend_identifier.split('#')
    if len(parts) != 2:
        raise HTTPException(status_code=400, detail="Invalid format. Use: username#1234")
    
    friend_username, friend_tag = parts
    
    # Find friend by username and tag
    friend_doc = await db.users.find_one({
        "username": friend_username,
        "user_tag": friend_tag
    }, {"_id": 0})
    
    if not friend_doc:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if friend_doc["user_id"] == user["user_id"]:
        raise HTTPException(status_code=400, detail="No puedes agregarte a ti mismo")
    
    # Check if already friends
    existing = await db.friendships.find_one({
        "$or": [
            {"user_id": user["user_id"], "friend_id": friend_doc["user_id"]},
            {"user_id": friend_doc["user_id"], "friend_id": user["user_id"]}
        ]
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Ya son amigos")
    
    friendship_doc = {
        "friendship_id": f"friend_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "friend_id": friend_doc["user_id"],
        "status": "accepted",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.friendships.insert_one(friendship_doc)
    
    return {"message": "Amigo agregado exitosamente", "friend": friend_doc}

# ============ GAME ROOMS ROUTES ============

@api_router.get("/rooms")
async def get_rooms(user: dict = Depends(get_current_user)):
    """Get all available game rooms"""
    rooms = await db.game_rooms.find(
        {"status": {"$in": ["waiting", "playing"]}},
        {"_id": 0}
    ).to_list(50)
    return rooms

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
    """Create a new game room with configuration"""
    room_id = f"room_{uuid.uuid4().hex[:8]}"
    
    room_doc = {
        "room_id": room_id,
        "name": room_name,
        "host_user_id": user["user_id"],
        "players": [user["user_id"]],  # Host se une automáticamente
        "max_players": max_players,
        "game_mode": game_mode,
        "subject": subject,
        "grade_level": grade_level,
        "time_per_question": time_per_question,
        "total_questions": total_questions,
        "status": "waiting",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.game_rooms.insert_one(room_doc)
    
    room_doc.pop("_id", None)
    return room_doc

@api_router.post("/rooms/{room_id}/join")
async def join_room(room_id: str, user: dict = Depends(get_current_user)):
    """Join a game room"""
    room_doc = await db.game_rooms.find_one({"room_id": room_id}, {"_id": 0})
    if not room_doc:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if len(room_doc["players"]) >= room_doc["max_players"]:
        raise HTTPException(status_code=400, detail="Room is full")
    
    if user["user_id"] in room_doc["players"]:
        raise HTTPException(status_code=400, detail="Already in room")
    
    await db.game_rooms.update_one(
        {"room_id": room_id},
        {"$push": {"players": user["user_id"]}}
    )
    
    return {"message": "Joined room successfully"}

@api_router.post("/rooms/{room_id}/leave")
async def leave_room(room_id: str, user: dict = Depends(get_current_user)):
    """Leave a game room"""
    await db.game_rooms.update_one(
        {"room_id": room_id},
        {"$pull": {"players": user["user_id"]}}
    )
    
    # Check if room is empty
    room_doc = await db.game_rooms.find_one({"room_id": room_id})
    if not room_doc["players"]:
        await db.game_rooms.delete_one({"room_id": room_id})
    
    return {"message": "Left room successfully"}

# ============ GAME QUESTIONS & SESSION ROUTES ============

@api_router.post("/rooms/{room_id}/start")
async def start_game_session(room_id: str, user: dict = Depends(get_current_user)):
    """Start a game session and generate questions"""
    room_doc = await db.game_rooms.find_one({"room_id": room_id}, {"_id": 0})
    if not room_doc:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if room_doc["host_user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Only host can start game")
    
    # Get questions for this subject and grade
    questions = await db.questions.find({
        "subject": room_doc["subject"],
        "grade_level": room_doc["grade_level"]
    }, {"_id": 0}).to_list(10)
    
    if not questions:
        # If no questions exist, create some default ones
        questions = await create_default_questions(room_doc["subject"], room_doc["grade_level"])
    
    # Limit to 10 questions and shuffle
    import random
    random.shuffle(questions)
    questions = questions[:10]
    
    # Create game session
    session_id = f"session_{uuid.uuid4().hex[:12]}"
    question_ids = [q["question_id"] for q in questions]
    
    # Initialize player scores
    player_scores = {player_id: 0 for player_id in room_doc["players"]}
    player_answers = {player_id: [] for player_id in room_doc["players"]}
    
    session_doc = {
        "session_id": session_id,
        "room_id": room_id,
        "current_question": 0,
        "questions": question_ids,
        "player_scores": player_scores,
        "player_answers": player_answers,
        "started_at": datetime.now(timezone.utc),
        "status": "active"
    }
    
    await db.game_sessions.insert_one(session_doc)
    
    # Update room status
    await db.game_rooms.update_one(
        {"room_id": room_id},
        {"$set": {"status": "playing"}}
    )
    
    return {
        "session_id": session_id,
        "questions": questions,
        "total_questions": len(questions)
    }

@api_router.get("/sessions/{session_id}/question/{question_num}")
async def get_question(session_id: str, question_num: int, user: dict = Depends(get_current_user)):
    """Get specific question for the game"""
    session_doc = await db.game_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if question_num >= len(session_doc["questions"]):
        raise HTTPException(status_code=404, detail="Question not found")
    
    question_id = session_doc["questions"][question_num]
    question_doc = await db.questions.find_one({"question_id": question_id}, {"_id": 0})
    
    if not question_doc:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Don't send correct answer to frontend
    question_response = question_doc.copy()
    question_response.pop("correct_answer", None)
    question_response["question_number"] = question_num + 1
    question_response["total_questions"] = len(session_doc["questions"])
    
    return question_response

@api_router.post("/sessions/{session_id}/answer")
async def submit_answer(
    session_id: str,
    question_num: int,
    answer: int,
    user: dict = Depends(get_current_user)
):
    """Submit answer for a question"""
    session_doc = await db.game_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get the question
    question_id = session_doc["questions"][question_num]
    question_doc = await db.questions.find_one({"question_id": question_id}, {"_id": 0})
    
    # Check if answer is correct
    is_correct = answer == question_doc["correct_answer"]
    
    # Update player score
    if is_correct:
        await db.game_sessions.update_one(
            {"session_id": session_id},
            {"$inc": {f"player_scores.{user['user_id']}": 1}}
        )
    
    # Record answer
    await db.game_sessions.update_one(
        {"session_id": session_id},
        {"$push": {f"player_answers.{user['user_id']}": answer}}
    )
    
    return {
        "is_correct": is_correct,
        "correct_answer": question_doc["correct_answer"],
        "explanation": f"La respuesta correcta es: {question_doc['options'][question_doc['correct_answer']]}"
    }

@api_router.get("/sessions/{session_id}/results")
async def get_game_results(session_id: str, user: dict = Depends(get_current_user)):
    """Get final game results"""
    session_doc = await db.game_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get player usernames
    player_ids = list(session_doc["player_scores"].keys())
    players = await db.users.find(
        {"user_id": {"$in": player_ids}},
        {"_id": 0, "user_id": 1, "username": 1, "user_tag": 1}
    ).to_list(100)
    
    # Build results
    results = []
    for player in players:
        score = session_doc["player_scores"].get(player["user_id"], 0)
        results.append({
            "user_id": player["user_id"],
            "username": f"{player['username']}#{player.get('user_tag', '0000')}",
            "score": score,
            "total_questions": len(session_doc["questions"])
        })
    
    # Sort by score
    results.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "session_id": session_id,
        "results": results,
        "winner": results[0] if results else None
    }

async def create_default_questions(subject: str, grade_level: str):
    """Create default questions if none exist"""
    default_questions = {
        "matematicas": {
            "10": [
                {
                    "question_text": "¿Cuál es el resultado de 2³ + 4²?",
                    "options": ["24", "20", "16", "18"],
                    "correct_answer": 0
                },
                {
                    "question_text": "La ecuación x² - 5x + 6 = 0 tiene como soluciones:",
                    "options": ["x = 2, x = 3", "x = 1, x = 6", "x = -2, x = -3", "x = 2, x = -3"],
                    "correct_answer": 0
                }
            ],
            "11": [
                {
                    "question_text": "¿Cuál es la derivada de f(x) = x³?",
                    "options": ["3x²", "x²", "3x", "x³"],
                    "correct_answer": 0
                }
            ],
            "12": [
                {
                    "question_text": "La integral de 2x dx es:",
                    "options": ["x² + C", "2x² + C", "x²/2 + C", "2x + C"],
                    "correct_answer": 0
                }
            ]
        },
        "lengua": {
            "10": [
                {
                    "question_text": "¿Qué figura literaria se usa en 'Sus ojos eran dos luceros'?",
                    "options": ["Metáfora", "Símil", "Hipérbole", "Personificación"],
                    "correct_answer": 0
                }
            ]
        },
        "ciencias": {
            "10": [
                {
                    "question_text": "¿Cuál es la fórmula química del agua?",
                    "options": ["H₂O", "CO₂", "O₂", "H₂O₂"],
                    "correct_answer": 0
                }
            ]
        },
        "sociales": {
            "10": [
                {
                    "question_text": "¿En qué año comenzó la Segunda Guerra Mundial?",
                    "options": ["1939", "1914", "1945", "1940"],
                    "correct_answer": 0
                }
            ]
        }
    }
    
    questions = []
    if subject in default_questions and grade_level in default_questions[subject]:
        for q_data in default_questions[subject][grade_level]:
            question_id = f"q_{uuid.uuid4().hex[:12]}"
            question_doc = {
                "question_id": question_id,
                "subject": subject,
                "grade_level": grade_level,
                "question_text": q_data["question_text"],
                "options": q_data["options"],
                "correct_answer": q_data["correct_answer"],
                "difficulty": "medium"
            }
            await db.questions.insert_one(question_doc)
            questions.append(question_doc)
    
    return questions

# ============ WEBSOCKET ROUTE ============

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, token: str):
    """WebSocket for real-time game and chat"""
    try:
        # Verify token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008)
            return
        
        user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user_doc:
            await websocket.close(code=1008)
            return
        
    except JWTError:
        # Try Emergent session
        session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
        if not session_doc:
            await websocket.close(code=1008)
            return
        
        user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
        if not user_doc:
            await websocket.close(code=1008)
            return
        user_id = user_doc["user_id"]
    
    await manager.connect(websocket, room_id, user_id)
    
    # Notify room that user joined
    await manager.broadcast_to_room(room_id, {
        "type": "user_joined",
        "user_id": user_id,
        "username": user_doc["username"]
    })
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "chat":
                # Save message
                message_doc = {
                    "message_id": f"msg_{uuid.uuid4().hex[:12]}",
                    "room_id": room_id,
                    "user_id": user_id,
                    "username": user_doc["username"],
                    "message": data["message"],
                    "timestamp": datetime.now(timezone.utc)
                }
                await db.chat_messages.insert_one(message_doc)
                
                # Broadcast to room
                await manager.broadcast_to_room(room_id, {
                    "type": "chat",
                    "user_id": user_id,
                    "username": user_doc["username"],
                    "message": data["message"],
                    "timestamp": message_doc["timestamp"].isoformat()
                })
            
            elif data["type"] == "game_action":
                # Broadcast game action to room
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
            "username": user_doc["username"]
        })

# ============ CHAT ROUTES ============

@api_router.get("/rooms/{room_id}")
async def get_room(room_id: str, user: dict = Depends(get_current_user)):
    """Get room details"""
    room_doc = await db.game_rooms.find_one({"room_id": room_id}, {"_id": 0})
    if not room_doc:
        raise HTTPException(status_code=404, detail="Room not found")
    return room_doc

@api_router.get("/rooms/{room_id}/messages")
async def get_room_messages(room_id: str, user: dict = Depends(get_current_user)):
    """Get chat messages for a room"""
    messages = await db.chat_messages.find(
        {"room_id": room_id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(100)
    
    return messages

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
