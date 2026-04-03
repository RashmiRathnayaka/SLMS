const mongoose = require('mongoose');

const borrowRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'returned', 'overdue'],
    default: 'pending',
  },
  requestDate: { type: Date, default: Date.now },
  approvedDate: { type: Date },
  dueDate: { type: Date },
  returnedDate: { type: Date },
  staffNote: { type: String, trim: true },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('BorrowRequest', borrowRequestSchema);
