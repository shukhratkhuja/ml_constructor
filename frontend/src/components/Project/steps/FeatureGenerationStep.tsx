import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Alert,
} from '@mui/material';
import axios from 'axios';

interface FeatureGenerationStepProps {
  project: any;
  onFeaturesGenerated: () => void;
  updateProject: (updates: any) => Promise<any>;
}

const FeatureGenerationStep: React.FC<FeatureGenerationStepProps> = ({
  project,
  onFeaturesGenerated,
  updateProject,
}) => {
  const [dateFeatures, setDateFeatures] = useState({
    month: false,
    year: false,
    quarter: false,
    month_sin: false,
    month_cos: false,
    quarter_sin: false,
    quarter_cos: false,
    number_of_holidays_governmental: false,
    number_of_holidays_religious: false,
    periods_until_next_governmental_holiday: false,
    periods_until_next_religious_holiday: false,
    number_of_ramadan_days_in_month: false,
  });

  const [numericalFeatures, setNumericalFeatures] = useState({
    lag_periods: [] as number[],
    rolling_windows: [] as number[],
    trend_periods: [] as number[],
    change_periods: [] as number[],
    include_statistics: false,
    include_trend_features: false,
  });

  const [dialogOpen, setDialogOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calendar view numbers 1-30
  const numbers = Array.from({ length: 30 }, (_, i) => i + 1);

  useEffect(() => {
    // Load existing features if they exist
    if (project?.date_features) {
      setDateFeatures({ ...dateFeatures, ...project.date_features });
    }
    if (project?.numerical_features) {
      setNumericalFeatures({ ...numericalFeatures, ...project.numerical_features });
    }
  }, [project]);

  const handleDateFeatureChange = (feature: string) => {
    setDateFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature as keyof typeof prev]
    }));
  };

  const handleNumberSelection = (type: string, number: number) => {
    setNumericalFeatures(prev => {
      const currentArray = prev[type as keyof typeof prev] as number[];
      const newArray = currentArray.includes(number)
        ? currentArray.filter(n => n !== number)
        : [...currentArray, number].sort((a, b) => a - b);
      
      return {
        ...prev,
        [type]: newArray
      };
    });
  };

  const handleGenerateFeatures = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `/api/features/projects/${project.id}/generate-features`,
        {
          date_features: dateFeatures,
          numerical_features: numericalFeatures,
        }
      );

      await updateProject({
        date_features: dateFeatures,
        numerical_features: numericalFeatures,
      });

      onFeaturesGenerated();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to generate features');
    } finally {
      setLoading(false);
    }
  };

  const renderNumberCalendar = (type: string, title: string) => {
    const selectedNumbers = numericalFeatures[type as keyof typeof numericalFeatures] as number[];
    
    return (
      <Dialog
        open={dialogOpen === type}
        onClose={() => setDialogOpen(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Grid container spacing={1}>
            {numbers.map((num) => (
              <Grid item xs={2} key={num}>
                <Button
                  variant={selectedNumbers.includes(num) ? "contained" : "outlined"}
                  size="small"
                  fullWidth
                  onClick={() => handleNumberSelection(type, num)}
                  sx={{ minWidth: 0, p: 1 }}
                >
                  {num}
                </Button>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              Selected: {selectedNumbers.join(', ') || 'None'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Feature Generation
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Date Features */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Date Features
        </Typography>
        
        <FormGroup>
          <Grid container>
            {Object.entries(dateFeatures).map(([key, value]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={value}
                      onChange={() => handleDateFeatureChange(key)}
                    />
                  }
                  label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                />
              </Grid>
            ))}
          </Grid>
        </FormGroup>
      </Paper>

      {/* Numerical Features */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Numerical Features
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle1" gutterBottom>
              Lag Periods
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setDialogOpen('lag_periods')}
              sx={{ mb: 1 }}
            >
              Select Periods
            </Button>
            <Box>
              {numericalFeatures.lag_periods.map(num => (
                <Chip key={num} label={num} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle1" gutterBottom>
              Rolling Windows
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setDialogOpen('rolling_windows')}
              sx={{ mb: 1 }}
            >
              Select Windows
            </Button>
            <Box>
              {numericalFeatures.rolling_windows.map(num => (
                <Chip key={num} label={num} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle1" gutterBottom>
              Trend Periods
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setDialogOpen('trend_periods')}
              sx={{ mb: 1 }}
            >
              Select Periods
            </Button>
            <Box>
              {numericalFeatures.trend_periods.map(num => (
                <Chip key={num} label={num} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle1" gutterBottom>
              Change Periods
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setDialogOpen('change_periods')}
              sx={{ mb: 1 }}
            >
              Select Periods
            </Button>
            <Box>
              {numericalFeatures.change_periods.map(num => (
                <Chip key={num} label={num} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
              ))}
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={numericalFeatures.include_statistics}
                onChange={(e) => setNumericalFeatures(prev => ({
                  ...prev,
                  include_statistics: e.target.checked
                }))}
              />
            }
            label="Include Statistics (mean, min, max, std)"
          />
        </Box>

        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={numericalFeatures.include_trend_features}
                onChange={(e) => setNumericalFeatures(prev => ({
                  ...prev,
                  include_trend_features: e.target.checked
                }))}
              />
            }
            label="Include Trend Features"
          />
        </Box>
      </Paper>

      <Button
        variant="contained"
        size="large"
        onClick={handleGenerateFeatures}
        disabled={loading}
      >
        {loading ? 'Generating Features...' : 'Generate Features & Continue'}
      </Button>

      {/* Number selection dialogs */}
      {renderNumberCalendar('lag_periods', 'Select Lag Periods')}
      {renderNumberCalendar('rolling_windows', 'Select Rolling Window Sizes')}
      {renderNumberCalendar('trend_periods', 'Select Trend Periods')}
      {renderNumberCalendar('change_periods', 'Select Change Periods')}
    </Box>
  );
};

export default FeatureGenerationStep;