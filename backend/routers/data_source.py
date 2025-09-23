from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
import pandas as pd
import json
from pathlib import Path
from typing import List
import uuid

from database import get_db
from models import User, Project, DatabaseConnection
from schemas import (
    DatabaseConnectionCreate, DatabaseConnectionTest, DatabaseConnection as DBConnectionSchema,
    DataSourceInfo, ProjectCreate, Project as ProjectSchema, ProjectUpdate
)
from routers.auth import get_current_user
from config import settings

router = APIRouter()

@router.post("/upload-file")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate file type
    allowed_extensions = {'.csv', '.json', '.xlsx', '.xls'}
    file_extension = Path(file.filename).suffix.lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not supported. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Create unique filename
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = Path(settings.UPLOAD_DIR) / unique_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        if len(content) > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File too large"
            )
        buffer.write(content)
    
    # Read and analyze file
    try:
        if file_extension == '.csv':
            df = pd.read_csv(file_path)
        elif file_extension == '.json':
            df = pd.read_json(file_path)
        elif file_extension in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path)
        
        # Get file info
        columns = df.columns.tolist()
        row_count = len(df)
        sample_data = df.head(5).to_dict('records')
        
        return {
            "file_path": str(file_path),
            "source_info": {
                "source_type": "file",
                "columns": columns,
                "row_count": row_count,
                "sample_data": sample_data
            }
        }
        
    except Exception as e:
        # Clean up file if processing failed
        file_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing file: {str(e)}"
        )

@router.post("/test-db-connection")
def test_db_connection(connection: DatabaseConnectionTest):
    try:
        # Create connection string
        connection_url = f"postgresql://{connection.username}:{connection.password}@{connection.host}:{connection.port}/{connection.database}"
        
        # Test connection
        engine = create_engine(connection_url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()
        
        return {"success": True, "message": "Connection successful"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Connection failed: {str(e)}"
        )

@router.post("/db-connections", response_model=DBConnectionSchema)
def create_db_connection(
    connection: DatabaseConnectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Test connection first
    try:
        connection_url = f"postgresql://{connection.username}:{connection.password}@{connection.host}:{connection.port}/{connection.database}"
        engine = create_engine(connection_url)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Connection failed: {str(e)}"
        )
    
    # Save connection
    db_connection = DatabaseConnection(
        name=connection.name,
        host=connection.host,
        port=connection.port,
        database=connection.database,
        username=connection.username,
        password=connection.password,  # In production, encrypt this
        user_id=current_user.id
    )
    
    db.add(db_connection)
    db.commit()
    db.refresh(db_connection)
    
    return db_connection

@router.get("/db-connections", response_model=List[DBConnectionSchema])
def get_db_connections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(DatabaseConnection).filter(DatabaseConnection.user_id == current_user.id).all()

@router.get("/db-connections/{connection_id}/tables")
def get_db_tables(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get connection
    db_connection = db.query(DatabaseConnection).filter(
        DatabaseConnection.id == connection_id,
        DatabaseConnection.user_id == current_user.id
    ).first()
    
    if not db_connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    try:
        connection_url = f"postgresql://{db_connection.username}:{db_connection.password}@{db_connection.host}:{db_connection.port}/{db_connection.database}"
        engine = create_engine(connection_url)
        
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public'
                ORDER BY tablename
            """))
            tables = [row[0] for row in result]
        
        return {"tables": tables}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching tables: {str(e)}"
        )

@router.get("/db-connections/{connection_id}/tables/{table_name}/preview")
def preview_db_table(
    connection_id: int,
    table_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get connection
    db_connection = db.query(DatabaseConnection).filter(
        DatabaseConnection.id == connection_id,
        DatabaseConnection.user_id == current_user.id
    ).first()
    
    if not db_connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    try:
        connection_url = f"postgresql://{db_connection.username}:{db_connection.password}@{db_connection.host}:{db_connection.port}/{db_connection.database}"
        
        # Get table info using pandas
        df = pd.read_sql(f"SELECT * FROM {table_name} LIMIT 5", connection_url)
        
        # Get total count
        engine = create_engine(connection_url)
        with engine.connect() as conn:
            result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
            row_count = result.fetchone()[0]
        
        return {
            "source_info": {
                "source_type": "db",
                "columns": df.columns.tolist(),
                "row_count": row_count,
                "sample_data": df.to_dict('records')
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error previewing table: {str(e)}"
        )