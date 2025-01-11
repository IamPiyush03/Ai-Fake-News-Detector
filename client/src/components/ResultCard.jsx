import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Divider,
  LinearProgress,
  Rating,
  Stack
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import { FacebookShareButton, TwitterShareButton } from 'react-share';

const ResultCard = ({ result }) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 5, comment: '' });

  if (!result) return null;

  const { 
    isFake = false, 
    confidenceScore = 0, 
    categories = [], 
    reasoning = '', 
    detailedScores = {} 
  } = result;

  const shareUrl = window.location.href;
  const shareTitle = `News Analysis Result: ${isFake ? 'Fake' : 'Real'} News (${confidenceScore}% confidence)`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: reasoning,
          url: shareUrl
        });
      } catch (err) {
        setShareDialogOpen(true);
      }
    } else {
      setShareDialogOpen(true);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareTitle}\n\n${reasoning}\n\nAnalyzed at: ${shareUrl}`);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <>
      <Card 
        elevation={0}
        sx={{ 
          maxWidth: 800,
          mx: 'auto',
          mt: 4,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(20px)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            transform: 'translateY(-4px)'
          }
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Analysis Result
          </Typography>

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mt: 3 
          }}>
            <Chip
              label={isFake ? 'Fake News' : 'Real News'}
              color={isFake ? 'error' : 'success'}
              sx={{ 
                fontSize: '1.1rem',
                py: 2.5,
                px: 2,
                borderRadius: 2,
                fontWeight: 600
              }}
            />
            <Chip 
              label={`${confidenceScore}% Confidence`}
              variant="outlined"
              color="primary"
              sx={{ 
                fontSize: '1rem',
                py: 2,
                borderRadius: 2
              }}
            />
          </Box>

          <Stack spacing={4} sx={{ mt: 4 }}>
            {/* Categories */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Categories
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {categories.map((category, index) => (
                  <Chip 
                    key={index} 
                    label={category}
                    sx={{ 
                      borderRadius: 1,
                      bgcolor: 'rgba(0,0,0,0.05)'
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Detailed Scores */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Analysis Breakdown
              </Typography>
              {Object.entries(detailedScores).map(([key, value]) => (
                <Box key={key} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    {key.split(/(?=[A-Z])/).join(' ')}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={value}
                    sx={{ 
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(0,0,0,0.05)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4
                      }
                    }}
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ mt: 0.5 }}
                  >
                    {value}% confidence
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Reasoning */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Detailed Explanation
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  whiteSpace: 'pre-line',
                  color: 'text.secondary',
                  lineHeight: 1.6
                }}
              >
                {reasoning}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 4 }} />

          {/* Share Buttons */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            gap: 2 
          }}>
            <Button
              startIcon={<ShareIcon />}
              variant="contained"
              onClick={handleShare}
              sx={{
                bgcolor: 'black',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.8)'
                }
              }}
            >
              Share
            </Button>
            <FacebookShareButton url={shareUrl} quote={shareTitle}>
              <Button 
                startIcon={<FacebookIcon />}
                variant="outlined"
                sx={{
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2
                  }
                }}
              >
                Facebook
              </Button>
            </FacebookShareButton>
            <TwitterShareButton url={shareUrl} title={shareTitle}>
              <Button 
                startIcon={<TwitterIcon />}
                variant="outlined"
                sx={{
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2
                  }
                }}
              >
                Twitter
              </Button>
            </TwitterShareButton>
          </Box>
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog 
        open={shareDialogOpen} 
        onClose={() => setShareDialogOpen(false)}
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: 2,
            maxWidth: 500
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
          Share Analysis Result
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            value={shareUrl}
            variant="outlined"
            margin="normal"
            InputProps={{
              readOnly: true,
              endAdornment: (
                <IconButton 
                  onClick={handleCopy}
                  sx={{
                    color: copySuccess ? 'success.main' : 'inherit'
                  }}
                >
                  <ContentCopyIcon />
                </IconButton>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1
              }
            }}
          />
          {copySuccess && (
            <Typography 
              color="success" 
              variant="caption"
              sx={{ display: 'block', mt: 1 }}
            >
              Copied to clipboard!
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setShareDialogOpen(false)}
            variant="outlined"
            sx={{
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ResultCard;