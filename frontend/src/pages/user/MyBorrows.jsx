import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const statusCls = (s) => ({ pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger', returned: 'badge-gray', overdue: 'badge-danger' }[s] || 'badge-gray');

const MyBorrows = () => {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/borrows/my')
      .then(r => setBorrows(r.data))
      .catch(() => toast.error('Failed to load borrows'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? borrows : borrows.filter(b => b.status === filter);

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📘 My Borrowed Books</h1>
          <p className="page-subtitle">Track your borrow history and status</p>
        </div>
      </div>

      <div className="filter-tabs">
        {['all', 'pending', 'approved', 'rejected', 'returned'].map(f => (
          <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <div className="spinner" /> : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <p>No borrow records found.</p>
          <Link to="/books" className="btn btn-primary mt-4">Browse Books</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(b => (
            <div key={b._id} className="card">
              <div className="card-body" style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0 }}>
                  {b.book?.coverImage
                    ? <img src={b.book.coverImage} alt="" style={{ width: 72, height: 96, objectFit: 'cover', borderRadius: 8 }} />
                    : <div style={{ width: 72, height: 96, background: 'var(--gray-100)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📖</div>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', margin: 0 }}>{b.book?.title}</h3>
                    <span className={`badge ${statusCls(b.status)}`}>{b.status}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem' }}>by {b.book?.author} &bull; {b.book?.category}</p>
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Requested: {new Date(b.requestDate || b.createdAt).toLocaleDateString()}</span>
                    {b.dueDate && (
                      <span style={{ fontSize: '0.8rem', color: new Date(b.dueDate) < new Date() && b.status === 'approved' ? 'var(--danger)' : 'var(--success)', fontWeight: 500 }}>
                        Due: {new Date(b.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {b.returnedDate && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Returned: {new Date(b.returnedDate).toLocaleDateString()}</span>}
                  </div>
                  {b.staffNote && (
                    <div className="note-box mt-3" style={{ fontSize: '0.82rem' }}>
                      <strong>Staff Note:</strong> {b.staffNote}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBorrows;
