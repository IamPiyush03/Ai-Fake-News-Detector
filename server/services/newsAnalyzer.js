// newsAnalyzer.js
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import natural from 'natural';

dotenv.config();

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
    "you won't believe", "what happens next", "shocking truth",
    "mind-blowing", "unbelievable", "they don't want you to know"
  ]
};

// Track rate limiting
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

const getInputType = (input) => {
  if (!input || typeof input !== 'string') return 'invalid';

  // Check for URL format
  if (input.startsWith('http://') || input.startsWith('https://')) {
    try {
      new URL(input);
      return 'url';
    } catch (_) {
      return 'text';
    }
  }

  // Default to treating as text
  return 'text';
};

const preprocessText = (text) => {
  if (!text || typeof text !== 'string') return '';

  // Remove headline marker if present
  text = text.replace(/^Headline:\s*/, '');

  return text
    .slice(0, CONFIG.MAX_TEXT_LENGTH)
    .split(/\s+/)
    .join(' ')
    .replace(/[^\w\s.,!?-]/g, '')
    .replace(/\b(Share|Published|Advertising|Tags)\b[^\n]*(\n|$)/gi, '')
    .trim();
};

const analyzeContent = (text) => {
  if (!text) return { score: 0, reasons: ['No content provided'] };

  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text);

  let score = 100;
  const reasons = [];

  // Check for fake news indicators
  const fakeIndicators = PATTERNS.FAKE_INDICATORS.filter(indicator =>
    text.toLowerCase().includes(indicator.toLowerCase())
  );
  if (fakeIndicators.length) {
    score -= fakeIndicators.length * 20;
    reasons.push(`Contains suspicious terms: ${fakeIndicators.join(', ')}`);
  }

  // Check for credible markers
  const credibleMarkers = PATTERNS.CREDIBLE_MARKERS.filter(marker =>
    text.toLowerCase().includes(marker.toLowerCase())
  );
  if (credibleMarkers.length) {
    score += credibleMarkers.length * 10;
    reasons.push('Contains credible source citations');
  }

  // Check for statistical information
  if (/\d+(?:\.\d+)?%/.test(text)) {
    score += 10;
    reasons.push('Contains statistical information');
  }

  // Check for direct quotes
  if (/"[^"]+"/g.test(text)) {
    score += 10;
    reasons.push('Contains direct quotes');
  }

  // Check for clickbait patterns
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

const checkSourceCredibility = (url) => {
  if (!url) return { score: 50, reasons: ['No URL provided'] };

  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname.toLowerCase();

    // Check for satire sites
    if (DOMAINS.SATIRE.some(d => domain.includes(d))) {
      return { score: 0, reasons: ['Known satire website'] };
    }

    // Check for credible domains
    if (DOMAINS.CREDIBLE.some(d =>
      d.startsWith('.') ? domain.endsWith(d) : domain.includes(d)
    )) {
      return { score: 100, reasons: ['Credible domain source'] };
    }

    // Unknown domain
    return { score: 50, reasons: ['Unknown domain credibility'] };
  } catch {
    return { score: 0, reasons: ['Invalid URL format'] };
  }
};

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

    // Try specific article selectors first
    ['article p', '.article-body p', 'main p', 'div[itemprop="articleBody"] p']
      .forEach(selector => {
        $(selector).each((_, el) => {
          const text = $(el).text().trim();
          if (text) content += text + '\n';
        });
      });

    // If no content found, try general paragraphs
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

const analyzeText = async (input, url = null) => {
  try {
    let contentToAnalyze = '';
    let sourceUrl = null;

    // First, handle the main input
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
            sourceAnalysis: null
          }
        };
      }
    }

    // Then, handle additional URL if provided
    if (url && url !== input) {
      const urlType = getInputType(url);
      if (urlType === 'url') {
        sourceUrl = url;
        try {
          const scrapedContent = await scrapeURL(url);
          contentToAnalyze = scrapedContent.content;
        } catch (error) {
          console.error('Failed to scrape secondary URL:', error);
          // If we already have content, continue with that
          if (!contentToAnalyze) {
            return {
              isFake: true,
              confidenceScore: 50,
              analysis: {
                error: `Failed to scrape URL: ${error.message}`,
                contentAnalysis: null,
                sourceAnalysis: null
              }
            };
          }
        }
      }
    }

    // Ensure we have content to analyze
    const cleanedText = preprocessText(contentToAnalyze);
    if (!cleanedText) {
      throw new Error('No valid content to analyze');
    }

    const [contentAnalysis, sourceAnalysis] = await Promise.all([
      analyzeContent(cleanedText),
      checkSourceCredibility(sourceUrl)
    ]);

    const weightedScore = (
      contentAnalysis.score * 0.7 +
      sourceAnalysis.score * 0.3
    );

    return {
      isFake: weightedScore < CONFIG.FAKE_THRESHOLD,
      confidenceScore: weightedScore,
      analysis: {
        contentAnalysis,
        sourceAnalysis,
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
        sourceAnalysis: null
      }
    };
  }
};

export { analyzeText, scrapeURL, preprocessText };