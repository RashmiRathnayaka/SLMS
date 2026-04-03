const DamageReport = require('../models/DamageReport');

// @desc    Create damage report
// @route   POST /api/damages
const createDamageReport = async (req, res) => {
  try {
    const { bookTitle, bookIsbn, reporterName, reporterContact, locationFound, damageType, severity, description } = req.body;
    if (!bookTitle || !reporterName || !damageType || !severity || !description) {
      return res.status(400).json({ message: 'Book title, your name, damage type, severity, and description are required' });
    }
    const reportData = {
      user: req.user._id,
      bookTitle: bookTitle.trim(),
      bookIsbn: (bookIsbn || '').trim(),
      reporterName: reporterName.trim(),
      reporterContact: (reporterContact || '').trim(),
      locationFound: (locationFound || '').trim(),
      damageType: damageType.trim(),
      severity,
      description: description.trim(),
    };
    if (req.file) reportData.photo = `/uploads/images/${req.file.filename}`;
    const report = await DamageReport.create(reportData);
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get user's damage reports
// @route   GET /api/damages/my
const getMyDamageReports = async (req, res) => {
  try {
    const reports = await DamageReport.find({ user: req.user._id })
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all damage reports (staff)
// @route   GET /api/damages
const getAllDamageReports = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const reports = await DamageReport.find(query)
      .populate('user', 'name email studentId')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Review damage report
// @route   PUT /api/damages/:id/review
const reviewDamageReport = async (req, res) => {
  try {
    const report = await DamageReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (req.body.status) report.status = req.body.status;
    report.staffNote = req.body.staffNote || report.staffNote || '';
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createDamageReport, getMyDamageReports, getAllDamageReports, reviewDamageReport };
