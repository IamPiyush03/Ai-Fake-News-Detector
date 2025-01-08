import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const COHERE_API_KEY = process.env.COHERE_API_KEY;
const COHERE_API_URL = 'https://api.cohere.com/v1/classify';

// Define the fake news indicators
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
    .trim();
};

// Analyze text using Cohere's classify API
const analyzeText = async (text) => {
  try {
    const cleanedText = preprocessText(text);
    
    if (cleanedText.length < 50) {
      throw new Error('Insufficient text for analysis');
    }

    // Prepare the data for the classify endpoint
    const data = {
      inputs: [cleanedText],
      examples: [
        { text: "Scientists discover new planet in solar system", label: "REAL" },
        { text: "Aliens spotted in Area 51, government confirms", label: "FAKE" },
        { text: "Study shows coffee may reduce heart disease risk", label: "REAL" },
        { text: "Mind control chips found in COVID vaccines", label: "FAKE" }
      ]
    };

    // Make the POST request to Cohere API
    const response = await axios.post(COHERE_API_URL, data, {
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Parse the response
    const classification = response.data.classifications[0];
    const confidence = classification.confidence;
    const isFake = classification.prediction === 'FAKE';

    let finalScore = isFake ? confidence : 1 - confidence;

    // Check for obvious fake news indicators
    const hasKeywords = FAKE_INDICATORS.some(kw =>
      cleanedText.toLowerCase().includes(kw.toLowerCase())
    );

    if (hasKeywords) {
      finalScore = Math.max(finalScore, 0.75);
    }

    return {
      label: isFake ? 'FAKE' : 'REAL',
      score: finalScore,
      confidence: confidence,
      reasoning: 'Determined by Cohere AI classification'
    };
  } catch (error) {
    console.error('Analysis error:', error);
    throw new Error(`Analysis failed: ${error.message}`);
  }
};

// Example usage
const testText = "Bigfoot sighting in the forests of Oregon has been confirmed by the government.";
analyzeText(testText).then(result => {
  console.log(result);
}).catch(err => {
  console.error(err);
});
