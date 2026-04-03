const express = require('express');
const router = express.Router();
const { createDamageReport, getMyDamageReports, getAllDamageReports, reviewDamageReport } = require('../controllers/damageController');
const { protect, staffOrAdmin } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

router.post('/', protect, uploadImage.single('photo'), createDamageReport);
router.get('/my', protect, getMyDamageReports);
router.get('/', protect, staffOrAdmin, getAllDamageReports);
router.put('/:id/review', protect, staffOrAdmin, reviewDamageReport);

module.exports = router;
