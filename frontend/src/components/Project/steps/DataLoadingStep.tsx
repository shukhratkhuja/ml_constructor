import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  Chip,
} from '@mui/material';
import { 
  CloudUpload, 
  Storage, 
  Add, 
  CheckCircle,
  Description,
  DataObject,
  TableChart
} from '@mui/icons-material';
import axios from 'axios';

interface DataLoadingStepProps {
  project: any;
  onDataLoaded: (dataInfo: any) => void;
  updateProject: (updates: any) => Promise<any>;
}

interface DatabaseConnection {
  id: number;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
}

const ModernDataLoadingStep: React.FC<DataLoadingStepProps> = ({
  project,
  onDataLoaded,
  updateProject,
}) => {
  const [sourceType, setSourceType] = useState<'file' | 'db'>(project?.source_type || 'file');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  // Database related states
  const [dbConnections, setDbConnections] = useState<DatabaseConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<number | ''>('');
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [newConnectionDialog, setNewConnectionDialog] = useState(false);
  const [newConnection, setNewConnection] = useState({
    name: '',
    host: '',
    port: 5432,
    database: '',
    username: '',
    password: '',
  });

  useEffect(() => {
    if (sourceType === 'db') {
      fetchDbConnections();
    }
  }, [sourceType]);

  useEffect(() => {
    if (selectedConnection) {
      fetchTables();
    }
  }, [selectedConnection]);

  const fetchDbConnections = async () => {
    try {
      const response = await axios.get('/api/data-source/db-connections');
      setDbConnections(response.data);
    } catch (error) {
      console.error('Error fetching DB connections:', error);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await axios.get(`/api/data-source/db-connections/${selectedConnection}/tables`);
      setTables(response.data.tables);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/data-source/upload-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await updateProject({
        source_type: 'file',
        file_path: response.data.file_path,
      });

      onDataLoaded(response.data.source_info);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'File upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDbPreview = async () => {
    if (!selectedConnection || !selectedTable) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(
        `/api/data-source/db-connections/${selectedConnection}/tables/${selectedTable}/preview`
      );

      await updateProject({
        source_type: 'db',
        db_connection_id: selectedConnection,
        table_name: selectedTable,
      });

      onDataLoaded(response.data.source_info);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Database preview failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      await axios.post('/api/data-source/test-db-connection', {
        host: newConnection.host,
        port: newConnection.port,
        database: newConnection.database,
        username: newConnection.username,
        password: newConnection.password,
      });
      
      alert('Connection successful!');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Connection failed');
    }
  };

  const handleSaveConnection = async () => {
    try {
      await axios.post('/api/data-source/db-connections', newConnection);
      setNewConnectionDialog(false);
      setNewConnection({
        name: '',
        host: '',
        port: 5432,
        database: '',
        username: '',
        password: '',
      });
      fetchDbConnections();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to save connection');
    }
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.csv')) return TableChart;
    if (filename.endsWith('.json')) return DataObject;
    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) return Description;
    return Description;
  };

  const getFileTypeColor = (filename: string) => {
    if (filename.endsWith('.csv')) return '#10b981';
    if (filename.endsWith('.json')) return '#f59e0b';
    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) return '#06b6d4';
    return '#8b5cf6';
  };

  return (
    <Box>
      <Typography
        variant="h5"
        sx={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontWeight: 600,
          mb: 1,
        }}
      >
        Data Source
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'rgba(255, 255, 255, 0.6)',
          mb: 4,
        }}
      >
        Choose your data source to begin the machine learning pipeline
      </Typography>

      {/* Source Type Toggle */}
      <Box sx={{ mb: 4 }}>
        <ToggleButtonGroup
          value={sourceType}
          exclusive
          onChange={(_, newSourceType) => newSourceType && setSourceType(newSourceType)}
          sx={{
            '& .MuiToggleButton-root': {
              color: 'rgba(255, 255, 255, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              px: 3,
              py: 1.5,
              mx: 0.5,
              background: 'rgba(30, 41, 59, 0.3)',
              '&.Mui-selected': {
                background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                color: 'white',
                border: '1px solid #8b5cf6',
                '&:hover': {
                  background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                },
              },
              '&:hover': {
                background: 'rgba(30, 41, 59, 0.5)',
              },
            },
          }}
        >
          <ToggleButton value="file">
            <CloudUpload sx={{ mr: 1 }} />
            File Upload
          </ToggleButton>
          <ToggleButton value="db">
            <Storage sx={{ mr: 1 }} />
            Database
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            borderRadius: '12px',
          }}
        >
          {error}
        </Alert>
      )}

      {sourceType === 'file' && (
        <Card
          sx={{
            background: 'rgba(30, 41, 59, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            p: 3,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 600,
              mb: 2,
            }}
          >
            Upload File
          </Typography>
          
          {/* Drag & Drop Area */}
          <Box
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            sx={{
              border: `2px dashed ${dragActive ? '#8b5cf6' : 'rgba(255, 255, 255, 0.2)'}`,
              borderRadius: '12px',
              p: 4,
              textAlign: 'center',
              background: dragActive 
                ? 'rgba(139, 92, 246, 0.05)' 
                : 'rgba(30, 41, 59, 0.2)',
              transition: 'all 0.3s ease',
              mb: 3,
              cursor: 'pointer',
            }}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".csv,.json,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />
            
            <CloudUpload 
              sx={{ 
                fontSize: 48, 
                color: dragActive ? '#8b5cf6' : 'rgba(255, 255, 255, 0.4)',
                mb: 2
              }} 
            />
            
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                mb: 1,
              }}
            >
              {dragActive ? 'Drop your file here' : 'Drag & drop your file here'}
            </Typography>
            
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                mb: 2,
              }}
            >
              or click to browse files
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
              {['CSV', 'JSON', 'Excel'].map((type) => (
                <Chip
                  key={type}
                  label={type}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Selected File Display */}
          {file && (
            <Card
              sx={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                p: 2,
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {React.createElement(getFileIcon(file.name), {
                  sx: { 
                    color: getFileTypeColor(file.name), 
                    mr: 2, 
                    fontSize: 32 
                  }
                })}
                
                <Box sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: 500,
                    }}
                  >
                    {file.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.6)',
                    }}
                  >
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </Typography>
                </Box>

                <CheckCircle sx={{ color: '#10b981' }} />
              </Box>
            </Card>
          )}

          <Button
            onClick={handleFileUpload}
            disabled={!file || loading}
            sx={{
              background: !file || loading 
                ? 'rgba(139, 92, 246, 0.3)' 
                : 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              color: 'white',
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                background: !file || loading 
                  ? 'rgba(139, 92, 246, 0.3)' 
                  : 'linear-gradient(135deg, #7c3aed, #9333ea)',
              },
              '&:disabled': {
                color: 'rgba(255, 255, 255, 0.5)',
              },
            }}
            startIcon={loading ? <CircularProgress size={20} /> : <CloudUpload />}
          >
            {loading ? 'Uploading...' : 'Upload & Analyze'}
          </Button>
        </Card>
      )}

      {sourceType === 'db' && (
        <Card
          sx={{
            background: 'rgba(30, 41, 59, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            p: 3,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 600,
              }}
            >
              Database Connection
            </Typography>
            <Button
              onClick={() => setNewConnectionDialog(true)}
              sx={{
                background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                color: 'white',
                px: 3,
                py: 1,
                borderRadius: '8px',
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0891b2, #0e7490)',
                },
              }}
              startIcon={<Add />}
            >
              Add Connection
            </Button>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Database Connection
                </InputLabel>
                <Select
                  value={selectedConnection}
                  onChange={(e) => setSelectedConnection(e.target.value as number)}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b5cf6',
                    },
                  }}
                >
                  {dbConnections.map((conn) => (
                    <MenuItem key={conn.id} value={conn.id}>
                      {conn.name} ({conn.host}:{conn.port}/{conn.database})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Table
                </InputLabel>
                <Select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  disabled={!selectedConnection}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b5cf6',
                    },
                  }}
                >
                  {tables.map((table) => (
                    <MenuItem key={table} value={table}>
                      {table}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Button
            onClick={handleDbPreview}
            disabled={!selectedConnection || !selectedTable || loading}
            sx={{
              background: !selectedConnection || !selectedTable || loading
                ? 'rgba(139, 92, 246, 0.3)'
                : 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              color: 'white',
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              mt: 3,
              '&:hover': {
                background: !selectedConnection || !selectedTable || loading
                  ? 'rgba(139, 92, 246, 0.3)'
                  : 'linear-gradient(135deg, #7c3aed, #9333ea)',
              },
              '&:disabled': {
                color: 'rgba(255, 255, 255, 0.5)',
              },
            }}
            startIcon={loading ? <CircularProgress size={20} /> : <Storage />}
          >
            {loading ? 'Loading...' : 'Load Data'}
          </Button>
        </Card>
      )}

      {/* New Connection Dialog */}
      <Dialog
        open={newConnectionDialog}
        onClose={() => setNewConnectionDialog(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            background: 'rgba(30, 41, 59, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
          },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          Add Database Connection
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Connection Name"
                value={newConnection.name}
                onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                  },
                  '& .MuiInputBase-input': { color: 'white' },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6)' },
                }}
              />
            </Grid>
            <Grid item xs={8}>
              <TextField
                fullWidth
                label="Host"
                value={newConnection.host}
                onChange={(e) => setNewConnection({ ...newConnection, host: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                  },
                  '& .MuiInputBase-input': { color: 'white' },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6)' },
                }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Port"
                type="number"
                value={newConnection.port}
                onChange={(e) => setNewConnection({ ...newConnection, port: parseInt(e.target.value) })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                  },
                  '& .MuiInputBase-input': { color: 'white' },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6)' },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Database"
                value={newConnection.database}
                onChange={(e) => setNewConnection({ ...newConnection, database: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                  },
                  '& .MuiInputBase-input': { color: 'white' },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6)' },
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Username"
                value={newConnection.username}
                onChange={(e) => setNewConnection({ ...newConnection, username: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                  },
                  '& .MuiInputBase-input': { color: 'white' },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6)' },
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={newConnection.password}
                onChange={(e) => setNewConnection({ ...newConnection, password: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                  },
                  '& .MuiInputBase-input': { color: 'white' },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6)' },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setNewConnectionDialog(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTestConnection}
            sx={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              mx: 1,
              '&:hover': {
                background: 'linear-gradient(135deg, #d97706, #b45309)',
              },
            }}
          >
            Test Connection
          </Button>
          <Button
            onClick={handleSaveConnection}
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
              },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModernDataLoadingStep;