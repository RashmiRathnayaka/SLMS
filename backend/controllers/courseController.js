const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Book = require('../models/Book');
const BorrowRequest = require('../models/BorrowRequest');

// @desc    Get all courses
// @route   GET /api/courses
const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true }).sort({ name: 1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create course (admin)
// @route   POST /api/courses
const createCourse = async (req, res) => {
  try {
    const { name, code, description, department, keywords } = req.body;
    const course = await Course.create({ name, code, description, department, keywords: keywords || [] });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update course (admin)
// @route   PUT /api/courses/:id
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete course (admin)
// @route   DELETE /api/courses/:id
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    course.isActive = false;
    await course.save();
    res.json({ message: 'Course removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Enroll in course
// @route   POST /api/courses/:id/enroll
const enrollCourse = async (req, res) => {
  try {
    const existing = await Enrollment.findOne({ user: req.user._id, course: req.params.id });
    if (existing && existing.isActive) return res.status(400).json({ message: 'Already enrolled' });
    if (existing) {
      existing.isActive = true;
      await existing.save();
      return res.json(existing);
    }
    const enrollment = await Enrollment.create({ user: req.user._id, course: req.params.id });
    res.status(201).json(enrollment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Unenroll from course
// @route   DELETE /api/courses/:id/enroll
const unenrollCourse = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({ user: req.user._id, course: req.params.id });
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
    enrollment.isActive = false;
    await enrollment.save();
    res.json({ message: 'Unenrolled successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get user enrollments
// @route   GET /api/courses/enrolled
const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id, isActive: true }).populate('course');
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get personalized book recommendations
// @route   GET /api/courses/recommendations
const getRecommendations = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id, isActive: true }).populate('course');
    if (!enrollments.length) return res.json([]);

    // Build keyword set from courses
    const keywords = new Set();
    enrollments.forEach(e => {
      if (e.course) {
        keywords.add(e.course.name.toLowerCase());
        e.course.keywords.forEach(k => keywords.add(k.toLowerCase()));
        if (e.course.department) keywords.add(e.course.department.toLowerCase());
      }
    });

    // Already borrowed books
    const borrowed = await BorrowRequest.find({ user: req.user._id, status: { $in: ['pending', 'approved'] } }).distinct('book');

    // Find matching books
    const keywordArray = [...keywords];
    const orConditions = keywordArray.map(kw => [
      { title: { $regex: kw, $options: 'i' } },
      { author: { $regex: kw, $options: 'i' } },
      { category: { $regex: kw, $options: 'i' } },
      { description: { $regex: kw, $options: 'i' } },
    ]).flat();

    const recommendations = await Book.find({
      isActive: true,
      _id: { $nin: borrowed },
      $or: orConditions,
    }).limit(20);

    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getCourses, createCourse, updateCourse, deleteCourse, enrollCourse, unenrollCourse, getMyEnrollments, getRecommendations };
