const express = require('express');
const router = express.Router();
const { getCourses, createCourse, updateCourse, deleteCourse, enrollCourse, unenrollCourse, getMyEnrollments, getRecommendations } = require('../controllers/courseController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/enrolled', protect, getMyEnrollments);
router.get('/recommendations', protect, getRecommendations);
router.get('/', getCourses);
router.post('/', protect, adminOnly, createCourse);
router.put('/:id', protect, adminOnly, updateCourse);
router.delete('/:id', protect, adminOnly, deleteCourse);
router.post('/:id/enroll', protect, enrollCourse);
router.delete('/:id/enroll', protect, unenrollCourse);

module.exports = router;
