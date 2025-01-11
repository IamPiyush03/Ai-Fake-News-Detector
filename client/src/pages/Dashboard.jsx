import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  CircularProgress, 
  Alert 
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    timelineData: { labels: [], datasets: [] },
    categoryData: { labels: [], datasets: [] },
    reliabilityData: { labels: [], datasets: [] }
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/analysis/history', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        if (response.data.history) {
          processData(response.data.history);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);


  const processData = (history) => {
    // Timeline data
    const timelineLabels = history.map(item => new Date(item.createdAt).toLocaleDateString());
    const fakeNewsData = history.map(item => item.result.isFake ? 1 : 0);
    const realNewsData = history.map(item => item.result.isFake ? 0 : 1);

    // Category distribution
    const categories = history.reduce((acc, item) => {
      item.result.categories.forEach(cat => {
        acc[cat] = (acc[cat] || 0) + 1;
      });
      return acc;
    }, {});

    // Reliability distribution
    const reliability = history.reduce((acc, item) => {
      const level = item.result.confidenceScore > 80 ? 'High' : 
                    item.result.confidenceScore > 60 ? 'Moderate' : 'Low';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});

    setData({
      timelineData: {
        labels: timelineLabels,
        datasets: [
          {
            label: 'Fake News',
            data: fakeNewsData,
            borderColor: 'red',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            fill: false
          },
          {
            label: 'Real News',
            data: realNewsData,
            borderColor: 'green',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            fill: false
          }
        ]
      },
      categoryData: {
        labels: Object.keys(categories),
        datasets: [{
          data: Object.values(categories),
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)'
          ]
        }]
      },
      reliabilityData: {
        labels: Object.keys(reliability),
        datasets: [{
          label: 'Reliability Distribution',
          data: Object.values(reliability),
          backgroundColor: [
            'rgba(75, 192, 192, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(255, 99, 132, 0.5)'
          ]
        }]
      }
    });
  };

  if (loading) return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(45deg, #000 30%, #333 90%)'
    }}>
      <CircularProgress sx={{ color: 'white' }} />
    </Box>
  );

  if (error) return (
    <Box sx={{ 
      p: 3,
      minHeight: '100vh',
      background: 'linear-gradient(45deg, #000 30%, #333 90%)'
    }}>
      <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto', mt: 5 }}>
        {error}
      </Alert>
    </Box>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      pt: { xs: 10, md: 12 },
      pb: 8,
      background: 'linear-gradient(45deg, #000 30%, #333 90%)'
    }}>
      <Container maxWidth="lg">
        <Typography 
          variant="h2" 
          sx={{ 
            color: 'white',
            fontWeight: 800,
            mb: 6,
            textAlign: 'center'
          }}
        >
          Analysis Dashboard
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Paper sx={{ 
              p: 4,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.98)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                Analysis Timeline
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line data={data.timelineData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { stepSize: 1 }
                    }
                  }
                }} />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ 
              p: 4,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.98)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                Category Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <Pie data={data.categoryData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }} />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ 
              p: 4,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.98)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                Reliability Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar data={data.reliabilityData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  }
                }} />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;