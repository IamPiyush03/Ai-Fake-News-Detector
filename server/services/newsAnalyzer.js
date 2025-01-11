import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import natural from 'natural';

dotenv.config();

// Constants
const SATIRE_DOMAINS = ['theonion.com', 'clickhole.com', 'babylonbee.com'];
const FAKE_INDICATORS = [
  'bigfoot', 'alien invasion', 'conspiracy', 'classified',
  'government cover', 'secret mission', 'miracle cure', 'shocking truth'
];
const CREDIBLE_DOMAINS = ['.edu', '.gov', 'reuters.com', 'ap.org', 'bbc.com'];

// Text Preprocessing
const preprocessText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?-]/g, '')
    .replace(/\b(Share|Published|Advertising|Tags)\b.*?(?=\n|$)/gi, '')
    .trim();
};

// Content Analysis
const calculateContentScore = (text) => {
  const tokenizer = new natural.WordTokenizer();
  const words = tokenizer.tokenize(text);

  const indicatorCount = FAKE_INDICATORS.reduce(
    (count, indicator) => (text.toLowerCase().includes(indicator) ? count + 1 : count),
    0
  );

  const hasCredibleSource = /\b(?:according to|cited by|published in|researchers at)\b/i.test(text);
  const hasNumbers = /\d+(?:\.\d+)?%?/.test(text);
  const hasQuotes = /"[^"]+"/g.test(text);

  let score = 100;
  score -= indicatorCount * 15;
  score += hasCredibleSource ? 20 : 0;
  score += hasNumbers ? 10 : 0;
  score += hasQuotes ? 10 : 0;

  return Math.max(0, Math.min(100, score));
};

// Source Credibility
const checkSourceCredibility = (url) => {
  if (!url) return 50;
  try {
    const domain = new URL(url).hostname;
    if (SATIRE_DOMAINS.some((d) => domain.includes(d))) return 0;
    if (CREDIBLE_DOMAINS.some((d) => domain.includes(d))) return 100;
    return 50;
  } catch {
    return 50;
  }
};

// Language Analysis
const analyzeLanguage = (text) => {
  const sensationalism = /!{2,}|\?{2,}|BREAKING|SHOCKING|MUST SEE/gi.test(text);
  const emotionalWords = /(?:outrage|terrifying|mindblowing|unbelievable)/gi.test(text);
  const clickbait = /(?:you won't believe|what happens next|shocking truth)/gi.test(text);

  let score = 100;
  score -= sensationalism ? 30 : 0;
  score -= emotionalWords ? 20 : 0;
  score -= clickbait ? 25 : 0;

  return Math.max(0, score);
};

// Contextual Relevance
const analyzeContext = (text) => {
  const hasWhen = /\b(?:today|yesterday|last|on|in)\s+(?:\d{1,2}(?:st|nd|rd|th)?\s+)?(?:january|february|march|april|may|june|july|august|september|october|november|december|\d{4})\b/i.test(text);
  const hasWhere = /\b(?:in|at|from|to)\s+(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/.test(text);
  const hasWho = /\b(?:according to|said|reported by|authored by)\b/i.test(text);

  return (hasWhen ? 33 : 0) + (hasWhere ? 33 : 0) + (hasWho ? 34 : 0);
};

// Web Scraping
const scrapeURL = async (url) => {
  try {
    const isSatireSite = SATIRE_DOMAINS.some((domain) => url.includes(domain));
    const formattedUrl = url.includes('theonion.com') && !url.includes('www')
      ? url.replace('theonion.com', 'www.theonion.com')
      : url;

    const response = await axios.get(formattedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const contentSelectors = ['article p', '.article-content p', 'main p'];

    let content = '';
    contentSelectors.forEach((selector) => {
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

// Cohere Analysis
const performCohereAnalysis = async (text) => {
  const data = {
    inputs: [text],
    examples: [
      { text: "According to a study published in Nature journal...", label: "REAL" },
      { text: "Scientists discover miracle cure...", label: "FAKE" },
    ],
  };

  const response = await axios.post('https://api.cohere.ai/v1/classify', data, {
    headers: {
      Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    label: response.data.classifications[0].prediction,
    confidence: response.data.classifications[0].confidence,
  };
};

// Weighted Scoring
const calculateWeightedScore = (scores, cohereConfidence) => {
  const weights = {
    contentAnalysis: 0.3,
    sourceCredibility: 0.25,
    languagePatterns: 0.2,
    contextualRelevance: 0.15,
    cohereAnalysis: 0.1,
  };

  return (
    scores.contentAnalysis * weights.contentAnalysis +
    scores.sourceCredibility * weights.sourceCredibility +
    scores.languagePatterns * weights.languagePatterns +
    scores.contextualRelevance * weights.contextualRelevance +
    cohereConfidence * 100 * weights.cohereAnalysis
  );
};

// Final Text Analysis
const analyzeText = async (text, urlInfo = null) => {
  try {
    const cleanedText = preprocessText(text);
    const contentScore = calculateContentScore(cleanedText);
    const sourceScore = checkSourceCredibility(urlInfo?.url);
    const languageScore = analyzeLanguage(cleanedText);
    const contextScore = analyzeContext(cleanedText);

    const cohereResult = await performCohereAnalysis(cleanedText);

    const detailedScores = {
      contentAnalysis: contentScore,
      sourceCredibility: sourceScore,
      languagePatterns: languageScore,
      contextualRelevance: contextScore,
    };

    const weightedScore = calculateWeightedScore(detailedScores, cohereResult.confidence);
    const isFake = weightedScore < 60;

    return {
      isFake,
      confidenceScore: Math.round(weightedScore),
      detailedScores,
      reasoning: generateExplanation(detailedScores, isFake),
    };
  } catch (error) {
    console.error('Analysis error:', error);
    throw new Error(`Analysis failed: ${error.message}`);
  }
};

const generateExplanation = (scores, isFake) => {
  const explanations = [];
  if (scores.contentAnalysis < 50) explanations.push('Content contains suspicious patterns');
  if (scores.sourceCredibility < 50) explanations.push('Source credibility is questionable');
  if (scores.languagePatterns < 50) explanations.push('Language shows sensationalist patterns');
  if (scores.contextualRelevance < 50) explanations.push('Lacks proper context and attribution');

  return explanations.length
    ? `This appears to be ${isFake ? 'fake' : 'real'} news because: ${explanations.join('; ')}.`
    : `Analysis suggests this is ${isFake ? 'fake' : 'real'} news based on overall patterns.`;
};

export { analyzeText, scrapeURL, preprocessText };
