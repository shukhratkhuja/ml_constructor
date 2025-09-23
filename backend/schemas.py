from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# User schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: int
    email: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Database Connection schemas
class DatabaseConnectionCreate(BaseModel):
    name: str
    host: str
    port: int = 5432
    database: str
    username: str
    password: str

class DatabaseConnectionTest(BaseModel):
    host: str
    port: int = 5432
    database: str
    username: str
    password: str

class DatabaseConnection(BaseModel):
    id: int
    name: str
    host: str
    port: int
    database: str
    username: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Project schemas
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    source_type: Optional[str] = None
    db_connection_id: Optional[int] = None
    table_name: Optional[str] = None
    query: Optional[str] = None
    date_column: Optional[str] = None
    value_column: Optional[str] = None
    product_column: Optional[str] = None
    date_features: Optional[Dict[str, Any]] = None
    numerical_features: Optional[Dict[str, Any]] = None
    test_ratio: Optional[float] = None
    cv_folds: Optional[int] = None

class Project(BaseModel):
    id: int
    name: str
    description: Optional[str]
    source_type: Optional[str]
    date_column: Optional[str]
    value_column: Optional[str]
    product_column: Optional[str]
    date_features: Optional[Dict[str, Any]]
    numerical_features: Optional[Dict[str, Any]]
    test_ratio: Optional[float]
    cv_folds: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Data schemas
class DataSourceInfo(BaseModel):
    source_type: str
    columns: List[str]
    row_count: int
    sample_data: List[Dict[str, Any]]

class ColumnMapping(BaseModel):
    date_column: str
    value_column: str
    product_column: Optional[str] = None

class DateFeatures(BaseModel):
    month: bool = False
    year: bool = False
    quarter: bool = False
    month_sin: bool = False
    month_cos: bool = False
    quarter_sin: bool = False
    quarter_cos: bool = False
    number_of_holidays_governmental: bool = False
    number_of_holidays_religious: bool = False
    periods_until_next_governmental_holiday: bool = False
    periods_until_next_religious_holiday: bool = False
    number_of_ramadan_days_in_month: bool = False

class NumericalFeatures(BaseModel):
    lag_periods: List[int] = []
    rolling_windows: List[int] = []
    trend_periods: List[int] = []
    change_periods: List[int] = []
    include_statistics: bool = False
    include_trend_features: bool = False

# ML Model schemas
class MLModelCreate(BaseModel):
    name: str
    model_type: str
    parameters: Optional[Dict[str, Any]] = None

class MLModel(BaseModel):
    id: int
    name: str
    model_type: str
    parameters: Optional[Dict[str, Any]]
    metrics: Optional[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True