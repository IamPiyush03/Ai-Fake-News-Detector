import axios from 'axios';

// Create axios instance with config
const API = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Retry logic configuration
const retryConfig = {
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error) => {
    return axios.isAxiosError(error) && error.response?.status >= 500;
  }
};

// Request interceptor
API.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(new Error('Session expired. Please login again.'));
    }

    // Implement retry logic
    if (retryConfig.retryCondition(error) && originalRequest._retryCount < retryConfig.retries) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      return new Promise(resolve => {
        setTimeout(() => resolve(API(originalRequest)), 
          retryConfig.retryDelay * originalRequest._retryCount
        );
      });
    }

    return Promise.reject(error);
  }
);

// Authentication
export const loginUser = async (credentials) => {
  try {
    const response = await API.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await API.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

// News Analysis
export const analyzeNews = async (content, isUrl = false) => {
  try {
    if (!content?.trim()) {
      throw new Error('Content cannot be empty');
    }

    const response = await API.post('/analysis/analyze', 
      { [isUrl ? 'url' : 'text']: content.trim() },
      {
        validateStatus: (status) => status < 500,
        _retryCount: 0
      }
    );

    if (!response?.data) {
      throw new Error('Invalid response from server');
    }

    return response.data;
  } catch (error) {
    console.error('Analysis error:', error);
    throw new Error(
      error.response?.data?.message || 
      'Analysis failed. Please try again.'
    );
  }
};

// History Management
export const getHistory = async (page = 1, limit = 10) => {
  try {
    const response = await API.get('/analysis/history', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch history');
  }
};

export const deleteAnalysis = async (id) => {
  try {
    await API.delete(`/analysis/${id}`);
    return true;
  } catch (error) {
    throw new Error('Failed to delete analysis');
  }
};

// Feedback System
export const submitFeedback = async (analysisId, feedback) => {
  try {
    const response = await API.post(`/analysis/${analysisId}/feedback`, feedback);
    return response.data;
  } catch (error) {
    throw new Error('Failed to submit feedback');
  }
};

// Additional Analysis Methods
export const getAnalysisStats = async () => {
  try {
    const response = await API.get('/analysis/stats');
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch analysis statistics');
  }
};

export const getCategoryDistribution = async () => {
  try {
    const response = await API.get('/analysis/categories');
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch category distribution');
  }
};

export default API;