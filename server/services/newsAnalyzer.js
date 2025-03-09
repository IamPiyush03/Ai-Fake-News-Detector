// newsAnalyzer.js
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import natural from 'natural';

dotenv.config();

// Configuration settings for limits, thresholds, and timing
const CONFIG = {
  MAX_TEXT_LENGTH: 100000,
  MAX_CONTENT_LENGTH: 20 * 1024 * 1024, // 20MB
  REQUEST_TIMEOUT: 30000, // 30 seconds
  MIN_ARTICLE_LENGTH: 100,
  API_RETRY_ATTEMPTS: 3,
  DEFAULT_CONFIDENCE: 0.7,
  FAKE_THRESHOLD: 75,
  RATE_LIMIT_WINDOW: 60000,
  MAX_REQUESTS_PER_WINDOW: 100
};

// Domain lists to help decide credibility based on website source
const DOMAINS = {
  SATIRE: ['theonion.com', 'clickhole.com', 'babylonbee.com'],
  CREDIBLE: ['.edu', '.gov', 'reuters.com', 'ap.org', 'bbc.com', 'nature.com']
};

// Lists of words/phrases that are markers for fake news, credibility, and clickbait
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
    "you won't believe", "what happens next", "shocking truth",
    "mind-blowing", "unbelievable", "they don't want you to know"
  ]
};

// Variables to track the number of requests (rate limiting)
let requestCount = 0;
let lastResetTime = Date.now();

// Checks if we have exceeded our allowed number of requests in a given time window
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

// Determines whether the provided input is a URL or plain text
const getInputType = (input) => {
  if (!input || typeof input !== 'string') return 'invalid';

  if (input.startsWith('http://') || input.startsWith('https://')) {
    try {
      new URL(input);
      return 'url';
    } catch (_) {
      return 'text';
    }
  }
  return 'text';
};

// Cleans the text by removing unnecessary markers, limiting length, and stripping unwanted characters
const preprocessText = (text) => {
  if (!text || typeof text !== 'string') return '';

  text = text.replace(/^Headline:\s*/, '');
  return text
    .slice(0, CONFIG.MAX_TEXT_LENGTH)
    .split(/\s+/)
    .join(' ')
    .replace(/[^\w\s.,!?-]/g, '')
    .replace(/\b(Share|Published|Advertising|Tags)\b[^\n]*(\n|$)/gi, '')
    .trim();
};

// Analyzes the text content using heuristic methods
const analyzeContent = (text) => {
  if (!text) return { score: 0, reasons: ['No content provided'] };

  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text);
  let score = 100;
  const reasons = [];

  // Subtract points for fake indicators
  const fakeIndicators = PATTERNS.FAKE_INDICATORS.filter(indicator =>
    text.toLowerCase().includes(indicator.toLowerCase())
  );
  if (fakeIndicators.length) {
    score -= fakeIndicators.length * 20;
    reasons.push(`Contains suspicious terms: ${fakeIndicators.join(', ')}`);
  }

  // Add points for credible markers
  const credibleMarkers = PATTERNS.CREDIBLE_MARKERS.filter(marker =>
    text.toLowerCase().includes(marker.toLowerCase())
  );
  if (credibleMarkers.length) {
    score += credibleMarkers.length * 10;
    reasons.push('Contains credible source citations');
  }

  // Bonus for statistical information and direct quotes
  if (/\d+(?:\.\d+)?%/.test(text)) {
    score += 10;
    reasons.push('Contains statistical information');
  }
  if (/"[^"]+"/g.test(text)) {
    score += 10;
    reasons.push('Contains direct quotes');
  }

  // Subtract points for clickbait language
  const clickbaitPatterns = PATTERNS.CLICKBAIT.filter(pattern =>
    text.toLowerCase().includes(pattern.toLowerCase())
  );
  if (clickbaitPatterns.length) {
    score -= clickbaitPatterns.length * 15;
    reasons.push('Contains clickbait language');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasons
  };
};

// Checks if the URL comes from a credible source or from a satire site
const checkSourceCredibility = (url) => {
  if (!url) return { score: 50, reasons: ['No URL provided'] };

  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname.toLowerCase();

    if (DOMAINS.SATIRE.some(d => domain.includes(d))) {
      return { score: 0, reasons: ['Known satire website'] };
    }
    if (DOMAINS.CREDIBLE.some(d =>
      d.startsWith('.') ? domain.endsWith(d) : domain.includes(d)
    )) {
      return { score: 100, reasons: ['Credible domain source'] };
    }
    return { score: 50, reasons: ['Unknown domain credibility'] };
  } catch {
    return { score: 0, reasons: ['Invalid URL format'] };
  }
};

// Scrapes the content from a webpage given its URL
const scrapeURL = async (url) => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error('Invalid protocol - only HTTP/HTTPS allowed');
  }

  try {
    checkRateLimit();
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: CONFIG.REQUEST_TIMEOUT,
      maxContentLength: CONFIG.MAX_CONTENT_LENGTH
    });

    const $ = cheerio.load(response.data);
    let content = '';

    // Try several selectors to extract article text
    ['article p', '.article-body p', 'main p', 'div[itemprop="articleBody"] p'].forEach(selector => {
      $(selector).each((_, el) => {
        const text = $(el).text().trim();
        if (text) content += text + '\n';
      });
    });

    // If not enough content, fallback to scanning all paragraphs
    if (content.length < CONFIG.MIN_ARTICLE_LENGTH) {
      $('body p').each((_, el) => {
        const text = $(el).text().trim();
        if (text) content += text + '\n';
      });
    }

    const cleanedContent = preprocessText(content);
    if (!cleanedContent || cleanedContent.length < CONFIG.MIN_ARTICLE_LENGTH) {
      throw new Error(`Insufficient content found (${cleanedContent?.length || 0} characters)`);
    }

    return { content: cleanedContent, url };
  } catch (error) {
    throw new Error(`Failed to scrape URL: ${error.message}`);
  }
};

// Function to analyze text using a Hugging Face model for advanced NLP insights
const analyzeWithHuggingFace = async (text) => {
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/winterForestStump/Roberta-fake-news-detector',
      { inputs: text },
      { headers: { Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}` } }
    );
    // Expecting an array like [{ label: "FAKE", score: 0.85 }]
    return response.data;
  } catch (error) {
    console.error('Hugging Face API error:', error);
    return null;
  }
};

// Main function that ties everything together: scraping, processing, analyzing, and combining scores
const analyzeText = async (input, url = null) => {
  try {
    let contentToAnalyze = '';
    let sourceUrl = null;

    // Determine if the input is text or a URL
    const inputType = getInputType(input);
    if (inputType === 'text') {
      contentToAnalyze = input;
    } else if (inputType === 'url') {
      sourceUrl = input;
      try {
        const scrapedContent = await scrapeURL(input);
        contentToAnalyze = scrapedContent.content;
      } catch (error) {
        console.error('Failed to scrape primary URL:', error);
        return {
          isFake: true,
          confidenceScore: 50,
          analysis: {
            error: `Failed to scrape URL: ${error.message}`,
            contentAnalysis: null,
            sourceAnalysis: null,
            hfAnalysis: null
          }
        };
      }
    }

    // Optionally handle a secondary URL if provided
    if (url && url !== input) {
      const urlType = getInputType(url);
      if (urlType === 'url') {
        sourceUrl = url;
        try {
          const scrapedContent = await scrapeURL(url);
          contentToAnalyze = scrapedContent.content;
        } catch (error) {
          console.error('Failed to scrape secondary URL:', error);
          if (!contentToAnalyze) {
            return {
              isFake: true,
              confidenceScore: 50,
              analysis: {
                error: `Failed to scrape URL: ${error.message}`,
                contentAnalysis: null,
                sourceAnalysis: null,
                hfAnalysis: null
              }
            };
          }
        }
      }
    }

    // Clean up the text for analysis
    const cleanedText = preprocessText(contentToAnalyze);
    if (!cleanedText) {
      throw new Error('No valid content to analyze');
    }

    // Run heuristic analysis, source check, and Hugging Face analysis concurrently
    const [contentAnalysis, sourceAnalysis, hfResult] = await Promise.all([
      analyzeContent(cleanedText),
      checkSourceCredibility(sourceUrl),
      analyzeWithHuggingFace(cleanedText)
    ]);

    // Adjust the final score based on the Hugging Face result
    let hfScoreAdjustment = 0;
    if (hfResult && hfResult.length > 0) {
      const label = hfResult[0].label;
      const score = hfResult[0].score;
      if (label.toUpperCase() === "FAKE" && score > 0.8) {
        hfScoreAdjustment = -15;
      } else if (label.toUpperCase() === "REAL" && score > 0.8) {
        hfScoreAdjustment = 15;
      }
    }

    // Compute a weighted final score: 70% content, 30% source credibility, plus any Hugging Face adjustment
    const weightedScore = (
      contentAnalysis.score * 0.7 +
      sourceAnalysis.score * 0.3 +
      hfScoreAdjustment
    );

    return {
      isFake: weightedScore < CONFIG.FAKE_THRESHOLD,
      confidenceScore: weightedScore,
      analysis: {
        contentAnalysis,
        sourceAnalysis,
        hfAnalysis: hfResult,
        text: cleanedText.substring(0, 200) + '...'
      }
    };
  } catch (error) {
    console.error('Analysis error:', error);
    return {
      isFake: true,
      confidenceScore: 50,
      analysis: {
        error: error.message,
        contentAnalysis: null,
        sourceAnalysis: null,
        hfAnalysis: null
      }
    };
  }
};

export { analyzeText, scrapeURL, preprocessText };
