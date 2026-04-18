const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const csv = require('csv-parser');
const Book = require('../models/Book');
const User = require('../models/User');
const BorrowRequest = require('../models/BorrowRequest');
const WaitingList = require('../models/WaitingList');

const RECOMMEND_URGENT_THRESHOLD = 6;
const RECOMMEND_HIGH_THRESHOLD = 3;

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
    const fields = ['title', 'author', 'isbn', 'category', 'description', 'publisher', 'publishYear', 'language'];
    fields.forEach(f => { if (req.body[f] !== undefined) book[f] = req.body[f]; });
    if (req.body.totalCopies !== undefined) {
      const nextTotalCopies = Number(req.body.totalCopies);
      if (Number.isNaN(nextTotalCopies) || nextTotalCopies < 1) {
        return res.status(400).json({ message: 'totalCopies must be at least 1' });
      }

      const currentlyBorrowed = await BorrowRequest.countDocuments({
        book: book._id,
        status: { $in: ['approved', 'overdue'] },
      });

      // Recompute availability from active borrows so stale values are corrected.
      book.availableCopies = Math.max(0, nextTotalCopies - currentlyBorrowed);
      book.totalCopies = nextTotalCopies;
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

    const fileBuffer = fs.readFileSync(filePath);
    let fileText = fileBuffer.toString('utf8');

    // Handle common Excel exports (UTF-16) where UTF-8 decoding breaks header detection.
    if (fileBuffer.length >= 2) {
      const b0 = fileBuffer[0];
      const b1 = fileBuffer[1];
      if (b0 === 0xff && b1 === 0xfe) {
        fileText = fileBuffer.toString('utf16le');
      } else if (b0 === 0xfe && b1 === 0xff) {
        // Convert UTF-16BE to UTF-16LE for Node decoding.
        const swapped = Buffer.from(fileBuffer);
        for (let i = 0; i + 1 < swapped.length; i += 2) {
          const tmp = swapped[i];
          swapped[i] = swapped[i + 1];
          swapped[i + 1] = tmp;
        }
        fileText = swapped.toString('utf16le');
      }
    }

    // Some Excel CSV exports are UTF-16LE without BOM.
    if (fileText.includes('\u0000')) {
      fileText = fileBuffer.toString('utf16le');
    }

    const firstLine = (fileText.split(/\r?\n/)[0] || '').replace(/^\uFEFF/, '');
    const delimiterCandidates = [',', ';', '\t'];
    const separator = delimiterCandidates.reduce((best, candidate) => {
      const count = firstLine ? firstLine.split(candidate).length - 1 : 0;
      return count > best.count ? { delimiter: candidate, count } : best;
    }, { delimiter: ',', count: -1 }).delimiter;

    await new Promise((resolve, reject) => {
      Readable.from([fileText])
        .pipe(csv({ separator }))
        .on('data', (row) => results.push(row))
        .on('end', resolve)
        .on('error', reject);
    });
    const imported = [];
    for (let i = 0; i < results.length; i++) {
      const row = results[i];

      // Normalize CSV headers so minor spelling/case differences still import correctly.
      const normalizedRow = {};
      Object.entries(row).forEach(([key, value]) => {
        const normalizedKey = String(key || '')
          .replace(/^\uFEFF/, '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');
        normalizedRow[normalizedKey] = typeof value === 'string' ? value.trim() : value;
      });

      const pick = (...keys) => {
        for (const key of keys) {
          if (normalizedRow[key] !== undefined && normalizedRow[key] !== '') return normalizedRow[key];
        }
        return undefined;
      };

      const pickByPrefix = (prefix) => {
        const k = Object.keys(normalizedRow).find((key) => key.startsWith(prefix));
        return k ? normalizedRow[k] : undefined;
      };

      const rowValues = Object.values(normalizedRow).map((v) => (typeof v === 'string' ? v.trim() : v));

      const title = pick('title') || pickByPrefix('title');
      const author = pick('author') || pickByPrefix('author');
      const category = pick('category', 'categyory', 'categroy') || pickByPrefix('categ');
      const isbn = pick('isbn');
      const description = pick('description', 'descriptio') || pickByPrefix('descrip') || '';
      const totalCopiesValue = pick('totalcopies', 'totalcopie', 'totalcopy') || pickByPrefix('totalcop');
      const publisher = pick('publisher') || '';
      const publishYearValue = pick('publishyear', 'publishye', 'year') || pickByPrefix('publishy');
      const language = pick('language') || 'English';

      // Positional fallback for malformed/missing headers:
      // [title, author, isbn, category, description, totalCopies, publisher, publishYear, language]
      const titleFromIndex = rowValues[0];
      const authorFromIndex = rowValues[1];
      const isbnFromIndex = rowValues[2];
      const categoryFromIndex = rowValues[3];
      const descriptionFromIndex = rowValues[4];
      const totalCopiesFromIndex = rowValues[5];
      const publisherFromIndex = rowValues[6];
      const publishYearFromIndex = rowValues[7];
      const languageFromIndex = rowValues[8];

      let resolvedTitle = title || titleFromIndex;
      let resolvedAuthor = author || authorFromIndex;
      let resolvedCategory = category || categoryFromIndex;
      let resolvedIsbn = isbn || isbnFromIndex;
      let resolvedDescription = description || descriptionFromIndex || '';
      let resolvedTotalCopiesValue = totalCopiesValue || totalCopiesFromIndex;
      let resolvedPublisher = publisher || publisherFromIndex || '';
      let resolvedPublishYearValue = publishYearValue || publishYearFromIndex;
      let resolvedLanguage = language || languageFromIndex || 'English';

      // If parser produced a single-column row, rebuild values by splitting raw key/value.
      if ((!resolvedTitle || !resolvedAuthor || !resolvedCategory) && Object.keys(normalizedRow).length === 1) {
        const rawHeader = String(Object.keys(normalizedRow)[0] || '');
        const rawValue = String(Object.values(normalizedRow)[0] || '');
        const bestSeparator = [',', ';', '\t'].reduce((best, candidate) => {
          const count = rawHeader.split(candidate).length - 1;
          return count > best.count ? { delimiter: candidate, count } : best;
        }, { delimiter: ',', count: -1 }).delimiter;

        const headerParts = rawHeader.split(bestSeparator).map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
        const valueParts = rawValue.split(bestSeparator).map((v) => v.trim());
        const rebuilt = {};
        headerParts.forEach((h, idx) => { rebuilt[h] = valueParts[idx]; });

        resolvedTitle = resolvedTitle || rebuilt.title || valueParts[0];
        resolvedAuthor = resolvedAuthor || rebuilt.author || valueParts[1];
        resolvedCategory = resolvedCategory || rebuilt.category || rebuilt.categyory || valueParts[3];
        resolvedIsbn = resolvedIsbn || rebuilt.isbn || valueParts[2];
        resolvedDescription = resolvedDescription || rebuilt.description || valueParts[4] || '';
        resolvedTotalCopiesValue = resolvedTotalCopiesValue || rebuilt.totalcopies || valueParts[5];
        resolvedPublisher = resolvedPublisher || rebuilt.publisher || valueParts[6] || '';
        resolvedPublishYearValue = resolvedPublishYearValue || rebuilt.publishyear || valueParts[7];
        resolvedLanguage = resolvedLanguage || rebuilt.language || valueParts[8] || 'English';
      }

      if (!resolvedTitle || !resolvedAuthor || !resolvedCategory) {
        errors.push({
          row: i + 2,
          message: 'Missing required fields: title, author, category',
          detectedHeaders: Object.keys(normalizedRow),
          detectedValues: rowValues,
        });
        continue;
      }
      try {
        const parsedTotalCopies = Number(resolvedTotalCopiesValue);
        const safeTotalCopies = Number.isFinite(parsedTotalCopies) && parsedTotalCopies > 0
          ? Math.floor(parsedTotalCopies)
          : 1;

        const parsedPublishYear = Number(resolvedPublishYearValue);
        const safePublishYear = Number.isFinite(parsedPublishYear)
          ? Math.floor(parsedPublishYear)
          : undefined;

        const bookData = {
          title: resolvedTitle,
          author: resolvedAuthor,
          category: resolvedCategory,
          isbn: resolvedIsbn || undefined,
          description: resolvedDescription,
          totalCopies: safeTotalCopies,
          availableCopies: safeTotalCopies,
          publisher: resolvedPublisher,
          publishYear: safePublishYear,
          language: resolvedLanguage,
        };
        const book = await Book.create(bookData);
        imported.push(book);
      } catch (e) {
        errors.push({
          row: i + 2,
          message: e.message,
          title: resolvedTitle,
          author: resolvedAuthor,
          category: resolvedCategory,
          isbn: resolvedIsbn || undefined,
        });
      }
    }
    fs.unlinkSync(filePath);
    res.json({ imported: imported.length, errors, meta: { separator } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get analytics
// @route   GET /api/books/analytics
const getAnalytics = async (req, res) => {
  try {
    const urgentThreshold = RECOMMEND_URGENT_THRESHOLD;
    const highThreshold = Math.min(RECOMMEND_HIGH_THRESHOLD, urgentThreshold);

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

    // --- Borrow frequency (last 30 days): count per book ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentBorrows = await BorrowRequest.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$book', count: { $sum: 1 } } },
    ]);
    const borrowCountMap = {};
    recentBorrows.forEach(f => { borrowCountMap[String(f._id)] = f.count; });

    const recommendIds = [...new Set([
      ...Object.keys(waitingCountMap),
      ...Object.keys(borrowCountMap),
      ...books.filter(b => b.availableCopies <= 1).map(b => String(b._id)),
    ])];
    const rawBooks = await Book.find({ _id: { $in: recommendIds }, isActive: true }).lean();

    // Final score:
    // ((waitingCount*3) + (borrowCount*1)) / (totalCopies + 1) + lowStockBonus
    const recommendations = rawBooks.map(b => {
      const id = String(b._id);
      const waitingCount = waitingCountMap[id] || 0;
      const borrowCount = borrowCountMap[id] || 0;
      const lowStockBonus = b.availableCopies === 0 ? 5 : b.availableCopies === 1 ? 3 : 0;
      const pressureScore = ((waitingCount * 3) + borrowCount) / ((b.totalCopies || 0) + 1);
      const recommendationScore = Number((pressureScore + lowStockBonus).toFixed(2));

      // Thresholds tuned for normalized pressure-based scores.
      let priority = 'medium';
      if (recommendationScore >= urgentThreshold) {
        priority = 'urgent';
      } else if (recommendationScore >= highThreshold) {
        priority = 'high';
      }

      return {
        ...b,
        waitingCount,
        borrowCount,
        pressureScore: Number(pressureScore.toFixed(2)),
        lowStockBonus,
        recommendationScore,
        priority,
      };
    }).sort((a, b) => b.recommendationScore - a.recommendationScore || b.waitingCount - a.waitingCount || b.borrowCount - a.borrowCount);

    res.json({
      totalBooks, totalCopies, availableCopies, borrowedCopies, lowStock,
      categoryData,
      availability: [
        { name: 'Available', value: availableCopies },
        { name: 'Borrowed/Reserved', value: borrowedCopies },
      ],
      priorityThresholds: {
        urgent: urgentThreshold,
        high: highThreshold,
      },
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
