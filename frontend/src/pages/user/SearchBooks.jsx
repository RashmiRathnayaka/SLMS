import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const SearchBooks = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('all');
  const [favourites, setFavourites] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const { data } = await api.get('/books', { params });
      setBooks(data);
      const cats = [...new Set(data.map(b => b.category))];
      setCategories(cats);
    } catch {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const fetchFavourites = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/books/favourites');
      setFavourites(data.map(b => b._id));
    } catch {}
  };

  useEffect(() => {
    fetchBooks();
    fetchFavourites();
  }, []);

  const handleSelectBook = async (book) => {
    if (selectedBook?._id === book._id) {
      setSelectedBook(null);
      setRelatedBooks([]);
      return;
    }
    setSelectedBook(book);
    setRelatedLoading(true);
    try {
      const { data } = await api.get(`/books/${book._id}/related`);
      setRelatedBooks(data);
    } catch {
      setRelatedBooks([]);
    } finally {
      setRelatedLoading(false);
    }
  };

  const handleBorrow = async (bookId) => {
    try {
      await api.post('/borrows', { bookId });
      toast.success('Borrow request submitted!');
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Borrow failed');
    }
  };

  const handleWaitingList = async (bookId) => {
    try {
      await api.post('/waiting', { bookId });
      toast.success('Added to waiting list!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join waiting list');
    }
  };

  const handleToggleFav = async (bookId) => {
    if (!user) return toast.error('Please login to favourite books');
    try {
      const { data } = await api.post(`/books/${bookId}/favourite`);
      const ids = data.favorites.map(String);
      setFavourites(ids);
      toast.success(ids.includes(bookId) ? '❤️ Added to favourites' : 'Removed from favourites');
    } catch {
      toast.error('Failed to update favourites');
    }
  };

  const displayBooks = tab === 'favourites'
    ? books.filter(b => favourites.includes(b._id))
    : books;

  const BookCard = ({ book }) => {
    const isFav = favourites.includes(book._id);
    return (
      <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 200, overflow: 'hidden', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {book.coverImage
            ? <img src={book.coverImage} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '3.5rem' }}>📖</span>}
          {user && (
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
          )}
        </div>
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.3 }}>{book.title}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>by {book.author}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <span className={`badge ${book.availableCopies > 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
              {book.availableCopies > 0 ? `✓ Available (${book.availableCopies})` : '✕ Unavailable'}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{book.category}</div>
          {book.isbn && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>Course ID: {book.isbn}</div>
          )}
          {user && (
            <div style={{ marginTop: 'auto', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {book.availableCopies > 0
                ? <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => handleBorrow(book._id)}>Borrow</button>
                : <button className="btn btn-warning btn-sm" style={{ width: '100%' }} onClick={() => handleWaitingList(book._id)}>⏳ Join Waiting List</button>}
         
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔍 Search Books</h1>
          <p className="page-subtitle">Browse and borrow from our collection</p>
        </div>
      </div>

      {user && (
        <div className="filter-tabs mb-6">
          <button className={`filter-tab${tab === 'all' ? ' active' : ''}`} onClick={() => setTab('all')}>📚 All Books</button>
          <button className={`filter-tab${tab === 'favourites' ? ' active' : ''}`} onClick={() => setTab('favourites')}>❤️ Favourites {favourites.length > 0 && `(${favourites.length})`}</button>
        </div>
      )}

      <div className="card mb-6">
        <div className="card-body">
          <div className="search-bar">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search by title, author, course code"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchBooks()}
              />
            </div>
            <select className="filter-select" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="btn btn-primary" onClick={fetchBooks}>Search</button>
          </div>
        </div>
      </div>

      {loading ? <div className="spinner" /> : displayBooks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{tab === 'favourites' ? '❤️' : '📚'}</div>
          <p>{tab === 'favourites' ? 'No favourite books yet. Click the ❤️ on any book to save it.' : 'No books found. Try a different search.'}</p>
          {tab === 'favourites' && <button className="btn btn-primary mt-3" onClick={() => setTab('all')}>Browse All Books</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {displayBooks.map(book => <BookCard key={book._id} book={book} />)}
        </div>
      )}

      {selectedBook && (
        <div className="card mt-6" style={{ borderTop: '3px solid var(--primary)' }}>
          <div className="card-body">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>
              🔗 Related Books — <span style={{ color: 'var(--text)' }}>{selectedBook.category}</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Books in the same category as <strong>{selectedBook.title}</strong>
              {selectedBook.isbn && <> — Course ID: <code style={{ fontSize: '0.78rem' }}>{selectedBook.isbn}</code></>}
            </p>
            {relatedLoading ? (
              <div className="spinner" />
            ) : relatedBooks.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem' }}>
                <div className="empty-state-icon">📚</div>
                <p>No other books found in the <strong>{selectedBook.category}</strong> category.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {relatedBooks.map(book => <BookCard key={book._id} book={book} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBooks;
