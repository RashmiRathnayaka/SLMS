const BorrowRequest = require('../models/BorrowRequest');
const WaitingList = require('../models/WaitingList');
const Book = require('../models/Book');
const Enrollment = require('../models/Enrollment');

// @desc    Get personalised book recommendations for logged-in user
// @route   GET /api/recommendations
// Signal 1: reading/borrow history → top categories
// Signal 2: enrolled courses → course name, keywords, department
const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Gather all signals in parallel
    const [borrows, waiting, enrollments] = await Promise.all([
      BorrowRequest.find({ user: userId }).select('book').lean(),
      WaitingList.find({ user: userId }).select('book').lean(),
      Enrollment.find({ user: userId, isActive: true }).populate('course').lean(),
    ]);

    const touchedIds = [
      ...borrows.map(b => b.book.toString()),
      ...waiting.map(w => w.book.toString()),
    ];

    // 2. Signal A — categories from reading/borrow history
    let topCategories = [];
    if (touchedIds.length > 0) {
      const touchedBooks = await Book.find({ _id: { $in: touchedIds } }).select('category').lean();
      const categoryCount = {};
      touchedBooks.forEach(b => {
        categoryCount[b.category] = (categoryCount[b.category] || 0) + 1;
      });
      topCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([cat]) => cat);
    }

    // 3. Signal B — keywords from enrolled courses
    const courseKeywords = new Set();
    const enrolledCourseNames = [];
    enrollments.forEach(e => {
      if (e.course) {
        enrolledCourseNames.push(e.course.name);
        courseKeywords.add(e.course.name.toLowerCase());
        (e.course.keywords || []).forEach(k => courseKeywords.add(k.toLowerCase()));
        if (e.course.department) courseKeywords.add(e.course.department.toLowerCase());
        if (e.course.code) courseKeywords.add(e.course.code.toLowerCase());
      }
    });

    const hasCourses = courseKeywords.size > 0;
    const hasHistory = topCategories.length > 0;

    // 4. No signals at all — return popular books
    if (!hasCourses && !hasHistory) {
      const popular = await Book.find({ isActive: true })
        .sort({ borrowedCount: -1 })
        .limit(8)
        .lean();
      return res.json({ type: 'popular', books: popular, categories: [], courses: [] });
    }

    // 5. Build combined OR conditions
    const orConditions = [];

    // From reading history: category match
    if (topCategories.length > 0) {
      orConditions.push({ category: { $in: topCategories } });
    }

    // From enrolled courses: keyword match on title / category / description
    courseKeywords.forEach(kw => {
      orConditions.push(
        { title: { $regex: kw, $options: 'i' } },
        { category: { $regex: kw, $options: 'i' } },
        { description: { $regex: kw, $options: 'i' } },
      );
    });

    // 6. Query combined recommendations, exclude already-touched books
    const recommended = await Book.find({
      isActive: true,
      _id: { $nin: touchedIds },
      $or: orConditions,
    })
      .sort({ borrowedCount: -1, availableCopies: -1 })
      .limit(16)
      .lean();

    // 7. Top up with popular books if fewer than 4 results
    let finalBooks = recommended;
    if (finalBooks.length < 4) {
      const topUp = await Book.find({
        isActive: true,
        _id: { $nin: [...touchedIds, ...finalBooks.map(b => b._id.toString())] },
      })
        .sort({ borrowedCount: -1 })
        .limit(8 - finalBooks.length)
        .lean();
      finalBooks = [...finalBooks, ...topUp];
    }

    res.json({
      type: 'personalised',
      categories: topCategories,
      courses: enrolledCourseNames,
      books: finalBooks,
    });
  } catch (err) {
    console.error('getRecommendations:', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getRecommendations };
