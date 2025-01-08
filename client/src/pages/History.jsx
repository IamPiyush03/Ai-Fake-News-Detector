import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Pagination,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getHistory, deleteAnalysis } from '../services/api';

const History = () => {
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    try {
      const data = await getHistory(page);
      setHistory(data.history);
      setTotalPages(data.totalPages);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const handleDelete = async (id) => {
    try {
      await deleteAnalysis(id);
      fetchHistory(); // Refresh list after deletion
    } catch (error) {
      setError(error.message);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 5, p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Analysis History
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <List>
        {history.map((item) => (
          <ListItem key={item._id} divider>
            <ListItemText
              primary={item.text}
              secondary={`${item.result.isFake ? 'Fake' : 'Real'} News - Confidence: ${item.result.confidenceScore}%`}
            />
            <ListItemSecondaryAction>
              <IconButton 
                edge="end" 
                aria-label="delete"
                onClick={() => handleDelete(item._id)}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Pagination 
          count={totalPages} 
          page={page} 
          onChange={handlePageChange}
          color="primary"
        />
      </Box>
    </Box>
  );
};

export default History;