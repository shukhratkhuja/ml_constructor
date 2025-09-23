# ML Constructor

A comprehensive machine learning platform for time series feature engineering and modeling built with FastAPI backend and React frontend.

## Features

- **Authentication**: JWT-based user authentication
- **Data Sources**: Support for file uploads (CSV, JSON, Excel) and database connections
- **Column Mapping**: Interactive column mapping for time series data
- **Feature Generation**: 
  - Date features (month, year, quarter, trigonometric features, holidays)
  - Numerical features (lag, rolling windows, trends, changes)
- **Model Training**: Automated ML model training with cross-validation
- **Model Management**: Track and compare multiple models

## Tech Stack

### Backend
- FastAPI
- PostgreSQL
- SQLAlchemy
- Pandas & Scikit-learn
- JWT Authentication

### Frontend
- React with TypeScript
- Material-UI
- Recharts for visualization
- Axios for API calls

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ml-constructor
   ```

2. **Build and run with Docker Compose**
   ```bash
   docker compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Manual Setup

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb ml_constructor
   ```

6. **Run the application**
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

## Project Structure

```
ml-constructor/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── database.py             # Database configuration
│   ├── models.py               # SQLAlchemy models
│   ├── schemas.py              # Pydantic schemas
│   ├── config.py               # Configuration settings
│   ├── routers/                # API route handlers
│   │   ├── auth.py             # Authentication routes
│   │   ├── data_source.py      # Data source management
│   │   ├── features.py         # Feature generation
│   │   ├── models.py           # ML model training
│   │   └── __init__.py
│   ├── uploads/                # File upload directory
│   ├── saved_models/           # Trained model storage
│   ├── requirements.txt        # Python dependencies
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── Auth/           # Authentication components
│   │   │   ├── Dashboard/      # Dashboard components
│   │   │   └── Project/        # Project-related components
│   │   ├── contexts/           # React contexts
│   │   ├── App.tsx             # Main App component
│   │   └── index.tsx           # Application entry point
│   ├── package.json            # Node.js dependencies
│   ├── nginx.conf              # Nginx configuration
│   └── Dockerfile
├── docker-compose.yml          # Docker composition
└── README.md
```

## Usage

1. **Register/Login**: Create an account or sign in
2. **Create Project**: Start a new ML project
3. **Load Data**: Upload a file or connect to a database
4. **Map Columns**: Define date, value, and optional product columns
5. **Generate Features**: Select and configure date and numerical features
6. **Train Models**: Configure training parameters and train ML models
7. **Compare Results**: Analyze model performance and metrics

## API Documentation

When running the backend, visit http://localhost:8000/docs for interactive API documentation.

## Environment Variables

### Backend (.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=ml_constructor
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
UPLOAD_DIR=uploads
MAX_FILE_SIZE=104857600
```

## Docker Commands

```bash
# Build and start all services
docker compose up --build

# Start services in background
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f

# Rebuild specific service
docker compose build backend
docker compose up backend
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.