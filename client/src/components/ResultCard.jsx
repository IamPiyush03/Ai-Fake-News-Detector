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
  Divider
} from '@mui/material';
import { FacebookShareButton, TwitterShareButton } from 'react-share';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';

const ResultCard = ({ result }) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  if (!result) return null;

  const { isFake = false, confidenceScore = 0, categories = [], reasoning = '', reliability = 'Unknown' } = result;

  const shareUrl = window.location.href;
  const shareTitle = `News Analysis Result: ${isFake ? 'Fake' : 'Real'} News (${confidenceScore}% confidence)`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `${reasoning}`,
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
    await navigator.clipboard.writeText(`${shareTitle}\n\n${reasoning}\n\nAnalyzed at: ${shareUrl}`);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <>
      <Card sx={{ maxWidth: 600, mx: 'auto', mt: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Analysis Result
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Chip
              label={isFake ? 'Fake News' : 'Real News'}
              color={isFake ? 'error' : 'success'}
              sx={{ fontSize: '1.1rem', py: 1 }}
            />
            <Chip 
              label={`Confidence: ${confidenceScore}%`}
              color="primary"
              variant="outlined"
            />
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Categories:</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            {categories.map((category, index) => (
              <Chip key={index} label={category} size="small" />
            ))}
          </Box>
          
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Reasoning:</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>{reasoning}</Typography>
          
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Reliability:</Typography>
          <Chip 
            label={reliability}
            color={reliability === 'High' ? 'success' : reliability === 'Moderate' ? 'warning' : 'error'}
            sx={{ mt: 1 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
            <Button
              startIcon={<ShareIcon />}
              variant="contained"
              onClick={handleShare}
            >
              Share
            </Button>
            <FacebookShareButton url={shareUrl} quote={shareTitle}>
              <Button startIcon={<FacebookIcon />} variant="outlined">
                Facebook
              </Button>
            </FacebookShareButton>
            <TwitterShareButton url={shareUrl} title={shareTitle}>
              <Button startIcon={<TwitterIcon />} variant="outlined">
                Twitter
              </Button>
            </TwitterShareButton>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
        <DialogTitle>Share Analysis Result</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            value={shareUrl}
            variant="outlined"
            margin="normal"
            InputProps={{
              readOnly: true,
              endAdornment: (
                <IconButton onClick={handleCopy}>
                  <ContentCopyIcon />
                </IconButton>
              )
            }}
          />
          {copySuccess && (
            <Typography color="success" variant="caption">
              Copied to clipboard!
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ResultCard;