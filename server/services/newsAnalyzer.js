import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import natural from 'natural';

dotenv.config();

// Enhanced constants
const CONFIG = {
  MAX_TEXT_LENGTH: 100000,
  MAX_CONTENT_LENGTH: 10 * 1024 * 1024,
  REQUEST_TIMEOUT: 15000,
  MIN_ARTICLE_LENGTH: 50,
  API_RETRY_ATTEMPTS: 3,
  DEFAULT_CONFIDENCE: 0.7,
  FAKE_THRESHOLD: 60,
  RATE_LIMIT_WINDOW: 60000,
  MAX_REQUESTS_PER_WINDOW: 100
};

const DOMAINS = {
  SATIRE: ['theonion.com', 'clickhole.com', 'babylonbee.com'],
  CREDIBLE: ['.edu', '.gov', 'reuters.com', 'ap.org', 'bbc.com', 'nature.com']
};

const PATTERNS = {
  FAKE_INDICATORS: [
    'bigfoot', 'alien invasion', 'conspiracy', 'classified',
    'government cover', 'secret mission', 'miracle cure', 'shocking truth'
  ],
  CREDIBLE_MARKERS: [
    'according to', 'cited by', 'published in', 'researchers at',
    'study shows', 'evidence suggests', 'data indicates'
  ],
  CLICKBAIT: [
    'you won\'t believe', 'what happens next', 'shocking truth',
    'mind-blowing', 'unbelievable', 'they don\'t want you to know'
  ]
};

// Rate limiting implementation
let requestCount = 0;
let lastResetTime = Date.now();

const checkRateLimit = () => {
  const now = Date.now();
  if (now - lastResetTime > CONFIG.RATE_LIMIT_WINDOW) {
    requestCount = 0;
    lastResetTime = now;
  }
  if (requestCount >= CONFIG.MAX_REQUESTS_PER_WINDOW) {
    throw new Error('Rate limit exceeded');
  }
  requestCount++;
};

// Enhanced text preprocessing
const preprocessText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .slice(0, CONFIG.MAX_TEXT_LENGTH)
    .split(/\s+/)
    .join(' ')
    .replace(/[^\w\s.,!?-]/g, '')
    .replace(/\b(Share|Published|Advertising|Tags)\b[^\n]*(\n|$)/gi, '')
    .trim();
};

// Enhanced content analysis
const analyzeContent = (text) => {
  if (!text) return { score: 0, reasons: [] };
  
  const tokenizer = new natural.WordTokenizer();
  const words = tokenizer.tokenize(text);
  
  let score = 100;
  const reasons = [];

  // Check fake indicators
  const fakeIndicators = PATTERNS.FAKE_INDICATORS.filter(indicator => 
    text.toLowerCase().includes(indicator.toLowerCase())
  );
  
  if (fakeIndicators.length) {
    score -= fakeIndicators.length * 15;
    reasons.push(`Contains suspicious terms: ${fakeIndicators.join(', ')}`);
  }

  // Check credible markers
  const credibleMarkers = PATTERNS.CREDIBLE_MARKERS.filter(marker => 
    text.toLowerCase().includes(marker.toLowerCase())
  );
  
  if (credibleMarkers.length) {
    score += credibleMarkers.length * 10;
    reasons.push('Contains credible source citations');
  }

  // Statistics and quotes
  if (/\d+(?:\.\d+)?%/.test(text)) {
    score += 10;
    reasons.push('Contains statistical information');
  }
  
  if (/"[^"]+"/g.test(text)) {
    score += 10;
    reasons.push('Contains direct quotes');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasons
  };
};

// Enhanced source credibility checking
const checkSourceCredibility = (url) => {
  if (!url) return { score: 50, reasons: ['No URL provided'] };
  
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname.toLowerCase();
    
    if (DOMAINS.SATIRE.some(d => domain.includes(d))) {
      return {
        score: 0,
        reasons: ['Known satire website']
      };
    }
    
    if (DOMAINS.CREDIBLE.some(d => 
      d.startsWith('.') ? domain.endsWith(d) : domain.includes(d)
    )) {
      return {
        score: 100,
        reasons: ['Credible domain source']
      };
    }
    
    return {
      score: 50,
      reasons: ['Unknown domain credibility']
    };
  } catch {
    return {
      score: 50,
      reasons: ['Invalid URL format']
    };
  }
};

// Enhanced language analysis
const analyzeLanguage = (text) => {
  if (!text) return { score: 0, reasons: [] };
  
  let score = 100;
  const reasons = [];
  
  // Check emotional language
  const emotionalPatterns = {
    sensationalism: /!{2,}|\?{2,}|BREAKING|SHOCKING|MUST SEE/gi,
    clickbait: new RegExp(PATTERNS.CLICKBAIT.join('|'), 'gi'),
    allCaps: /\b[A-Z]{4,}\b/g
  };

  Object.entries(emotionalPatterns).forEach(([type, pattern]) => {
    const matches = (text.match(pattern) || []);
    if (matches.length) {
      score -= matches.length * 10;
      reasons.push(`Contains ${type}: ${matches.join(', ')}`);
    }
  });

  return {
    score: Math.max(0, score),
    reasons
  };
};

// Enhanced Cohere integration
const performCohereAnalysis = async (text, retryCount = 0) => {
  checkRateLimit();
  
  const examples = [
    { text: "Scientists discover new evidence supporting climate change in Antarctic ice cores", label: "REAL" },
    { text: "New study in Nature journal shows link between exercise and longevity", label: "REAL" },
    { text: "Government confirms alien base discovered under Antarctic ice", label: "FAKE" },
    { text: "Scientists discover miracle pill that cures all diseases overnight", label: "FAKE" }
  ];

  try {
    const response = await axios.post('https://api.cohere.ai/v1/classify', {
      inputs: [preprocessText(text).slice(0, 512)],
      examples
    }, {
      headers: {
        Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: CONFIG.REQUEST_TIMEOUT
    });

    const result = response.data?.classifications?.[0];
    if (!result) throw new Error('Invalid API response');

    return {
      label: result.prediction,
      confidence: Math.max(0, Math.min(1, result.confidence || CONFIG.DEFAULT_CONFIDENCE))
    };
  } catch (error) {
    if (retryCount < CONFIG.API_RETRY_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return performCohereAnalysis(text, retryCount + 1);
    }
    
    // Fallback to rule-based analysis
    const contentAnalysis = analyzeContent(text);
    return {
      label: contentAnalysis.score < 50 ? 'FAKE' : 'REAL',
      confidence: CONFIG.DEFAULT_CONFIDENCE
    };
  }
};

// Add validation helper
const validateScore = (score, defaultValue = 50) => {
  const parsed = parseFloat(score);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.max(0, Math.min(100, Math.round(parsed)));
};

const calculateWeightedScore = (scores) => {
  const weights = {
    content: 0.3,
    source: 0.25, 
    language: 0.2,
    cohere: 0.25
  };

  // Validate all scores
  const validScores = {
    content: validateScore(scores.content),
    source: validateScore(scores.source),
    language: validateScore(scores.language),
    cohere: validateScore(scores.cohere)
  };

  // Calculate weighted sum
  const weightedScore = Object.entries(weights).reduce((total, [key, weight]) => {
    return total + (validScores[key] * weight);
  }, 0);

  return validateScore(weightedScore);
};

// Main analysis function
const analyzeText = async (text, url = null) => {
  try {
    const cleanedText = preprocessText(text);
    if (!cleanedText) {
      throw new Error('Invalid or empty text input');
    }

    const [contentAnalysis, sourceAnalysis, languageAnalysis, cohereResult] = 
      await Promise.all([
        analyzeContent(cleanedText),
        checkSourceCredibility(url),
        analyzeLanguage(cleanedText),
        performCohereAnalysis(cleanedText)
      ]);

    // Validate scores before calculation
    const weightedScore = calculateWeightedScore({
      content: contentAnalysis?.score ?? 50,
      source: sourceAnalysis?.score ?? 50, 
      language: languageAnalysis?.score ?? 50,
      cohere: (cohereResult?.confidence ?? 0.5) * 100
    });

    const isFake = weightedScore < CONFIG.FAKE_THRESHOLD;

    // Ensure valid number is returned
    return {
      isFake,
      confidenceScore: validateScore(weightedScore),
      analysis: {
        content: contentAnalysis,
        source: sourceAnalysis,
        language: languageAnalysis,
        aiPrediction: cohereResult
      }
    };

  } catch (error) {
    console.error('Analysis error:', error);
    // Return default values on error
    return {
      isFake: true,
      confidenceScore: 50,
      analysis: {
        content: { score: 50, reasons: ['Analysis failed'] },
        source: { score: 50, reasons: ['Analysis failed'] },
        language: { score: 50, reasons: ['Analysis failed'] },
        aiPrediction: { confidence: 0.5, label: 'FAKE' }
      }
    };
  }
};

const scrapeURL = async (url) => {
  try {
    // URL validation
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol - only HTTP/HTTPS allowed');
    }

    // Domain verification
    const domain = parsedUrl.hostname.toLowerCase();
    const isSatireSite = SATIRE_DOMAINS.some(d => domain.includes(d));

    // Special handling for known domains
    const formattedUrl = domain.includes('theonion.com') && !domain.startsWith('www') 
      ? url.replace('theonion.com', 'www.theonion.com')
      : url;

    // Make request with security headers
    const response = await axios.get(formattedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html,application/xhtml+xml',
      },
      timeout: CONFIG.REQUEST_TIMEOUT,
      maxContentLength: CONFIG.MAX_CONTENT_LENGTH,
      validateStatus: status => status === 200
    });

    // Parse content
    const $ = cheerio.load(response.data);
    const contentSelectors = ['article p', '.article-content p', 'main p'];
    
    let content = '';
    contentSelectors.forEach(selector => {
      $(selector).each((_, el) => {
        const text = $(el).text().trim();
        if (text && !text.match(/^\s*(Share|Advertisement)\s*$/)) {
          content += text + ' ';
        }
      });
    });

    // Validate and clean content
    const cleanedContent = preprocessText(content);
    if (!cleanedContent || cleanedContent.length < CONFIG.MIN_ARTICLE_LENGTH) {
      throw new Error('Insufficient article content');
    }

    return {
      content: cleanedContent,
      isSatire: isSatireSite,
      url: formattedUrl,
      domain
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('URL scraping error:', error);
    throw new Error(`URL scraping failed: ${message}`);
  }
};

// Add scrapeURL to exports
export { analyzeText, scrapeURL, preprocessText };