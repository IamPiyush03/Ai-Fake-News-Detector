import React, { useContext, useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Container, 
  Box,
  IconButton,
  Menu,
  MenuItem,
  useScrollTrigger
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleClose();
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{
        bgcolor:'rgba(255, 255, 255, 0.98)',
        borderBottom: trigger ? '1px solid' : 'none',
        borderColor: 'divider',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.3s ease'
      }}
      elevation={0}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1 }}>
          <Typography
            variant="h5"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'primary.main',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              '&:hover': {
                color: 'primary.dark'
              }
            }}
          >
            FAKE NEWS DETECTOR
          </Typography>

          {/* Desktop Menu */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>
            <Button 
              component={Link} 
              to="/analyze" 
              sx={{ 
                color: 'text.primary',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
              }}
            >
              Analyze
            </Button>
            {user && (
              <>
                <Button 
                  component={Link} 
                  to="/history"
                  sx={{ 
                    color: 'text.primary',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                  }}
                >
                  History
                </Button>
                <Button 
                  component={Link} 
                  to="/dashboard"
                  sx={{ 
                    color: 'text.primary',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                  }}
                >
                  Dashboard
                </Button>
                <Button 
                  onClick={handleLogout}
                  sx={{ 
                    color: 'text.primary',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                  }}
                >
                  Logout
                </Button>
              </>
            )}
            {!user && (
              <>
                <Button 
                  component={Link} 
                  to="/login"
                  sx={{ 
                    color: 'text.primary',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                  }}
                >
                  Login
                </Button>
                <Button 
                  component={Link} 
                  to="/register" 
                  variant="contained"
                  sx={{
                    bgcolor: 'black',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.8)'
                    }
                  }}
                >
                  Register
                </Button>
              </>
            )}
          </Box>

          {/* Mobile Menu */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              onClick={handleMenu}
              sx={{ color: 'text.primary' }}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  mt: 1.5,
                  border: '1px solid',
                  borderColor: 'divider'
                }
              }}
            >
              <MenuItem 
                component={Link} 
                to="/analyze" 
                onClick={handleClose}
              >
                Analyze
              </MenuItem>
              {user && (
                <>
                  <MenuItem 
                    component={Link} 
                    to="/history" 
                    onClick={handleClose}
                  >
                    History
                  </MenuItem>
                  <MenuItem 
                    component={Link} 
                    to="/dashboard" 
                    onClick={handleClose}
                  >
                    Dashboard
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    Logout
                  </MenuItem>
                </>
              )}
              {!user && (
                <>
                  <MenuItem 
                    component={Link} 
                    to="/login" 
                    onClick={handleClose}
                  >
                    Login
                  </MenuItem>
                  <MenuItem 
                    component={Link} 
                    to="/register" 
                    onClick={handleClose}
                  >
                    Register
                  </MenuItem>
                </>
              )}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;