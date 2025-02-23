import express from 'express';
import { analyzeText, scrapeURL, preprocessText } from '../services/newsAnalyzer.js';
import Analysis from '../models/Analysis.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/analyze', auth, async (req, res) => {
  try {
    const { text, url } = req.body;
    
    if (!text && !url) {
      return res.status(400).json({
        error: 'Input required',
        details: 'Please provide either text content or a URL to analyze'
      });
    }

    const analysisResult = await analyzeText(text || url, url);

    if (analysisResult.analysis?.error) {
      return res.status(400).json({
        error: 'Analysis failed',
        details: analysisResult.analysis.error
      });
    }

    const reasoning = analysisResult.analysis?.contentAnalysis?.reasons?.join(', ') || 'Analysis complete';

    // Save analysis results
    const newAnalysis = new Analysis({
      userId: req.userId,
      text: analysisResult.analysis.text,
      url: url || null,
      result: {
        isFake: analysisResult.isFake,
        confidenceScore: analysisResult.confidenceScore,
        categories: ['News', analysisResult.isFake ? 'Fake News' : 'Real News'],
        reasoning
      }
    });

    await newAnalysis.save();

    res.json({
      isFake: analysisResult.isFake,
      confidenceScore: analysisResult.confidenceScore,
      categories: ['News', analysisResult.isFake ? 'Fake News' : 'Real News'],
      reasoning,
      details: {
        contentAnalysis: analysisResult.analysis.contentAnalysis,
        sourceAnalysis: analysisResult.analysis.sourceAnalysis
      }
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
      .limit(limit)
      .select('-analysis.reasons'); // Exclude detailed reasons from list view

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
    console.error('Error deleting analysis:', error);
    res.status(500).json({ error: 'Failed to delete analysis' });
  }
});

export default router;