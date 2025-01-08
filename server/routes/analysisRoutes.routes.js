import express from 'express';
import { analyzeText, scrapeURL, preprocessText } from '../services/newsAnalyzer.js';
import Analysis from '../models/Analysis.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();
router.post('/analyze', auth, async (req, res) => {
  try {
    const { text, url } = req.body;
    
    // Enhanced content validation
    let contentToAnalyze = text;
    if (url) {
      const scrapedContent = await scrapeURL(url);
      contentToAnalyze = scrapedContent.content;
      
      // Check for satire sites
      if (scrapedContent.isSatire) {
        return res.json({
          isFake: true,
          confidenceScore: 100,
          categories: ['News', 'Satire'],
          reliability: 'Known Satire Source'
        });
      }
    }

    // Minimum content length check
    if (!contentToAnalyze || contentToAnalyze.length < 50) {
      return res.status(400).json({
        error: 'Content too short for reliable analysis'
      });
    }

    // Perform analysis
    const analysisResult = await analyzeText(contentToAnalyze);
    
    // Ensure isFake is properly set
    const isFake = analysisResult.label === 'FAKE';
    const confidenceScore = Math.round(analysisResult.confidence * 100);
    
    // Store analysis result
    const newAnalysis = await Analysis.create({
      userId: req.userId,
      text: contentToAnalyze,
      url: url || null,
      result: {
        isFake: isFake,
        confidenceScore: confidenceScore,
        categories: ['News', isFake ? 'Fake News' : 'Real News'],
        reasoning: analysisResult.reasoning
      }
    });

    res.json({
      isFake: isFake,
      confidenceScore: confidenceScore,
      categories: ['News', isFake ? 'Fake News' : 'Real News'],
      reliability: confidenceScore > 80 ? 'High' : confidenceScore > 60 ? 'Moderate' : 'Low',
      reasoning: analysisResult.reasoning
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      details: error.message
    });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Analysis.countDocuments({ userId: req.userId });
    const history = await Analysis.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      history,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Delete analysis
router.delete('/history/:id', auth, async (req, res) => {
  try {
    const analysis = await Analysis.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json({ message: 'Analysis deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete analysis' });
  }
});


export default router;