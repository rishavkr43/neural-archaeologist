from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from app.database import engine
from app.models import Base
from app.config import settings
from app.utils.websocket import sio

# Create all database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Neural Archaeologist API",
    description="Multi-Agent AI System for Code History Excavation",
    version="1.0.0",
    debug=settings.DEBUG
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routes
from app.routes.auth import router as auth_router
from app.routes.investigations import router as investigations_router

app.include_router(auth_router)
app.include_router(investigations_router)

# Startup event
@app.on_event("startup")
async def startup_event():
    print("✅ Database tables created successfully")
    print("✅ WebSocket server ready")
    print("📊 API Docs: http://127.0.0.1:8000/docs")
    print("💚 Health: http://127.0.0.1:8000/health")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Neural Archaeologist API is running"}

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to Neural Archaeologist API",
        "docs": "/docs",
        "health": "/health",
        "websocket": "/socket.io"
    }

# Create ASGI app with Socket.IO
socket_app = socketio.ASGIApp(
    sio,
    app,
    socketio_path='/socket.io'
)