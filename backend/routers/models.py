from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
# from sklearn.model_selection import train_test_split, cross_val_score
# from sklearn.ensemble import RandomForestRegressor
# from sklearn.linear_model import LinearRegression
# from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import joblib
from pathlib import Path
from typing import Dict, Any, List
import uuid

from database import get_db
from models import User, Project, MLModel, DatabaseConnection
from schemas import MLModelCreate, MLModel as MLModelSchema
from routers.auth import get_current_user
from config import settings

router = APIRouter()

# Create models directory
MODELS_DIR = Path("saved_models")
MODELS_DIR.mkdir(exist_ok=True)

@router.post("/projects/{project_id}/train-model", response_model=MLModelSchema)
def train_model(
    project_id: int,
    model_config: MLModelCreate,
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
    
    if not project.date_column or not project.value_column:
        raise HTTPException(status_code=400, detail="Date and value columns must be set")
    
    try:
        # Load and prepare data
        if project.source_type == "file":
            if project.file_path.endswith('.csv'):
                df = pd.read_csv(project.file_path)
            elif project.file_path.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(project.file_path)
            elif project.file_path.endswith('.json'):
                df = pd.read_json(project.file_path)
            else:
                raise HTTPException(status_code=400, detail="Unsupported file format")
        elif project.source_type == "db":
            db_conn = db.query(DatabaseConnection).filter(DatabaseConnection.id == project.db_connection_id).first()
            if not db_conn:
                raise HTTPException(status_code=400, detail="Database connection not found")
            
            connection_url = f"postgresql://{db_conn.username}:{db_conn.password}@{db_conn.host}:{db_conn.port}/{db_conn.database}"
            query = project.query or f"SELECT * FROM {project.table_name}"
            df = pd.read_sql(query, connection_url)
        else:
            raise HTTPException(status_code=400, detail="Invalid source type")
        
        # # Apply feature generation if configured
        # if project.date_features:
        #     from routers.features import generate_date_features
        #     from schemas import DateFeatures
        #     date_features = DateFeatures(**project.date_features)
        #     df = generate_date_features(df, project.date_column, date_features)
        
        # if project.numerical_features:
        #     from routers.features import generate_numerical_features
        #     from schemas import NumericalFeatures
        #     numerical_features = NumericalFeatures(**project.numerical_features)
        #     df = generate_numerical_features(df, project.value_column, numerical_features)
        
        # # Prepare features and target
        # target_col = project.value_column
        # exclude_cols = [project.date_column, target_col]
        # if project.product_column:
        #     exclude_cols.append(project.product_column)
        
        # feature_cols = [col for col in df.columns if col not in exclude_cols]
        
        # # Remove any remaining non-numeric columns and handle NaN values
        # X = df[feature_cols].select_dtypes(include=[np.number]).fillna(0)
        # y = df[target_col].fillna(df[target_col].mean())
        
        # if X.empty:
        #     raise HTTPException(status_code=400, detail="No numeric features available for training")
        
        # # Split data
        # test_size = project.test_ratio or 0.2
        # X_train, X_test, y_train, y_test = train_test_split(
        #     X, y, test_size=test_size, random_state=42
        # )
        
        # # Train model 
        # if model_config.model_type == "random_forest":
        #     model_params = model_config.parameters or {}
        #     model = RandomForestRegressor(
        #         n_estimators=model_params.get('n_estimators', 100),
        #         max_depth=model_params.get('max_depth', None),
        #         random_state=42
        #     )
        # elif model_config.model_type == "linear_regression":
        #     model = LinearRegression()
        # else:
        #     raise HTTPException(status_code=400, detail=f"Model type {model_config.model_type} not supported")
        
        # # Fit model
        # model.fit(X_train, y_train)
        
        # # Make predictions
        # y_pred_train = model.predict(X_train)
        # y_pred_test = model.predict(X_test)
        
        # # Calculate metrics
        # train_metrics = {
        #     "mse": float(mean_squared_error(y_train, y_pred_train)),
        #     "mae": float(mean_absolute_error(y_train, y_pred_train)),
        #     "r2": float(r2_score(y_train, y_pred_train))
        # }
        
        # test_metrics = {
        #     "mse": float(mean_squared_error(y_test, y_pred_test)),
        #     "mae": float(mean_absolute_error(y_test, y_pred_test)),
        #     "r2": float(r2_score(y_test, y_pred_test))
        # }
        
        # # Cross-validation
        # cv_folds = project.cv_folds or 3
        # cv_scores = cross_val_score(model, X_train, y_train, cv=cv_folds, scoring='r2')
        
        # # Save model
        # model_filename = f"{uuid.uuid4()}.joblib"
        # model_path = MODELS_DIR / model_filename
        # joblib.dump(model, model_path)
        
        # # Prepare feature importance
        # feature_importance = None
        # if hasattr(model, 'feature_importances_'):
        #     feature_importance = dict(zip(X.columns, model.feature_importances_.tolist()))
        
        # # Save to database
        # ml_model = MLModel(
        #     name=model_config.name,
        #     model_type=model_config.model_type,
        #     parameters=model_config.parameters,
        #     metrics={
        #         "train": train_metrics,
        #         "test": test_metrics,
        #         "cv_mean": float(cv_scores.mean()),
        #         "cv_std": float(cv_scores.std()),
        #         "feature_importance": feature_importance
        #     },
        #     model_path=str(model_path),
        #     project_id=project_id
        # )
        
        # db.add(ml_model)
        # db.commit()
        # db.refresh(ml_model)
        
        # return ml_model
        return "ok"
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error training model: {str(e)}"
        )

@router.get("/projects/{project_id}/models", response_model=List[MLModelSchema])
def get_project_models(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    models = db.query(MLModel).filter(MLModel.project_id == project_id).all()
    return models

@router.get("/models/{model_id}", response_model=MLModelSchema)
def get_model(
    model_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    model = db.query(MLModel).join(Project).filter(
        MLModel.id == model_id,
        Project.user_id == current_user.id
    ).first()
    
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    return model

@router.delete("/models/{model_id}")
def delete_model(
    model_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    model = db.query(MLModel).join(Project).filter(
        MLModel.id == model_id,
        Project.user_id == current_user.id
    ).first()
    
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    # Delete model file
    if model.model_path and Path(model.model_path).exists():
        Path(model.model_path).unlink()
    
    # Delete from database
    db.delete(model)
    db.commit()
    
    return {"message": "Model deleted successfully"}

@router.get("/model-types")
def get_available_model_types():
    """Get available model types and their parameters"""
    return {
        "random_forest": {
            "name": "Random Forest",
            "parameters": {
                "n_estimators": {
                    "type": "integer",
                    "default": 100,
                    "min": 10,
                    "max": 1000,
                    "description": "Number of trees"
                },
                "max_depth": {
                    "type": "integer",
                    "default": None,
                    "min": 1,
                    "max": 50,
                    "description": "Maximum depth of trees"
                }
            }
        },
        "linear_regression": {
            "name": "Linear Regression",
            "parameters": {}
        }
    }