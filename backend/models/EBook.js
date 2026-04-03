const mongoose = require('mongoose');

const ebookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  coverImage: { type: String, default: '' },
  filePath: { type: String, required: true },
  fileSize: { type: Number },
  fileType: { type: String, default: 'pdf' },
  downloadCount: { type: Number, default: 0 },
  readCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  tags: [{ type: String, trim: true }],
  isbn: { type: String, trim: true },
  publisher: { type: String, trim: true },
  publishYear: { type: Number },
  language: { type: String, default: 'English' },
}, { timestamps: true });

module.exports = mongoose.model('EBook', ebookSchema);
