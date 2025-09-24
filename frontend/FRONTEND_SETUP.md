# Frontend Setup Guide

## Issues Fixed

1. **Vite Configuration**: Added proper React plugin and proxy setup
2. **TypeScript Configuration**: Fixed tsconfig files for proper compilation
3. **Environment Variables**: Added proper Vite environment variable handling
4. **Axios Configuration**: Created centralized API configuration
5. **Import Issues**: Fixed relative imports and API calls

## Installation Steps

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Create Environment File

Create `.env` in frontend directory:
```bash
# API Configuration
VITE_API_URL=http://localhost:8000

# Build Configuration
GENERATE_SOURCEMAP=false
SKIP_PREFLIGHT_CHECK=true
```

### 3. Replace Existing Files

Replace the following files with the updated versions:

- `package.json` - Updated with correct Vite version and scripts
- `vite.config.ts` - Complete Vite configuration (rename from .js)
- `tsconfig.json` - Fixed TypeScript configuration
- `tsconfig.node.json` - Node-specific TypeScript config
- `src/config/axios.ts` - New centralized API configuration
- `src/contexts/AuthContext.tsx` - Updated to use new axios config
- `src/components/Dashboard/Dashboard.tsx` - Fixed API imports
- `src/components/Project/ProjectDetail.tsx` - Fixed API imports
- All step components in `src/components/Project/steps/` - Fixed API imports

### 4. Remove Conflicting Files

Remove these files if they exist:
- `frontend/ts.config.json` (typo - should be tsconfig.json)
- `frontend/vite.config.js` (replace with .ts version)

### 5. Directory Structure

Ensure your frontend directory looks like this:
```
frontend/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── Dashboard/
│   │   │   └── Dashboard.tsx
│   │   └── Project/
│   │       ├── ProjectDetail.tsx
│   │       └── steps/
│   │           ├── DataLoadingStep.tsx
│   │           ├── ColumnMappingStep.tsx
│   │           ├── FeatureGenerationStep.tsx
│   │           └── ModelTrainingStep.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── config/
│   │   └── axios.ts
│   ├── App.tsx
│   ├── index.tsx
│   └── index.css
├── .env
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── Dockerfile
```

### 6. Start Development Server

```bash
npm run dev
# or
npm start
```

The application should start on `http://localhost:3000`

## Key Changes Made

### 1. Vite Configuration (`vite.config.ts`)
- Added React plugin
- Configured proxy for API calls
- Set up path aliases
- Proper build configuration

### 2. TypeScript Configuration
- Fixed module resolution
- Added proper compiler options
- Separated node and browser configs

### 3. Axios Configuration (`src/config/axios.ts`)
- Centralized API configuration
- Automatic token injection
- Response interceptors for error handling
- Environment variable support

### 4. Component Updates
- Fixed all import statements to use new axios config
- Updated API calls to use the centralized configuration
- Fixed TypeScript type issues

### 5. Environment Variables
- Changed from `REACT_APP_` to `VITE_` prefix
- Proper Vite environment variable handling

## Common Issues & Solutions

### 1. "Cannot resolve module" errors
- Make sure all dependencies are installed: `npm install`
- Check that file paths are correct
- Ensure TypeScript configuration is properly set

### 2. API connection issues
- Verify backend is running on port 8000
- Check `.env` file has correct `VITE_API_URL`
- Ensure proxy configuration in `vite.config.ts` is correct

### 3. Build issues
- Run `npm run lint` to check TypeScript errors
- Make sure all import statements use the correct paths
- Verify all components export properly

### 4. Dark theme issues
- The CSS in `index.css` provides dark theme overrides
- Make sure Ant Design components are using the dark theme configuration

## Docker Build

The existing Dockerfile should work with these changes. The build process:

1. Install dependencies
2. Build the application
3. Serve with nginx

Make sure to update the nginx configuration if needed for proper routing.

## API Integration

All API calls now go through the centralized axios configuration:
- Authentication handled automatically
- Base URL from environment variables
- Consistent error handling
- Request/response interceptors

The API calls should match your FastAPI backend endpoints structure.