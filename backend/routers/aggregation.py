from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime, timedelta

from database import get_db
from models import User, Project, AdditionalFile, AggregatedData, DatabaseConnection
from schemas import AggregationConfig, AggregatedDataResponse
from routers.auth import get_current_user

router = APIRouter()

def aggregate_to_period(df: pd.DataFrame, date_column: str, period: str, aggregations: Dict[str, str]) -> pd.DataFrame:
    """
    Aggregate dataframe to specified period
    period: 'W' for weekly, 'M' for monthly
    aggregations: dict of column_name: aggregation_function
    """
    df = df.copy()
    df[date_column] = pd.to_datetime(df[date_column])
    df.set_index(date_column, inplace=True)
    
    # Perform aggregation
    agg_dict = {}
    for col, agg_func in aggregations.items():
        if col in df.columns:
            agg_dict[col] = agg_func
    
    if period == 'weekly':
        result = df.resample('W').agg(agg_dict)
    elif period == 'monthly':
        result = df.resample('M').agg(agg_dict)
    else:
        result = df.resample('D').agg(agg_dict)
    
    result.reset_index(inplace=True)
    return result

def fill_missing_dates(df: pd.DataFrame, date_column: str, start_date: datetime, end_date: datetime, 
                       period: str, fill_method: str = 'zero') -> pd.DataFrame:
    """
    Fill missing dates in dataframe
    """
    df = df.copy()
    df[date_column] = pd.to_datetime(df[date_column])
    
    # Create full date range
    if period == 'weekly':
        date_range = pd.date_range(start=start_date, end=end_date, freq='W')
    elif period == 'monthly':
        date_range = pd.date_range(start=start_date, end=end_date, freq='M')
    else:
        date_range = pd.date_range(start=start_date, end=end_date, freq='D')
    
    # Create full dataframe with all dates
    full_df = pd.DataFrame({date_column: date_range})
    
    # Merge with existing data
    result = pd.merge(full_df, df, on=date_column, how='left')
    
    # Fill missing values based on method
    numeric_columns = result.select_dtypes(include=[np.number]).columns
    
    if fill_method == 'zero':
        result[numeric_columns] = result[numeric_columns].fillna(0)
    elif fill_method == 'forward':
        result[numeric_columns] = result[numeric_columns].fillna(method='ffill')
    elif fill_method == 'backward':
        result[numeric_columns] = result[numeric_columns].fillna(method='bfill')
    elif fill_method == 'mean':
        for col in numeric_columns:
            result[col] = result[col].fillna(result[col].mean())
    elif fill_method == 'interpolate':
        result[numeric_columns] = result[numeric_columns].interpolate(method='linear')
    
    # Fill any remaining NaN with zero
    result[numeric_columns] = result[numeric_columns].fillna(0)
    
    return result

def merge_dataframes_horizontal(main_df: pd.DataFrame, additional_dfs: List[Dict], 
                                date_column: str, product_column: str = None) -> pd.DataFrame:
    """
    Merge main dataframe with additional dataframes horizontally based on date column
    and optionally product column
    
    Args:
        main_df: Main dataframe
        additional_dfs: List of dicts with 'df' and 'product_column' keys
        date_column: Name of date column for merging
        product_column: Name of product column in main df (optional)
    """
    result = main_df.copy()
    
    for idx, add_dict in enumerate(additional_dfs):
        add_df = add_dict['df']
        add_product_col = add_dict.get('product_column')
        
        # Rename columns to avoid conflicts (except date and product columns)
        cols_to_keep = [date_column]
        if add_product_col:
            cols_to_keep.append(add_product_col)
        
        rename_dict = {
            col: f"{col}_add{idx+1}" 
            for col in add_df.columns 
            if col not in cols_to_keep
        }
        add_df_renamed = add_df.rename(columns=rename_dict)
        
        # Determine merge columns
        if product_column and add_product_col:
            # Merge on both date and product
            merge_on = [date_column, product_column]
            
            # Ensure product columns have same name for merging
            if add_product_col != product_column:
                add_df_renamed = add_df_renamed.rename(columns={add_product_col: product_column})
            
            result = pd.merge(result, add_df_renamed, on=merge_on, how='left')
        else:
            # Merge only on date
            result = pd.merge(result, add_df_renamed, on=date_column, how='left')
    
    return result

@router.post("/projects/{project_id}/aggregate")
async def aggregate_project_data(
    project_id: int,
    config: AggregationConfig,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aggregate main and additional files data"""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not project.date_column or not project.value_column:
        raise HTTPException(status_code=400, detail="Date and value columns must be set")
    
    try:
        # Load main file data
        if project.source_type == "file":
            if project.file_path.endswith('.csv'):
                main_df = pd.read_csv(project.file_path)
            elif project.file_path.endswith(('.xlsx', '.xls')):
                main_df = pd.read_excel(project.file_path)
            elif project.file_path.endswith('.json'):
                main_df = pd.read_json(project.file_path)
        elif project.source_type == "db":
            db_conn = db.query(DatabaseConnection).filter(
                DatabaseConnection.id == project.db_connection_id
            ).first()
            connection_url = f"postgresql://{db_conn.username}:{db_conn.password}@{db_conn.host}:{db_conn.port}/{db_conn.database}"
            query = project.query or f"SELECT * FROM {project.table_name}"
            main_df = pd.read_sql(query, connection_url)
        
        # Prepare aggregation dict for main file
        main_agg = {project.value_column: config.main_value_aggregation}
        if project.product_column and project.product_column in main_df.columns:
            main_agg[project.product_column] = 'first'
        
        # Aggregate main file
        period_map = {
            'daily_to_weekly': 'weekly',
            'daily_to_monthly': 'monthly',
            'weekly_to_monthly': 'monthly',
            'daily': 'daily',
            'weekly': 'weekly',
            'monthly': 'monthly'
        }
        
        target_period = period_map.get(config.period, 'monthly')
        main_df_agg = aggregate_to_period(main_df, project.date_column, target_period, main_agg)
        
        # Get date range from main data
        main_df_agg[project.date_column] = pd.to_datetime(main_df_agg[project.date_column])
        min_date = main_df_agg[project.date_column].min()
        max_date = main_df_agg[project.date_column].max()
        
        # Process additional files
        additional_files = db.query(AdditionalFile).filter(
            AdditionalFile.project_id == project_id
        ).all()
        
        additional_dfs = []
        for add_file in additional_files:
            # Skip if columns not mapped
            if not add_file.date_column or not add_file.selected_columns:
                continue
            
            # Load additional file
            file_path = Path(add_file.file_path)
            if add_file.file_type == 'csv':
                add_df = pd.read_csv(file_path)
            elif add_file.file_type == 'json':
                add_df = pd.read_json(file_path)
            elif add_file.file_type in ['xlsx', 'xls']:
                add_df = pd.read_excel(file_path)
            
            # Keep only date column and selected columns
            cols_to_keep = [add_file.date_column] + add_file.selected_columns
            add_df = add_df[cols_to_keep]
            
            # Prepare aggregation dict for additional file
            add_agg = {}
            if add_file.column_aggregations:
                for col in add_file.selected_columns:
                    agg_func = add_file.column_aggregations.get(col, 'mean')
                    add_agg[col] = agg_func
            else:
                # Default to mean if not specified
                for col in add_file.selected_columns:
                    add_agg[col] = 'mean'
            
            # Aggregate additional file
            add_df_agg = aggregate_to_period(add_df, add_file.date_column, target_period, add_agg)
            
            # Fill missing dates based on main data range
            add_df_filled = fill_missing_dates(
                add_df_agg, 
                add_file.date_column, 
                min_date, 
                max_date, 
                target_period,
                add_file.fill_method
            )
            
            # Rename date column to match main file
            if add_file.date_column != project.date_column:
                add_df_filled = add_df_filled.rename(columns={add_file.date_column: project.date_column})
            
            additional_dfs.append(add_df_filled)
        
        # Merge all dataframes horizontally
        if additional_dfs:
            final_df = merge_dataframes_horizontal(main_df_agg, additional_dfs, project.date_column)
        else:
            final_df = main_df_agg
        
        # Clean up: remove any rows with NaN in critical columns
        final_df = final_df.dropna(subset=[project.date_column])
        
        # Convert to JSON for storage
        data_json = final_df.to_dict('records')
        
        # Delete previous aggregated data if exists
        db.query(AggregatedData).filter(
            AggregatedData.project_id == project_id
        ).delete()
        
        # Save aggregated data to database
        aggregated_data = AggregatedData(
            project_id=project_id,
            data=data_json,
            period=target_period,
            row_count=len(final_df),
            columns=final_df.columns.tolist()
        )
        
        db.add(aggregated_data)
        
        # Update project
        project.aggregation_period = target_period
        project.aggregation_completed = True
        
        db.commit()
        db.refresh(aggregated_data)
        
        return {
            "aggregated_data_id": aggregated_data.id,
            "period": target_period,
            "row_count": len(final_df),
            "columns": final_df.columns.tolist(),
            "sample_data": final_df.head(10).to_dict('records'),
            "date_range": {
                "min": str(min_date),
                "max": str(max_date)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error aggregating data: {str(e)}"
        )

@router.get("/projects/{project_id}/aggregated-data")
def get_aggregated_data(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get aggregated data for a project"""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    aggregated_data = db.query(AggregatedData).filter(
        AggregatedData.project_id == project_id
    ).first()
    
    if not aggregated_data:
        raise HTTPException(status_code=404, detail="No aggregated data found")
    
    # Return sample of data
    sample_size = min(20, aggregated_data.row_count)
    sample_data = aggregated_data.data[:sample_size] if aggregated_data.data else []
    
    return {
        "id": aggregated_data.id,
        "project_id": aggregated_data.project_id,
        "period": aggregated_data.period,
        "row_count": aggregated_data.row_count,
        "columns": aggregated_data.columns,
        "sample_data": sample_data,
        "created_at": aggregated_data.created_at
    }

@router.delete("/projects/{project_id}/aggregated-data")
def delete_aggregated_data(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete aggregated data for a project"""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete aggregated data
    deleted_count = db.query(AggregatedData).filter(
        AggregatedData.project_id == project_id
    ).delete()
    
    # Update project
    project.aggregation_completed = False
    
    db.commit()
    
    return {"message": f"Deleted {deleted_count} aggregated data record(s)"}