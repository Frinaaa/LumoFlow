const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 1. USERS
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  isVerified: { type: Boolean, default: false },

  // 🟢 ADD THESE TWO LINES
  avatar: { type: String, default: '' }, // Stores the Base64 image string
  bio: { type: String, default: '' },    // Stores the user bio

  // Stats tracking
  linesWritten: { type: Number, default: 0 },
  bugsDetected: { type: Number, default: 0 },
  conceptsVisualized: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  recentActivity: [{
    title: String,
    type: String,
    time: { type: Date, default: Date.now },
    xp: Number,
    color: String,
    icon: String
  }],

  resetPasswordCode: { type: String },
  resetPasswordExpires: { type: Date },
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// 2. CODE PROJECTS
const CodeProjectSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectName: { type: String, required: true },
  language: { type: String, required: true }, // e.g., 'python', 'javascript'
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// 3. CODE FILES
const CodeFileSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'CodeProject', required: true },
  fileName: { type: String, required: true },
  codeContent: { type: String, default: '' },
  lastModified: { type: Date, default: Date.now }
});

// 4. GAME PROGRESS
const GameProgressSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  gameName: { type: String, required: true },
  score: { type: Number, default: 0 },
  level: { type: String, default: '1' },
  playedAt: { type: Date, default: Date.now }
});

// 5. PROGRESS TRACKING
const ProgressTrackingSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true }, // e.g., 'Loops', 'Variables'
  completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  lastUpdated: { type: Date, default: Date.now }
});

// 6. ANALYSIS RESULTS (AI Feedback)
const AnalysisResultSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fileId: { type: Schema.Types.ObjectId, ref: 'CodeFile', required: true },
  analysisType: { type: String, required: true }, // e.g., 'Syntax', 'Logic', 'Efficiency'
  explanation: { type: String }, // The AI explanation text
  analyzedAt: { type: Date, default: Date.now }
});

// 7. VISUALIZATIONS
const VisualizationSchema = new Schema({
  fileId: { type: Schema.Types.ObjectId, ref: 'CodeFile', required: true },
  visualizationType: { type: String, required: true }, // e.g., 'Flowchart', 'MemoryGraph'
  visualizationData: { type: String }, // JSON string or data structure for the frontend renderer
  generatedAt: { type: Date, default: Date.now }
});

// Export all models
module.exports = {
  User: mongoose.model('User', UserSchema),
  CodeProject: mongoose.model('CodeProject', CodeProjectSchema),
  CodeFile: mongoose.model('CodeFile', CodeFileSchema),
  GameProgress: mongoose.model('GameProgress', GameProgressSchema),
  ProgressTracking: mongoose.model('ProgressTracking', ProgressTrackingSchema),
  AnalysisResult: mongoose.model('AnalysisResult', AnalysisResultSchema),
  Visualization: mongoose.model('Visualization', VisualizationSchema)
};
