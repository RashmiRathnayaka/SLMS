const mongoose = require('mongoose');

const damageReportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookTitle: { type: String, required: true, trim: true },
  bookIsbn: { type: String, trim: true, default: '' },
  reporterName: { type: String, required: true, trim: true },
  reporterContact: { type: String, trim: true, default: '' },
  locationFound: { type: String, trim: true, default: '' },
  damageType: { type: String, required: true, trim: true },
  severity: { type: String, enum: ['minor', 'moderate', 'severe'], required: true, default: 'minor' },
  description: { type: String, required: true, trim: true },
  photo: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  staffNote: { type: String, trim: true, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('DamageReport', damageReportSchema);
