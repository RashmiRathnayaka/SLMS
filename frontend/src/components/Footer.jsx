import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer style={{ background: '#0a0a1a', padding: '2rem 2rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem', marginBottom: '1.5rem' }}>
        {/* Brand */}
        <div>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>📚</span>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#a5b4fc' }}>Smart<span style={{ color: '#818cf8' }}>Lib</span></span>
          </Link>
          <p style={{ color: '#475569', fontSize: '0.82rem', maxWidth: 220, lineHeight: 1.6, margin: 0 }}>
            Smart Library Management System — borrow books, read e-books, and manage knowledge efficiently.
          </p>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
          <div>
            <h4 style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem', margin: '0 0 0.75rem' }}>Platform</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[{ to: '/books', label: 'Browse Books' }, { to: '/ebooks', label: 'E-Books' }, { to: '/courses', label: 'Courses' }, { to: '/dashboard', label: 'Dashboard' }].map(l => (
                <Link key={l.to} to={l.to} style={{ color: '#475569', fontSize: '0.82rem', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = '#a5b4fc'}
                  onMouseLeave={e => e.target.style.color = '#475569'}
                >{l.label}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem' }}>Account</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[{ to: '/login', label: 'Sign In' }, { to: '/register', label: 'Register' }, { to: '/profile', label: 'My Profile' }, { to: '/inquiries', label: 'Inquiries' }].map(l => (
                <Link key={l.to} to={l.to} style={{ color: '#475569', fontSize: '0.82rem', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = '#a5b4fc'}
                  onMouseLeave={e => e.target.style.color = '#475569'}
                >{l.label}</Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ color: '#334155', fontSize: '0.79rem' }}>
          © {new Date().getFullYear()} SmartLib. All rights reserved.
        </span>
        <span style={{ color: '#334155', fontSize: '0.79rem' }}>
          Smart Library Management System
        </span>
      </div>
    </div>
  </footer>
);

export default Footer;
