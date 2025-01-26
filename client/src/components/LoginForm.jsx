import { useState, useContext } from 'react';
import { Box, TextField, Button, Typography, Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
  
    try {
      // Form validation
      if (!username || !password) {
        throw new Error('Please enter both username and password');
      }
  
      // Attempt login
      const userData = await login({ username, password });
  
      // Success handling
      setSnackbarMessage('Login successful!');
      setSnackbarSeverity('success'); 
      setOpenSnackbar(true);
      navigate('/');
  
    } catch (error) {
      // Error handling 
      setError(error.message);
      setSnackbarMessage(error.message);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 5, p: 3, boxShadow: 3, borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom>
        Login
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Username"
          variant="outlined"
          fullWidth
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Password"
          variant="outlined"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button type="submit" variant="contained" color="primary" fullWidth>
          Login
        </Button>
      </form>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        message="Login successful!"
      />
    </Box>
  );
};

export default LoginForm;