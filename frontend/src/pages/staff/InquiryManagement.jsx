import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const statusCls = (s) => ({ open: 'badge-warning', replied: 'badge-success', closed: 'badge-gray' }[s] || 'badge-gray');

const InquiryManagement = () => {
  const [inquiries, setInquiries] = useState([]);
  const [filter, setFilter] = useState('open');
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [activeId, setActiveId] = useState(null);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const { data } = await api.get('/inquiries', { params });
      setInquiries(data);
    } catch (err) { toast.error('Failed to load inquiries'); }
    finally { setLoading(false); }
  };

  
  useEffect(() => { fetchInquiries(); }, [filter]);

  const handleReply = async (id) => {
    if (!replyText.trim()) return toast.error('Reply cannot be empty');
    if (replyText.trim().length < 10) return toast.error('Reply must be at least 10 characters');
    try {
      await api.put(`/inquiries/${id}/reply`, { reply: replyText });
      toast.success('Reply sent!'); setReplyText(''); setActiveId(null); fetchInquiries();
    } catch { toast.error('Failed to send reply'); }
  };

  const handleClose = async (id) => {
    try { await api.put(`/inquiries/${id}/close`); toast.success('Inquiry closed'); fetchInquiries(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📧 Inquiry Management</h1>
          <p className="page-subtitle">Respond to student questions and requests</p>
        </div>
      </div>

      <div className="filter-tabs mb-6">
        {['all','open','replied','closed'].map(f => (
          <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <div className="spinner" /> : inquiries.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">📧</div><p>No {filter} inquiries.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {inquiries.map(inq => (
            <div key={inq._id} className="card" style={{ borderLeft: `4px solid ${inq.status === 'open' ? 'var(--warning)' : inq.status === 'replied' ? 'var(--success)' : 'var(--gray-300)'}` }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontWeight: 700, margin: '0 0 0.2rem' }}>{inq.subject}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>From: <strong>{inq.user?.name}</strong> ({inq.user?.email})</p>
                  </div>
                  <span className={`badge ${statusCls(inq.status)}`}>{inq.status}</span>
                </div>
                <p style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>{inq.message}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Received: {new Date(inq.createdAt).toLocaleDateString()}</p>
                {inq.reply && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderLeft: '4px solid var(--success)', borderRadius: 8, padding: '0.75rem 1rem', margin: '0.75rem 0' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.82rem', color: '#15803d', marginBottom: '0.3rem' }}>Your Reply</p>
                    <p style={{ color: '#166534', margin: 0 }}>{inq.reply}</p>
                    {inq.repliedAt && <p style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.3rem', marginBottom: 0 }}>Sent: {new Date(inq.repliedAt).toLocaleDateString()}</p>}
                  </div>
                )}
                {inq.status !== 'closed' && (
                  <div style={{ marginTop: '0.75rem' }}>
                    {activeId === inq._id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <textarea className="form-control" placeholder="Write your reply..." value={replyText} onChange={e => setReplyText(e.target.value)} rows={3} />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-success btn-sm" onClick={() => handleReply(inq._id)}>Send Reply</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setActiveId(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => { setActiveId(inq._id); setReplyText(''); }}>
                          {inq.reply ? 'Update Reply' : 'Reply'}
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleClose(inq._id)}>Close</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InquiryManagement;
