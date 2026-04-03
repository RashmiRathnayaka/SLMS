import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const statusBadge = (s) => ({ pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger', returned: 'badge-gray', overdue: 'badge-danger' }[s] || 'badge-gray');

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ borrows: [], waiting: [], inquiries: [] });
  const [loading, setLoading] = useState(true);
  const [recs, setRecs] = useState({ type: null, books: [], categories: [] });
  const [recsLoading, setRecsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [b, w, i] = await Promise.all([
          api.get('/borrows/my'),
          api.get('/waiting/my'),
          api.get('/inquiries/my'),
        ]);
        setStats({ borrows: b.data, waiting: w.data, inquiries: i.data });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };

    const fetchRecs = async () => {
      try {
        const { data } = await api.get('/recommendations');
        setRecs(data);
      } catch { /* silent */ }
      finally { setRecsLoading(false); }
    };

    fetchStats();
    fetchRecs();
  }, []);

  const handleBorrow = async (bookId) => {
    try {
      await api.post('/borrows', { bookId });
      toast.success('Borrow request submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Borrow failed');
    }
  };

  const handleWaiting = async (bookId) => {
    try {
      await api.post('/waiting', { bookId });
      toast.success('Added to waiting list!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join waiting list');
    }
  };

  const activeBorrows  = stats.borrows.filter(b => b.status === 'approved').length;
  const pendingBorrows = stats.borrows.filter(b => b.status === 'pending').length;
  const openInquiries  = stats.inquiries.filter(i => i.status === 'open').length;

  const cards = [
    { label: 'Active Borrows',   value: activeBorrows,         icon: '📖', iconCls: 'stat-icon-success', link: '/my-borrows' },
    { label: 'Pending Requests', value: pendingBorrows,        icon: '⏳', iconCls: 'stat-icon-warning', link: '/my-borrows' },
    { label: 'Waiting List',     value: stats.waiting.length,  icon: '🕐', iconCls: 'stat-icon-info',    link: '/waiting' },
    { label: 'Open Inquiries',   value: openInquiries,         icon: '📧', iconCls: 'stat-icon-danger',  link: '/inquiries' },
  ];

  const quickLinks = [
    { to: '/books',   icon: '🔍', label: 'Search Books' },
    { to: '/ebooks',  icon: '📱', label: 'E-Books' },
    { to: '/courses', icon: '🎓', label: 'Courses' },
    { to: '/damages', icon: '🛡️', label: 'Report Damage' },
  ];

  return (
    <div className="page-wrapper fade-in">
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Welcome back, <span style={{ color: 'var(--primary)' }}>{user?.name?.split(' ')[0]}</span>! 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>Here's an overview of your library activity.</p>
      </div>

      {loading ? <div className="spinner" /> : (
        <>
          {/* Stats */}
          <div className="stats-grid">
            {cards.map(card => (
              <Link to={card.link} key={card.label} className="stat-card" style={{ textDecoration: 'none' }}>
                <div className={`stat-icon ${card.iconCls}`}>{card.icon}</div>
                <div>
                  <div className="stat-value">{card.value}</div>
                  <div className="stat-label">{card.label}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Links */}
          <div className="card mb-6">
            <div className="card-header"><span className="card-title">Quick Access</span></div>
            <div className="card-body" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {quickLinks.map(l => (
                <Link key={l.to} to={l.to} className="btn btn-ghost btn-sm" style={{ fontSize: '0.875rem' }}>
                  {l.icon} {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="card mb-6">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="card-title">
                  {recs.type === 'personalised' ? '✨ Recommended For You' : '🔥 Popular Books'}
                </span>
                {recs.type === 'personalised' && recs.categories.length > 0 && (
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Based on your interest in&nbsp;
                    {recs.categories.map((c, i) => (
                      <span key={c}>
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{c}</span>
                        {i < recs.categories.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </p>
                )}
                {recs.type === 'popular' && (
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Borrow some books to get personalised picks!
                  </p>
                )}
              </div>
              <Link to="/recommendations" className="btn btn-secondary btn-sm">See All →</Link>
            </div>
            <div className="card-body" style={{ paddingTop: '0.5rem' }}>
              {recsLoading ? (
                <div className="spinner" />
              ) : recs.books.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem 0' }}>
                  <div className="empty-state-icon">📚</div>
                  <p>No recommendations yet. <Link to="/books">Browse the catalogue</Link>!</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                  {recs.books.map(book => (
                    <div key={book._id} className="card" style={{ overflow: 'hidden', margin: 0 }}>
                      <div style={{ height: 150, background: 'var(--primary-bg)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {book.coverImage
                          ? <img src={book.coverImage} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '3rem' }}>📖</span>}
                      </div>
                      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.title}</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>by {book.author}</div>
                        <span className={`badge ${book.availableCopies > 0 ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem', width: 'fit-content', marginTop: '0.2rem' }}>
                          {book.availableCopies > 0 ? `Available (${book.availableCopies})` : 'Waiting list'}
                        </span>
                        <div style={{ marginTop: '0.4rem' }}>
                          {book.availableCopies > 0
                            ? <button className="btn btn-primary btn-sm" style={{ width: '100%', fontSize: '0.75rem' }} onClick={() => handleBorrow(book._id)}>Borrow</button>
                            : <button className="btn btn-warning btn-sm" style={{ width: '100%', fontSize: '0.75rem' }} onClick={() => handleWaiting(book._id)}>⏳ Waiting List</button>
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          {stats.borrows.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Recent Borrow Activity</span>
                <Link to="/my-borrows" className="btn btn-secondary btn-sm">View All</Link>
              </div>
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                <table>
                  <thead><tr><th>Book</th><th>Author</th><th>Status</th><th>Due Date</th></tr></thead>
                  <tbody>
                    {stats.borrows.slice(0, 5).map(b => (
                      <tr key={b._id}>
                        <td style={{ fontWeight: 500 }}>{b.book?.title}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{b.book?.author || '-'}</td>
                        <td><span className={`badge ${statusBadge(b.status)}`}>{b.status}</span></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{b.dueDate ? new Date(b.dueDate).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
