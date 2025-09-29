from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from database import get_db, engine
from models import Base
from routers import auth, data_source, features, models as model_router, projects, additional_files, aggregation
from config import settings

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ML Constructor", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Create saved_models directory
MODELS_DIR = Path("saved_models")
MODELS_DIR.mkdir(exist_ok=True)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(data_source.router, prefix="/api/data-source", tags=["data-source"])
app.include_router(additional_files.router, prefix="/api/additional-files", tags=["additional-files"])
app.include_router(aggregation.router, prefix="/api/aggregation", tags=["aggregation"])
app.include_router(features.router, prefix="/api/features", tags=["features"])
app.include_router(model_router.router, prefix="/api/models", tags=["models"])
app.include_router(projects.router, prefix="/api", tags=["projects"])

@app.get("/")
def read_root():
    return {"message": "ML Constructor API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)