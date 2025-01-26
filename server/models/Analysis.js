import mongoose from 'mongoose';
const AnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  url: { type: String },
  result: {
    isFake: { type: Boolean, required: true },
    confidenceScore: { 
      type: Number, 
      required: true,
      min: 0,
      max: 100,
      validate: {
        validator: Number.isFinite,
        message: 'Confidence score must be a valid number'
      }
    },
    categories: [String],
    reasoning: { type: String }
  }
});

export default mongoose.model('Analysis', AnalysisSchema);