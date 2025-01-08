import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Button } from '@mui/material';
import { FacebookShareButton, TwitterShareButton } from 'react-share';

const ResultCard = ({ result }) => {
  if (!result) return null;

  const { isFake = false, confidenceScore = 0, categories = [], reasoning = '', reliability = 'Unknown' } = result;

  const shareUrl = window.location.href;
  const shareTitle = `News Analysis Result: ${isFake ? 'Fake' : 'Real'} News (${confidenceScore}% confidence)`;

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 3 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Analysis Result
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Chip
            label={isFake ? 'Fake News' : 'Real News'}
            color={isFake ? 'error' : 'success'}
          />
          <Typography>Confidence: {confidenceScore}%</Typography>
        </Box>
        <Typography sx={{ mt: 2 }}>Categories: {categories.join(', ')}</Typography>
        <Typography sx={{ mt: 2 }}>Reasoning: {reasoning}</Typography>
        <Typography sx={{ mt: 2 }}>Reliability: {reliability}</Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'space-between' }}>
          <FacebookShareButton url={shareUrl} quote={shareTitle}>
            <Box component="span">
              <Button variant="contained" color="primary">
                Share on Facebook
              </Button>
            </Box>
          </FacebookShareButton>
          <TwitterShareButton url={shareUrl} title={shareTitle}>
            <Box component="span">
              <Button variant="contained" color="primary">
                Share on Twitter
              </Button>
            </Box>
          </TwitterShareButton>
        </Box>
      </CardContent>
    </Card>
  );
};


export default ResultCard;