from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import FRONTEND_ORIGIN
from database import init_db
from routes.auth import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist on startup
    try:
        await init_db()
        print("Database schema verified / initialized successfully.")
    except Exception as e:
        print(f"Warning: Database initialization failed during startup: {e}")
    yield

app = FastAPI(
    title="Forbusyness Web ERP API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration: must explicitly allow frontend origin with credentials enabled
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount auth routes under both /api/auth and /auth for compatibility
app.include_router(auth_router, prefix="/api/auth")
app.include_router(auth_router, prefix="/auth")

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "forbusyness-api"}
