const express = require('express');
const router = express.Router();
const { joinWaitingList, getMyWaitingList, getBookWaitingList, getAllWaitingLists, claimBook, expireOverdue, cancelWaiting, adminCancelWaiting } = require('../controllers/waitingController');
const { protect, staffOrAdmin } = require('../middleware/auth');

router.post('/', protect, joinWaitingList);
router.get('/my', protect, getMyWaitingList);
router.get('/all', protect, staffOrAdmin, getAllWaitingLists);
router.get('/book/:bookId', protect, staffOrAdmin, getBookWaitingList);
router.post('/expire', protect, staffOrAdmin, expireOverdue);
router.post('/:id/claim', protect, claimBook);
router.delete('/admin/:id', protect, staffOrAdmin, adminCancelWaiting);
router.delete('/:id', protect, cancelWaiting);

module.exports = router;
