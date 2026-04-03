import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const statusCls = (s) => ({ pending: 'badge-warning', reviewed: 'badge-info', resolved: 'badge-success' }[s] || 'badge-gray');
const severityBadge = (s) => ({ minor: 'badge-warning', moderate: 'badge-info', severe: 'badge-danger' }[s] || 'badge-gray');
const severityBorder = (s) => ({ minor: 'var(--warning)', moderate: '#f97316', severe: 'var(--danger)' }[s] || 'var(--border)');

const DamageManagement = () => {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ staffNote: '', status: 'reviewed' });
  const [activeId, setActiveId] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const { data } = await api.get('/damages', { params });
      setReports(data);
    } catch (err) { toast.error('Failed to load damage reports'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, [filter]);

  const handleReview = async (id) => {
    if (form.status === 'resolved' && !form.staffNote.trim())
      return toast.error('A staff note is required when resolving a report');
    if (form.staffNote.trim() && form.staffNote.trim().length < 5)
      return toast.error('Staff note must be at least 5 characters');
    try {
      await api.put(`/damages/${id}/review`, form);
      toast.success('Report reviewed'); setActiveId(null); fetchReports();
    } catch { toast.error('Review failed'); }
  };

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🛡️ Damage Reports</h1>
          <p className="page-subtitle">Review and resolve book damage reports submitted by students</p>
        </div>
      </div>

      <div className="filter-tabs mb-6">
        {['all', 'pending', 'reviewed', 'resolved'].map(f => (
          <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <div className="spinner" /> : reports.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">🛡️</div><p>No {filter} reports.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reports.map(r => (
            <div key={r._id} className="card" style={{ borderLeft: `4px solid ${severityBorder(r.severity)}` }}>
              <div className="card-body">
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontWeight: 700, margin: '0 0 0.2rem', fontSize: '1.05rem' }}>{r.bookTitle}</h3>
                    {r.bookIsbn && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>ISBN: {r.bookIsbn}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span className={`badge ${severityBadge(r.severity)}`} style={{ textTransform: 'capitalize' }}>{r.severity}</span>
                    <span className={`badge ${statusCls(r.status)}`}>{r.status}</span>
                  </div>
                </div>

                {/* Meta row: damage type, location, reporter */}
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', background: 'var(--gray-50)', borderRadius: 8, padding: '0.55rem 0.9rem' }}>
                  {r.damageType && <span>🔍 <strong>{r.damageType}</strong></span>}
                  {r.locationFound && <span>📍 {r.locationFound}</span>}
                  <span>👤 <strong>{r.reporterName}</strong>{r.reporterContact && ` · ${r.reporterContact}`}</span>
                  <span>📅 {new Date(r.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Reporter (account) */}
                {r.user && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                    Account: <strong>{r.user.name}</strong> ({r.user.email}){r.user.studentId && ` · ID: ${r.user.studentId}`}
                  </p>
                )}

                <p style={{ color: 'var(--text)', margin: '0.4rem 0 0.6rem', fontSize: '0.9rem', lineHeight: 1.5 }}>{r.description}</p>

                {r.photo && (
                  <a href={r.photo} target="_blank" rel="noreferrer">
                    <img src={r.photo} alt="Damage evidence" style={{ height: 140, borderRadius: 8, objectFit: 'cover', marginBottom: '0.6rem', display: 'block', cursor: 'zoom-in' }} />
                  </a>
                )}

                {r.staffNote && <div className="alert alert-warning mt-2"><strong>Staff Note:</strong> {r.staffNote}</div>}
                {r.reviewedBy && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Reviewed by {r.reviewedBy.name} · {r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString() : ''}</p>}

                {r.status !== 'resolved' && (
                  <div style={{ marginTop: '0.75rem' }}>
                    {activeId === r._id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                        <div className="form-row">
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Update Status</label>
                            <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                              <option value="reviewed">Reviewed</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Staff Note {form.status === 'resolved' && <span style={{ color: 'var(--danger)' }}>*</span>}</label>
                          <textarea className="form-control" placeholder="Add your findings or instructions..." value={form.staffNote} onChange={e => setForm({ ...form, staffNote: e.target.value })} rows={2} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-info btn-sm" onClick={() => handleReview(r._id)}>Submit Review</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setActiveId(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => { setActiveId(r._id); setForm({ staffNote: '', status: 'reviewed' }); }}>Review</button>
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

export default DamageManagement;
