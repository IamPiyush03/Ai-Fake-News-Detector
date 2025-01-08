// src/components/NewsForm.jsx
import React, { useState, useContext } from 'react';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { analyzeNews } from '../services/api';
import ResultCard from './ResultCard';
import { AuthContext } from '../context/AuthContext';

const NewsForm = () => {
  const [input, setInput] = useState('');
  const [isUrl, setIsUrl] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
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
  
    if (!user?.token) {
      navigate('/login');
      return;
    }
  
    try {
      const response = await analyzeNews(input, isUrl);
  
      if (!response || response.isFake === undefined || !response.confidenceScore) {
        setError('Failed to determine news validity.');
        return;
      }
  
      setResult({
        isFake: response.isFake,
        confidenceScore: response.confidenceScore,
        categories: response.categories,
        reliability: response.reliability,
        reasoning: response.reasoning
      });
    } catch (error) {
      console.error('Error analyzing news:', error);
      setError(error.message || 'An unexpected error occurred');
    }
  };
  
  
  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 5, p: 3, boxShadow: 3, borderRadius: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Typography variant="h5" gutterBottom>
        Analyze News Article
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label={isUrl ? "Enter News URL" : "Enter News Text"}
          variant="outlined"
          multiline={!isUrl}
          rows={isUrl ? 1 : 4}
          fullWidth
          value={input}
          onChange={handleInputChange}
          sx={{ mb: 2 }}
          placeholder={isUrl ? "https://example.com/news-article" : "Paste article text here..."}
        />
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          fullWidth
          disabled={!input.trim()}
        >
          {isUrl ? "Analyze URL" : "Analyze Text"}
        </Button>
      </form>
      
      <ResultCard result={result} />


    </Box>
  );
};

export default NewsForm;