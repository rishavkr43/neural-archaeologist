from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes.investigations import router as investigations_router

# Initialize FastAPI app FIRST
app = FastAPI(
    title="Neural Archaeologist API",
    description="Multi-Agent AI System for Code History Excavation",
    version="1.0.0",
    debug=settings.DEBUG
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Import and include auth routes
from app.routes.auth import router as auth_router
app.include_router(auth_router)

# Include investigation routes
app.include_router(investigations_router)

# Startup event - create tables after app is ready
@app.on_event("startup")
async def startup_event():
    from app.database import engine
    from app.models import Base
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")

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
        "health": "/health"
    }