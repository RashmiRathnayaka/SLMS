import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const statusCls = (s) => ({ pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger', returned: 'badge-gray', overdue: 'badge-danger' }[s] || 'badge-gray');

const BorrowRequests = () => {
  const [borrows, setBorrows] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  const fetchBorrows = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const { data } = await api.get('/borrows', { params });
      setBorrows(data);
    } catch (err) { toast.error('Failed to load borrow requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBorrows(); }, [filter]);

  const handleAction = async (id, action) => {
    try {
      await api.put(`/borrows/${id}/${action}`, { staffNote: note });
      toast.success(`Request ${action}d successfully`);
      setNote(''); setActiveId(null); fetchBorrows();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  // Filter borrows by search text
  const filteredBorrows = borrows.filter(b =>
    b.book?.title.toLowerCase().includes(searchText.toLowerCase()) ||
    b.book?.author.toLowerCase().includes(searchText.toLowerCase()) ||
    b.user?.name.toLowerCase().includes(searchText.toLowerCase()) ||
    b.user?.email.toLowerCase().includes(searchText.toLowerCase())
  );

  // Sort borrows
  const sortedBorrows = [...filteredBorrows].sort((a, b) => {
    switch(sortOrder) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'name-az':
        return (a.user?.name || '').localeCompare(b.user?.name || '');
      default:
        return 0;
    }
  });
  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Borrow Requests</h1>
          <p className="page-subtitle">Review and manage student borrow requests</p>
        </div>
      </div>

      <div className="filter-tabs mb-6">
        {['all','pending','approved','rejected','returned'].map(f => (
          <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search books..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              fontSize: '0.95rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              padding: '0.75rem 1rem 0.75rem 2.75rem'
            }}
          />
          <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem', pointerEvents: 'none' }}>
            🔍
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="form-control"
            style={{
              width: 'auto',
              minWidth: '180px',
              fontSize: '0.95rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              padding: '0.75rem 2.5rem 0.75rem 1rem',
              cursor: 'pointer',
              appearance: 'none'
            }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name-az">Name A-Z</option>
          </select>
          <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', pointerEvents: 'none', color: 'var(--text-secondary)' }}>
            ▼
          </span>
        </div>
      </div>

      {loading ? <div className="spinner" /> : sortedBorrows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>{searchText ? `No borrow requests match "${searchText}"` : `No ${filter} requests found.`}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sortedBorrows.map(b => (
            <div key={b._id} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontWeight: 700, margin: '0 0 0.2rem' }}>{b.book?.title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>by {b.book?.author} &bull; ISBN: {b.book?.isbn || 'N/A'}</p>
                  </div>
                  <span className={`badge ${statusCls(b.status)}`}>{b.status}</span>
                </div>
                <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '0.6rem 0.9rem', marginBottom: '0.6rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <strong>👤 {b.user?.name}</strong> &bull; {b.user?.email} &bull; ID: {b.user?.studentId || 'N/A'}
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  <span>Requested: {new Date(b.createdAt).toLocaleDateString()}</span>
                  {b.dueDate && <span>Due: {new Date(b.dueDate).toLocaleDateString()}</span>}
                </div>
                {b.staffNote && <div className="alert alert-warning" style={{ marginBottom: '0.5rem' }}>Note: {b.staffNote}</div>}
                {b.status === 'pending' && (
                  <div style={{ marginTop: '0.75rem' }}>
                    {activeId === b._id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input className="form-control" style={{ flex: 1, minWidth: 200 }} placeholder="Optional note..." value={note} onChange={e => setNote(e.target.value)} />
                        <button className="btn btn-success btn-sm" onClick={() => handleAction(b._id, 'approve')}>✓ Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleAction(b._id, 'reject')}>✗ Reject</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setActiveId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => setActiveId(b._id)}>Review Request</button>
                    )}
                  </div>
                )}
                {b.status === 'approved' && (
                  <button className="btn btn-info btn-sm mt-3" onClick={() => handleAction(b._id, 'return')}>Mark as Returned</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BorrowRequests;
