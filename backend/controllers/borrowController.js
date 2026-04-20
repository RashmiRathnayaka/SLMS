const BorrowRequest = require('../models/BorrowRequest');
const Book = require('../models/Book');
const WaitingList = require('../models/WaitingList');
const { notifyNext } = require('./waitingController');
const { ensureTrendingWeek, calculateTrendingScore } = require('./bookController');

// @desc    Request to borrow a book
// @route   POST /api/borrows
const requestBorrow = async (req, res) => {
  try {
    const { bookId } = req.body;
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    // Check max borrow limit
    const activeBorrows = await BorrowRequest.countDocuments({
      user: req.user._id,
      status: { $in: ['pending', 'approved'] },
    });
    if (activeBorrows >= 3) return res.status(400).json({ message: 'You can only borrow up to 3 books at a time' });

    // Check duplicate request
    const existing = await BorrowRequest.findOne({ user: req.user._id, book: bookId, status: { $in: ['pending', 'approved'] } });
    if (existing) return res.status(400).json({ message: 'You already have an active request for this book' });

    if (book.availableCopies <= 0) return res.status(400).json({ message: 'No copies available. Please join the waiting list.' });

    const request = await BorrowRequest.create({ user: req.user._id, book: bookId });
    await request.populate('book user', 'title author name email');
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get user's borrow requests
// @route   GET /api/borrows/my
const getMyBorrows = async (req, res) => {
  try {
    const borrows = await BorrowRequest.find({ user: req.user._id })
      .populate('book', 'title author isbn coverImage category')
      .sort({ createdAt: -1 });
    res.json(borrows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all borrow requests (staff/admin)
// @route   GET /api/borrows
const getAllBorrows = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const borrows = await BorrowRequest.find(query)
      .populate('user', 'name email studentId')
      .populate('book', 'title author isbn')
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(borrows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Approve borrow request
// @route   PUT /api/borrows/:id/approve
const approveBorrow = async (req, res) => {
  try {
    const request = await BorrowRequest.findById(req.params.id).populate('book');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });
    if (request.book.availableCopies <= 0) return res.status(400).json({ message: 'No copies available' });

    request.status = 'approved';
    request.approvedDate = new Date();
    request.dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
    request.processedBy = req.user._id;
    if (req.body.staffNote) request.staffNote = req.body.staffNote;
    await request.save();

    const { weekStart, weekEnd } = await ensureTrendingWeek();
    const updatedBook = await Book.findByIdAndUpdate(
      request.book._id,
      {
        $inc: { availableCopies: -1, borrowedCount: 1, weeklyBorrowCount: 1 },
        $set: { trendingWindowStart: weekStart, trendingWindowEnd: weekEnd },
      },
      { new: true, select: 'weeklyBorrowCount favoriteCount' }
    ).lean();

    if (updatedBook) {
      await Book.updateOne(
        { _id: request.book._id },
        {
          $set: {
            trendingScore: calculateTrendingScore(
              Number(updatedBook.weeklyBorrowCount) || 0,
              Number(updatedBook.favoriteCount) || 0
            ),
          },
        }
      );
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Reject borrow request
// @route   PUT /api/borrows/:id/reject
const rejectBorrow = async (req, res) => {
  try {
    const request = await BorrowRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });
    request.status = 'rejected';
    request.processedBy = req.user._id;
    if (req.body.staffNote) request.staffNote = req.body.staffNote;
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Return book
// @route   PUT /api/borrows/:id/return
const returnBook = async (req, res) => {
  try {
    const request = await BorrowRequest.findById(req.params.id).populate('book');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'approved') return res.status(400).json({ message: 'Book is not currently borrowed' });

    request.status = 'returned';
    request.returnedDate = new Date();
    request.processedBy = req.user._id;
    await request.save();

    await Book.findByIdAndUpdate(request.book._id, { $inc: { availableCopies: 1 } });

    // Notify next person in waiting list with a 24-hour claim window
    await notifyNext(request.book._id);

    res.json({ message: 'Book returned successfully', request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { requestBorrow, getMyBorrows, getAllBorrows, approveBorrow, rejectBorrow, returnBook };
