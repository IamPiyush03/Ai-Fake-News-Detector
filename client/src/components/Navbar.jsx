import React, { useContext } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,
  Container,
  IconButton
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NewspaperIcon from '@mui/icons-material/Newspaper';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <IconButton
            component={Link}
            to="/"
            sx={{ color: 'white', mr: 2 }}
          >
            <NewspaperIcon />
          </IconButton>
          
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{
              mr: 2,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.2rem',
              color: 'white',
              textDecoration: 'none',
              flexGrow: 1
            }}
          >
            FAKE NEWS DETECTOR
          </Typography>

          <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
            {user && (
              <>
                <Button
                  component={Link}
                  to="/analyze"
                  sx={{ color: 'white' }}
                >
                  Analyze
                </Button>
                <Button
                  component={Link}
                  to="/history"
                  sx={{ color: 'white' }}
                >
                  History
                </Button>
                <Button
                  component={Link}
                  to="/dashboard"
                  sx={{ color: 'white' }}
                >
                  Dashboard
                </Button>
              </>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {user ? (
              <Button 
                color="inherit" 
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Logout
              </Button>
            ) : (
              <>
                <Button 
                  component={Link} 
                  to="/login" 
                  sx={{ color: 'white' }}
                >
                  Login
                </Button>
                <Button 
                  component={Link} 
                  to="/register" 
                  variant="contained" 
                  color="secondary"
                >
                  Register
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;