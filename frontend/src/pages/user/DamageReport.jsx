import React, { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const LOCATIONS = ['Reading Room', 'Shelf A', 'Shelf B', 'Shelf C', 'Shelf D', 'Shelf E', 'Shelf F', 'Study Hall', 'Return Counter', 'Other'];
const DAMAGE_TYPES = ['Torn Pages', 'Water Damage', 'Missing Pages', 'Broken Spine', 'Cover Damage', 'Writing / Marks', 'Mold / Stain', 'Other'];
const SEVERITY = [
  { value: 'minor',    label: 'Minor',    dot: '#f59e0b', activeBorder: '#10b981', activeBg: '#f0fdf4', activeColor: '#059669' },
  { value: 'moderate', label: 'Moderate', dot: '#f97316', activeBorder: '#f97316', activeBg: '#fff7ed', activeColor: '#c2410c' },
  { value: 'severe',   label: 'Severe',   dot: '#ef4444', activeBorder: '#ef4444', activeBg: '#fef2f2', activeColor: '#b91c1c' },
];

const statusCls = (s) => ({ pending: 'badge-warning', reviewed: 'badge-info', resolved: 'badge-success' }[s] || 'badge-gray');
const severityBadge = (s) => ({ minor: 'badge-warning', moderate: 'badge-info', severe: 'badge-danger' }[s] || 'badge-gray');

const DamageReport = () => {
  const { user } = useAuth();
  const fileRef = useRef();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState('form');
  const [dragOver, setDragOver] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [form, setForm] = useState({
    bookTitle: '', bookIsbn: '', reporterName: '', reporterContact: '',
    locationFound: '', damageType: '', severity: 'minor', description: '',
  });

  useEffect(() => {
    if (user) setForm(f => ({ ...f, reporterName: user.name || '', reporterContact: user.email || '' }));
    fetchReports();
    fetchBorrowedBooks();
  }, [user]);

  const fetchBorrowedBooks = async () => {
    try {
      const { data } = await api.get('/borrows/my');
      // Only show books with approved status (in the student's possession)
      const active = data.filter(b => b.status === 'approved' && b.book);
      setBorrowedBooks(active);
    } catch {}
  };

  const fetchReports = async () => {
    try { const { data } = await api.get('/damages/my'); setReports(data); }
    catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  const sf = (k, v) => { setForm(f => ({ ...f, [k]: v })); if (errors[k]) setErrors(p => ({ ...p, [k]: '' })); };

  const validate = () => {
    const errs = {};
    if (!form.bookTitle.trim()) errs.bookTitle = 'Book title is required';
    if (!form.reporterName.trim()) errs.reporterName = 'Your name is required';
    if (!form.damageType) errs.damageType = 'Please select a damage type';
    if (!form.description.trim()) errs.description = 'Description is required';
    else if (form.description.trim().length < 20) errs.description = 'Please describe the damage in at least 20 characters';
    if (photo && photo.size > 10 * 1024 * 1024) errs.photo = 'Image must be smaller than 10 MB';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append('photo', photo);
      await api.post('/damages', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Damage report submitted successfully!');
      setForm({ bookTitle: '', bookIsbn: '', reporterName: user?.name || '', reporterContact: user?.email || '', locationFound: '', damageType: '', severity: 'minor', description: '' });
      setPhoto(null);
      await fetchReports();
      setView('history');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) { setPhoto(file); if (errors.photo) setErrors(p => ({ ...p, photo: '' })); }
  };

  const labelStyle = { fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' };
  const sectionHeader = (icon, title) => (
    <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
      <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
        <span>{icon}</span> {title}
      </span>
    </div>
  );

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🛡️ Book Damage Report</h1>
          <p className="page-subtitle">Found a damaged book? Report it to help us maintain our collection.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={`btn ${view === 'form' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('form')}>+ New Report</button>
          <button className={`btn ${view === 'history' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('history')}>My Reports ({reports.length})</button>
        </div>
      </div>

      {view === 'form' && (
        <form onSubmit={handleSubmit}>
          {/* ── Book Information ── */}
          <div className="card mb-6">
            <div className="card-body">
              {sectionHeader('📋', 'Book Information')}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" style={labelStyle}>Book Title *</label>
                  {borrowedBooks.length === 0 ? (
                    <div style={{ padding: '0.6rem 0.9rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: 'var(--text-muted)', background: 'var(--surface)' }}>
                      No currently borrowed books found.
                    </div>
                  ) : (
                    <select
                      className={`form-control${errors.bookTitle ? ' is-invalid' : ''}`}
                      value={form.bookTitle}
                      onChange={e => {
                        const selected = borrowedBooks.find(b => b.book.title === e.target.value);
                        setForm(f => ({
                          ...f,
                          bookTitle: e.target.value,
                          bookIsbn: selected?.book?.isbn || '',
                        }));
                        if (errors.bookTitle) setErrors(p => ({ ...p, bookTitle: '' }));
                      }}
                    >
                      <option value="">-- Select a borrowed book --</option>
                      {borrowedBooks.map(b => (
                        <option key={b._id} value={b.book.title}>
                          {b.book.title}{b.book.isbn ? ` (${b.book.isbn})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.bookTitle && <span className="form-error">{errors.bookTitle}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" style={labelStyle}>Book ID / ISBN</label>
                  <input className="form-control" value={form.bookIsbn} readOnly placeholder="Auto-filled when book is selected" style={{ background: 'var(--gray-50)', cursor: 'default' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={labelStyle}>Your Name *</label>
                  <input className={`form-control${errors.reporterName ? ' is-invalid' : ''}`} value={form.reporterName} onChange={e => sf('reporterName', e.target.value)} placeholder="e.g. Kamal Perera" />
                  {errors.reporterName && <span className="form-error">{errors.reporterName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" style={labelStyle}>Contact (Email / Phone)</label>
                  <input className="form-control" value={form.reporterContact} onChange={e => sf('reporterContact', e.target.value)} placeholder="e.g. kamal@example.com" />
                </div>
                <div className="form-group">
                  <label className="form-label" style={labelStyle}>Location Found</label>
                  <select className="form-control" value={form.locationFound} onChange={e => sf('locationFound', e.target.value)}>
                    <option value="">-- Select shelf / area --</option>
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={labelStyle}>Damage Type *</label>
                  <select className={`form-control${errors.damageType ? ' is-invalid' : ''}`} value={form.damageType} onChange={e => sf('damageType', e.target.value)}>
                    <option value="">-- Select damage type --</option>
                    {DAMAGE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.damageType && <span className="form-error">{errors.damageType}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* ── Damage Severity ── */}
          <div className="card mb-6">
            <div className="card-body">
              {sectionHeader('⚠️', 'Damage Severity')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
                {SEVERITY.map(s => {
                  const active = form.severity === s.value;
                  return (
                    <button type="button" key={s.value} onClick={() => sf('severity', s.value)} style={{
                      padding: '1.5rem 1rem', borderRadius: 'var(--radius)',
                      border: `2px solid ${active ? s.activeBorder : 'var(--border)'}`,
                      background: active ? s.activeBg : 'var(--surface)',
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
                      transition: 'all 0.15s',
                    }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: s.dot, boxShadow: active ? `0 0 12px ${s.dot}80` : 'none', transition: 'all 0.15s' }} />
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: active ? s.activeColor : 'var(--text)' }}>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Photo Evidence ── */}
          <div className="card mb-6">
            <div className="card-body">
              {sectionHeader('📷', 'Photo Evidence')}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current.click()}
                style={{
                  border: `2px dashed ${dragOver ? 'var(--primary)' : errors.photo ? 'var(--danger)' : '#cbd5e1'}`,
                  borderRadius: 'var(--radius)', padding: '3rem 1rem', textAlign: 'center', cursor: 'pointer',
                  background: dragOver ? 'var(--primary-bg)' : '#f8fafc', transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                }}
              >
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { setPhoto(e.target.files[0]); if (errors.photo) setErrors(p => ({ ...p, photo: '' })); }} />
                {photo ? (
                  <>
                    <img src={URL.createObjectURL(photo)} alt="Preview" style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 8, objectFit: 'cover' }} />
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>{photo.name}</p>
                    <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: '0.25rem' }} onClick={e => { e.stopPropagation(); setPhoto(null); }}>Remove</button>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '2.5rem' }}>✨📷</span>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text)' }}>
                      <strong style={{ color: 'var(--primary)' }}>Click to upload</strong> or drag &amp; drop a photo
                    </p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>PNG, JPG up to 10MB</p>
                  </>
                )}
              </div>
              {errors.photo && <span className="form-error" style={{ marginTop: '0.4rem', display: 'block' }}>{errors.photo}</span>}
            </div>
          </div>

          {/* ── Description ── */}
          <div className="card mb-6">
            <div className="card-body">
              {sectionHeader('📝', 'Description')}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={labelStyle}>Describe the damage in detail *</label>
                <textarea className={`form-control${errors.description ? ' is-invalid' : ''}`} rows={5} value={form.description}
                  onChange={e => sf('description', e.target.value)}
                  placeholder="Explain the nature of the damage, when you found it, and any other relevant details..."
                  style={{ minHeight: 120 }} />
                {errors.description && <span className="form-error">{errors.description}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
            <button className="btn btn-primary btn-lg" type="submit" disabled={submitting} style={{ minWidth: 220, fontSize: '1rem' }}>
              {submitting ? 'Submitting...' : 'Submit Damage Report'}
            </button>
          </div>
        </form>
      )}

      {view === 'history' && (
        <>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text)' }}>My Damage Reports</h2>
          {loading ? <div className="spinner" /> : reports.length === 0
            ? <div className="empty-state"><div className="empty-state-icon">🛡️</div><p>No damage reports yet.</p><button className="btn btn-primary mt-3" onClick={() => setView('form')}>Make a Report</button></div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reports.map(r => {
                  const sevColors = { minor: 'var(--warning)', moderate: '#f97316', severe: 'var(--danger)' };
                  return (
                    <div key={r._id} className="card" style={{ borderLeft: `4px solid ${sevColors[r.severity] || 'var(--danger)'}` }}>
                      <div className="card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div>
                            <h3 style={{ fontWeight: 700, margin: '0 0 0.2rem' }}>{r.bookTitle}</h3>
                            {r.bookIsbn && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>ISBN: {r.bookIsbn}</p>}
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <span className={`badge ${severityBadge(r.severity)}`} style={{ textTransform: 'capitalize' }}>{r.severity}</span>
                            <span className={`badge ${statusCls(r.status)}`}>{r.status}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          {r.damageType && <span>🔍 {r.damageType}</span>}
                          {r.locationFound && <span>📍 {r.locationFound}</span>}
                          <span>📅 {new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p style={{ color: 'var(--text)', fontSize: '0.875rem', margin: '0.4rem 0' }}>{r.description}</p>
                        {r.photo && <img src={r.photo} alt="Damage" style={{ height: 140, borderRadius: 8, objectFit: 'cover', marginTop: '0.5rem' }} />}
                        {r.staffNote && (
                          <div className="alert alert-warning mt-3"><strong>Staff Note:</strong> {r.staffNote}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </>
      )}
    </div>
  );
};

export default DamageReport;
