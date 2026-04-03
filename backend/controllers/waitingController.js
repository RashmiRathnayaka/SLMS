const WaitingList = require('../models/WaitingList');
const BorrowRequest = require('../models/BorrowRequest');
const Book = require('../models/Book');

// Helper: notify the next person in queue for a book and set their 24h claim window
const notifyNext = async (bookId) => {
  const next = await WaitingList.findOne({ book: bookId, status: 'waiting' }).sort('position');
  if (!next) return null;
  next.status = 'notified';
  next.notifiedAt = new Date();
  next.claimDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await next.save();
  return next;
};

// @desc    Join waiting list
// @route   POST /api/waiting
const joinWaitingList = async (req, res) => {
  try {
    const { bookId } = req.body;
    const existing = await WaitingList.findOne({ user: req.user._id, book: bookId, status: { $in: ['waiting', 'notified'] } });
    if (existing) return res.status(400).json({ message: 'You are already in the waiting list for this book' });

    const count = await WaitingList.countDocuments({ book: bookId, status: { $in: ['waiting', 'notified'] } });
    const entry = await WaitingList.create({ user: req.user._id, book: bookId, position: count + 1 });
    await entry.populate('book', 'title author');
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get user's waiting list
// @route   GET /api/waiting/my
const getMyWaitingList = async (req, res) => {
  try {
    const list = await WaitingList.find({ user: req.user._id, status: { $in: ['waiting', 'notified'] } })
      .populate('book', 'title author coverImage category')
      .sort({ joinedAt: 1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get waiting list for a book
// @route   GET /api/waiting/book/:bookId
const getBookWaitingList = async (req, res) => {
  try {
    const list = await WaitingList.find({ book: req.params.bookId, status: { $in: ['waiting', 'notified'] } })
      .populate('user', 'name email studentId')
      .sort('position');
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    User claims a notified book (creates borrow request)
// @route   POST /api/waiting/:id/claim
const claimBook = async (req, res) => {
  try {
    const entry = await WaitingList.findById(req.params.id).populate('book');
    if (!entry) return res.status(404).json({ message: 'Waiting list entry not found' });
    if (entry.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    if (entry.status !== 'notified') return res.status(400).json({ message: 'This entry is not in notified state' });
    if (entry.claimDeadline && new Date() > entry.claimDeadline) {
      // Expired — mark and pass to next
      entry.status = 'expired';
      await entry.save();
      await notifyNext(entry.book._id);
      return res.status(400).json({ message: 'Your 24-hour window has expired. The book has been passed to the next person.' });
    }

    const book = entry.book;
    if (book.availableCopies <= 0) return res.status(400).json({ message: 'No copies available right now' });

    // Check existing active borrow
    const exists = await BorrowRequest.findOne({ user: req.user._id, book: book._id, status: { $in: ['pending', 'approved'] } });
    if (exists) return res.status(400).json({ message: 'You already have an active request for this book' });

    // Create borrow request
    const borrow = await BorrowRequest.create({ user: req.user._id, book: book._id });
    await borrow.populate('book', 'title author');

    // Mark as fulfilled
    entry.status = 'fulfilled';
    await entry.save();

    res.status(201).json({ message: 'Book claimed! Your borrow request is pending approval.', borrow });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Expire overdue notified entries and pass to next (called by cron)
// @route   POST /api/waiting/expire (internal / admin)
const expireOverdue = async (req, res) => {
  try {
    const overdue = await WaitingList.find({
      status: 'notified',
      claimDeadline: { $lt: new Date() },
    });
    let count = 0;
    for (const entry of overdue) {
      entry.status = 'expired';
      await entry.save();
      await notifyNext(entry.book);
      count++;
    }
    res.json({ expired: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Cancel waiting list entry
// @route   DELETE /api/waiting/:id
const cancelWaiting = async (req, res) => {
  try {
    const entry = await WaitingList.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    if (entry.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    const wasNotified = entry.status === 'notified';
    const bookId = entry.book;
    entry.status = 'cancelled';
    await entry.save();
    // If they held the notified slot, pass it to next person
    if (wasNotified) await notifyNext(bookId);
    res.json({ message: 'Removed from waiting list' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all active waiting list entries (admin/staff)
// @route   GET /api/waiting/all
const getAllWaitingLists = async (req, res) => {
  try {
    const list = await WaitingList.find({ status: { $in: ['waiting', 'notified'] } })
      .populate('user', 'name email studentId')
      .populate('book', 'title author coverImage')
      .sort({ joinedAt: 1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Admin removes any waiting list entry
// @route   DELETE /api/waiting/admin/:id
const adminCancelWaiting = async (req, res) => {
  try {
    const entry = await WaitingList.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    const wasNotified = entry.status === 'notified';
    const bookId = entry.book;
    entry.status = 'cancelled';
    await entry.save();
    if (wasNotified) await notifyNext(bookId);
    res.json({ message: 'Entry removed from waiting list' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { joinWaitingList, getMyWaitingList, getBookWaitingList, getAllWaitingLists, claimBook, expireOverdue, cancelWaiting, adminCancelWaiting, notifyNext };
