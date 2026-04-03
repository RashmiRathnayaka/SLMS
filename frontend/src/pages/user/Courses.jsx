import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const Courses = ({ defaultTab = 'courses' }) => {
  const [courses, setCourses] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [tab, setTab] = useState(defaultTab);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollKey, setEnrollKey] = useState('');
  const [enrollKeyError, setEnrollKeyError] = useState('');
  const [showEnrollKey, setShowEnrollKey] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [c, e, r] = await Promise.all([
        api.get('/courses'),
        api.get('/courses/enrolled'),
        api.get('/courses/recommendations'),
      ]);
      setCourses(c.data);
      setEnrolled(e.data.map(en => en.course._id));
      setEnrollmentData(e.data);
      setRecommendations(r.data);
    } catch (err) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleEnroll = async (courseId, courseCode) => {
    if (!enrollKey.trim()) {
      setEnrollKeyError('Please enter the enrollment key.');
      return;
    }
    if (enrollKey.trim() !== courseCode) {
      setEnrollKeyError(`Incorrect key. The enrollment key is the Course Code.`);
      return;
    }
    try {
      await api.post(`/courses/${courseId}/enroll`);
      toast.success('Enrolled successfully!');
      setShowEnrollKey(false);
      setEnrollKey('');
      setEnrollKeyError('');
      fetchData();
      setEnrolled(prev => [...prev, courseId]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleUnenroll = async (courseId) => {
    try {
      await api.delete(`/courses/${courseId}/enroll`);
      toast.success('Unenrolled');
      fetchData();
      setEnrolled(prev => prev.filter(id => id !== courseId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleBorrow = async (bookId) => {
    try {
      await api.post('/borrows', { bookId });
      toast.success('Borrow request submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Borrow failed');
    }
  };

  // ── Course Detail View ─────────────────────────────────────────────
  if (selectedCourse) {
    const course = selectedCourse;
    const isEnrolled = enrolled.includes(course._id);
    return (
      <div className="page-wrapper fade-in">
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setSelectedCourse(null); setShowEnrollKey(false); setEnrollKey(''); setEnrollKeyError(''); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            ← Back to Courses
          </button>
        </div>

        <div className="card" style={{ maxWidth: 720, margin: '0 auto' }}>
          <div
            style={{
              padding: '2rem 2rem 1.25rem',
              borderBottom: '1px solid var(--gray-200)',
              background: isEnrolled ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'linear-gradient(135deg,#eef2ff,#e0e7ff)',
              borderRadius: 'var(--radius) var(--radius) 0 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem', lineHeight: 1.25 }}>
                  {course.name}
                </h1>
                <span className="chip" style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{course.code}</span>
              </div>
              {isEnrolled && (
                <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>✓ Enrolled</span>
              )}
            </div>
            {course.department && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.75rem' }}>
                🏫 <strong>Department:</strong> {course.department}
              </p>
            )}
          </div>

          <div className="card-body" style={{ padding: '2rem' }}>
            {/* Description */}
            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                About this Course
              </h2>
              {course.description ? (
                <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: 1.7 }}>
                  {course.description}
                </p>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No description available for this course.</p>
              )}
            </section>

            {/* Keywords */}
            {course.keywords?.length > 0 && (
              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Topics
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {course.keywords.map(k => <span key={k} className="chip">{k}</span>)}
                </div>
              </section>
            )}

            {/* Enroll button — always at the very bottom */}
            <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem', marginTop: '1rem' }}>
              {isEnrolled ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.95rem' }}>✓ You are currently enrolled in this course.</span>
                  <button className="btn btn-danger" onClick={() => handleUnenroll(course._id)}>
                    Unenroll from Course
                  </button>
                </div>
              ) : showEnrollKey ? (
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
                    Enter the <strong>enrollment key</strong> to confirm. The key is the <strong>Course Code</strong>.
                  </p>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <input
                        className={`form-control${enrollKeyError ? ' is-invalid' : ''}`}
                        placeholder={`e.g. ${course.code}`}
                        value={enrollKey}
                        onChange={e => { setEnrollKey(e.target.value); if (enrollKeyError) setEnrollKeyError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleEnroll(course._id, course.code)}
                        autoFocus
                      />
                      {enrollKeyError && (
                        <span style={{ display: 'block', marginTop: '0.35rem', color: 'var(--danger)', fontSize: '0.82rem' }}>
                          {enrollKeyError}
                        </span>
                      )}
                    </div>
                    <button className="btn btn-success" onClick={() => handleEnroll(course._id, course.code)}>
                      Confirm Enrollment
                    </button>
                    <button className="btn btn-secondary" onClick={() => { setShowEnrollKey(false); setEnrollKey(''); setEnrollKeyError(''); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
                    Enroll to get personalized book recommendations related to this course.
                  </p>
                  <button
                    className="btn btn-success"
                    style={{ minWidth: 180 }}
                    onClick={() => setShowEnrollKey(true)}
                  >
                    + Enroll in this Course
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Course List View ───────────────────────────────────────────────
  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🎓 Courses & Recommendations</h1>
          <p className="page-subtitle">Enroll in courses and discover relevant books</p>
        </div>
      </div>

      <div className="filter-tabs mb-6">
        {[['courses','📚 All Courses'],['my-enrollments',`📋 My Enrollments${enrolled.length > 0 ? ` (${enrolled.length})` : ''}`],['recommendations','💡 Recommended Books']].map(([t,label]) => (
          <button key={t} className={`filter-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{label}</button>
        ))}
      </div>

      {loading ? <div className="spinner" /> : tab === 'courses' ? (
        courses.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🎓</div><p>No courses available.</p></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '1.5rem' }}>
            {courses.map(course => {
              const isEnrolled = enrolled.includes(course._id);
              return (
                <div
                  key={course._id}
                  className="card"
                  style={{ borderTop: `4px solid ${isEnrolled ? 'var(--success)' : 'var(--primary)'}`, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onClick={() => { setSelectedCourse(course); setShowEnrollKey(false); setEnrollKey(''); setEnrollKeyError(''); }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1rem', lineHeight: 1.3 }}>{course.name}</h3>
                      {isEnrolled && <span className="badge badge-success" style={{ fontSize: '0.72rem', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>✓ Enrolled</span>}
                    </div>
                    <span className="chip" style={{ marginBottom: '0.5rem', display: 'inline-block', fontFamily: 'monospace', fontSize: '0.78rem' }}>{course.code}</span>
                    {course.department && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.3rem 0 0' }}>🏫 {course.department}</p>
                    )}
                    {course.description && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.5rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {course.description}
                      </p>
                    )}
                    <p style={{ fontSize: '0.78rem', color: 'var(--primary)', marginTop: '0.75rem', fontWeight: 600 }}>View details →</p>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : tab === 'my-enrollments' ? (
        enrollmentData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>You haven't enrolled in any courses yet.</p>
            <button className="btn btn-primary mt-3" onClick={() => setTab('courses')}>Browse Courses</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {enrollmentData.map(en => {
              const course = en.course;
              if (!course) return null;
              const enrolledDate = new Date(en.enrolledAt || en.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
              return (
                <div key={en._id} className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                  <div className="card-body" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                        <h3
                          style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)', cursor: 'pointer', margin: 0 }}
                          onClick={() => { setSelectedCourse(course); setShowEnrollKey(false); setEnrollKey(''); setEnrollKeyError(''); }}
                        >
                          {course.name}
                        </h3>
                        <span className="chip" style={{ fontFamily: 'monospace', fontSize: '0.76rem' }}>{course.code}</span>
                      </div>
                      {course.department && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.2rem 0' }}>🏫 {course.department}</p>
                      )}
                      {course.description && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.4rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {course.description}
                        </p>
                      )}
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>✅ Enrolled on {enrolledDate}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setSelectedCourse(course); setShowEnrollKey(false); setEnrollKey(''); setEnrollKeyError(''); }}
                      >
                        View Details
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleUnenroll(course._id)}
                      >
                        Unenroll
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>📖 Personalized suggestions based on your enrolled courses and reading history.</p>
          {recommendations.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">💡</div><p>Enroll in courses to get personalized book suggestions.</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px,1fr))', gap: '1.5rem' }}>
              {recommendations.map(book => (
                <div key={book._id} className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ height: 150, background: 'var(--primary-bg)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {book.coverImage ? <img src={book.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '3rem' }}>📖</span>}
                  </div>
                  <div className="card-body">
                    <h4 style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.2rem' }}>{book.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginBottom: '0.3rem' }}>by {book.author}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>📂 {book.category}</p>
                    <span className={`badge ${book.availableCopies > 0 ? 'badge-success' : 'badge-danger'}`}>{book.availableCopies > 0 ? 'Available' : 'Unavailable'}</span>
                    {book.availableCopies > 0 && (
                      <button className="btn btn-primary btn-sm mt-3" onClick={() => handleBorrow(book._id)}>Borrow</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Courses;
