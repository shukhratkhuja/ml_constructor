from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from pathlib import Path
import os

from database import engine, Base
from routers import auth, data_source, features, models as model_router, projects
from config import settings

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ML Constructor", version="1.0.0", debug=True)

# CORS middleware - IMPORTANT: This must be before other middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads and models directories
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
MODELS_DIR = Path("saved_models")
MODELS_DIR.mkdir(exist_ok=True)

# Include routers with /api prefix
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(data_source.router, prefix="/api/data-source", tags=["data-source"])
app.include_router(features.router, prefix="/api/features", tags=["features"])
app.include_router(model_router.router, prefix="/api/models", tags=["models"])
app.include_router(projects.router, prefix="/api", tags=["projects"])

@app.get("/")
def read_root():
    return {"message": "ML Constructor API is running", "version": "1.0.0"}

@app.get("/api")
def api_root():
    return {"message": "ML Constructor API", "status": "healthy"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "message": "API is working"}

# Additional health check endpoint
@app.get("/health")
def simple_health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)