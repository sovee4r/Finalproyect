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
ACCESS_TOKEN_EXPIRE_DAYS = 7

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
    status: str = "waiting"  # "waiting", "playing", "finished"
    created_at: datetime

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
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "username": user_data["name"],
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
    
    # Store session
    session_token = user_data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
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
        {"_id": 0, "user_id": 1, "username": 1, "picture": 1}
    ).to_list(100)
    
    return friends

@api_router.post("/friends/add")
async def add_friend(friend_email: str, user: dict = Depends(get_current_user)):
    """Send friend request"""
    friend_doc = await db.users.find_one({"email": friend_email}, {"_id": 0})
    if not friend_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if friend_doc["user_id"] == user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot add yourself as friend")
    
    # Check if already friends
    existing = await db.friendships.find_one({
        "$or": [
            {"user_id": user["user_id"], "friend_id": friend_doc["user_id"]},
            {"user_id": friend_doc["user_id"], "friend_id": user["user_id"]}
        ]
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already friends")
    
    friendship_doc = {
        "friendship_id": f"friend_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "friend_id": friend_doc["user_id"],
        "status": "accepted",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.friendships.insert_one(friendship_doc)
    
    return {"message": "Friend added successfully", "friend": friend_doc}

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
async def create_room(room_name: str, max_players: int = 4, user: dict = Depends(get_current_user)):
    """Create a new game room"""
    room_id = f"room_{uuid.uuid4().hex[:8]}"
    
    room_doc = {
        "room_id": room_id,
        "name": room_name,
        "host_user_id": user["user_id"],
        "players": [user["user_id"]],
        "max_players": max_players,
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
