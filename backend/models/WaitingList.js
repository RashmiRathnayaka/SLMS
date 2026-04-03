const mongoose = require('mongoose');

const waitingListSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  position: { type: Number, required: true },
  status: { type: String, enum: ['waiting', 'notified', 'fulfilled', 'cancelled', 'expired'], default: 'waiting' },
  joinedAt: { type: Date, default: Date.now },
  notifiedAt: { type: Date },
  claimDeadline: { type: Date },   // 24-hour window starts when notified
}, { timestamps: true });

module.exports = mongoose.model('WaitingList', waitingListSchema);
