import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: '🔍', title: 'Search & Borrow', desc: 'Search thousands of books by title, author, or category. Borrow with a smart priority-based waiting list.', accent: '#4f46e5' },
  { icon: '📋', title: 'Book Management', desc: 'Full CRUD for library inventory. Bulk import via CSV, track borrow counts, and get purchase recommendations.', accent: '#10b981' },
  { icon: '📖', title: 'Digital E-Library', desc: 'Browse and read PDFs online, download resources, save favourites, and climb the reader leaderboard.', accent: '#06b6d4' },
  { icon: '🎓', title: 'Course Recommendations', desc: 'Enrol in your courses and receive personalised book recommendations based on your curriculum.', accent: '#7c3aed' },
  { icon: '🛡️', title: 'BookShield Reports', desc: 'Report damaged books with photos. Staff review, assess fines, and track resolutions transparently.', accent: '#f59e0b' },
  { icon: '💬', title: 'Inquiry System', desc: 'Submit questions to library staff anytime. Get replies tracked for full communication history.', accent: '#ef4444' },
];

const stats = [
  { value: '20+', label: 'Books in Catalog', icon: '📚', bg: '#eef2ff', color: '#4f46e5' },
  { value: '10+', label: 'Digital E-Books',  icon: '💻', bg: '#d1fae5', color: '#10b981' },
  { value: '8',   label: 'Active Courses',   icon: '🎓', bg: '#cffafe', color: '#06b6d4' },
  { value: '8',   label: 'Registered Users', icon: '👥', bg: '#fef3c7', color: '#f59e0b' },
];

const LibraryIllustration = () => (
  <svg width="340" height="260" viewBox="0 0 340 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.4))' }}>
    {/* Shelf base */}
    <rect x="15" y="190" width="310" height="14" rx="4" fill="#312e81" opacity="0.9"/>
    {/* Books row 1 */}
    <rect x="30" y="105" width="28" height="90" rx="3" fill="#6366f1"/>
    <rect x="34" y="115" width="2" height="70" rx="1" fill="rgba(255,255,255,0.25)"/>
    <rect x="63" y="88" width="32" height="107" rx="3" fill="#7c3aed"/>
    <rect x="67" y="100" width="2" height="85" rx="1" fill="rgba(255,255,255,0.2)"/>
    <rect x="100" y="95" width="38" height="100" rx="3" fill="#4f46e5"/>
    <text x="119" y="150" fill="rgba(255,255,255,0.45)" fontSize="7" textAnchor="middle" transform="rotate(-90,119,150)">SMARTLIB</text>
    <rect x="143" y="118" width="26" height="77" rx="3" fill="#06b6d4"/>
    <rect x="147" y="128" width="2" height="57" rx="1" fill="rgba(255,255,255,0.2)"/>
    <rect x="174" y="102" width="30" height="93" rx="3" fill="#10b981"/>
    <rect x="178" y="112" width="2" height="73" rx="1" fill="rgba(255,255,255,0.2)"/>
    <rect x="209" y="112" width="24" height="83" rx="3" fill="#f59e0b"/>
    <rect x="238" y="98" width="33" height="97" rx="3" fill="#ef4444"/>
    <rect x="242" y="110" width="2" height="77" rx="1" fill="rgba(255,255,255,0.2)"/>
    <rect x="276" y="108" width="30" height="87" rx="3" fill="#8b5cf6"/>
    {/* Upper shelf */}
    <rect x="15" y="100" width="310" height="10" rx="3" fill="#2d2760" opacity="0.6"/>
    {/* Open book floating above */}
    <g transform="translate(120, 30)">
      <ellipse cx="50" cy="52" rx="52" ry="12" fill="#1e1b4b" opacity="0.35"/>
      <path d="M2 45 Q52 18 102 45" fill="#4338ca" opacity="0.9"/>
      <path d="M2 45 Q52 72 102 45" fill="#6366f1" opacity="0.7"/>
      <line x1="52" y1="18" x2="52" y2="72" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
      <line x1="12" y1="36" x2="48" y2="33" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="10" y1="43" x2="47" y2="41" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="56" y1="33" x2="92" y2="36" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="57" y1="41" x2="93" y2="43" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeLinecap="round"/>
    </g>
    {/* Sparkles */}
    <circle cx="298" cy="70" r="4" fill="#a5b4fc" opacity="0.8"/>
    <circle cx="280" cy="48" r="3" fill="#f9a8d4" opacity="0.7"/>
    <circle cx="315" cy="40" r="2.5" fill="#6ee7b7" opacity="0.6"/>
    <circle cx="308" cy="22" r="2" fill="#fbbf24" opacity="0.7"/>
    <circle cx="25" cy="58" r="3" fill="#a5b4fc" opacity="0.6"/>
    <circle cx="38" cy="38" r="2" fill="#f9a8d4" opacity="0.5"/>
  </svg>
);

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCTA = () => {
    if (!user) { navigate('/register'); return; }
    if (user.role === 'admin') navigate('/admin/books');
    else if (user.role === 'staff') navigate('/staff/borrows');
    else navigate('/dashboard');
  };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", overflowX: 'hidden' }}>

      {/* ═══ HERO ════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0f0c29 0%, #1e1b4b 40%, #312e81 70%, #4f46e5 100%)',
        display: 'flex', alignItems: 'center',
      }}>
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)', top: '-100px', right: '-100px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)', bottom: '-80px', left: '10%', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '8rem 2rem 6rem', width: '100%', display: 'flex', alignItems: 'center', gap: '4rem', flexWrap: 'wrap' }}>
          {/* Text */}
          <div style={{ flex: 1, minWidth: 280, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(165,180,252,0.15)', border: '1px solid rgba(165,180,252,0.3)', color: '#a5b4fc', padding: '0.4rem 1rem', borderRadius: 99, fontSize: '0.82rem', fontWeight: 500, marginBottom: '1.75rem', backdropFilter: 'blur(8px)' }}>
              🏛️ Smart Library Management System
            </div>
            <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: '1.25rem', letterSpacing: '-0.03em' }}>
              Your Knowledge,<br />
              <span style={{ background: 'linear-gradient(90deg, #a5b4fc, #f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Managed Smartly.
              </span>
            </h1>
            <p style={{ color: 'rgba(199,210,254,0.85)', fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '2.5rem', maxWidth: 520 }}>
              Borrow books, read e-books, enrol in courses, and get personalised recommendations — all in one modern library platform built for students and staff.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleCTA}
                style={{ padding: '0.85rem 2.25rem', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 32px rgba(79,70,229,0.45)', transition: 'all 0.2s', letterSpacing: '-0.01em' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(79,70,229,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(79,70,229,0.45)'; }}
              >
                {user ? '→ Go to Dashboard' : 'Get Started Free'}
              </button>
              {!user && (
                <Link
                  to="/login"
                  style={{ padding: '0.85rem 2.25rem', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 10, fontSize: '1rem', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', backdropFilter: 'blur(8px)', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Library SVG illustration */}
          <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
            <LibraryIllustration />
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {stats.map(s => (
            <div key={s.label} style={{ padding: '2.5rem 1.5rem', textAlign: 'center', borderRight: '1px solid #f1f5f9', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = s.bg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{s.icon}</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.4rem', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ════════════════════════════════════════════════════ */}
      <section style={{ padding: '5rem 2rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', fontWeight: 800, color: '#1e293b', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
              Everything You Need in One Place
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: 520, margin: '0 auto' }}>Six powerful modules built for students, staff, and administrators.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.5rem' }}>
            {features.map(f => (
              <div
                key={f.title}
                style={{ background: '#fff', borderRadius: 16, padding: '1.75rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.2s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.1), 0 0 0 2px ${f.accent}22`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 12, background: f.accent + '15', color: f.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1.1rem' }}>
                  {f.icon}
                </div>
                <h3 style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem', fontSize: '1rem' }}>{f.title}</h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA SECTION ═════════════════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #1e1b4b 50%, #312e81 100%)', padding: '5rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, color: '#fff', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Ready to Start?
          </h2>
          <p style={{ color: 'rgba(199,210,254,0.85)', fontSize: '1.05rem', marginBottom: '2.5rem', lineHeight: 1.7 }}>
            {user
              ? `Welcome back, ${user.name}! Jump back into your library.`
              : 'Create a free account and explore the full library today.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleCTA}
              style={{ padding: '0.9rem 2.5rem', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', borderRadius: 10, fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 32px rgba(79,70,229,0.5)', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              {user ? '→ Open Dashboard' : 'Create Free Account'}
            </button>
            {!user && (
              <Link
                to="/login"
                style={{ padding: '0.9rem 2.5rem', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 10, fontSize: '1.05rem', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', transition: 'all 0.2s', backdropFilter: 'blur(8px)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
