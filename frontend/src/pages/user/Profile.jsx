import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const roleCls = (r) => ({ admin: 'badge-danger', staff: 'badge-warning', student: 'badge-primary' }[r] || 'badge-gray');

const Profile = () => {
  const { user, updateUserState } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', address: '', studentId: '' });
  const [pwForm, setPwForm] = useState({ password: '' });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) setForm({ name: user.name || '', phone: user.phone || '', address: user.address || '', studentId: user.studentId || '' });
  }, [user]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (form.phone && !/^\d{7,15}$/.test(form.phone.replace(/[\s\-().+]/g, ''))) errs.phone = 'Enter a valid phone number (7–15 digits, e.g. +94 71 234 5678)';
    if (pwForm.password) {
      if (pwForm.password.length < 8) errs.password = 'New password must be at least 8 characters';
      else if (!/[A-Z]/.test(pwForm.password)) errs.password = 'Password must include at least one uppercase letter';
      else if (!/[0-9]/.test(pwForm.password)) errs.password = 'Password must include at least one number';
    }
    if (photo && photo.size > 5 * 1024 * 1024) errs.photo = 'Image must be smaller than 5 MB';
    return errs;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (pwForm.password) fd.append('password', pwForm.password);
      if (photo) fd.append('profileImage', photo);
      const { data } = await api.put('/auth/profile', fd);
      updateUserState({ ...user, ...data });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper fade-in" style={{ maxWidth: 820 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">👤 My Profile</h1>
          <p className="page-subtitle">Manage your account information</p>
        </div>
      </div>

      <div className="card">
        {/* User identity bar */}
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            {user?.profileImage
              ? <img src={user.profileImage} alt="Profile" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-bg)' }} />
              : (
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800 }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.2rem' }}>{user?.name}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{user?.email}</p>
            <span className={`badge ${roleCls(user?.role)}`} style={{ textTransform: 'capitalize' }}>{user?.role}</span>
          </div>
        </div>

        {/* Update form */}
        <div className="card-body" style={{ paddingTop: 0 }}>
          <form onSubmit={handleUpdate}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text)' }}>Update Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className={`form-control${errors.name ? ' is-invalid' : ''}`} value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors(p => ({ ...p, name: '' })); }} />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className={`form-control${errors.phone ? ' is-invalid' : ''}`} value={form.phone} onChange={e => { setForm({ ...form, phone: e.target.value }); if (errors.phone) setErrors(p => ({ ...p, phone: '' })); }} placeholder="+94 71 234 5678" />
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Student ID</label>
                <input className="form-control" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">New Password <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <input className={`form-control${errors.password ? ' is-invalid' : ''}`} type="password" value={pwForm.password} onChange={e => { setPwForm({ password: e.target.value }); if (errors.password) setErrors(p => ({ ...p, password: '' })); }} placeholder="Leave blank to keep current" />
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea className="form-control" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} />
            </div>
            <div className="form-group">
              <label className="form-label">Profile Photo</label>
              <input className={`form-control${errors.photo ? ' is-invalid' : ''}`} type="file" accept="image/*" onChange={e => { setPhoto(e.target.files[0]); if (errors.photo) setErrors(p => ({ ...p, photo: '' })); }} style={{ padding: '0.45rem 0.9rem' }} />
              {errors.photo && <span className="form-error">{errors.photo}</span>}
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
