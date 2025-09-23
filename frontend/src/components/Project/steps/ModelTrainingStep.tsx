import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

interface ModelTrainingStepProps {
  project: any;
  updateProject: (updates: any) => Promise<any>;
}

interface MLModel {
  id: number;
  name: string;
  model_type: string;
  metrics: any;
  created_at: string;
}

const ModelTrainingStep: React.FC<ModelTrainingStepProps> = ({
  project,
  updateProject,
}) => {
  const [testRatio, setTestRatio] = useState(project?.test_ratio || 20);
  const [cvFolds, setCvFolds] = useState(project?.cv_folds || 3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [models, setModels] = useState<MLModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await axios.get(`/api/models/projects/${project.id}/models`);
      setModels(response.data);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const handleTrainModel = async () => {
    setLoading(true);
    setError('');

    try {
      // Update project settings first
      await updateProject({
        test_ratio: testRatio / 100,
        cv_folds: cvFolds,
      });

      // Train model
      const response = await axios.post(`/api/models/projects/${project.id}/train-model`, {
        name: `Model ${new Date().toLocaleString()}`,
        model_type: 'random_forest',
        parameters: {
          n_estimators: 100,
          max_depth: null,
        }
      });

      setModels([...models, response.data]);
      setSelectedModel(response.data);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to train model');
    } finally {
      setLoading(false);
    }
  };

  const formatMetric = (value: number) => {
    return typeof value === 'number' ? value.toFixed(4) : value;
  };

  const getMetricColor = (metric: string, value: number) => {
    if (metric === 'r2') {
      return value > 0.8 ? 'success' : value > 0.6 ? 'warning' : 'error';
    }
    // For MSE and MAE, lower is better
    return value < 0.1 ? 'success' : value < 0.3 ? 'warning' : 'error';
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Model Training
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Training Configuration */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Training Configuration
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>
              Test Ratio: {testRatio}%
            </Typography>
            <Slider
              value={testRatio}
              onChange={(_, newValue) => setTestRatio(newValue as number)}
              valueLabelDisplay="auto"
              step={5}
              marks
              min={10}
              max={50}
              valueLabelFormat={(value) => `${value}%`}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>CV Folds</InputLabel>
              <Select
                value={cvFolds}
                onChange={(e) => setCvFolds(e.target.value as number)}
              >
                <MenuItem value={3}>3 Folds</MenuItem>
                <MenuItem value={5}>5 Folds</MenuItem>
                <MenuItem value={10}>10 Folds</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleTrainModel}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Training Model...' : 'Train Model'}
          </Button>
        </Box>
      </Paper>

      {/* Model Results */}
      {models.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Trained Models
          </Typography>

          <Grid container spacing={2}>
            {models.map((model) => (
              <Grid item xs={12} md={6} lg={4} key={model.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedModel?.id === model.id ? 2 : 0,
                    borderColor: 'primary.main'
                  }}
                  onClick={() => setSelectedModel(model)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {model.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {model.model_type.replace('_', ' ').toUpperCase()}
                    </Typography>
                    
                    {model.metrics?.test && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Test Metrics:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          <Chip
                            label={`R² ${formatMetric(model.metrics.test.r2)}`}
                            color={getMetricColor('r2', model.metrics.test.r2)}
                            size="small"
                          />
                          <Chip
                            label={`MSE ${formatMetric(model.metrics.test.mse)}`}
                            color={getMetricColor('mse', model.metrics.test.mse)}
                            size="small"
                          />
                          <Chip
                            label={`MAE ${formatMetric(model.metrics.test.mae)}`}
                            color={getMetricColor('mae', model.metrics.test.mae)}
                            size="small"
                          />
                        </Box>
                      </Box>
                    )}
                    
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      {new Date(model.created_at).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Detailed Model Results */}
      {selectedModel && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Model Details: {selectedModel.name}
          </Typography>

          {selectedModel.metrics && (
            <Grid container spacing={3}>
              {/* Metrics Table */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Performance Metrics
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Metric</TableCell>
                        <TableCell>Train</TableCell>
                        <TableCell>Test</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>R²</TableCell>
                        <TableCell>{formatMetric(selectedModel.metrics.train?.r2)}</TableCell>
                        <TableCell>{formatMetric(selectedModel.metrics.test?.r2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>MSE</TableCell>
                        <TableCell>{formatMetric(selectedModel.metrics.train?.mse)}</TableCell>
                        <TableCell>{formatMetric(selectedModel.metrics.test?.mse)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>MAE</TableCell>
                        <TableCell>{formatMetric(selectedModel.metrics.train?.mae)}</TableCell>
                        <TableCell>{formatMetric(selectedModel.metrics.test?.mae)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {selectedModel.metrics.cv_mean && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">
                      Cross-Validation R²: {formatMetric(selectedModel.metrics.cv_mean)} ± {formatMetric(selectedModel.metrics.cv_std)}
                    </Typography>
                  </Box>
                )}
              </Grid>

              {/* Feature Importance */}
              {selectedModel.metrics.feature_importance && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Top 10 Feature Importance
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Feature</TableCell>
                          <TableCell>Importance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(selectedModel.metrics.feature_importance)
                          .sort(([,a], [,b]) => (b as number) - (a as number))
                          .slice(0, 10)
                          .map(([feature, importance]) => (
                            <TableRow key={feature}>
                              <TableCell>{feature}</TableCell>
                              <TableCell>{formatMetric(importance as number)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
            </Grid>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default ModelTrainingStep;