/**
 * Smart Library Management System — Database Seed Script
 * Covers: Users, Books, EBooks, Courses, BorrowRequests,
 *         WaitingList, Inquiries, DamageReports, ReadingHistory, Enrollments
 *
 * Run: node seed.js
 * Run (reset only): node seed.js --reset
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User         = require('./models/User');
const Book         = require('./models/Book');
const EBook        = require('./models/EBook');
const Course       = require('./models/Course');
const Enrollment   = require('./models/Enrollment');
const BorrowRequest = require('./models/BorrowRequest');
const WaitingList  = require('./models/WaitingList');
const Inquiry      = require('./models/Inquiry');
const DamageReport = require('./models/DamageReport');
const ReadingHistory = require('./models/ReadingHistory');

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const daysAgo  = n => new Date(Date.now() - n * 864e5);
const daysFrom = n => new Date(Date.now() + n * 864e5);
const hash     = pw => bcrypt.hash(pw, 12);
const pick     = arr => arr[Math.floor(Math.random() * arr.length)];

async function clearAll () {
  await Promise.all([
    User.deleteMany({}),
    Book.deleteMany({}),
    EBook.deleteMany({}),
    Course.deleteMany({}),
    Enrollment.deleteMany({}),
    BorrowRequest.deleteMany({}),
    WaitingList.deleteMany({}),
    Inquiry.deleteMany({}),
    DamageReport.deleteMany({}),
    ReadingHistory.deleteMany({}),
  ]);
  console.log('✓  All collections cleared');
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN SEED
═══════════════════════════════════════════════════════════════════════════ */
async function seed () {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✓  MongoDB connected');

  await clearAll();
  if (process.argv.includes('--reset')) {
    console.log('✓  Reset complete (--reset flag, no data inserted)');
    return mongoose.disconnect();
  }

  /* ── 1. USERS ──────────────────────────────────────────────────────────── */
  const [p_admin, p_staff1, p_staff2, p_s1, p_s2, p_s3, p_s4, p_s5] =
    await Promise.all([
      hash('Admin@1234'),
      hash('Staff@1234'),
      hash('Staff@1234'),
      hash('Student@1234'),
      hash('Student@1234'),
      hash('Student@1234'),
      hash('Student@1234'),
      hash('Student@1234'),
    ]);

  const users = await User.insertMany([
    // ── admin
    {
      name: 'Nipuni Admin',
      email: 'admin@smartlib.lk',
      password: p_admin,
      role: 'admin',
      studentId: '',
      phone: '0771234567',
      address: '42 Library Road, Colombo 03',
      isActive: true,
    },
    // ── staff
    {
      name: 'Rashmi Fernando',
      email: 'rashmi@smartlib.lk',
      password: p_staff1,
      role: 'staff',
      phone: '0779876543',
      address: '12 Galle Road, Colombo 06',
      isActive: true,
    },
    {
      name: 'Sifran Naleem',
      email: 'sifran@smartlib.lk',
      password: p_staff2,
      role: 'staff',
      phone: '0762345678',
      address: '8 Temple Street, Kandy',
      isActive: true,
    },
    // ── students
    {
      name: 'Ashan Perera',
      email: 'ashan@student.lk',
      password: p_s1,
      role: 'student',
      studentId: 'STU001',
      phone: '0701112233',
      address: '5 Lotus Lane, Nugegoda',
      isActive: true,
    },
    {
      name: 'Dilini Jayawardena',
      email: 'dilini@student.lk',
      password: p_s2,
      role: 'student',
      studentId: 'STU002',
      phone: '0712223344',
      address: '17 Flower Road, Maharagama',
      isActive: true,
    },
    {
      name: 'Kasun Silva',
      email: 'kasun@student.lk',
      password: p_s3,
      role: 'student',
      studentId: 'STU003',
      phone: '0723334455',
      address: '31 Main Street, Gampaha',
      isActive: true,
    },
    {
      name: 'Thilini Wickramasinghe',
      email: 'thilini@student.lk',
      password: p_s4,
      role: 'student',
      studentId: 'STU004',
      phone: '0734445566',
      address: '9 Palm Grove, Kelaniya',
      isActive: true,
    },
    {
      name: 'Ruwan Bandara',
      email: 'ruwan@student.lk',
      password: p_s5,
      role: 'student',
      studentId: 'STU005',
      phone: '0745556677',
      address: '22 Lake View, Colombo 07',
      isActive: false,   // inactive user for testing
    },
  ]);

  const [admin, staff1, staff2, s1, s2, s3, s4, s5] = users;
  console.log(`✓  ${users.length} users created`);

  /* ── 2. BOOKS ──────────────────────────────────────────────────────────── */
  const books = await Book.insertMany([
    // ── Computer Science
    {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      category: 'Computer Science',
      description: 'A handbook of agile software craftsmanship.',
      publisher: 'Prentice Hall',
      publishYear: 2008,
      language: 'English',
      totalCopies: 5,
      availableCopies: 3,
      borrowedCount: 4,
      isActive: true,
    },
    {
      title: 'Introduction to Algorithms',
      author: 'Thomas H. Cormen',
      isbn: '9780262033848',
      category: 'Computer Science',
      description: 'Comprehensive introduction to algorithms.',
      publisher: 'MIT Press',
      publishYear: 2009,
      language: 'English',
      totalCopies: 4,
      availableCopies: 1,
      borrowedCount: 6,
      isActive: true,
    },
    {
      title: 'The Pragmatic Programmer',
      author: 'David Thomas',
      isbn: '9780135957059',
      category: 'Computer Science',
      description: 'Your journey to mastery in software development.',
      publisher: 'Addison-Wesley',
      publishYear: 2019,
      language: 'English',
      totalCopies: 3,
      availableCopies: 2,
      borrowedCount: 2,
      isActive: true,
    },
    {
      title: 'Design Patterns',
      author: 'Erich Gamma',
      isbn: '9780201633610',
      category: 'Computer Science',
      description: 'Elements of Reusable Object-Oriented Software.',
      publisher: 'Addison-Wesley',
      publishYear: 1994,
      language: 'English',
      totalCopies: 2,
      availableCopies: 0,
      borrowedCount: 5,
      isActive: true,
    },
    // ── Mathematics
    {
      title: 'Calculus: Early Transcendentals',
      author: 'James Stewart',
      isbn: '9781285741550',
      category: 'Mathematics',
      description: 'A comprehensive calculus textbook.',
      publisher: 'Cengage Learning',
      publishYear: 2015,
      language: 'English',
      totalCopies: 6,
      availableCopies: 4,
      borrowedCount: 3,
      isActive: true,
    },
    {
      title: 'Linear Algebra Done Right',
      author: 'Sheldon Axler',
      isbn: '9783319110790',
      category: 'Mathematics',
      description: 'Clear approach to linear algebra.',
      publisher: 'Springer',
      publishYear: 2015,
      language: 'English',
      totalCopies: 3,
      availableCopies: 3,
      borrowedCount: 0,
      isActive: true,
    },
    {
      title: 'Discrete Mathematics and Its Applications',
      author: 'Kenneth Rosen',
      isbn: '9780073383095',
      category: 'Mathematics',
      description: 'Foundation text for discrete mathematics.',
      publisher: 'McGraw-Hill',
      publishYear: 2018,
      language: 'English',
      totalCopies: 4,
      availableCopies: 2,
      borrowedCount: 4,
      isActive: true,
    },
    // ── Engineering
    {
      title: 'Engineering Mechanics: Statics',
      author: 'R. C. Hibbeler',
      isbn: '9780133918922',
      category: 'Engineering',
      description: 'Comprehensive text on static mechanics.',
      publisher: 'Pearson',
      publishYear: 2016,
      language: 'English',
      totalCopies: 5,
      availableCopies: 3,
      borrowedCount: 3,
      isActive: true,
    },
    {
      title: 'Signals and Systems',
      author: 'Alan V. Oppenheim',
      isbn: '9780138147570',
      category: 'Engineering',
      description: 'Classic text on signals and systems analysis.',
      publisher: 'Prentice Hall',
      publishYear: 1996,
      language: 'English',
      totalCopies: 3,
      availableCopies: 1,
      borrowedCount: 5,
      isActive: true,
    },
    // ── Data Science
    {
      title: 'Python for Data Analysis',
      author: 'Wes McKinney',
      isbn: '9781491957660',
      category: 'Data Science',
      description: 'Data wrangling with Pandas and NumPy.',
      publisher: "O'Reilly",
      publishYear: 2017,
      language: 'English',
      totalCopies: 4,
      availableCopies: 2,
      borrowedCount: 5,
      isActive: true,
    },
    {
      title: 'Hands-On Machine Learning',
      author: 'Aurélien Géron',
      isbn: '9781492032649',
      category: 'Data Science',
      description: 'Practical ML with Scikit-Learn, Keras & TensorFlow.',
      publisher: "O'Reilly",
      publishYear: 2019,
      language: 'English',
      totalCopies: 3,
      availableCopies: 0,
      borrowedCount: 8,
      isActive: true,
    },
    // ── Management
    {
      title: 'Project Management: A Systems Approach',
      author: 'Harold Kerzner',
      isbn: '9781119165354',
      category: 'Management',
      description: 'Planning, scheduling, and controlling projects.',
      publisher: 'Wiley',
      publishYear: 2017,
      language: 'English',
      totalCopies: 3,
      availableCopies: 2,
      borrowedCount: 2,
      isActive: true,
    },
    {
      title: 'The Lean Startup',
      author: 'Eric Ries',
      isbn: '9780307887894',
      category: 'Management',
      description: 'How constant innovation creates radically successful businesses.',
      publisher: 'Crown Business',
      publishYear: 2011,
      language: 'English',
      totalCopies: 4,
      availableCopies: 3,
      borrowedCount: 2,
      isActive: true,
    },
    // ── Science
    {
      title: 'A Brief History of Time',
      author: 'Stephen Hawking',
      isbn: '9780553380163',
      category: 'Science',
      description: 'From the Big Bang to black holes.',
      publisher: 'Bantam Books',
      publishYear: 1998,
      language: 'English',
      totalCopies: 5,
      availableCopies: 4,
      borrowedCount: 3,
      isActive: true,
    },
    {
      title: 'The Selfish Gene',
      author: 'Richard Dawkins',
      isbn: '9780198788607',
      category: 'Science',
      description: 'A landmark work in evolutionary biology.',
      publisher: 'Oxford University Press',
      publishYear: 2016,
      language: 'English',
      totalCopies: 3,
      availableCopies: 2,
      borrowedCount: 2,
      isActive: true,
    },
    // ── Literature
    {
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '9780061935466',
      category: 'Literature',
      description: 'A Pulitzer Prize-winning novel about racial injustice.',
      publisher: 'Harper Perennial',
      publishYear: 2002,
      language: 'English',
      totalCopies: 4,
      availableCopies: 3,
      borrowedCount: 3,
      isActive: true,
    },
    {
      title: '1984',
      author: 'George Orwell',
      isbn: '9780451524935',
      category: 'Literature',
      description: 'A dystopian social science fiction novel.',
      publisher: 'Signet Classic',
      publishYear: 1961,
      language: 'English',
      totalCopies: 5,
      availableCopies: 3,
      borrowedCount: 4,
      isActive: true,
    },
    // ── Networking
    {
      title: 'Computer Networking: A Top-Down Approach',
      author: 'James Kurose',
      isbn: '9780136079675',
      category: 'Networking',
      description: 'Comprehensive intro to computer networking.',
      publisher: 'Pearson',
      publishYear: 2016,
      language: 'English',
      totalCopies: 3,
      availableCopies: 1,
      borrowedCount: 6,
      isActive: true,
    },
    // ── low-stock (for analytics testing)
    {
      title: 'Database System Concepts',
      author: 'Abraham Silberschatz',
      isbn: '9780073523323',
      category: 'Computer Science',
      description: 'Foundational text for database systems.',
      publisher: 'McGraw-Hill',
      publishYear: 2010,
      language: 'English',
      totalCopies: 2,
      availableCopies: 0,
      borrowedCount: 10,
      isActive: true,
    },
    {
      title: 'Operating System Concepts',
      author: 'Abraham Silberschatz',
      isbn: '9781118063330',
      category: 'Computer Science',
      description: 'The "Dinosaur Book" — core OS concepts.',
      publisher: 'Wiley',
      publishYear: 2012,
      language: 'English',
      totalCopies: 2,
      availableCopies: 1,
      borrowedCount: 7,
      isActive: true,
    },
  ]);

  console.log(`✓  ${books.length} books created`);

  /* ── 3. E-BOOKS ────────────────────────────────────────────────────────── */
  const ebooks = await EBook.insertMany([
    {
      title: 'JavaScript: The Good Parts',
      author: 'Douglas Crockford',
      category: 'Computer Science',
      description: 'Unearthing the excellence in JavaScript.',
      filePath: 'javascript_good_parts.pdf',
      fileSize: 1048576,
      fileType: 'pdf',
      readCount: 42,
      downloadCount: 18,
      tags: ['javascript', 'web', 'programming'],
      isbn: '9780596517748',
      publisher: "O'Reilly",
      publishYear: 2008,
      language: 'English',
      isActive: true,
    },
    {
      title: 'Python Crash Course',
      author: 'Eric Matthes',
      category: 'Computer Science',
      description: 'A hands-on, project-based introduction to programming.',
      filePath: 'python_crash_course.pdf',
      fileSize: 2097152,
      fileType: 'pdf',
      readCount: 78,
      downloadCount: 45,
      tags: ['python', 'programming', 'beginner'],
      isbn: '9781593276034',
      publisher: 'No Starch Press',
      publishYear: 2019,
      language: 'English',
      isActive: true,
    },
    {
      title: 'Deep Learning',
      author: 'Ian Goodfellow',
      category: 'Data Science',
      description: 'Authoritative deep learning textbook.',
      filePath: 'deep_learning.pdf',
      fileSize: 5242880,
      fileType: 'pdf',
      readCount: 55,
      downloadCount: 30,
      tags: ['deep learning', 'neural networks', 'AI'],
      isbn: '9780262035613',
      publisher: 'MIT Press',
      publishYear: 2016,
      language: 'English',
      isActive: true,
    },
    {
      title: 'Statistics for Data Scientists',
      author: 'Peter Bruce',
      category: 'Data Science',
      description: '50 essential concepts using R and Python.',
      filePath: 'statistics_data_scientists.pdf',
      fileSize: 3145728,
      fileType: 'pdf',
      readCount: 33,
      downloadCount: 20,
      tags: ['statistics', 'data science', 'R', 'python'],
      publisher: "O'Reilly",
      publishYear: 2020,
      language: 'English',
      isActive: true,
    },
    {
      title: 'Fundamentals of Database Systems',
      author: 'Ramez Elmasri',
      category: 'Computer Science',
      description: 'Conceptual and practical database fundamentals.',
      filePath: 'fundamentals_database_systems.pdf',
      fileSize: 4194304,
      fileType: 'pdf',
      readCount: 28,
      downloadCount: 12,
      tags: ['database', 'SQL', 'DBMS'],
      isbn: '9780133970777',
      publisher: 'Pearson',
      publishYear: 2015,
      language: 'English',
      isActive: true,
    },
    {
      title: 'Computer Organization and Architecture',
      author: 'William Stallings',
      category: 'Engineering',
      description: 'Design, evaluation and performance of computer systems.',
      filePath: 'computer_organization.pdf',
      fileSize: 3670016,
      fileType: 'pdf',
      readCount: 19,
      downloadCount: 9,
      tags: ['architecture', 'hardware', 'computer organization'],
      isbn: '9780134101613',
      publisher: 'Pearson',
      publishYear: 2016,
      language: 'English',
      isActive: true,
    },
    {
      title: 'Artificial Intelligence: A Modern Approach',
      author: 'Stuart Russell',
      category: 'Computer Science',
      description: 'The leading textbook in artificial intelligence.',
      filePath: 'ai_modern_approach.pdf',
      fileSize: 6291456,
      fileType: 'pdf',
      readCount: 61,
      downloadCount: 38,
      tags: ['AI', 'machine learning', 'search', 'planning'],
      isbn: '9780136042594',
      publisher: 'Pearson',
      publishYear: 2020,
      language: 'English',
      isActive: true,
    },
    {
      title: 'Network Security Essentials',
      author: 'William Stallings',
      category: 'Networking',
      description: 'Applications and standards in cyber security.',
      filePath: 'network_security_essentials.pdf',
      fileSize: 2621440,
      fileType: 'pdf',
      readCount: 24,
      downloadCount: 15,
      tags: ['networking', 'security', 'cryptography'],
      isbn: '9780134527338',
      publisher: 'Pearson',
      publishYear: 2017,
      language: 'English',
      isActive: true,
    },
    {
      title: 'Business Analytics',
      author: 'James Evans',
      category: 'Management',
      description: 'Methods, models, and decisions for business.',
      filePath: 'business_analytics.pdf',
      fileSize: 2097152,
      fileType: 'pdf',
      readCount: 15,
      downloadCount: 8,
      tags: ['analytics', 'business', 'management'],
      publisher: 'Pearson',
      publishYear: 2016,
      language: 'English',
      isActive: true,
    },
    {
      title: 'Organic Chemistry',
      author: 'Paula Bruice',
      category: 'Science',
      description: 'Comprehensive introduction to organic chemistry.',
      filePath: 'organic_chemistry.pdf',
      fileSize: 8388608,
      fileType: 'pdf',
      readCount: 11,
      downloadCount: 5,
      tags: ['chemistry', 'science', 'organic'],
      isbn: '9780134042282',
      publisher: 'Pearson',
      publishYear: 2016,
      language: 'English',
      isActive: true,
    },
  ]);

  console.log(`✓  ${ebooks.length} e-books created`);

  /* ── 4. COURSES ────────────────────────────────────────────────────────── */
  const courses = await Course.insertMany([
    {
      name: 'Bachelor of Science in Computer Science',
      code: 'BSC-CS',
      description: 'Core program covering algorithms, databases, systems software, and AI.',
      department: 'Faculty of Computing',
      keywords: ['algorithms', 'programming', 'database', 'operating system', 'AI', 'python', 'javascript'],
      isActive: true,
    },
    {
      name: 'Bachelor of Engineering in Software Engineering',
      code: 'BE-SE',
      description: 'Software design, architecture, testing, and project management.',
      department: 'Faculty of Engineering',
      keywords: ['software engineering', 'design patterns', 'agile', 'testing', 'architecture'],
      isActive: true,
    },
    {
      name: 'Bachelor of Science in Data Science',
      code: 'BSC-DS',
      description: 'Statistical analysis, machine learning, and big data processing.',
      department: 'Faculty of Computing',
      keywords: ['data science', 'machine learning', 'statistics', 'python', 'neural networks', 'deep learning'],
      isActive: true,
    },
    {
      name: 'Bachelor of Engineering in Electronic & Electrical',
      code: 'BE-EEE',
      description: 'Electronics, signals processing, and communication systems.',
      department: 'Faculty of Engineering',
      keywords: ['signals', 'electronics', 'circuit design', 'communication', 'hardware'],
      isActive: true,
    },
    {
      name: 'Bachelor of Business Administration',
      code: 'BBA',
      description: 'Management principles, marketing, finance, and analytics.',
      department: 'Faculty of Management',
      keywords: ['management', 'business', 'analytics', 'project management', 'marketing'],
      isActive: true,
    },
    {
      name: 'Bachelor of Science in Information Technology',
      code: 'BSC-IT',
      description: 'Networking, cybersecurity, cloud computing, and web technologies.',
      department: 'Faculty of Computing',
      keywords: ['networking', 'security', 'web', 'cloud', 'database', 'programming'],
      isActive: true,
    },
    {
      name: 'Bachelor of Science in Mathematics',
      code: 'BSC-MATH',
      description: 'Pure and applied mathematics including statistics and operations research.',
      department: 'Faculty of Science',
      keywords: ['calculus', 'linear algebra', 'discrete mathematics', 'statistics'],
      isActive: true,
    },
    {
      name: 'Bachelor of Science in Biology',
      code: 'BSC-BIO',
      description: 'Life sciences covering genetics, ecology, and molecular biology.',
      department: 'Faculty of Science',
      keywords: ['biology', 'genetics', 'chemistry', 'science', 'organic'],
      isActive: true,
    },
  ]);

  console.log(`✓  ${courses.length} courses created`);

  /* ── 5. ENROLLMENTS ────────────────────────────────────────────────────── */
  const enrollments = await Enrollment.insertMany([
    { user: s1._id, course: courses[0]._id, isActive: true },   // Ashan → CS
    { user: s1._id, course: courses[1]._id, isActive: true },   // Ashan → SE
    { user: s2._id, course: courses[2]._id, isActive: true },   // Dilini → DS
    { user: s2._id, course: courses[0]._id, isActive: true },   // Dilini → CS
    { user: s3._id, course: courses[3]._id, isActive: true },   // Kasun → EEE
    { user: s3._id, course: courses[5]._id, isActive: true },   // Kasun → IT
    { user: s4._id, course: courses[4]._id, isActive: true },   // Thilini → BBA
    { user: s4._id, course: courses[6]._id, isActive: true },   // Thilini → Math
    { user: s5._id, course: courses[7]._id, isActive: true },   // Ruwan → Bio
    { user: staff1._id, course: courses[0]._id, isActive: true },
  ]);

  console.log(`✓  ${enrollments.length} enrollments created`);

  /* ── 6. BORROW REQUESTS ────────────────────────────────────────────────── */
  const now = new Date();

  const borrows = await BorrowRequest.insertMany([
    // approved + currently borrowed
    {
      user: s1._id, book: books[0]._id,
      status: 'approved',
      requestDate: daysAgo(10), approvedDate: daysAgo(8),
      dueDate: daysFrom(6), processedBy: staff1._id,
    },
    {
      user: s1._id, book: books[9]._id,
      status: 'approved',
      requestDate: daysAgo(7), approvedDate: daysAgo(5),
      dueDate: daysFrom(9), processedBy: staff1._id,
    },
    {
      user: s2._id, book: books[1]._id,
      status: 'approved',
      requestDate: daysAgo(12), approvedDate: daysAgo(10),
      dueDate: daysFrom(4), processedBy: staff2._id,
    },
    // pending
    {
      user: s2._id, book: books[10]._id,
      status: 'pending',
      requestDate: daysAgo(1),
    },
    {
      user: s3._id, book: books[7]._id,
      status: 'pending',
      requestDate: daysAgo(2),
    },
    {
      user: s4._id, book: books[4]._id,
      status: 'pending',
      requestDate: now,
    },
    // returned
    {
      user: s1._id, book: books[5]._id,
      status: 'returned',
      requestDate: daysAgo(30), approvedDate: daysAgo(28),
      dueDate: daysAgo(14), returnedDate: daysAgo(15),
      processedBy: staff1._id,
      staffNote: 'Returned in good condition.',
    },
    {
      user: s3._id, book: books[2]._id,
      status: 'returned',
      requestDate: daysAgo(20), approvedDate: daysAgo(19),
      dueDate: daysAgo(5), returnedDate: daysAgo(6),
      processedBy: staff2._id,
    },
    {
      user: s2._id, book: books[15]._id,
      status: 'returned',
      requestDate: daysAgo(25), approvedDate: daysAgo(23),
      dueDate: daysAgo(9), returnedDate: daysAgo(10),
      processedBy: staff1._id,
    },
    // rejected
    {
      user: s5._id, book: books[11]._id,
      status: 'rejected',
      requestDate: daysAgo(5),
      processedBy: staff1._id,
      staffNote: 'User account is inactive.',
    },
    // overdue
    {
      user: s4._id, book: books[17]._id,
      status: 'overdue',
      requestDate: daysAgo(30), approvedDate: daysAgo(28),
      dueDate: daysAgo(14), processedBy: staff2._id,
      staffNote: 'No response from student.',
    },
    // s3 third active borrow (max 3 test)
    {
      user: s3._id, book: books[8]._id,
      status: 'approved',
      requestDate: daysAgo(5), approvedDate: daysAgo(3),
      dueDate: daysFrom(11), processedBy: staff2._id,
    },
  ]);

  console.log(`✓  ${borrows.length} borrow requests created`);

  /* ── 7. WAITING LIST ───────────────────────────────────────────────────── */
  const waiting = await WaitingList.insertMany([
    // Design Patterns (0 available)
    { user: s2._id, book: books[3]._id, position: 1, status: 'waiting',   joinedAt: daysAgo(5) },
    { user: s4._id, book: books[3]._id, position: 2, status: 'waiting',   joinedAt: daysAgo(3) },
    { user: s5._id, book: books[3]._id, position: 3, status: 'waiting',   joinedAt: daysAgo(1) },
    // Hands-On Machine Learning (0 available)
    { user: s1._id, book: books[10]._id, position: 1, status: 'notified', joinedAt: daysAgo(8), notifiedAt: daysAgo(1) },
    { user: s3._id, book: books[10]._id, position: 2, status: 'waiting',  joinedAt: daysAgo(4) },
    // Database System Concepts (0 available)
    { user: s4._id, book: books[18]._id, position: 1, status: 'waiting',  joinedAt: daysAgo(2) },
  ]);

  console.log(`✓  ${waiting.length} waiting list entries created`);

  /* ── 8. INQUIRIES ──────────────────────────────────────────────────────── */
  const inquiries = await Inquiry.insertMany([
    // open
    {
      user: s1._id,
      subject: 'Book reservation policy',
      message: 'Can I reserve a book that is currently borrowed? How long is the reservation held?',
      status: 'open',
    },
    {
      user: s3._id,
      subject: 'E-book download limit',
      message: 'Is there a daily download limit for e-books? I tried downloading 3 PDFs today but was unsure.',
      status: 'open',
    },
    // replied
    {
      user: s2._id,
      subject: 'Lost library card',
      message: 'I have lost my library card. What is the process to get a replacement?',
      status: 'replied',
      reply: 'Please visit the library front desk with your student ID to get a replacement card. There is a small administrative fee of LKR 200.',
      repliedBy: staff1._id,
      repliedAt: daysAgo(2),
    },
    {
      user: s4._id,
      subject: 'Overdue fine waiver request',
      message: 'I was in hospital for two weeks and could not return the book on time. Is it possible to waive the overdue fine?',
      status: 'replied',
      reply: 'We are sorry to hear about your health situation. Please provide a medical certificate at the front desk and your fine will be reviewed for a full waiver.',
      repliedBy: staff2._id,
      repliedAt: daysAgo(1),
    },
    // closed
    {
      user: s5._id,
      subject: 'Borrow limit increase request',
      message: 'I am doing my final year project and need access to more than 3 books. Can the limit be increased temporarily?',
      status: 'closed',
      reply: 'Final year students may request temporary limit increases. Please have your supervisor send an email to library@smartlib.lk with your student ID and requirements.',
      repliedBy: staff1._id,
      repliedAt: daysAgo(10),
    },
    {
      user: s1._id,
      subject: 'New book purchase suggestion',
      message: 'Could the library purchase "Refactoring" by Martin Fowler (2nd edition)? It is very relevant to our software engineering course.',
      status: 'closed',
      reply: 'Thank you for the suggestion! We have forwarded this to our acquisitions team and will add 2 copies in the next procurement cycle.',
      repliedBy: admin._id,
      repliedAt: daysAgo(5),
    },
  ]);

  console.log(`✓  ${inquiries.length} inquiries created`);

  /* ── 9. DAMAGE REPORTS ─────────────────────────────────────────────────── */
  const damages = await DamageReport.insertMany([
    // pending
    {
      user: s3._id, book: books[8]._id,
      description: 'The spine of the book is cracked and the first 10 pages are torn. Occurred during transport in my bag.',
      status: 'pending',
    },
    {
      user: s2._id, book: books[1]._id,
      description: 'Several pages have water stains. I accidentally spilled water on it while studying.',
      status: 'pending',
    },
    // reviewed
    {
      user: s1._id, book: books[0]._id,
      description: 'Cover is slightly bent at the corner. No write marks or torn pages.',
      status: 'reviewed',
      staffNote: 'Minor cosmetic damage only. No fine assessed. Book remains serviceable.',
      reviewedBy: staff1._id,
      reviewedAt: daysAgo(3),
    },
    // resolved
    {
      user: s4._id, book: books[17]._id,
      description: 'Multiple pages have underline marks made with a ballpoint pen throughout chapters 3 and 4.',
      status: 'resolved',
      staffNote: 'Student fined LKR 500 for writing in library book. Fine paid. Book marked for decommission.',
      reviewedBy: staff2._id,
      reviewedAt: daysAgo(15),
    },
    {
      user: s5._id, book: books[15]._id,
      description: 'Back cover is missing. Book was returned without its back cover.',
      status: 'resolved',
      staffNote: 'Student was inactive — case escalated and resolved administratively. Book replaced.',
      reviewedBy: admin._id,
      reviewedAt: daysAgo(8),
    },
  ]);

  console.log(`✓  ${damages.length} damage reports created`);

  /* ── 10. READING HISTORY ───────────────────────────────────────────────── */
  const histories = await ReadingHistory.insertMany([
    // s1
    { user: s1._id, ebook: ebooks[0]._id, action: 'completed', readAt: daysAgo(20), completed: true, completedAt: daysAgo(18), progress: 100 },
    { user: s1._id, ebook: ebooks[1]._id, action: 'completed', readAt: daysAgo(15), completed: true, completedAt: daysAgo(12), progress: 100 },
    { user: s1._id, ebook: ebooks[6]._id, action: 'read',      readAt: daysAgo(5),  completed: false, progress: 45 },
    { user: s1._id, ebook: ebooks[0]._id, action: 'downloaded', readAt: daysAgo(19), completed: false, progress: 0 },
    // s2
    { user: s2._id, ebook: ebooks[2]._id, action: 'completed', readAt: daysAgo(30), completed: true, completedAt: daysAgo(25), progress: 100 },
    { user: s2._id, ebook: ebooks[3]._id, action: 'completed', readAt: daysAgo(22), completed: true, completedAt: daysAgo(18), progress: 100 },
    { user: s2._id, ebook: ebooks[1]._id, action: 'read',      readAt: daysAgo(10), completed: false, progress: 60 },
    // s3
    { user: s3._id, ebook: ebooks[5]._id, action: 'completed', readAt: daysAgo(14), completed: true, completedAt: daysAgo(10), progress: 100 },
    { user: s3._id, ebook: ebooks[7]._id, action: 'completed', readAt: daysAgo(8),  completed: true, completedAt: daysAgo(5),  progress: 100 },
    { user: s3._id, ebook: ebooks[2]._id, action: 'read',      readAt: daysAgo(3),  completed: false, progress: 30 },
    // s4
    { user: s4._id, ebook: ebooks[8]._id, action: 'completed', readAt: daysAgo(12), completed: true, completedAt: daysAgo(9),  progress: 100 },
    { user: s4._id, ebook: ebooks[6]._id, action: 'completed', readAt: daysAgo(6),  completed: true, completedAt: daysAgo(4),  progress: 100 },
    // s5
    { user: s5._id, ebook: ebooks[9]._id, action: 'completed', readAt: daysAgo(40), completed: true, completedAt: daysAgo(35), progress: 100 },
    { user: s5._id, ebook: ebooks[1]._id, action: 'read',      readAt: daysAgo(2),  completed: false, progress: 20 },
    // staff1
    { user: staff1._id, ebook: ebooks[0]._id, action: 'completed', readAt: daysAgo(60), completed: true, completedAt: daysAgo(55), progress: 100 },
    { user: staff1._id, ebook: ebooks[4]._id, action: 'downloaded', readAt: daysAgo(7), completed: false, progress: 0 },
  ]);

  console.log(`✓  ${histories.length} reading history records created`);

  /* ── update user favoriteEbooks ───────────────────────────────────────── */
  await User.findByIdAndUpdate(s1._id,   { favoriteEbooks: [ebooks[0]._id, ebooks[6]._id] });
  await User.findByIdAndUpdate(s2._id,   { favoriteEbooks: [ebooks[2]._id, ebooks[3]._id, ebooks[1]._id] });
  await User.findByIdAndUpdate(s3._id,   { favoriteEbooks: [ebooks[7]._id] });
  await User.findByIdAndUpdate(s4._id,   { favoriteEbooks: [ebooks[8]._id, ebooks[6]._id] });

  console.log('✓  User favourite e-books updated');

  /* ── SUMMARY ──────────────────────────────────────────────────────────── */
  console.log('\n════════════════════════════════════════');
  console.log('  Seed complete!');
  console.log('════════════════════════════════════════');
  console.log(`  Users         : ${users.length}  (1 admin, 2 staff, 5 students)`);
  console.log(`  Books         : ${books.length}`);
  console.log(`  E-Books       : ${ebooks.length}`);
  console.log(`  Courses       : ${courses.length}`);
  console.log(`  Enrollments   : ${enrollments.length}`);
  console.log(`  Borrow Reqs   : ${borrows.length}`);
  console.log(`  Waiting List  : ${waiting.length}`);
  console.log(`  Inquiries     : ${inquiries.length}`);
  console.log(`  Damage Reports: ${damages.length}`);
  console.log(`  Reading Hist  : ${histories.length}`);
  console.log('\n  Login credentials:');
  console.log('  admin@smartlib.lk   / Admin@1234   (admin)');
  console.log('  rashmi@smartlib.lk  / Staff@1234   (staff)');
  console.log('  sifran@smartlib.lk  / Staff@1234   (staff)');
  console.log('  ashan@student.lk    / Student@1234 (student)');
  console.log('  dilini@student.lk   / Student@1234 (student)');
  console.log('  kasun@student.lk    / Student@1234 (student)');
  console.log('  thilini@student.lk  / Student@1234 (student)');
  console.log('  ruwan@student.lk    / Student@1234 (student, inactive)');
  console.log('════════════════════════════════════════\n');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
