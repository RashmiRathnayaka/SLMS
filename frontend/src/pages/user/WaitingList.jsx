import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-toastify';

// Live countdown hook — returns remaining time string or null
const useCountdown = (deadline) => {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const diff = new Date(deadline) - Date.now();
      if (diff <= 0) { setRemaining('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  return remaining;
};

const CountdownBadge = ({ deadline }) => {
  const remaining = useCountdown(deadline);
  if (!remaining) return null;
  const isExpired = remaining === 'Expired';
  const diff = new Date(deadline) - Date.now();
  const isUrgent = diff < 3 * 3600000; // < 3 hours left
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      padding: '0.4rem 0.8rem', borderRadius: 'var(--radius)',
      background: isExpired ? 'var(--danger)' : isUrgent ? '#fff7ed' : '#f0fdf4',
      border: `1px solid ${isExpired ? 'var(--danger)' : isUrgent ? '#f97316' : '#10b981'}`,
      color: isExpired ? '#fff' : isUrgent ? '#c2410c' : '#059669',
      fontSize: '0.8rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
    }}>
      <span>{isExpired ? '⛔' : isUrgent ? '⚠️' : '⏱️'}</span>
      <span>{isExpired ? 'Window expired' : `Claim in ${remaining}`}</span>
    </div>
  );
};


const WaitingList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const navigate = useNavigate();

  const fetchList = async () => {
    setLoading(true);
    try { const { data } = await api.get('/waiting/my'); setList(data); }
    catch { toast.error('Failed to load waiting list'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchList(); }, []);

  const handleCancel = async (id) => {
    if (!confirm('Remove yourself from this waiting list?')) return;
    try { await api.delete(`/waiting/${id}`); toast.success('Removed'); fetchList(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleClaim = async (id) => {
    setClaiming(id);
    try {
      const { data } = await api.post(`/waiting/${id}/claim`);
      toast.success(data.message || 'Book claimed! Visit My Borrows to see it.');
      navigate('/my-borrows');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim book');
      fetchList(); // refresh to show updated state
    } finally {
      setClaiming(null);
    }
  };

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🕐 My Waiting List</h1>
          <p className="page-subtitle">You'll be notified when a book becomes available — you'll have 24 hours to claim it</p>
        </div>
      </div>

      {loading ? <div className="spinner" /> : list.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>You're not on any waiting lists.</p>
          <Link to="/books" className="btn btn-primary mt-4">Browse Books</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {list.map(item => {
            const isNotified = item.status === 'notified';
            const isExpired = item.claimDeadline && new Date(item.claimDeadline) < Date.now();
            return (
              <div key={item._id} className="card" style={{
                borderLeft: `4px solid ${isNotified && !isExpired ? 'var(--success)' : isExpired ? 'var(--danger)' : 'var(--border)'}`,
              }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 0.25rem' }}>{item.book?.title}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 0.5rem' }}>
                        by {item.book?.author} &bull; {item.book?.category}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                        Joined: {new Date(item.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.6rem' }}>
                      <span className={`badge ${isNotified ? 'badge-success' : 'badge-warning'}`} style={{ textTransform: 'capitalize' }}>
                        {isNotified ? '🔔 Book Available!' : `Queue #${item.position}`}
                      </span>
                      {isNotified && item.claimDeadline && (
                        <CountdownBadge deadline={item.claimDeadline} />
                      )}
                    </div>
                  </div>

                  {isNotified && (
                    <div style={{
                      marginTop: '1rem', padding: '0.85rem 1rem', borderRadius: 'var(--radius)',
                      background: isExpired ? '#fef2f2' : '#f0fdf4',
                      border: `1px solid ${isExpired ? '#fca5a5' : '#86efac'}`,
                    }}>
                      {isExpired ? (
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 600 }}>
                          ⛔ Your 24-hour claim window has expired. The book will be offered to the next person.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#065f46', fontWeight: 500 }}>
                            🎉 It's your turn! Claim this book before the window closes.
                          </p>
                          <button
                            className="btn btn-success"
                            style={{ minWidth: 130, fontWeight: 700 }}
                            disabled={claiming === item._id}
                            onClick={() => handleClaim(item._id)}
                          >
                            {claiming === item._id ? 'Claiming…' : '✅ Claim Now'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-danger btn-sm" onClick={() => handleCancel(item._id)}>
                      {isNotified ? 'Pass / Cancel' : 'Cancel'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WaitingList;
