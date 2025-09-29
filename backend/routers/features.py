from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
from typing import Dict, Any, List

from database import get_db
from models import User, Project, AggregatedData, GeneratedFeatures
from schemas import DateFeatures, NumericalFeatures, ProjectUpdate
from routers.auth import get_current_user

router = APIRouter()

def generate_date_features(df: pd.DataFrame, date_column: str, features: DateFeatures) -> pd.DataFrame:
    """Generate date-based features"""
    df = df.copy()
    df[date_column] = pd.to_datetime(df[date_column])
    
    if features.month:
        df['date_month'] = df[date_column].dt.month
    
    if features.year:
        df['date_year'] = df[date_column].dt.year
    
    if features.quarter:
        df['date_quarter'] = df[date_column].dt.quarter
    
    if features.month_sin:
        df['date_month_sin'] = np.sin(2 * np.pi * df[date_column].dt.month / 12)
    
    if features.month_cos:
        df['date_month_cos'] = np.cos(2 * np.pi * df[date_column].dt.month / 12)
    
    if features.quarter_sin:
        df['date_quarter_sin'] = np.sin(2 * np.pi * df[date_column].dt.quarter / 4)
    
    if features.quarter_cos:
        df['date_quarter_cos'] = np.cos(2 * np.pi * df[date_column].dt.quarter / 4)
    
    # Holiday features (simplified - you can expand these)
    if features.number_of_holidays_governmental:
        df['date_number_of_holidays_governmental'] = 0
    
    if features.number_of_holidays_religious:
        df['date_number_of_holidays_religious'] = 0
    
    if features.periods_until_next_governmental_holiday:
        df['date_periods_until_next_governmental_holiday'] = 0
    
    if features.periods_until_next_religious_holiday:
        df['date_periods_until_next_religious_holiday'] = 0
    
    if features.number_of_ramadan_days_in_month:
        df['date_number_of_ramadan_days_in_month'] = 0
    
    return df

def generate_numerical_features(df: pd.DataFrame, value_columns: List[str], features: NumericalFeatures) -> pd.DataFrame:
    """Generate numerical features for all value columns"""
    df = df.copy()
    
    for value_column in value_columns:
        if value_column not in df.columns:
            continue
        
        # Create prefix based on column name
        prefix = value_column.replace(' ', '_').lower()
        
        # Lag features
        for lag in features.lag_periods:
            df[f'{prefix}_lag_{lag}'] = df[value_column].shift(lag)
        
        # Rolling window features
        for window in features.rolling_windows:
            if features.include_statistics:
                df[f'{prefix}_rolling_{window}_mean'] = df[value_column].rolling(window=window).mean()
                df[f'{prefix}_rolling_{window}_std'] = df[value_column].rolling(window=window).std()
                df[f'{prefix}_rolling_{window}_min'] = df[value_column].rolling(window=window).min()
                df[f'{prefix}_rolling_{window}_max'] = df[value_column].rolling(window=window).max()
            else:
                df[f'{prefix}_rolling_{window}'] = df[value_column].rolling(window=window).mean()
        
        # Trend features
        if features.include_trend_features:
            for period in features.trend_periods:
                df[f'{prefix}_trend_{period}'] = df[value_column].rolling(window=period).apply(
                    lambda x: np.polyfit(range(len(x)), x, 1)[0] if len(x) == period else np.nan
                )
        
        # Change features
        for period in features.change_periods:
            df[f'{prefix}_change_{period}'] = df[value_column].pct_change(periods=period)
    
    return df

@router.post("/projects/{project_id}/generate-features")
def generate_features(
    project_id: int,
    date_features: DateFeatures,
    numerical_features: NumericalFeatures,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate features from aggregated data"""
    # Get project
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not project.aggregation_completed:
        raise HTTPException(status_code=400, detail="Data aggregation must be completed first")
    
    # Get aggregated data
    aggregated_data = db.query(AggregatedData).filter(
        AggregatedData.project_id == project_id
    ).first()
    
    if not aggregated_data:
        raise HTTPException(status_code=404, detail="No aggregated data found")
    
    try:
        # Load aggregated data into DataFrame
        df = pd.DataFrame(aggregated_data.data)
        
        # Generate date features
        if project.date_column:
            df = generate_date_features(df, project.date_column, date_features)
        
        # Identify all numeric columns for feature generation
        numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
        
        # Remove date-related columns from numeric processing
        date_feature_cols = [col for col in df.columns if col.startswith('date_')]
        numeric_columns = [col for col in numeric_columns if col not in date_feature_cols]
        
        # Generate numerical features for all numeric columns
        if numeric_columns and (numerical_features.lag_periods or numerical_features.rolling_windows or 
                               numerical_features.trend_periods or numerical_features.change_periods):
            df = generate_numerical_features(df, numeric_columns, numerical_features)
        
        # Remove rows with NaN values created by lag/rolling features
        df = df.dropna()
        
        # Convert to JSON for storage with _gf prefix logic
        data_json = df.to_dict('records')
        
        # Delete previous generated features if exists
        db.query(GeneratedFeatures).filter(
            GeneratedFeatures.project_id == project_id
        ).delete()
        
        # Save generated features to database
        generated_features = GeneratedFeatures(
            project_id=project_id,
            data=data_json,
            row_count=len(df),
            columns=df.columns.tolist(),
            feature_config={
                'date_features': date_features.dict(),
                'numerical_features': numerical_features.dict()
            }
        )
        
        db.add(generated_features)
        
        # Update project with feature settings
        project.date_features = date_features.dict()
        project.numerical_features = numerical_features.dict()
        project.features_generated = True
        
        db.commit()
        db.refresh(generated_features)
        
        # Get feature categories
        new_date_features = [col for col in df.columns if col.startswith('date_') and col != project.date_column]
        new_numeric_features = [col for col in df.columns if any(
            suffix in col for suffix in ['_lag_', '_rolling_', '_trend_', '_change_']
        )]
        
        return {
            "generated_features_id": generated_features.id,
            "total_features": len(df.columns),
            "row_count": len(df),
            "columns": df.columns.tolist(),
            "new_date_features": new_date_features,
            "new_numeric_features": new_numeric_features,
            "sample_data": df.head(5).to_dict('records')
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error generating features: {str(e)}"
        )

@router.get("/projects/{project_id}/generated-features")
def get_generated_features(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get generated features for a project"""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    generated_features = db.query(GeneratedFeatures).filter(
        GeneratedFeatures.project_id == project_id
    ).first()
    
    if not generated_features:
        raise HTTPException(status_code=404, detail="No generated features found")
    
    # Return sample of data
    sample_size = min(20, generated_features.row_count)
    sample_data = generated_features.data[:sample_size] if generated_features.data else []
    
    return {
        "id": generated_features.id,
        "project_id": generated_features.project_id,
        "row_count": generated_features.row_count,
        "columns": generated_features.columns,
        "feature_config": generated_features.feature_config,
        "sample_data": sample_data,
        "created_at": generated_features.created_at
    }

@router.delete("/projects/{project_id}/generated-features")
def delete_generated_features(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete generated features for a project"""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete generated features
    deleted_count = db.query(GeneratedFeatures).filter(
        GeneratedFeatures.project_id == project_id
    ).delete()
    
    # Update project
    project.features_generated = False
    
    db.commit()
    
    return {"message": f"Deleted {deleted_count} generated features record(s)"}

@router.get("/feature-options")
def get_feature_options():
    """Get available feature generation options"""
    return {
        "date_features": {
            "month": "Month (1-12)",
            "year": "Year",
            "quarter": "Quarter (1-4)",
            "month_sin": "Month Sine",
            "month_cos": "Month Cosine", 
            "quarter_sin": "Quarter Sine",
            "quarter_cos": "Quarter Cosine",
            "number_of_holidays_governmental": "Governmental Holidays Count",
            "number_of_holidays_religious": "Religious Holidays Count",
            "periods_until_next_governmental_holiday": "Periods Until Next Govt Holiday",
            "periods_until_next_religious_holiday": "Periods Until Next Religious Holiday",
            "number_of_ramadan_days_in_month": "Ramadan Days in Month"
        },
        "numerical_options": {
            "lag_periods": list(range(1, 31)),
            "rolling_windows": list(range(3, 31)),
            "trend_periods": list(range(3, 31)),
            "change_periods": list(range(1, 13))
        }
    }