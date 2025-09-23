from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
from typing import Dict, Any, List

from database import get_db
from models import User, Project
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
        # Example: New Year, Independence Day, etc.
        df['date_number_of_holidays_governmental'] = 0  # Placeholder
    
    if features.number_of_holidays_religious:
        # Example: Christmas, Easter, etc.
        df['date_number_of_holidays_religious'] = 0  # Placeholder
    
    if features.periods_until_next_governmental_holiday:
        df['date_periods_until_next_governmental_holiday'] = 0  # Placeholder
    
    if features.periods_until_next_religious_holiday:
        df['date_periods_until_next_religious_holiday'] = 0  # Placeholder
    
    if features.number_of_ramadan_days_in_month:
        df['date_number_of_ramadan_days_in_month'] = 0  # Placeholder
    
    return df

def generate_numerical_features(df: pd.DataFrame, value_column: str, features: NumericalFeatures) -> pd.DataFrame:
    """Generate numerical features"""
    df = df.copy()
    df = df.sort_values(by=df.columns[0])  # Assume first column is date/time
    
    # Lag features
    for lag in features.lag_periods:
        df[f'units_lag_{lag}'] = df[value_column].shift(lag)
    
    # Rolling window features
    for window in features.rolling_windows:
        if features.include_statistics:
            df[f'units_rolling_{window}_mean'] = df[value_column].rolling(window=window).mean()
            df[f'units_rolling_{window}_std'] = df[value_column].rolling(window=window).std()
            df[f'units_rolling_{window}_min'] = df[value_column].rolling(window=window).min()
            df[f'units_rolling_{window}_max'] = df[value_column].rolling(window=window).max()
        else:
            df[f'units_rolling_{window}'] = df[value_column].rolling(window=window).mean()
    
    # Trend features
    if features.include_trend_features:
        for period in features.trend_periods:
            df[f'units_trend_{period}'] = df[value_column].rolling(window=period).apply(
                lambda x: np.polyfit(range(len(x)), x, 1)[0] if len(x) == period else np.nan
            )
    
    # Change features
    for period in features.change_periods:
        df[f'units_change_{period}'] = df[value_column].pct_change(periods=period)
    
    return df

@router.post("/projects/{project_id}/generate-features")
def generate_features(
    project_id: int,
    date_features: DateFeatures,
    numerical_features: NumericalFeatures,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get project
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Load data based on source type
    try:
        if project.source_type == "file":
            df = pd.read_csv(project.file_path) if project.file_path.endswith('.csv') else \
                 pd.read_excel(project.file_path) if project.file_path.endswith(('.xlsx', '.xls')) else \
                 pd.read_json(project.file_path)
        elif project.source_type == "db":
            # Load from database
            from sqlalchemy import create_engine
            db_conn = db.query(DatabaseConnection).filter(DatabaseConnection.id == project.db_connection_id).first()
            connection_url = f"postgresql://{db_conn.username}:{db_conn.password}@{db_conn.host}:{db_conn.port}/{db_conn.database}"
            query = project.query or f"SELECT * FROM {project.table_name}"
            df = pd.read_sql(query, connection_url)
        else:
            raise HTTPException(status_code=400, detail="Invalid source type")
        
        # Generate features
        if project.date_column:
            df = generate_date_features(df, project.date_column, date_features)
        
        if project.value_column:
            df = generate_numerical_features(df, project.value_column, numerical_features)
        
        # Save feature settings to project
        project.date_features = date_features.dict()
        project.numerical_features = numerical_features.dict()
        db.commit()
        
        # Return feature info
        new_columns = [col for col in df.columns if col not in [project.date_column, project.value_column, project.product_column]]
        
        return {
            "generated_features": new_columns,
            "total_features": len(df.columns),
            "sample_data": df.head(5).to_dict('records')
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error generating features: {str(e)}"
        )

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