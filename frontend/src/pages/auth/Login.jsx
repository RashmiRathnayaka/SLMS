import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'admin') navigate('/admin/books');
      else if (user.role === 'staff') navigate('/staff/borrows');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <div className="auth-logo-icon">📚</div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your SmartLib account</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className={`form-control${errors.email ? ' is-invalid' : ''}`} type="email" value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); if (errors.email) setErrors(p => ({ ...p, email: '' })); }} placeholder="you@example.com" />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className={`form-control${errors.password ? ' is-invalid' : ''}`} type="password" value={form.password} onChange={e => { setForm({ ...form, password: e.target.value }); if (errors.password) setErrors(p => ({ ...p, password: '' })); }} placeholder="••••••••" />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>
          <button className="btn btn-primary w-full" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.95rem' }} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create one</Link>
        </p>
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--primary-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.25rem' }}>Demo Credentials</strong>
          Admin: admin@smartlib.lk / Admin@1234<br />
          Staff: rashmi@smartlib.lk / Staff@1234<br />
          Student: ashan@student.lk / Student@1234
        </div>
      </div>
    </div>
  );
};

export default Login;
