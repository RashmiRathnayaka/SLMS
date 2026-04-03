const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Book = require('../models/Book');
const User = require('../models/User');
const BorrowRequest = require('../models/BorrowRequest');
const WaitingList = require('../models/WaitingList');

// @desc    Get all books
// @route   GET /api/books
const getBooks = async (req, res) => {
  try {
    const { search, category, available } = req.query;
    const query = { isActive: true };
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { isbn: { $regex: search, $options: 'i' } },
    ];
    if (category) query.category = { $regex: category, $options: 'i' };
    if (available === 'true') query.availableCopies = { $gt: 0 };
    const books = await Book.find(query).sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single book
// @route   GET /api/books/:id
const getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create book
// @route   POST /api/books
const createBook = async (req, res) => {
  try {
    const { title, author, isbn, category, description, totalCopies, publisher, publishYear, language } = req.body;
    const bookData = { title, author, isbn, category, description, totalCopies: Number(totalCopies) || 1, publisher, publishYear, language };
    bookData.availableCopies = bookData.totalCopies;
    if (req.file) bookData.coverImage = `/uploads/images/${req.file.filename}`;
    const book = await Book.create(bookData);
    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update book
// @route   PUT /api/books/:id
const updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    const fields = ['title', 'author', 'isbn', 'category', 'description', 'totalCopies', 'publisher', 'publishYear', 'language'];
    fields.forEach(f => { if (req.body[f] !== undefined) book[f] = req.body[f]; });
    if (req.body.totalCopies) {
      const diff = Number(req.body.totalCopies) - book.totalCopies;
      book.availableCopies = Math.max(0, book.availableCopies + diff);
      book.totalCopies = Number(req.body.totalCopies);
    }
    if (req.file) book.coverImage = `/uploads/images/${req.file.filename}`;
    const updated = await book.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    book.isActive = false;
    await book.save();
    res.json({ message: 'Book removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Bulk import books via CSV
// @route   POST /api/books/import
const importBooks = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No CSV file uploaded' });
    const results = [];
    const errors = [];
    const filePath = req.file.path;
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => results.push(row))
        .on('end', resolve)
        .on('error', reject);
    });
    const imported = [];
    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      if (!row.title || !row.author || !row.category) {
        errors.push({ row: i + 2, message: 'Missing required fields: title, author, category' });
        continue;
      }
      try {
        const bookData = {
          title: row.title.trim(),
          author: row.author.trim(),
          category: row.category.trim(),
          isbn: row.isbn ? row.isbn.trim() : undefined,
          description: row.description || '',
          totalCopies: Number(row.totalCopies) || 1,
          availableCopies: Number(row.totalCopies) || 1,
          publisher: row.publisher || '',
          publishYear: row.publishYear ? Number(row.publishYear) : undefined,
          language: row.language || 'English',
        };
        const book = await Book.create(bookData);
        imported.push(book);
      } catch (e) {
        errors.push({ row: i + 2, message: e.message });
      }
    }
    fs.unlinkSync(filePath);
    res.json({ imported: imported.length, errors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get analytics
// @route   GET /api/books/analytics
const getAnalytics = async (req, res) => {
  try {
    const books = await Book.find({ isActive: true });
    const totalBooks = books.length;
    const totalCopies = books.reduce((a, b) => a + b.totalCopies, 0);
    const availableCopies = books.reduce((a, b) => a + b.availableCopies, 0);
    const borrowedCopies = totalCopies - availableCopies;
    const lowStock = books.filter(b => b.availableCopies <= 1).length;

    const categoryMap = {};
    books.forEach(b => {
      categoryMap[b.category] = (categoryMap[b.category] || 0) + 1;
    });
    const categoryData = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));

    // --- Waiting list: count per book ---
    const waitingAgg = await WaitingList.aggregate([
      { $match: { status: 'waiting' } },
      { $group: { _id: '$book', count: { $sum: 1 } } },
    ]);
    const waitingCountMap = {};
    waitingAgg.forEach(w => { waitingCountMap[String(w._id)] = w.count; });
    const waitingBookIds = new Set(Object.keys(waitingCountMap));

    // --- Borrow frequency: count per book ---
    const frequentBorrows = await BorrowRequest.aggregate([
      { $group: { _id: '$book', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    const borrowCountMap = {};
    frequentBorrows.forEach(f => { borrowCountMap[String(f._id)] = f.count; });
    const freqIds = frequentBorrows.map(f => f._id);

    // --- Low stock books ---
    const lowStockBooks = books.filter(b => b.availableCopies <= 1).map(b => b._id);

    const recommendIds = [...new Set([
      ...waitingBookIds,
      ...freqIds.map(String),
      ...lowStockBooks.map(String),
    ])];
    const rawBooks = await Book.find({ _id: { $in: recommendIds }, isActive: true }).lean();

    // --- Enrich each book with priority signals ---
    const recommendations = rawBooks.map(b => {
      const id = String(b._id);
      const hasWaiting = waitingBookIds.has(id);
      const waitingCount = waitingCountMap[id] || 0;
      const borrowCount = borrowCountMap[id] || 0;
      const isLowStock = b.availableCopies <= 1;

      let priority, priorityScore;
      if (hasWaiting || b.availableCopies === 0) {
        priority = 'urgent';  priorityScore = 0;
      } else if (isLowStock || borrowCount >= 5) {
        priority = 'high';    priorityScore = 1;
      } else {
        priority = 'medium';  priorityScore = 2;
      }

      return { ...b, hasWaiting, waitingCount, borrowCount, isLowStock, priority, priorityScore };
    }).sort((a, b) => a.priorityScore - b.priorityScore || b.waitingCount - a.waitingCount || b.borrowCount - a.borrowCount);

    res.json({
      totalBooks, totalCopies, availableCopies, borrowedCopies, lowStock,
      categoryData,
      availability: [
        { name: 'Available', value: availableCopies },
        { name: 'Borrowed/Reserved', value: borrowedCopies },
      ],
      recommendations,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Toggle favourite book
// @route   POST /api/books/:id/favourite
const toggleFavoriteBook = async (req, res) => {
  try {
    const bookId = req.params.id;
    // Check current state first
    const u = await User.findById(req.user._id).select('favoriteBooks');
    if (!u) return res.status(404).json({ message: 'User not found' });
    const favs = (u.favoriteBooks || []).map(id => id.toString());
    const isAlready = favs.includes(bookId);
    // Use atomic operators — safe even if field is missing on old documents
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      isAlready ? { $pull: { favoriteBooks: bookId } } : { $addToSet: { favoriteBooks: bookId } },
      { new: true, select: 'favoriteBooks' }
    );
    res.json({ favorites: updated.favoriteBooks || [] });
  } catch (err) {
    console.error('toggleFavoriteBook:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get related books (same category, excludes current book)
// @route   GET /api/books/:id/related
const getRelatedBooks = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).select('category').lean();
    if (!book) return res.status(404).json({ message: 'Book not found' });
    const related = await Book.find({
      isActive: true,
      category: book.category,
      _id: { $ne: req.params.id },
    })
      .sort({ borrowedCount: -1, availableCopies: -1 })
      .limit(8)
      .lean();
    res.json(related);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get user's favourite books
// @route   GET /api/books/favourites
const getFavoriteBooks = async (req, res) => {
  try {
    const u = await User.findById(req.user._id).populate('favoriteBooks');
    res.json((u.favoriteBooks || []).filter(b => b && b.isActive));
  } catch (err) {
    console.error('getFavoriteBooks:', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getBooks, getBook, createBook, updateBook, deleteBook, importBooks, getAnalytics, toggleFavoriteBook, getFavoriteBooks, getRelatedBooks };
