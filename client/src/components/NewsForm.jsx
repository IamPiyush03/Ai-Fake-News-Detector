import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { analyzeNews } from '../services/api';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import AnalysisIcon from '@mui/icons-material/Analytics';
import LinkIcon from '@mui/icons-material/Link';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ResultCard from './ResultCard';

const NewsForm = () => {
  const [input, setInput] = useState('');
  const [isUrl, setIsUrl] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // Add result state
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();


  const validateUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    setIsUrl(validateUrl(value));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null)

    if (!user?.token) {
      navigate('/login');
      return;
    }

    try {
      const response = await analyzeNews(input, isUrl);

      if (!response || response.isFake === undefined || !response.confidenceScore) {
        throw new Error('Failed to determine news validity.');
      }

      setResult(response);
    } catch (err) {
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      pt: { xs: 10, md: 12 },
      pb: 8,
      background: 'linear-gradient(45deg, #000 30%, #333 90%)'
    }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 6, color: 'white' }}>
          <Typography variant="h2" sx={{ 
            fontWeight: 800,
            fontSize: { xs: '2rem', md: '3rem' },
            mb: 2
          }}>
            Analyze News
          </Typography>
          <Typography variant="h6" sx={{ 
            color: 'rgba(255,255,255,0.8)',
            maxWidth: '600px',
            mx: 'auto'
          }}>
            Enter news text or paste a URL to analyze its authenticity using AI
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ 
          borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>

          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                multiline
                rows={6}
                variant="outlined"
                placeholder={isUrl ? "Enter URL to analyze" : "Enter news text to analyze"}
                value={input}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ 
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      color: 'text.secondary'
                    }}>
                      {isUrl ? <LinkIcon /> : <TextFieldsIcon />}
                    </Box>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    pl: 5,
                    transition: 'all 0.3s ease',
                    '&:hover, &.Mui-focused': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(0,0,0,0.02)'
                    }
                  }
                }}
              />

              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mt: 2,
                    borderRadius: 1,
                    animation: 'slideIn 0.3s ease'
                  }}
                >
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={!input || loading}
                fullWidth
                sx={{
                  mt: 3,
                  py: 2,
                  bgcolor: 'black',
                  color: 'white',
                  fontSize: '1.1rem',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.8)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {loading ? (
                  <CircularProgress 
                    size={24} 
                    sx={{ color: 'inherit' }}
                  />
                ) : (
                  <>
                    <AnalysisIcon sx={{ mr: 1 }} />
                    Analyze Now
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Paper>
        {result && (
          <ResultCard 
            result={result} 
            setResult={setResult}
          />
        )}
      </Container>
      
    </Box>
    
  );
};

export default NewsForm;