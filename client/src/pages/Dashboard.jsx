// filepath: client/src/pages/Dashboard.jsx
import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Box, Typography } from '@mui/material';
import { Line } from 'react-chartjs-2';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/analysis/history', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const history = response.data;
        const labels = history.map(item => new Date(item.createdAt).toLocaleDateString());
        const fakeNewsData = history.map(item => item.result.isFake ? 1 : 0);
        const realNewsData = history.map(item => item.result.isFake ? 0 : 1);

        setData({
          labels,
          datasets: [
            {
              label: 'Fake News',
              data: fakeNewsData,
              borderColor: 'red',
              fill: false,
            },
            {
              label: 'Real News',
              data: realNewsData,
              borderColor: 'green',
              fill: false,
            },
          ],
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 5 }}>
      <Typography variant="h5" gutterBottom>
        Analysis Trends
      </Typography>
      <Line data={data} />
    </Box>
  );
};

export default Dashboard;