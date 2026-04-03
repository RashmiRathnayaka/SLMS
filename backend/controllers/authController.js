const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// @desc    Register user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, studentId, phone, address, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password, studentId, phone, address, role: role || 'student' });
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email, role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated' });
    res.json({
      _id: user._id, name: user.name, email: user.email, role: user.role,
      studentId: user.studentId, phone: user.phone, address: user.address,
      profileImage: user.profileImage,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get profile
// @route   GET /api/auth/profile
const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
};

// @desc    Update profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { name, phone, address, studentId, password } = req.body;
    if (name && name.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim ? phone.trim() : phone;
    if (address !== undefined) user.address = address;
    if (studentId && studentId.trim()) user.studentId = studentId.trim();
    if (password) user.password = password;
    if (req.file) user.profileImage = `/uploads/images/${req.file.filename}`;
    const updated = await user.save();
    res.json({ _id: updated._id, name: updated.name, email: updated.email, role: updated.role, phone: updated.phone, address: updated.address, studentId: updated.studentId, profileImage: updated.profileImage });
  } catch (err) {
    console.error('updateProfile error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all users (admin)
// @route   GET /api/auth/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update user role (admin)
// @route   PUT /api/auth/users/:id/role
const updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.role = req.body.role;
    await user.save();
    res.json({ message: 'Role updated', role: user.role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Toggle user active status (admin)
// @route   PUT /api/auth/users/:id/toggle
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, getProfile, updateProfile, getAllUsers, updateUserRole, toggleUserStatus };
