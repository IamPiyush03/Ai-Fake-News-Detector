import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

export const analyzeNews = async (content, isUrl = false) => {
  try {
    if (!content?.trim()) {
      throw new Error('Content cannot be empty');
    }

    console.log('Sending request:', { [isUrl ? 'url' : 'text']: content.trim() }); // Debug log

    const response = await API.post('/analysis/analyze', {
      [isUrl ? 'url' : 'text']: content.trim()
    });
    
    if (!response?.data) {
      throw new Error('Invalid response from server');
    }

    return response.data;
  } catch (error) {
    console.error('Analysis error:', error.response?.data || error);
    if (error.response?.status === 401) {
      throw new Error('Please log in to analyze news');
    }
    throw error.response?.data?.error || error.message;
  }
};

export const getHistory = async (page = 1, limit = 10) => {
  try {
    const response = await API.get(`/analysis/history?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
};

export const deleteAnalysis = async (id) => {
  try {
    const response = await API.delete(`/analysis/history/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting analysis:', error);
    throw error;
  }
};

export const loginUser = (userData) => API.post('/auth/login', userData);
export const registerUser = (userData) => API.post('/auth/register', userData);