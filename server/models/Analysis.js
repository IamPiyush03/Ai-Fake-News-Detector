import mongoose from 'mongoose';
const AnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  url: { type: String },
  result: {
    isFake: { type: Boolean, required: true },
    confidenceScore: { type: Number, required: true },
    categories: [String],
    reasoning: { type: String }
  },
  detailedScores: {
    contentAnalysis: Number,
    sourceCredibility: Number,
    languagePatterns: Number,
    contextualRelevance: Number
  },
  feedbacks: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isAccurate: Boolean,
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Analysis', AnalysisSchema);