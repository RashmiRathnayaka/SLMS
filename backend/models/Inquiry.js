const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['open', 'replied', 'closed'], default: 'open' },
  reply: { type: String, trim: true },
  repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  repliedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Inquiry', inquirySchema);
