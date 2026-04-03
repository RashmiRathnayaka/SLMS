import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const statusBadge = (status) => {
  if (status === 'notified') return <span className="badge badge-warning">Notified</span>;
  return <span className="badge badge-secondary">Waiting</span>;
};

const WaitingListManagement = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/waiting/all');
      setEntries(data);
    } catch {
      toast.error('Failed to load waiting list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this entry from the waiting list?')) return;
    try {
      await api.delete(`/waiting/admin/${id}`);
      toast.success('Entry removed');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove entry');
    }
  };

  const filtered = entries.filter(e =>
    (e.book?.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.user?.studentId || '').toLowerCase().includes(search.toLowerCase())
  );

  // Group by book for summary
  const byBook = filtered.reduce((acc, e) => {
    const bookId = e.book?._id || 'unknown';
    if (!acc[bookId]) acc[bookId] = { book: e.book, entries: [] };
    acc[bookId].entries.push(e);
    return acc;
  }, {});

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">⏳ Waiting List Management</h1>
          <p className="page-subtitle">View and manage students waiting for books</p>
        </div>
      </div>

      {/* How it works info box */}
      <div className="card mb-6" style={{ borderLeft: '4px solid var(--primary)', background: 'var(--primary-bg)' }}>
        <div className="card-body" style={{ padding: '1rem 1.25rem' }}>
          <p style={{ fontWeight: 700, marginBottom: '0.4rem', color: 'var(--primary)' }}>ℹ️ How the Waiting List Works</p>
          <ol style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>
            <li>Student joins the waiting list when a book has no available copies.</li>
            <li>When a book is returned and marked as returned by staff, the system automatically notifies the next person in the queue.</li>
            <li>The notified student has <strong>24 hours</strong> to click <em>"Claim Now"</em> — this creates a borrow request.</li>
            <li>Staff/admin then approves the borrow request as normal.</li>
            <li>If the student does not claim within 24 hours, the slot passes to the next person automatically.</li>
          </ol>
        </div>
      </div>

      <div className="search-bar mb-6">
        <div className="search-input-wrap" style={{ flex: 1 }}>
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search by book title, student name, or ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-secondary" onClick={fetchAll}>↻ Refresh</button>
      </div>

      {loading ? <div className="spinner" /> : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <p>{search ? 'No results match your search.' : 'No active waiting list entries.'}</p>
        </div>
      ) : (
        Object.values(byBook).map(({ book, entries: bookEntries }) => (
          <div key={book?._id} className="card mb-6">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📚</span>
              <div>
                <span className="card-title">{book?.title || 'Unknown Book'}</span>
                <span style={{ marginLeft: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>by {book?.author || '—'}</span>
              </div>
              <span className="badge badge-primary" style={{ marginLeft: 'auto' }}>{bookEntries.length} in queue</span>
            </div>
            <div className="table-wrapper" style={{ marginBottom: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Student ID</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Claim Deadline</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookEntries.map((entry, i) => {
                    const deadline = entry.claimDeadline ? new Date(entry.claimDeadline) : null;
                    const expired = deadline && deadline < new Date();
                    return (
                      <tr key={entry._id}>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{entry.position ?? i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{entry.user?.name || '—'}</td>
                        <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{entry.user?.studentId || '—'}</td>
                        <td>{statusBadge(entry.status)}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(entry.joinedAt).toLocaleDateString()}</td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {deadline
                            ? <span style={{ color: expired ? '#ef4444' : '#22c55e' }}>{deadline.toLocaleString()}{expired ? ' ⚠ Expired' : ''}</span>
                            : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => handleRemove(entry._id)}>Remove</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default WaitingListManagement;
