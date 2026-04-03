import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const EBOOK_CATEGORIES = ['Management', 'Engineering', 'Mathematics', 'Computer Science', 'IT'];

const EBookManagement = () => {
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', author: '', category: '', description: '', tags: '', publisher: '', publishYear: '', language: 'English' });
  const [coverFile, setCoverFile] = useState(null);
  const [ebookFile, setEbookFile] = useState(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('ebooks');
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchEBooks(); }, []);

  const fetchEBooks = async () => {
    try { setLoading(true); const { data } = await api.get('/ebooks'); setEbooks(data.ebooks || data); }
    catch { toast.error('Failed to load e-books'); }
    finally { setLoading(false); }
  };

  const fetchAnalytics = async () => {
    try { const { data } = await api.get('/ebooks/analytics'); setAnalytics(data); }
    catch { toast.error('Failed to load analytics'); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', author: '', category: '', description: '', tags: '', publisher: '', publishYear: '', language: 'English' });
    setCoverFile(null); setEbookFile(null); setShowModal(true); setErrors({});
  };

  const openEdit = (ebook) => {
    setEditing(ebook);
    setForm({ title: ebook.title, author: ebook.author, category: ebook.category, description: ebook.description || '', tags: (ebook.tags || []).join(', '), publisher: ebook.publisher || '', publishYear: ebook.publishYear || '', language: ebook.language || 'English' });
    setCoverFile(null); setEbookFile(null); setShowModal(true); setErrors({});
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.author.trim()) errs.author = 'Author is required';
    if (!form.category.trim()) errs.category = 'Category is required';
    if (!editing && !ebookFile) errs.ebookFile = 'A PDF file is required';
    if (ebookFile && ebookFile.size > 50 * 1024 * 1024) errs.ebookFile = 'PDF must be smaller than 50 MB';
    if (coverFile && coverFile.size > 5 * 1024 * 1024) errs.coverFile = 'Cover image must be smaller than 5 MB';
    if (form.publishYear) {
      const yr = Number(form.publishYear);
      if (isNaN(yr) || yr < 1000 || yr > new Date().getFullYear()) errs.publishYear = `Year must be between 1000 and ${new Date().getFullYear()}`;
    }
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (coverFile) fd.append('coverImage', coverFile);
    if (ebookFile) fd.append('file', ebookFile);
    try {
      setSaving(true);
      if (editing) { await api.put(`/ebooks/${editing._id}`, fd); toast.success('E-book updated'); }
      else { await api.post('/ebooks', fd); toast.success('E-book uploaded'); }
      setShowModal(false); fetchEBooks();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this e-book?')) return;
    try { await api.delete(`/ebooks/${id}`); toast.success('E-book deleted'); fetchEBooks(); }
    catch { toast.error('Delete failed'); }
  };

  const filtered = ebooks.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📖 E-Book Management</h1>
          <p className="page-subtitle">Manage the digital library collection</p>
        </div>
      </div>

      <div className="filter-tabs mb-6">
        {[['ebooks','📚 E-Books'],['analytics','📊 Analytics']].map(([t,label]) => (
          <button key={t} className={`filter-tab${activeTab === t ? ' active' : ''}`} onClick={() => { setActiveTab(t); if (t === 'analytics') fetchAnalytics(); }}>{label}</button>
        ))}
      </div>

      {activeTab === 'ebooks' && (
        <>
          <div className="search-bar mb-4">
            <div className="search-input-wrap" style={{ flex: 1 }}>
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Search title or author..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={openCreate}>+ Upload E-Book</button>
          </div>
          {loading ? <div className="spinner" /> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Cover</th><th>Title</th><th>Author</th><th>Category</th><th>Reads</th><th>Downloads</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No e-books found</td></tr>
                  ) : filtered.map(e => (
                    <tr key={e._id}>
                      <td>
                        {e.coverImage
                          ? <img src={e.coverImage} alt="" style={{ width: 40, height: 50, objectFit: 'cover', borderRadius: 4 }} onError={ev => ev.target.style.display = 'none'} />
                          : <span style={{ fontSize: '1.5rem' }}>📖</span>}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{e.title}</td>
                      <td>{e.author}</td>
                      <td><span className="chip">{e.category}</span></td>
                      <td>{e.readCount || 0}</td>
                      <td>{e.downloadCount || 0}</td>
                      <td><span className={`badge ${e.isActive ? 'badge-success' : 'badge-danger'}`}>{e.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        <button className="btn btn-warning btn-sm" style={{ marginRight: '0.4rem' }} onClick={() => openEdit(e)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'analytics' && analytics && (
        <div>
          <div className="stats-grid mb-6">
            {[
              { label: 'Total E-Books', value: analytics.totalEbooks, variant: 'primary' },
              { label: 'Total Reads (30d)', value: analytics.recentReads, variant: 'success' },
              { label: 'Total Downloads (30d)', value: analytics.recentDownloads, variant: 'info' },
              { label: 'Top Books', value: analytics.topRead?.length ?? 0, variant: 'warning' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className={`stat-icon stat-icon-${s.variant}`}>📊</div>
                <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Top Read E-Books</span></div>
            <div className="card-body">
              {analytics.topRead?.length > 0 ? (
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>#</th><th>Title</th><th>Author</th><th>Category</th><th>Reads</th><th>Downloads</th></tr></thead>
                    <tbody>
                      {analytics.topRead.map((e, i) => (
                        <tr key={e._id}>
                          <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{i + 1}</td>
                          <td style={{ fontWeight: 600 }}>{e.title}</td>
                          <td>{e.author}</td>
                          <td><span className="chip">{e.category}</span></td>
                          <td>{e.readCount}</td>
                          <td>{e.downloadCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p style={{ color: 'var(--text-muted)' }}>No data yet.</p>}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Edit E-Book' : 'Upload New E-Book'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input className={`form-control${errors.title ? ' is-invalid' : ''}`} value={form.title} onChange={e => { setForm({ ...form, title: e.target.value }); if (errors.title) setErrors(p => ({ ...p, title: '' })); }} />
                    {errors.title && <span className="form-error">{errors.title}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Author *</label>
                    <input className={`form-control${errors.author ? ' is-invalid' : ''}`} value={form.author} onChange={e => { setForm({ ...form, author: e.target.value }); if (errors.author) setErrors(p => ({ ...p, author: '' })); }} />
                    {errors.author && <span className="form-error">{errors.author}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className={`form-control${errors.category ? ' is-invalid' : ''}`} value={form.category} onChange={e => { setForm({ ...form, category: e.target.value }); if (errors.category) setErrors(p => ({ ...p, category: '' })); }}>
                      <option value="">Select category...</option>
                      {EBOOK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.category && <span className="form-error">{errors.category}</span>}
                  </div>
                  <div className="form-group"><label className="form-label">Publisher</label><input className="form-control" value={form.publisher} onChange={e => setForm({ ...form, publisher: e.target.value })} /></div>
                  <div className="form-group">
                    <label className="form-label">Publish Year</label>
                    <input className={`form-control${errors.publishYear ? ' is-invalid' : ''}`} type="number" value={form.publishYear} onChange={e => { setForm({ ...form, publishYear: e.target.value }); if (errors.publishYear) setErrors(p => ({ ...p, publishYear: '' })); }} placeholder="e.g. 2024" />
                    {errors.publishYear && <span className="form-error">{errors.publishYear}</span>}
                  </div>
                  <div className="form-group"><label className="form-label">Language</label><input className="form-control" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} /></div>
                </div>
                <div className="form-group"><label className="form-label">Tags (comma separated)</label><input className="form-control" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="science, research" /></div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">PDF File {!editing && '*'}</label>
                    <input type="file" accept=".pdf" className={`form-control${errors.ebookFile ? ' is-invalid' : ''}`} onChange={e => { setEbookFile(e.target.files[0]); if (errors.ebookFile) setErrors(p => ({ ...p, ebookFile: '' })); }} />
                    {errors.ebookFile && <span className="form-error">{errors.ebookFile}</span>}
                    {editing?.filePath && <small style={{ color: 'var(--text-muted)' }}>Current: {editing.filePath.split('/').pop()}</small>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cover Image</label>
                    <input type="file" accept="image/*" className={`form-control${errors.coverFile ? ' is-invalid' : ''}`} onChange={e => { setCoverFile(e.target.files[0]); if (errors.coverFile) setErrors(p => ({ ...p, coverFile: '' })); }} />
                    {errors.coverFile && <span className="form-error">{errors.coverFile}</span>}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Upload'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EBookManagement;
