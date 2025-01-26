import React, { createContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../services/api';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = async (credentials) => {
    try {
      const response = await loginUser(credentials);
  
      // Validate response
      if (!response?.userId || !response?.token) {
        throw new Error('Invalid server response');
      }
  
      const userData = {
        id: response.userId,
        username: response.username,
        token: response.token
      };
  
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
  
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };
  const register = async (userData) => {
    try {
      const response = await registerUser(userData);
      const newUser = { 
        id: response.data.userId || response.data._id,
        username: response.data.username,
        token: response.data.token 
      };

      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };