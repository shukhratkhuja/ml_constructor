import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Card,
  Chip,
  Avatar,
} from '@mui/material';
import { CalendarMonth, TrendingUp, Category, CheckCircle } from '@mui/icons-material';

interface ColumnMappingStepProps {
  project: any;
  dataInfo: any;
  onMappingComplete: () => void;
  updateProject: (updates: any) => Promise<any>;
}

const ModernColumnMappingStep: React.FC<ColumnMappingStepProps> = ({
  project,
  dataInfo,
  onMappingComplete,
  updateProject,
}) => {
  const [dateColumn, setDateColumn] = useState(project?.date_column || '');
  const [valueColumn, setValueColumn] = useState(project?.value_column || '');
  const [productColumn, setProductColumn] = useState(project?.product_column || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const columns = dataInfo?.columns || [];
  const sampleData = dataInfo?.sample_data || [];

  const handleSaveMapping = async () => {
    if (!dateColumn || !valueColumn) {
      setError('Date and Value columns are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await updateProject({
        date_column: dateColumn,
        value_column: valueColumn,
        product_column: productColumn || null,
      });

      onMappingComplete();
    } catch (error: any) {
      setError('Failed to save column mapping');
    } finally {
      setLoading(false);
    }
  };

  const getColumnTypeIcon = (columnType: 'date' | 'value' | 'product') => {
    switch (columnType) {
      case 'date':
        return { icon: CalendarMonth, color: '#8b5cf6' };
      case 'value':
        return { icon: TrendingUp, color: '#06b6d4' };
      case 'product':
        return { icon: Category, color: '#f59e0b' };
      default:
        return { icon: Category, color: '#6b7280' };
    }
  };

  const getColumnLabel = (col: string) => {
    if (col === dateColumn) return 'DATE';
    if (col === valueColumn) return 'VALUE';
    if (col === productColumn) return 'PRODUCT';
    return null;
  };

  const getColumnLabelColor = (col: string) => {
    if (col === dateColumn) return '#8b5cf6';
    if (col === valueColumn) return '#06b6d4';
    if (col === productColumn) return '#f59e0b';
    return null;
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
        Column Mapping
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'rgba(255, 255, 255, 0.6)',
          mb: 4,
        }}
      >
        Map your data columns to the required fields for time series analysis
      </Typography>

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

      {/* Column Mapping Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Date Column */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: `1px solid ${dateColumn ? '#8b5cf6' : 'rgba(139, 92, 246, 0.3)'}`,
              borderRadius: '16px',
              p: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(139, 92, 246, 0.15)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                  width: 40,
                  height: 40,
                  mr: 2,
                }}
              >
                <CalendarMonth />
              </Avatar>
              <Box>
                <Typography
                  variant="h6"
                  sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}
                >
                  Date Column
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                >
                  Required
                </Typography>
              </Box>
            </Box>

            <FormControl fullWidth>
              <Select
                value={dateColumn}
                onChange={(e) => setDateColumn(e.target.value)}
                displayEmpty
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(139, 92, 246, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#8b5cf6',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#8b5cf6',
                  },
                }}
              >
                <MenuItem value="">
                  <em>Select date column</em>
                </MenuItem>
                {columns.map((col: string) => (
                  <MenuItem key={col} value={col}>
                    {col}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Card>
        </Grid>

        {/* Value Column */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              background: 'rgba(6, 182, 212, 0.1)',
              border: `1px solid ${valueColumn ? '#06b6d4' : 'rgba(6, 182, 212, 0.3)'}`,
              borderRadius: '16px',
              p: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(6, 182, 212, 0.15)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  width: 40,
                  height: 40,
                  mr: 2,
                }}
              >
                <TrendingUp />
              </Avatar>
              <Box>
                <Typography
                  variant="h6"
                  sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}
                >
                  Value Column
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                >
                  Required
                </Typography>
              </Box>
            </Box>

            <FormControl fullWidth>
              <Select
                value={valueColumn}
                onChange={(e) => setValueColumn(e.target.value)}
                displayEmpty
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(6, 182, 212, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#06b6d4',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#06b6d4',
                  },
                }}
              >
                <MenuItem value="">
                  <em>Select value column</em>
                </MenuItem>
                {columns.map((col: string) => (
                  <MenuItem key={col} value={col}>
                    {col}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Card>
        </Grid>

        {/* Product Column */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: `1px solid ${productColumn ? '#f59e0b' : 'rgba(245, 158, 11, 0.3)'}`,
              borderRadius: '16px',
              p: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(245, 158, 11, 0.15)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  width: 40,
                  height: 40,
                  mr: 2,
                }}
              >
                <Category />
              </Avatar>
              <Box>
                <Typography
                  variant="h6"
                  sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}
                >
                  Product Column
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                >
                  Optional
                </Typography>
              </Box>
            </Box>

            <FormControl fullWidth>
              <Select
                value={productColumn}
                onChange={(e) => setProductColumn(e.target.value)}
                displayEmpty
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(245, 158, 11, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#f59e0b',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#f59e0b',
                  },
                }}
              >
                <MenuItem value="">
                  <em>Select product column (optional)</em>
                </MenuItem>
                {columns.map((col: string) => (
                  <MenuItem key={col} value={col}>
                    {col}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Card>
        </Grid>
      </Grid>

      {/* Continue Button */}
      <Box sx={{ mb: 4 }}>
        <Button
          onClick={handleSaveMapping}
          disabled={!dateColumn || !valueColumn || loading}
          sx={{
            background: !dateColumn || !valueColumn || loading
              ? 'rgba(139, 92, 246, 0.3)'
              : 'linear-gradient(135deg, #8b5cf6, #a855f7)',
            color: 'white',
            px: 4,
            py: 1.5,
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              background: !dateColumn || !valueColumn || loading
                ? 'rgba(139, 92, 246, 0.3)'
                : 'linear-gradient(135deg, #7c3aed, #9333ea)',
            },
            '&:disabled': {
              color: 'rgba(255, 255, 255, 0.5)',
            },
          }}
          startIcon={<CheckCircle />}
        >
          {loading ? 'Saving...' : 'Save Mapping & Continue'}
        </Button>
      </Box>

      {/* Data Preview */}
      <Card
        sx={{
          background: 'rgba(30, 41, 59, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 3, pb: 0 }}>
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 600,
              mb: 2,
            }}
          >
            Data Preview
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              mb: 3,
            }}
          >
            First 5 rows of your data with column mappings highlighted
          </Typography>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((col: string) => (
                  <TableCell
                    key={col}
                    sx={{
                      backgroundColor: 'rgba(30, 41, 59, 0.5)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      py: 2,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontWeight: 600,
                          mb: 1,
                        }}
                      >
                        {col}
                      </Typography>
                      {getColumnLabel(col) && (
                        <Chip
                          label={getColumnLabel(col)}
                          size="small"
                          sx={{
                            backgroundColor: `${getColumnLabelColor(col)}20`,
                            color: getColumnLabelColor(col),
                            fontSize: '10px',
                            height: 20,
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sampleData.slice(0, 5).map((row: any, index: number) => (
                <TableRow key={index}>
                  {columns.map((col: string) => (
                    <TableCell
                      key={col}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        backgroundColor: getColumnLabel(col) 
                          ? `${getColumnLabelColor(col)}05` 
                          : 'transparent',
                      }}
                    >
                      {String(row[col] || '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default ModernColumnMappingStep;