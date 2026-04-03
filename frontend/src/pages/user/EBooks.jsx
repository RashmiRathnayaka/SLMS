import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const rankStyle = (i) => [
  { background: 'linear-gradient(135deg,#ffd700,#ffb300)', color: '#333' },
  { background: 'linear-gradient(135deg,#c0c0c0,#9e9e9e)', color: '#fff' },
  { background: 'linear-gradient(135deg,#cd7f32,#a0522d)', color: '#fff' },
][i] || { background: 'var(--border)', color: 'var(--text-secondary)' };

const EBooks = () => {
  const { user } = useAuth();
  const [ebooks, setEbooks] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [tab, setTab] = useState('all');
  const [leaderboard, setLeaderboard] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEBooks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const { data } = await api.get('/ebooks', { params });
      setEbooks(data);
      const cats = [...new Set(data.map(e => e.category))];
      setCategories(cats);
    } catch (err) {
      toast.error('Failed to load e-books');
    } finally {
      setLoading(false);
    }
  };

  const fetchFavourites = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/ebooks/favourites');
      setFavourites(data.map(f => f._id));
    } catch {}
  };

  const fetchLeaderboard = async () => {
    try {
      const { data } = await api.get('/ebooks/leaderboard');
      setLeaderboard(data);
    } catch {}
  };

  useEffect(() => {
    fetchEBooks();
    fetchFavourites();
    fetchLeaderboard();
  }, []);

  const handleToggleFav = async (id) => {
    if (!user) return toast.error('Please login');
    try {
      const { data } = await api.post(`/ebooks/${id}/favourite`);
      setFavourites(data.favorites.map(String));
      toast.success(data.favorites.includes(id) ? 'Added to favourites' : 'Removed from favourites');
    } catch {}
  };

  const handleRead = (ebook) => {
    const token = localStorage.getItem('token');
    window.open(`/api/ebooks/${ebook._id}/serve?token=${token}`, '_blank');
  };

  const handleDownload = (ebook) => {
    const token = localStorage.getItem('token');
    const a = document.createElement('a');
    a.href = `/api/ebooks/${ebook._id}/download?token=${token}`;
    a.download = ebook.title + '.pdf';
    a.click();
  };

  const displayBooks = tab === 'favourites'
    ? ebooks.filter(e => favourites.includes(e._id))
    : ebooks;

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📱 E-Books Library</h1>
          <p className="page-subtitle">Digital resources available 24/7</p>
        </div>
      </div>

      <div className="filter-tabs mb-6">
        {[['all','📚 All E-Books'],['favourites','❤️ Favourites'],['leaderboard','🏆 Leaderboard']].map(([t,label]) => (
          <button key={t} className={`filter-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{label}</button>
        ))}
      </div>

      {tab === 'leaderboard' ? (
        <div className="card">
          <div className="card-header"><span className="card-title">Most Active Readers</span></div>
          <div className="card-body">
            {leaderboard.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🏆</div><p>No data yet.</p></div> : leaderboard.map((entry, i) => (
              <div key={entry._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: 36, height: 36, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0, ...rankStyle(i) }}>{i + 1}</span>
                <span style={{ flex: 1, fontWeight: 600 }}>{entry.user?.name}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{entry.booksRead} books read</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="search-bar mb-6">
            <div className="search-input-wrap" style={{ flex: 1 }}>
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Search e-books..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchEBooks()} />
            </div>
            <select className="filter-select" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="btn btn-primary" onClick={fetchEBooks}>Search</button>
          </div>
          {loading ? <div className="spinner" /> : displayBooks.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📚</div><p>No e-books found.</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px,1fr))', gap: '1.5rem' }}>
              {displayBooks.map(ebook => (
                <div key={ebook._id} className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ position: 'relative', height: 160, background: 'var(--primary-bg)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ebook.coverImage
                      ? <img src={ebook.coverImage} alt={ebook.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '3.5rem' }}>📄</span>}
                    {user && (
                      <button onClick={() => handleToggleFav(ebook._id)} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.85)', border: 'none', cursor: 'pointer', fontSize: '1.1rem', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--t)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', flexShrink: 0 }}>
                        {favourites.includes(ebook._id) ? '❤️' : '🤍'}
                      </button>
                    )}
                  </div>
                  <div className="card-body">
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{ebook.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.3rem' }}>by {ebook.author}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.5rem' }}>📂 {ebook.category}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.75rem' }}>👁 {ebook.readCount} reads &middot; ⬇ {ebook.downloadCount} downloads</p>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleRead(ebook)}>📖 Read</button>
                      <button className="btn btn-success btn-sm" onClick={() => handleDownload(ebook)}>⬇ Download</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EBooks;
