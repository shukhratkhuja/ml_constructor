from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import pandas as pd
from pathlib import Path
from typing import List
import uuid

from database import get_db
from models import User, Project, AdditionalFile as AdditionalFileModel
from schemas import AdditionalFile, AdditionalFileColumnMapping, DataSourceInfo
from routers.auth import get_current_user
from config import settings

router = APIRouter()

@router.post("/projects/{project_id}/additional-files/upload")
async def upload_additional_file(
    project_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload an additional file for the project"""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Validate file type
    allowed_extensions = {'.csv', '.json', '.xlsx', '.xls'}
    file_extension = Path(file.filename).suffix.lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not supported. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Create unique filename
    unique_filename = f"additional_{project_id}_{uuid.uuid4()}{file_extension}"
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
        
        # Create database record
        additional_file = AdditionalFileModel(
            project_id=project_id,
            file_name=file.filename,
            file_path=str(file_path),
            file_type=file_extension[1:]  # Remove the dot
        )
        
        db.add(additional_file)
        db.commit()
        db.refresh(additional_file)
        
        # Get file info
        columns = df.columns.tolist()
        row_count = len(df)
        sample_data = df.head(5).to_dict('records')
        
        return {
            "additional_file": additional_file,
            "source_info": {
                "source_type": "additional_file",
                "columns": columns,
                "row_count": row_count,
                "sample_data": sample_data
            }
        }
        
    except Exception as e:
        # Clean up file if processing failed
        file_path.unlink(missing_ok=True)
        if additional_file:
            db.delete(additional_file)
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing file: {str(e)}"
        )

@router.get("/projects/{project_id}/additional-files", response_model=List[AdditionalFile])
def get_additional_files(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all additional files for a project"""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    additional_files = db.query(AdditionalFileModel).filter(
        AdditionalFileModel.project_id == project_id
    ).all()
    
    return additional_files

@router.get("/projects/{project_id}/additional-files/{file_id}/preview")
def preview_additional_file(
    project_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Preview data from an additional file"""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get additional file
    additional_file = db.query(AdditionalFileModel).filter(
        AdditionalFileModel.id == file_id,
        AdditionalFileModel.project_id == project_id
    ).first()
    
    if not additional_file:
        raise HTTPException(status_code=404, detail="Additional file not found")
    
    try:
        # Read file
        file_path = Path(additional_file.file_path)
        if additional_file.file_type == 'csv':
            df = pd.read_csv(file_path)
        elif additional_file.file_type == 'json':
            df = pd.read_json(file_path)
        elif additional_file.file_type in ['xlsx', 'xls']:
            df = pd.read_excel(file_path)
        
        return {
            "columns": df.columns.tolist(),
            "row_count": len(df),
            "sample_data": df.head(10).to_dict('records'),
            "date_column": additional_file.date_column,
            "selected_columns": additional_file.selected_columns,
            "column_aggregations": additional_file.column_aggregations
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading file: {str(e)}"
        )

@router.post("/projects/{project_id}/additional-files/{file_id}/map-columns")
def map_additional_file_columns(
    project_id: int,
    file_id: int,
    mapping: AdditionalFileColumnMapping,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Map columns for an additional file"""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get additional file
    additional_file = db.query(AdditionalFileModel).filter(
        AdditionalFileModel.id == file_id,
        AdditionalFileModel.project_id == project_id
    ).first()
    
    if not additional_file:
        raise HTTPException(status_code=404, detail="Additional file not found")
    
    # Update column mappings
    additional_file.date_column = mapping.date_column
    additional_file.selected_columns = mapping.selected_columns
    additional_file.column_aggregations = mapping.column_aggregations
    additional_file.fill_method = mapping.fill_method
    
    db.commit()
    db.refresh(additional_file)
    
    return additional_file

@router.delete("/projects/{project_id}/additional-files/{file_id}")
def delete_additional_file(
    project_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an additional file"""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get additional file
    additional_file = db.query(AdditionalFileModel).filter(
        AdditionalFileModel.id == file_id,
        AdditionalFileModel.project_id == project_id
    ).first()
    
    if not additional_file:
        raise HTTPException(status_code=404, detail="Additional file not found")
    
    # Delete file from disk
    file_path = Path(additional_file.file_path)
    if file_path.exists():
        file_path.unlink()
    
    # Delete from database
    db.delete(additional_file)
    db.commit()
    
    return {"message": "Additional file deleted successfully"}

@router.get("/aggregation-options")
def get_aggregation_options():
    """Get available aggregation options"""
    return {
        "periods": {
            "daily_to_weekly": "Daily to Weekly",
            "daily_to_monthly": "Daily to Monthly",
            "weekly_to_monthly": "Weekly to Monthly"
        },
        "aggregation_functions": {
            "mean": "Mean (Average)",
            "sum": "Sum (Total)",
            "max": "Maximum",
            "min": "Minimum",
            "median": "Median",
            "std": "Standard Deviation",
            "count": "Count"
        },
        "fill_methods": {
            "zero": "Fill with Zero",
            "forward": "Forward Fill",
            "backward": "Backward Fill",
            "mean": "Fill with Mean",
            "interpolate": "Linear Interpolation"
        }
    }