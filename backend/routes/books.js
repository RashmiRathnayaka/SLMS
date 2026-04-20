const express = require('express');
const router = express.Router();
const { getBooks, getBook, createBook, updateBook, deleteBook, importBooks, getAnalytics, toggleFavoriteBook, getFavoriteBooks, getRelatedBooks, getTrendingBooks } = require('../controllers/bookController');
const { protect, staffOrAdmin, adminOnly } = require('../middleware/auth');
const { uploadImage, uploadCsv } = require('../middleware/upload');

router.get('/analytics', protect, staffOrAdmin, getAnalytics);
router.get('/favourites', protect, getFavoriteBooks);
router.get('/trending', getTrendingBooks);
router.get('/:id/related', getRelatedBooks);
router.get('/', getBooks);
router.get('/:id', getBook);
router.post('/:id/favourite', protect, toggleFavoriteBook);
router.post('/', protect, staffOrAdmin, uploadImage.single('coverImage'), createBook);
router.put('/:id', protect, staffOrAdmin, uploadImage.single('coverImage'), updateBook);
router.delete('/:id', protect, staffOrAdmin, deleteBook);
router.post('/import/csv', protect, staffOrAdmin, uploadCsv.single('file'), importBooks);

module.exports = router;
