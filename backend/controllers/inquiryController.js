const Inquiry = require('../models/Inquiry');

// @desc    Create inquiry
// @route   POST /api/inquiries
const createInquiry = async (req, res) => {
  try {
    const { subject, message } = req.body;
    const inquiry = await Inquiry.create({ user: req.user._id, subject, message });
    res.status(201).json(inquiry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get user's inquiries
// @route   GET /api/inquiries/my
const getMyInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ user: req.user._id })
      .populate('repliedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all inquiries (staff)
// @route   GET /api/inquiries
const getAllInquiries = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const inquiries = await Inquiry.find(query)
      .populate('user', 'name email')
      .populate('repliedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Reply to inquiry
// @route   PUT /api/inquiries/:id/reply
const replyInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    inquiry.reply = req.body.reply;
    inquiry.status = 'replied';
    inquiry.repliedBy = req.user._id;
    inquiry.repliedAt = new Date();
    await inquiry.save();
    res.json(inquiry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Close inquiry
// @route   PUT /api/inquiries/:id/close
const closeInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    inquiry.status = 'closed';
    await inquiry.save();
    res.json(inquiry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createInquiry, getMyInquiries, getAllInquiries, replyInquiry, closeInquiry };
