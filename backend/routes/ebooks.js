const express = require('express');
const router = express.Router();
const {
  getEBooks, getEBook, uploadEBook, updateEBook, deleteEBook,
  trackEBook, toggleFavourite, getFavourites, getLeaderboard,
  getReadingHistory, getEBookAnalytics, serveEBook, downloadEBook
} = require('../controllers/ebookController');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadEbook } = require('../middleware/upload');

router.get('/leaderboard', getLeaderboard);
router.get('/analytics', protect, adminOnly, getEBookAnalytics);
router.get('/favourites', protect, getFavourites);
router.get('/history', protect, getReadingHistory);
router.get('/', getEBooks);
router.get('/:id', getEBook);
router.post('/', protect, adminOnly, uploadEbook.fields([{ name: 'file', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), uploadEBook);
router.put('/:id', protect, adminOnly, uploadEbook.fields([{ name: 'file', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), updateEBook);
router.delete('/:id', protect, adminOnly, deleteEBook);
router.post('/:id/track', protect, trackEBook);
router.post('/:id/favourite', protect, toggleFavourite);
router.get('/:id/serve', protect, serveEBook);
router.get('/:id/download', protect, downloadEBook);

module.exports = router;
