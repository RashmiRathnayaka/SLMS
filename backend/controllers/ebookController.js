const EBook = require('../models/EBook');
const ReadingHistory = require('../models/ReadingHistory');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// @desc    Get all ebooks
// @route   GET /api/ebooks
const getEBooks = async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = { isActive: true };
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
    if (category) query.category = { $regex: category, $options: 'i' };
    const ebooks = await EBook.find(query).sort({ createdAt: -1 });
    res.json(ebooks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single ebook
// @route   GET /api/ebooks/:id
const getEBook = async (req, res) => {
  try {
    const ebook = await EBook.findById(req.params.id);
    if (!ebook) return res.status(404).json({ message: 'E-Book not found' });
    res.json(ebook);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Upload ebook (admin)
// @route   POST /api/ebooks
const uploadEBook = async (req, res) => {
  try {
    if (!req.files || !req.files.file) return res.status(400).json({ message: 'PDF file is required' });
    const uploadedFile = req.files.file[0];
    if (!uploadedFile.size || uploadedFile.size === 0) {
      // Remove the 0-byte file
      const badPath = path.join(__dirname, '..', 'uploads', 'ebooks', uploadedFile.filename);
      fs.unlink(badPath, () => {});
      return res.status(400).json({ message: 'Uploaded PDF file is empty or corrupted. Please try again.' });
    }
    const { title, author, category, description, tags, isbn, publisher, publishYear, language } = req.body;
    const ebookData = {
      title, author, category, description,
      filePath: `/uploads/ebooks/${uploadedFile.filename}`,
      fileSize: uploadedFile.size,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      isbn, publisher, publishYear, language,
    };
    if (req.files.coverImage) ebookData.coverImage = `/uploads/images/${req.files.coverImage[0].filename}`;
    const ebook = await EBook.create(ebookData);
    res.status(201).json(ebook);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update ebook (admin)
// @route   PUT /api/ebooks/:id
const updateEBook = async (req, res) => {
  try {
    const ebook = await EBook.findById(req.params.id);
    if (!ebook) return res.status(404).json({ message: 'E-Book not found' });
    const fields = ['title', 'author', 'category', 'description', 'isbn', 'publisher', 'publishYear', 'language'];
    fields.forEach(f => { if (req.body[f] !== undefined) ebook[f] = req.body[f]; });
    if (req.body.tags) ebook.tags = req.body.tags.split(',').map(t => t.trim());
    if (req.files && req.files.coverImage) ebook.coverImage = `/uploads/images/${req.files.coverImage[0].filename}`;
    if (req.files && req.files.file) {
      ebook.filePath = `/uploads/ebooks/${req.files.file[0].filename}`;
      ebook.fileSize = req.files.file[0].size;
    }
    const updated = await ebook.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete ebook (admin)
// @route   DELETE /api/ebooks/:id
const deleteEBook = async (req, res) => {
  try {
    const ebook = await EBook.findById(req.params.id);
    if (!ebook) return res.status(404).json({ message: 'E-Book not found' });
    ebook.isActive = false;
    await ebook.save();
    res.json({ message: 'E-Book removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Track read/download
// @route   POST /api/ebooks/:id/track
const trackEBook = async (req, res) => {
  try {
    const { action } = req.body;
    const { id } = req.params;
    const ebook = await EBook.findById(id);
    if (!ebook) return res.status(404).json({ message: 'E-Book not found' });

    if (action === 'read') await EBook.findByIdAndUpdate(id, { $inc: { readCount: 1 } });
    if (action === 'downloaded') await EBook.findByIdAndUpdate(id, { $inc: { downloadCount: 1 } });

    let history = await ReadingHistory.findOne({ user: req.user._id, ebook: id, action });
    if (!history) {
      history = await ReadingHistory.create({ user: req.user._id, ebook: id, action });
    } else {
      history.readAt = new Date();
      await history.save();
    }

    if (action === 'completed') {
      await ReadingHistory.findOneAndUpdate(
        { user: req.user._id, ebook: id },
        { completed: true, completedAt: new Date() },
        { upsert: true }
      );
    }
    res.json({ message: 'Tracked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Toggle favourite ebook
// @route   POST /api/ebooks/:id/favourite
const toggleFavourite = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const ebookId = req.params.id;
    const isFav = user.favoriteEbooks.some(id => id.toString() === ebookId);
    if (isFav) {
      await User.findByIdAndUpdate(req.user._id, { $pull: { favoriteEbooks: ebookId } });
    } else {
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { favoriteEbooks: ebookId } });
    }
    const updated = await User.findById(req.user._id);
    res.json({ favorites: updated.favoriteEbooks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get user favourites
// @route   GET /api/ebooks/favourites
const getFavourites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favoriteEbooks');
    res.json(user.favoriteEbooks.filter(e => e.isActive));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get leaderboard
// @route   GET /api/ebooks/leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await ReadingHistory.aggregate([
      { $match: { action: 'read' } },
      { $group: { _id: '$user', booksRead: { $sum: 1 } } },
      { $sort: { booksRead: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { 'user.name': 1, 'user.profileImage': 1, booksRead: 1 } },
    ]);
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get reading history
// @route   GET /api/ebooks/history
const getReadingHistory = async (req, res) => {
  try {
    const history = await ReadingHistory.find({ user: req.user._id })
      .populate('ebook', 'title author coverImage category')
      .sort({ readAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get ebook analytics (admin)
// @route   GET /api/ebooks/analytics
const getEBookAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const topRead = await EBook.find({ isActive: true }).sort({ readCount: -1 }).limit(10);
    const recentDownloads = await ReadingHistory.countDocuments({ action: 'downloaded', readAt: { $gte: thirtyDaysAgo } });
    const recentReads = await ReadingHistory.countDocuments({ action: 'read', readAt: { $gte: thirtyDaysAgo } });
    const totalEbooks = await EBook.countDocuments({ isActive: true });
    res.json({ topRead, recentDownloads, recentReads, totalEbooks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Serve ebook PDF for reading
// @route   GET /api/ebooks/:id/serve
const serveEBook = async (req, res) => {
  try {
    const ebook = await EBook.findById(req.params.id);
    if (!ebook) return res.status(404).json({ message: 'E-Book not found' });
    const filePath = path.join(__dirname, '..', ebook.filePath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'PDF file not found on server' });
    const stat = fs.statSync(filePath);
    if (stat.size === 0) return res.status(400).json({ message: 'PDF file is corrupted (0 bytes). Please re-upload this e-book.' });
    // Track read
    await EBook.findByIdAndUpdate(req.params.id, { $inc: { readCount: 1 } });
    let history = await ReadingHistory.findOne({ user: req.user._id, ebook: req.params.id, action: 'read' });
    if (!history) {
      await ReadingHistory.create({ user: req.user._id, ebook: req.params.id, action: 'read' });
    } else {
      history.readAt = new Date();
      await history.save();
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${ebook.title}.pdf"`);
    res.setHeader('Content-Length', stat.size);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Download ebook PDF
// @route   GET /api/ebooks/:id/download
const downloadEBook = async (req, res) => {
  try {
    const ebook = await EBook.findById(req.params.id);
    if (!ebook) return res.status(404).json({ message: 'E-Book not found' });
    const filePath = path.join(__dirname, '..', ebook.filePath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'PDF file not found on server' });
    const stat = fs.statSync(filePath);
    if (stat.size === 0) return res.status(400).json({ message: 'PDF file is corrupted (0 bytes). Please re-upload this e-book.' });
    // Track download
    await EBook.findByIdAndUpdate(req.params.id, { $inc: { downloadCount: 1 } });
    let history = await ReadingHistory.findOne({ user: req.user._id, ebook: req.params.id, action: 'downloaded' });
    if (!history) {
      await ReadingHistory.create({ user: req.user._id, ebook: req.params.id, action: 'downloaded' });
    } else {
      history.readAt = new Date();
      await history.save();
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${ebook.title}.pdf"`);
    res.setHeader('Content-Length', stat.size);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getEBooks, getEBook, uploadEBook, updateEBook, deleteEBook, trackEBook, toggleFavourite, getFavourites, getLeaderboard, getReadingHistory, getEBookAnalytics, serveEBook, downloadEBook };
