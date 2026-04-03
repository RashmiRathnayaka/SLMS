const express = require('express');
const router = express.Router();
const { createInquiry, getMyInquiries, getAllInquiries, replyInquiry, closeInquiry } = require('../controllers/inquiryController');
const { protect, staffOrAdmin } = require('../middleware/auth');

router.post('/', protect, createInquiry);
router.get('/my', protect, getMyInquiries);
router.get('/', protect, staffOrAdmin, getAllInquiries);
router.put('/:id/reply', protect, staffOrAdmin, replyInquiry);
router.put('/:id/close', protect, staffOrAdmin, closeInquiry);

module.exports = router;
