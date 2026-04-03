import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const statusCls = (s) => ({ open: 'badge-warning', replied: 'badge-success', closed: 'badge-gray' }[s] || 'badge-gray');

const Inquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [form, setForm]   = useState({ subject: '', message: '' });
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchInquiries = async () => {
    setLoading(true);
    try { const { data } = await api.get('/inquiries/my'); setInquiries(data); }
    catch { toast.error('Failed to load inquiries'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInquiries(); }, []);

  const validate = () => {
    const errs = {};
    if (!form.subject.trim()) errs.subject = 'Subject is required';
    else if (form.subject.trim().length < 5) errs.subject = 'Subject must be at least 5 characters';
    if (!form.message.trim()) errs.message = 'Message is required';
    else if (form.message.trim().length < 10) errs.message = 'Message must be at least 10 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      await api.post('/inquiries', form);
      toast.success('Inquiry submitted!');
      setForm({ subject: '', message: '' });
      fetchInquiries();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">💬 My Inquiries</h1>
          <p className="page-subtitle">Send questions to library staff</p>
        </div>
      </div>

      {/* New inquiry form */}
      <div className="card mb-6">
        <div className="card-header"><span className="card-title">Send New Inquiry</span></div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input className={`form-control${errors.subject ? ' is-invalid' : ''}`} value={form.subject} onChange={e => { setForm({ ...form, subject: e.target.value }); if (errors.subject) setErrors(p => ({ ...p, subject: '' })); }} placeholder="What is your question about?" />
              {errors.subject && <span className="form-error">{errors.subject}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea className={`form-control${errors.message ? ' is-invalid' : ''}`} rows={4} value={form.message} onChange={e => { setForm({ ...form, message: e.target.value }); if (errors.message) setErrors(p => ({ ...p, message: '' })); }} placeholder="Describe your inquiry in detail..." />
              {errors.message && <span className="form-error">{errors.message}</span>}
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Sending...' : 'Send Inquiry'}</button>
          </form>
        </div>
      </div>

      {/* Previous inquiries */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text)' }}>Previous Inquiries</h2>
      {loading ? <div className="spinner" /> : inquiries.length === 0
        ? <div className="empty-state"><div className="empty-state-icon">📧</div><p>No inquiries yet.</p></div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {inquiries.map(inq => (
              <div key={inq._id} className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>{inq.subject}</h3>
                    <span className={`badge ${statusCls(inq.status)}`}>{inq.status}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{inq.message}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sent: {new Date(inq.createdAt).toLocaleDateString()}</p>
                  {inq.reply && (
                    <div style={{ background: 'var(--success-bg)', border: '1px solid #6ee7b7', borderLeft: '4px solid var(--success)', borderRadius: 8, padding: '0.85rem 1rem', marginTop: '0.75rem' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.82rem', color: '#065f46', marginBottom: '0.4rem' }}>Staff Reply</p>
                      <p style={{ color: '#064e3b', fontSize: '0.875rem', margin: 0 }}>{inq.reply}</p>
                      {inq.repliedBy && <p style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.4rem', marginBottom: 0 }}>by {inq.repliedBy.name} &bull; {new Date(inq.repliedAt).toLocaleDateString()}</p>}
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

export default Inquiries;
