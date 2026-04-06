import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const Recommendations = () => {
  const { user } = useAuth();
  const [recs, setRecs] = useState({ type: null, books: [], categories: [], courses: [] });
  const [loading, setLoading] = useState(true);
  const [favourites, setFavourites] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [recRes, favRes] = await Promise.all([
          api.get('/recommendations'),
          api.get('/books/favourites'),
        ]);
        setRecs(recRes.data);
        setFavourites(favRes.data.map(b => b._id));
      } catch {
        toast.error('Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);
  

  const handleBorrow = async (bookId) => {
    try {
      await api.post('/borrows', { bookId });
      toast.success('Borrow request submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Borrow failed');
    }
  };

  const handleWaiting = async (bookId) => {
    try {
      await api.post('/waiting', { bookId });
      toast.success('Added to waiting list!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join waiting list');
    }
  };

  const handleToggleFav = async (bookId) => {
    try {
      const { data } = await api.post(`/books/${bookId}/favourite`);
      const ids = data.favorites.map(String);
      setFavourites(ids);
      toast.success(ids.includes(bookId) ? '❤️ Added to favourites' : 'Removed from favourites');
    } catch {
      toast.error('Failed to update favourites');
    }
  };

  const isPersonalised = recs.type === 'personalised';

  // Derive unique categories from the loaded book list
  const bookCategories = [...new Set(recs.books.map(b => b.category).filter(Boolean))].sort();

  // Client-side filter
  const q = search.trim().toLowerCase();
  const displayBooks = recs.books.filter(book => {
    const matchesSearch = !q || [book.title, book.author, book.isbn, book.category]
      .some(field => field && field.toLowerCase().includes(q));
    const matchesCategory = !categoryFilter || book.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="page-wrapper fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isPersonalised ? '✨ Recommended For You' : '🔥 Popular Books'}
          </h1>
          <p className="page-subtitle">
            {isPersonalised
              ? 'Personalised picks based on your enrolled courses and reading history'
              : 'Top books across the library — enrol in courses or borrow books to get personalised picks!'}
          </p>
        </div>
        <Link to="/books" className="btn btn-secondary">Browse All Books</Link>
      </div>

      {/* Personalisation signals card */}
      {isPersonalised && (recs.categories.length > 0 || recs.courses.length > 0) && (
        <div className="card mb-6">
          <div className="card-body" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recs.courses.length > 0 && (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                  🎓 Based on your enrolled courses:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {recs.courses.map(course => (
                    <span
                      key={course}
                      className="chip"
                      style={{ background: 'var(--primary)', color: '#fff', fontWeight: 600, fontSize: '0.8rem' }}
                    >
                      {course}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {recs.categories.length > 0 && (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                  📂 Based on your reading history in:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {recs.categories.map(cat => (
                    <span
                      key={cat}
                      className="chip"
                      style={{ background: 'var(--success)', color: '#fff', fontWeight: 600, fontSize: '0.8rem' }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="spinner" />
      ) : recs.books.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <p>No recommendations yet. Start borrowing books to get personalised picks!</p>
          <Link to="/books" className="btn btn-primary mt-3">Browse Books</Link>
        </div>
      ) : (
        <>
          {/* Search bar */}
          <div className="card mb-6">
            <div className="card-body">
              <div className="search-bar">
                <div className="search-input-wrap">
                  <span className="search-icon">🔍</span>
                  <input
                    className="search-input"
                    placeholder="Search by title, author, ISBN or course code..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', padding: '0 0.5rem' }}
                      title="Clear search"
                    >✕</button>
                  )}
                </div>
                <select
                  className="filter-select"
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {bookCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {(search || categoryFilter) && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.6rem' }}>
                  Showing {displayBooks.length} of {recs.books.length} recommended books
                  {categoryFilter && <> in <strong>{categoryFilter}</strong></>}
                  {search && <> matching &ldquo;<strong>{search}</strong>&rdquo;</>}
                  &nbsp;&mdash;&nbsp;
                  <button onClick={() => { setSearch(''); setCategoryFilter(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', padding: 0, fontWeight: 600 }}>Clear filters</button>
                </p>
              )}
            </div>
          </div>

          {displayBooks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <p>No recommended books match your search. <button onClick={() => { setSearch(''); setCategoryFilter(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: 'inherit' }}>Clear filters</button></p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {displayBooks.map(book => {
            const isFav = favourites.includes(book._id);
            return (
              <div key={book._id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Cover with heart button */}
                <div style={{ height: 200, overflow: 'hidden', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {book.coverImage
                    ? <img src={book.coverImage} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '3.5rem' }}>📖</span>}
                  {/* Personalised badge */}
                  {isPersonalised && (
                    <span style={{
                      position: 'absolute', top: 8, left: 8,
                      background: 'rgba(79,70,229,0.9)', color: '#fff',
                      fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.45rem',
                      borderRadius: 4, letterSpacing: '0.02em',
                    }}>✨ FOR YOU</span>
                  )}
                  {/* Favourite heart */}
                  <button
                    onClick={() => handleToggleFav(book._id)}
                    title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%',
                      width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', fontSize: '1.1rem', boxShadow: '0 1px 6px rgba(0,0,0,0.15)',
                      color: isFav ? '#ef4444' : '#94a3b8', transition: 'all 0.15s',
                    }}
                  >
                    {isFav ? '❤️' : '🤍'}
                  </button>
                </div>

                {/* Info */}
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.3 }}>{book.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>by {book.author}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📂 {book.category}</div>
                  {book.isbn && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ISBN: {book.isbn}</div>
                  )}
                  <span
                    className={`badge ${book.availableCopies > 0 ? 'badge-success' : 'badge-warning'}`}
                    style={{ fontSize: '0.68rem', width: 'fit-content', marginTop: '0.15rem' }}
                  >
                    {book.availableCopies > 0 ? `✓ Available (${book.availableCopies})` : '⏳ Waiting list'}
                  </span>

                  {/* Action button */}
                  <div style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
                    {book.availableCopies > 0
                      ? <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => handleBorrow(book._id)}>Borrow</button>
                      : <button className="btn btn-warning btn-sm" style={{ width: '100%' }} onClick={() => handleWaiting(book._id)}>⏳ Join Waiting List</button>}
                  </div>
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

export default Recommendations;
