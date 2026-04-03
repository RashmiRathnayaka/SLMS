import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';

// Public
import HomePage from './pages/HomePage';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// User Pages
import Dashboard from './pages/user/Dashboard';
import Profile from './pages/user/Profile';
import SearchBooks from './pages/user/SearchBooks';
import MyBorrows from './pages/user/MyBorrows';
import WaitingList from './pages/user/WaitingList';
import Inquiries from './pages/user/Inquiries';
import DamageReport from './pages/user/DamageReport';
import EBooks from './pages/user/EBooks';
import Courses from './pages/user/Courses';
import MyEnrollments from './pages/user/Courses';
import Recommendations from './pages/user/Recommendations';

// Staff Pages
import BorrowRequests from './pages/staff/BorrowRequests';
import InquiryManagement from './pages/staff/InquiryManagement';
import DamageManagement from './pages/staff/DamageManagement';

// Admin Pages
import BookManagement from './pages/admin/BookManagement';
import EBookManagement from './pages/admin/EBookManagement';
import CourseManagement from './pages/admin/CourseManagement';
import UserManagement from './pages/admin/UserManagement';
import Analytics from './pages/admin/Analytics';
import WaitingListManagement from './pages/admin/WaitingListManagement';

function AppLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/staff');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div
        data-theme={isAdminRoute ? 'dark' : undefined}
        style={{ paddingTop: isHome ? 0 : '64px', flex: 1, background: 'var(--bg)' }}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={<PrivateRoute roles={['student', 'staff', 'admin']}><Dashboard /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute roles={['student', 'staff', 'admin']}><Profile /></PrivateRoute>} />
          <Route path="/books" element={<PrivateRoute roles={['student', 'staff', 'admin']}><SearchBooks /></PrivateRoute>} />
          <Route path="/my-borrows" element={<PrivateRoute roles={['student', 'staff', 'admin']}><MyBorrows /></PrivateRoute>} />
          <Route path="/waiting" element={<PrivateRoute roles={['student', 'staff', 'admin']}><WaitingList /></PrivateRoute>} />
          <Route path="/inquiries" element={<PrivateRoute roles={['student', 'staff', 'admin']}><Inquiries /></PrivateRoute>} />
          <Route path="/damages" element={<PrivateRoute roles={['student', 'staff', 'admin']}><DamageReport /></PrivateRoute>} />
          <Route path="/ebooks" element={<PrivateRoute roles={['student', 'staff', 'admin']}><EBooks /></PrivateRoute>} />
          <Route path="/courses" element={<PrivateRoute roles={['student', 'staff', 'admin']}><Courses /></PrivateRoute>} />
          <Route path="/my-enrollments" element={<PrivateRoute roles={['student', 'staff', 'admin']}><MyEnrollments defaultTab="my-enrollments" /></PrivateRoute>} />
          <Route path="/recommendations" element={<PrivateRoute roles={['student', 'staff', 'admin']}><Recommendations /></PrivateRoute>} />

          <Route path="/staff/borrows" element={<PrivateRoute roles={['staff', 'admin']}><BorrowRequests /></PrivateRoute>} />
          <Route path="/staff/inquiries" element={<PrivateRoute roles={['staff', 'admin']}><InquiryManagement /></PrivateRoute>} />
          <Route path="/staff/damages" element={<PrivateRoute roles={['staff', 'admin']}><DamageManagement /></PrivateRoute>} />

          <Route path="/admin/books" element={<PrivateRoute roles={['admin']}><BookManagement /></PrivateRoute>} />
          <Route path="/admin/ebooks" element={<PrivateRoute roles={['admin']}><EBookManagement /></PrivateRoute>} />
          <Route path="/admin/courses" element={<PrivateRoute roles={['admin']}><CourseManagement /></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute roles={['admin']}><UserManagement /></PrivateRoute>} />
          <Route path="/admin/analytics" element={<PrivateRoute roles={['admin']}><Analytics /></PrivateRoute>} />
          <Route path="/admin/waiting" element={<PrivateRoute roles={['admin', 'staff']}><WaitingListManagement /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppLayout />
    </Router>
  );
}


export default App;
