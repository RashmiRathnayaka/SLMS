import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const BOOK_CATEGORIES = ['Computing', 'Business', 'Engineering', 'Humanities and Sciences', 'Architecture', 'Other'];

const BookManagement = () => {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editBook, setEditBook] = useState(null);
  const [form, setForm] = useState({ title: '', author: '', isbn: '', category: '', description: '', totalCopies: 1, publisher: '', publishYear: '', language: 'English' });
  const [coverImage, setCoverImage] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const { data } = await api.get('/books', { params });
      setBooks(data);
    } catch (err) { toast.error('Failed to load books'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBooks(); }, []);

  const openCreate = () => {
    setForm({ title: '', author: '', isbn: '', category: '', description: '', totalCopies: 1, publisher: '', publishYear: '', language: 'English' });
    setCoverImage(null); setEditBook(null); setModal('create'); setErrors({});
  };

  const openEdit = (book) => {
    setForm({ title: book.title, author: book.author, isbn: book.isbn || '', category: book.category, description: book.description || '', totalCopies: book.totalCopies, publisher: book.publisher || '', publishYear: book.publishYear || '', language: book.language || 'English' });
    setEditBook(book); setModal('edit'); setErrors({});
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.author.trim()) errs.author = 'Author is required';
    if (!form.category.trim()) errs.category = 'Category is required';
    if (form.isbn) {
      const clean = form.isbn.trim();
      if (clean.length < 2 || clean.length > 30) errs.isbn = 'Course Code must be between 2 and 30 characters';
    }
    const copies = Number(form.totalCopies);
    if (!form.totalCopies || isNaN(copies) || copies < 1) errs.totalCopies = 'Total copies must be at least 1';
    else if (copies > 1000) errs.totalCopies = 'Total copies cannot exceed 1000';
    if (form.publishYear) {
      const yr = Number(form.publishYear);
      if (isNaN(yr) || yr < 1000 || yr > new Date().getFullYear()) errs.publishYear = `Year must be between 1000 and ${new Date().getFullYear()}`;
    }
    if (coverImage && coverImage.size > 5 * 1024 * 1024) errs.coverImage = 'Cover image must be smaller than 5 MB';
    return errs;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (coverImage) fd.append('coverImage', coverImage);
      if (editBook) { await api.put(`/books/${editBook._id}`, fd); toast.success('Book updated!'); }
      else { await api.post('/books', fd); toast.success('Book added!'); }
      setModal(null); fetchBooks();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this book?')) return;
    try { await api.delete(`/books/${id}`); toast.success('Book removed'); fetchBooks(); }
    catch { toast.error('Delete failed'); }
  };

  const handleCsvImport = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    const fd = new FormData(); fd.append('file', csvFile);
    try {
      const { data } = await api.post('/books/import/csv', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Imported ${data.imported} books. Errors: ${data.errors.length}`);
      setCsvFile(null); fetchBooks();
    } catch (err) { toast.error(err.response?.data?.message || 'Import failed'); }
  };

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📚 Book Management</h1>
          <p className="page-subtitle">Manage the library book catalog</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-success" onClick={openCreate}>+ Add Book</button>
          <label className="btn btn-info" style={{ cursor: 'pointer' }}>
            📥 Import CSV
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={e => setCsvFile(e.target.files[0])} />
          </label>
          {csvFile && <button className="btn btn-warning" onClick={handleCsvImport}>Upload CSV</button>}
        </div>
      </div>

      <div className="search-bar mb-6">
        <div className="search-input-wrap" style={{ flex: 1 }}>
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search by title, author or course code..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchBooks()} />
        </div>
        <select className="filter-select" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {BOOK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn btn-primary" onClick={fetchBooks}>Search</button>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Cover</th><th>Title</th><th>Author</th><th>Course ID</th><th>Category</th><th>Copies</th><th>Available</th><th>Actions</th></tr></thead>
            <tbody>
              {books.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No books found.</td></tr>
              ) : books.map(b => (
                <tr key={b._id}>
                  <td>{b.coverImage ? <img src={b.coverImage} alt="" style={{ width: 45, height: 55, objectFit: 'cover', borderRadius: 4 }} /> : <span style={{ fontSize: '1.5rem' }}>📖</span>}</td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{b.title}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{b.author}</td>
                  <td style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{b.isbn || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td><span className="chip">{b.category}</span></td>
                  <td style={{ textAlign: 'center' }}>{b.totalCopies}</td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: b.availableCopies > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{b.availableCopies}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button className="btn btn-warning btn-sm" onClick={() => openEdit(b)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">{modal === 'create' ? 'Add New Book' : 'Edit Book'}</h2>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave}>
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
                      {BOOK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.category && <span className="form-error">{errors.category}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Course Code</label>
                    <input className={`form-control${errors.isbn ? ' is-invalid' : ''}`} value={form.isbn} onChange={e => { setForm({ ...form, isbn: e.target.value }); if (errors.isbn) setErrors(p => ({ ...p, isbn: '' })); }} placeholder="IT1010 , BM1020" />
                    {errors.isbn && <span className="form-error">{errors.isbn}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Copies *</label>
                    <input className={`form-control${errors.totalCopies ? ' is-invalid' : ''}`} type="number" min="1" max="1000" value={form.totalCopies} onChange={e => { setForm({ ...form, totalCopies: e.target.value }); if (errors.totalCopies) setErrors(p => ({ ...p, totalCopies: '' })); }} />
                    {errors.totalCopies && <span className="form-error">{errors.totalCopies}</span>}
                  </div>
                  <div className="form-group"><label className="form-label">Publisher</label><input className="form-control" value={form.publisher} onChange={e => setForm({ ...form, publisher: e.target.value })} /></div>
                  <div className="form-group">
                    <label className="form-label">Publish Year</label>
                    <input className={`form-control${errors.publishYear ? ' is-invalid' : ''}`} type="number" value={form.publishYear} onChange={e => { setForm({ ...form, publishYear: e.target.value }); if (errors.publishYear) setErrors(p => ({ ...p, publishYear: '' })); }} placeholder="e.g. 2024" />
                    {errors.publishYear && <span className="form-error">{errors.publishYear}</span>}
                  </div>
                  <div className="form-group"><label className="form-label">Language</label><input className="form-control" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} /></div>
                </div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" style={{ minHeight: 70 }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <div className="form-group">
                  <label className="form-label">Cover Image</label>
                  <input type="file" accept="image/*" className={`form-control${errors.coverImage ? ' is-invalid' : ''}`} onChange={e => { setCoverImage(e.target.files[0]); if (errors.coverImage) setErrors(p => ({ ...p, coverImage: '' })); }} />
                  {errors.coverImage && <span className="form-error">{errors.coverImage}</span>}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Book'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookManagement;
