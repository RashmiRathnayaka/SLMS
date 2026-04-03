const express = require('express');
const router = express.Router();
const { requestBorrow, getMyBorrows, getAllBorrows, approveBorrow, rejectBorrow, returnBook } = require('../controllers/borrowController');
const { protect, staffOrAdmin } = require('../middleware/auth');

router.post('/', protect, requestBorrow);
router.get('/my', protect, getMyBorrows);
router.get('/', protect, staffOrAdmin, getAllBorrows);
router.put('/:id/approve', protect, staffOrAdmin, approveBorrow);
router.put('/:id/reject', protect, staffOrAdmin, rejectBorrow);
router.put('/:id/return', protect, staffOrAdmin, returnBook);

module.exports = router;
