import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent,
  CardMedia 
} from '@mui/material';
import { Link } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';
import HistoryIcon from '@mui/icons-material/History';
import DashboardIcon from '@mui/icons-material/Dashboard';

const Homepage = () => {
  return (
    <Container>
      {/* Hero Section */}
      <Box
        sx={{
          pt: 8,
          pb: 6,
          textAlign: 'center'
        }}
      >
        <Typography
          component="h1"
          variant="h2"
          color="primary"
          gutterBottom
          sx={{ fontWeight: 'bold' }}
        >
          AI Fake News Detector
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Detect fake news with the power of artificial intelligence.
          Our advanced algorithms help you identify misinformation and verify news authenticity.
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button
            component={Link}
            to="/register"
            variant="contained"
            color="primary"
            size="large"
            sx={{ mr: 2 }}
          >
            Get Started
          </Button>
          <Button
            component={Link}
            to="/login"
            variant="outlined"
            color="primary"
            size="large"
          >
            Login
          </Button>
        </Box>
      </Box>

      {/* Features Section */}
      <Grid container spacing={4} sx={{ mt: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <SecurityIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
              <Typography gutterBottom variant="h5" component="h2">
                AI-Powered Analysis
              </Typography>
              <Typography>
                Advanced machine learning algorithms analyze news content for authenticity.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <HistoryIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
              <Typography gutterBottom variant="h5" component="h2">
                Analysis History
              </Typography>
              <Typography>
                Keep track of all your previous news analysis results.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <DashboardIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
              <Typography gutterBottom variant="h5" component="h2">
                Dashboard Insights
              </Typography>
              <Typography>
                Visualize trends and patterns in news authenticity.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Homepage;