import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const ROLES = ['student', 'staff', 'admin'];

const roleSelectStyle = {
  student: { background: '#d1fae5', color: '#065f46' },
  staff:   { background: '#cffafe', color: '#155e75' },
  admin:   { background: '#eef2ff', color: '#4338ca' },
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [updating, setUpdating] = useState({});

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try { setLoading(true); const { data } = await api.get('/auth/users'); setUsers(data); }
    catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const updateRole = async (id, role) => {
    try {
      setUpdating(u => ({ ...u, [id]: 'role' }));
      await api.put(`/auth/users/${id}/role`, { role });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role } : u));
      toast.success('Role updated');
    } catch { toast.error('Failed to update role'); }
    finally { setUpdating(u => ({ ...u, [id]: null })); }
  };

  const toggleStatus = async (id) => {
    try {
      setUpdating(u => ({ ...u, [id]: 'status' }));
      const { data } = await api.put(`/auth/users/${id}/toggle`);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: data.isActive ?? !u.isActive } : u));
      toast.success('Status updated');
    } catch { toast.error('Failed to update status'); }
    finally { setUpdating(u => ({ ...u, [id]: null })); }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.studentId || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole ? u.role === filterRole : true;
    return matchSearch && matchRole;
  });

  const roleCounts = ROLES.reduce((acc, r) => { acc[r] = users.filter(u => u.role === r).length; return acc; }, {});

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 User Management</h1>
          <p className="page-subtitle">Manage user accounts, roles, and access</p>
        </div>
      </div>

      <div className="stats-grid mb-6">
        {[
          { label: 'Total Users', value: users.length, variant: 'primary', icon: '👥' },
          { label: 'Students', value: roleCounts.student, variant: 'success', icon: '🎓' },
          { label: 'Staff', value: roleCounts.staff, variant: 'info', icon: '👔' },
          { label: 'Admins', value: roleCounts.admin, variant: 'warning', icon: '🔑' },
          { label: 'Inactive', value: users.filter(u => !u.isActive).length, variant: 'danger', icon: '🚫' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon stat-icon-${s.variant}`}>{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="search-bar mb-4">
        <div className="search-input-wrap" style={{ flex: 1 }}>
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search name, email, or student ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>User</th><th>Email</th><th>Student ID</th><th>Phone</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No users found</td></tr>
              ) : filtered.map(u => (
                <tr key={u._id} style={{ opacity: u.isActive ? 1 : 0.6 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div className="avatar" style={{ width: 34, height: 34, fontSize: '0.85rem' }}>{u.name.charAt(0).toUpperCase()}</div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td>{u.studentId || '—'}</td>
                  <td>{u.phone || '—'}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={e => updateRole(u._id, e.target.value)}
                      disabled={updating[u._id] === 'role'}
                      style={{ ...(roleSelectStyle[u.role] || {}), border: 'none', borderRadius: 20, padding: '0.2rem 0.6rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                  </td>
                  <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button
                      className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => toggleStatus(u._id)}
                      disabled={updating[u._id] === 'status'}
                    >
                      {updating[u._id] === 'status' ? '...' : u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
