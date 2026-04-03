const mongoose = require('mongoose');

const readingHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ebook: { type: mongoose.Schema.Types.ObjectId, ref: 'EBook', required: true },
  action: { type: String, enum: ['read', 'downloaded', 'completed'], default: 'read' },
  readAt: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  progress: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('ReadingHistory', readingHistorySchema);
