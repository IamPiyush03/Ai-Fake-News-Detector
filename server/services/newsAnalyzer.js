import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
dotenv.config();

// Define patterns
const SATIRE_DOMAINS = ['theonion.com', 'clickhole.com', 'babylonbee.com'];
const FAKE_INDICATORS = [
  'bigfoot', 'alien invasion', 'conspiracy', 'classified',
  'government cover', 'secret mission', 'miracle cure', 'shocking truth'
];

// Helper to preprocess text
const preprocessText = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?-]/g, '')
    .replace(/\b(Share|Published|Advertising|Tags)\b.*?(?=\n|$)/gi, '')
    .trim();
};

// Scrape content from a URL
const scrapeURL = async (url) => {
  try {
    const isSatireSite = SATIRE_DOMAINS.some(domain => url.includes(domain));

    if (url.includes('theonion.com') && !url.includes('www')) {
      url = url.replace('theonion.com', 'www.theonion.com');
    }

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const contentSelectors = [
      'article p', '.article-content p', '.article__body p',
      '[class*="article"] p', '[class*="content"] p', 'main p'
    ];

    let content = '';
    contentSelectors.forEach(selector => {
      $(selector).each((_, el) => {
        const text = $(el).text().trim();
        if (text && !text.match(/^\s*(Share|Advertisement)\s*$/)) {
          content += text + ' ';
        }
      });
    });

    const cleanedContent = preprocessText(content);
    if (!cleanedContent || cleanedContent.length < 50) {
      throw new Error('Insufficient article content');
    }

    return { content: cleanedContent, isSatire: isSatireSite };
  } catch (error) {
    console.error('URL scraping error:', error);
    throw new Error(`URL scraping failed: ${error.message}`);
  }
};

// Analyze text with Cohere API
const analyzeText = async (text, urlInfo = null) => {
  try {
    const cleanedText = preprocessText(text);

    // Improve examples with clear real/fake distinctions
    const data = {
      inputs: [cleanedText],
      examples: [
        { text: "According to a study published in Nature journal, researchers found...", label: "REAL" },
        { text: "Scientists discover miracle cure that heals all diseases overnight", label: "FAKE" },
        { text: "Local weather service predicts heavy rainfall for the weekend", label: "REAL" },
        { text: "Government admits to hiding aliens in secret underground facility", label: "FAKE" },
        { text: "New research from Stanford University shows correlation between...", label: "REAL" },
        { text: "Anonymous source reveals shocking conspiracy about world leaders", label: "FAKE" }
      ]
    };

    const response = await axios.post('https://api.cohere.com/v1/classify', data, {
      headers: {
        'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const classification = response.data.classifications[0];
    const label = classification.prediction;
    const confidence = classification.confidence;

    // Explicitly set isFake based on label
    const isFake = label === 'FAKE';

    return {
      label: label,
      isFake: isFake,
      confidence: confidence,
      score: confidence,
      reasoning: `Analysis determined this is ${isFake ? 'fake' : 'real'} news with ${(confidence * 100).toFixed(1)}% confidence`
    };

  } catch (error) {
    console.error('Analysis error:', error);
    throw new Error(`Analysis failed: ${error.message}`);
  }
};

export { analyzeText, scrapeURL, preprocessText };
