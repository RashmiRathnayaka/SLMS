import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', studentId: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Password must include at least one uppercase letter';
    else if (!/[0-9]/.test(form.password)) errs.password = 'Password must include at least one number';
    if (form.phone && !/^\d{7,15}$/.test(form.phone.replace(/[\s\-().+]/g, ''))) errs.phone = 'Enter a valid phone number (7–15 digits, e.g. +94 71 234 5678)';
    if (form.studentId && !/^[A-Za-z]{2}\d{8}$/.test(form.studentId)) errs.studentId = 'Student ID must start with 2 letters followed by 8 digits (e.g. AB12345678)';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">📚</div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join SmartLib and start your reading journey</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className={`form-control${errors.name ? ' is-invalid' : ''}`} value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors(p => ({ ...p, name: '' })); }} placeholder="John Doe" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input className={`form-control${errors.email ? ' is-invalid' : ''}`} type="email" value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); if (errors.email) setErrors(p => ({ ...p, email: '' })); }} placeholder="you@example.com" />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input className={`form-control${errors.password ? ' is-invalid' : ''}`} type="password" value={form.password} onChange={e => { setForm({ ...form, password: e.target.value }); if (errors.password) setErrors(p => ({ ...p, password: '' })); }} placeholder="Min 8 chars, uppercase &amp; number required" />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Student ID</label>
              <input className={`form-control${errors.studentId ? ' is-invalid' : ''}`} value={form.studentId} onChange={e => { setForm({ ...form, studentId: e.target.value }); if (errors.studentId) setErrors(p => ({ ...p, studentId: '' })); }} placeholder="AB12345678" />
              {errors.studentId && <span className="form-error">{errors.studentId}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className={`form-control${errors.phone ? ' is-invalid' : ''}`} value={form.phone} onChange={e => { setForm({ ...form, phone: e.target.value }); if (errors.phone) setErrors(p => ({ ...p, phone: '' })); }} placeholder="+94 71 234 5678" />
              {errors.phone && <span className="form-error">{errors.phone}</span>}
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.95rem' }} type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Free Account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
