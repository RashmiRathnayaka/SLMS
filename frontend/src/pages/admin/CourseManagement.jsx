import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', department: '', keywords: '' });
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try { setLoading(true); const { data } = await api.get('/courses'); setCourses(data); }
    catch { toast.error('Failed to load courses'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '', description: '', department: '', keywords: '' });
    setShowModal(true); setErrors({});
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, code: c.code, description: c.description || '', department: c.department || '', keywords: (c.keywords || []).join(', ') });
    setShowModal(true); setErrors({});
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Course name is required';
    else if (form.name.trim().length < 3) errs.name = 'Course name must be at least 3 characters';
    if (!form.code.trim()) errs.code = 'Course code is required';
    else if (!/^[A-Za-z0-9]{2,10}$/.test(form.code.trim())) errs.code = 'Code must be 2–10 alphanumeric characters (e.g. CS301)';
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    const payload = { ...form, keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean) };
    try {
      setSaving(true);
      if (editing) { await api.put(`/courses/${editing._id}`, payload); toast.success('Course updated'); }
      else { await api.post('/courses', payload); toast.success('Course created'); }
      setShowModal(false); fetchCourses();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this course?')) return;
    try { await api.delete(`/courses/${id}`); toast.success('Course deleted'); fetchCourses(); }
    catch { toast.error('Delete failed'); }
  };

  const filtered = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.department || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🎓 Course Management</h1>
          <p className="page-subtitle">Manage academic courses and their book recommendations</p>
        </div>
      </div>

      <div className="search-bar mb-6">
        <div className="search-input-wrap" style={{ flex: 1 }}>
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search course name, code, or department..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Course</button>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Code</th><th>Name</th><th>Department</th><th>Keywords</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No courses found</td></tr>
              ) : filtered.map(c => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{c.code}</td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.department || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {(c.keywords || []).slice(0, 4).map((k, i) => <span key={i} className="chip">{k}</span>)}
                      {(c.keywords || []).length > 4 && <span className="chip">+{c.keywords.length - 4}</span>}
                    </div>
                  </td>
                  <td><span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-warning btn-sm" onClick={() => openEdit(c)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Edit Course' : 'Add New Course'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Course Name *</label>
                    <input className={`form-control${errors.name ? ' is-invalid' : ''}`} value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors(p => ({ ...p, name: '' })); }} />
                    {errors.name && <span className="form-error">{errors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Course Code *</label>
                    <input className={`form-control${errors.code ? ' is-invalid' : ''}`} value={form.code} onChange={e => { setForm({ ...form, code: e.target.value }); if (errors.code) setErrors(p => ({ ...p, code: '' })); }} placeholder="e.g. CS301" />
                    {errors.code && <span className="form-error">{errors.code}</span>}
                  </div>
                  <div className="form-group"><label className="form-label">Department</label><input className="form-control" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Keywords (comma separated)</label><input className="form-control" value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} placeholder="algorithms, data structures" /></div>
                </div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
