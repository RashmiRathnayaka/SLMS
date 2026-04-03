import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleIcons = { admin: '⚙️', staff: '🛠️', student: '🎓' };

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const isHome = location.pathname === '/';
  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };

  const navItems = user?.role === 'admin'
    ? [
        { path: '/admin/books',     label: 'Books' },
        { path: '/admin/ebooks',    label: 'E-Books' },
        { path: '/admin/courses',   label: 'Courses' },
        { path: '/admin/users',     label: 'Users' },
        { path: '/admin/analytics', label: 'Analytics' },
        { path: '/admin/waiting',   label: 'Waiting' },
      ]
    : user?.role === 'staff'
    ? [
        { path: '/staff/borrows',    label: 'Borrows' },
        { path: '/staff/inquiries',  label: 'Inquiries' },
        { path: '/staff/damages',    label: 'Damages' },
        { path: '/admin/waiting',    label: 'Waiting' },
      ]
    : [
        { path: '/dashboard',        label: 'Dashboard' },
        { path: '/books',            label: 'Books' },
        { path: '/recommendations',  label: 'Recommended' },
        { path: '/my-borrows',       label: 'My Borrows' },
        { path: '/waiting',          label: 'Waiting' },
        { path: '/ebooks',           label: 'E-Books' },
        { path: '/courses',          label: 'Courses' },
        { path: '/inquiries',        label: 'Inquiries' },
      ];

  const navBg = isHome
    ? 'rgba(15,23,42,0.72)'
    : 'linear-gradient(90deg, #1e1b4b 0%, #312e81 100%)';

  const linkStyle = (isActive) => ({
    fontSize: '0.85rem', fontWeight: 500, padding: '0.4rem 0.75rem',
    borderRadius: 6, textDecoration: 'none', transition: 'all 0.18s ease',
    color: isActive ? '#fff' : 'rgba(255,255,255,0.72)',
    background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
    fontFamily: 'Inter, sans-serif',
  });

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      background: navBg,
      backdropFilter: isHome ? 'blur(12px)' : 'none',
      boxShadow: isHome ? 'none' : '0 2px 20px rgba(0,0,0,0.25)',
      borderBottom: isHome ? '1px solid rgba(255,255,255,0.08)' : 'none',
      transition: 'background 0.3s ease',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontSize: '1.5rem' }}>📚</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#fff', letterSpacing: '-0.02em' }}>Smart<span style={{ color: '#a5b4fc' }}>Lib</span></span>
        </Link>

        {/* Desktop Nav — hidden on mobile */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            {navItems.map(item => (
              <Link key={item.path} to={item.path} style={linkStyle(location.pathname === item.path)}>
                {item.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side: user info + auth + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
          {user ? (
            <>
              {!isMobile && (
                <Link
                  to="/profile"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', padding: '0.35rem 0.7rem', borderRadius: 8, transition: 'background 0.18s', background: 'rgba(255,255,255,0.1)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #818cf8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.83rem', color: '#fff', fontWeight: 500, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name?.split(' ')[0]}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#a5b4fc', textTransform: 'capitalize' }}>
                    {roleIcons[user.role]} {user.role}
                  </span>
                </Link>
              )}
              {!isMobile && (
                <button
                  onClick={handleLogout}
                  style={{ padding: '0.4rem 0.9rem', borderRadius: 6, border: '1.5px solid rgba(239,68,68,0.6)', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.18s', fontFamily: 'Inter, sans-serif' }}
                  onMouseEnter={e => { e.target.style.background = '#ef4444'; e.target.style.color = '#fff'; }}
                  onMouseLeave={e => { e.target.style.background = 'rgba(239,68,68,0.15)'; e.target.style.color = '#fca5a5'; }}
                >
                  Logout
                </button>
              )}
            </>
          ) : (
            !isMobile && (
              <>
                <Link to="/login" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.8)', padding: '0.4rem 0.8rem', borderRadius: 6, textDecoration: 'none', transition: 'all 0.18s' }}
                  onMouseEnter={e => e.target.style.color='#fff'}
                  onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.8)'}
                >Login</Link>
                <Link to="/register" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', padding: '0.45rem 1rem', borderRadius: 6, textDecoration: 'none', transition: 'all 0.18s', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.6)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,0.4)'}
                >Register</Link>
              </>
            )
          )}

          {/* Hamburger button — mobile only */}
          {isMobile && (
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', fontSize: '1.3rem', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              aria-label="Toggle menu"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {isMobile && menuOpen && (
        <div style={{ background: 'linear-gradient(180deg, #1e1b4b, #312e81)', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map(item => (
            <Link key={item.path} to={item.path} style={{ ...linkStyle(location.pathname === item.path), padding: '0.6rem 0.75rem', display: 'block' }}>
              {item.label}
            </Link>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {user ? (
              <>
                <Link to="/profile" style={{ ...linkStyle(false), padding: '0.6rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #818cf8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.name?.split(' ')[0]}</span>
                  <span style={{ fontSize: '0.7rem', color: '#a5b4fc', marginLeft: 'auto' }}>{roleIcons[user.role]} {user.role}</span>
                </Link>
                <button onClick={handleLogout} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 6, color: '#fca5a5', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', padding: '0.6rem 0.75rem', textAlign: 'left' }}>
                  🚪 Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ ...linkStyle(false), padding: '0.6rem 0.75rem', display: 'block' }}>Login</Link>
                <Link to="/register" style={{ ...linkStyle(false), padding: '0.6rem 0.75rem', display: 'block', background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

