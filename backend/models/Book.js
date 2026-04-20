const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  isbn: { type: String, trim: true },
  category: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  coverImage: { type: String, default: '' },
  totalCopies: { type: Number, required: true, default: 1 },
  availableCopies: { type: Number, required: true, default: 1 },
  borrowedCount: { type: Number, default: 0 },
  favoriteCount: { type: Number, default: 0 },
  weeklyBorrowCount: { type: Number, default: 0 },
  trendingScore: { type: Number, default: 0 },
  trendingWindowStart: { type: Date },
  trendingWindowEnd: { type: Date },
  publisher: { type: String, trim: true },
  publishYear: { type: Number },
  language: { type: String, default: 'English' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

bookSchema.index({ isActive: 1, trendingScore: -1, weeklyBorrowCount: -1, favoriteCount: -1 });

bookSchema.virtual('isAvailable').get(function () {
  return this.availableCopies > 0;
});

module.exports = mongoose.model('Book', bookSchema);
