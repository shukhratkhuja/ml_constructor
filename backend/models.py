from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON, Float, LargeBinary
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    projects = relationship("Project", back_populates="user")
    db_connections = relationship("DatabaseConnection", back_populates="user")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Main data source info
    source_type = Column(String)  # 'file' or 'db'
    file_path = Column(String)
    db_connection_id = Column(Integer, ForeignKey("database_connections.id"))
    table_name = Column(String)
    query = Column(Text)
    
    # Column mappings for main file
    date_column = Column(String)
    value_column = Column(String)
    product_column = Column(String)
    
    # Aggregation settings
    aggregation_period = Column(String)  # 'daily', 'weekly', 'monthly'
    aggregation_completed = Column(Boolean, default=False)
    
    # Feature generation settings
    date_features = Column(JSON)
    numerical_features = Column(JSON)
    features_generated = Column(Boolean, default=False)
    
    # Model settings
    test_ratio = Column(Float, default=0.2)
    cv_folds = Column(Integer, default=3)
    
    # Relationships
    user = relationship("User", back_populates="projects")
    db_connection = relationship("DatabaseConnection")
    models = relationship("MLModel", back_populates="project")
    additional_files = relationship("AdditionalFile", back_populates="project", cascade="all, delete-orphan")
    aggregated_data = relationship("AggregatedData", back_populates="project", cascade="all, delete-orphan")
    generated_features = relationship("GeneratedFeatures", back_populates="project", cascade="all, delete-orphan")

class DatabaseConnection(Base):
    __tablename__ = "database_connections"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    host = Column(String, nullable=False)
    port = Column(Integer, default=5432)
    database = Column(String, nullable=False)
    username = Column(String, nullable=False)
    password = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="db_connections")

class AdditionalFile(Base):
    __tablename__ = "additional_files"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String)  # 'csv', 'json', 'xlsx'
    
    # Column mappings for this additional file
    date_column = Column(String)
    selected_columns = Column(JSON)  # List of selected column names
    column_aggregations = Column(JSON)  # Dict: {column_name: aggregation_function}
    
    # Data filling method for missing periods
    fill_method = Column(String, default='zero')  # 'zero', 'forward', 'backward', 'mean'
    
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    project = relationship("Project", back_populates="additional_files")

class AggregatedData(Base):
    __tablename__ = "aggregated_data"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    
    # Store aggregated data as JSON
    data = Column(JSON, nullable=False)
    
    # Metadata
    period = Column(String)  # 'daily', 'weekly', 'monthly'
    row_count = Column(Integer)
    columns = Column(JSON)  # List of column names
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    project = relationship("Project", back_populates="aggregated_data")

class GeneratedFeatures(Base):
    __tablename__ = "generated_features"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    
    # Store generated features data as JSON with _gf prefix in table logic
    data = Column(JSON, nullable=False)
    
    # Metadata
    row_count = Column(Integer)
    columns = Column(JSON)  # List of feature column names
    feature_config = Column(JSON)  # Configuration used to generate features
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    project = relationship("Project", back_populates="generated_features")

class MLModel(Base):
    __tablename__ = "ml_models"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    model_type = Column(String, nullable=False)
    parameters = Column(JSON)
    metrics = Column(JSON)
    model_path = Column(String)
    project_id = Column(Integer, ForeignKey("projects.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    project = relationship("Project", back_populates="models")