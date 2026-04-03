const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, getAllUsers, updateUserRole, toggleUserStatus } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, uploadImage.single('profileImage'), updateProfile);
router.get('/users', protect, adminOnly, getAllUsers);
router.put('/users/:id/role', protect, adminOnly, updateUserRole);
router.put('/users/:id/toggle', protect, adminOnly, toggleUserStatus);

module.exports = router;
