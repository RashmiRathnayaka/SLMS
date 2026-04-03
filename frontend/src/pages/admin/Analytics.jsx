import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const COLORS = ['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6'];

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/books/analytics')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-wrapper"><div className="spinner" /></div>;
  if (!data) return <div className="page-wrapper"><div className="empty-state"><div className="empty-state-icon">📊</div><p>No data available.</p></div></div>;

  const statItems = [
    { label: 'Total Titles', value: data.totalBooks, variant: 'primary', icon: '📚' },
    { label: 'Total Copies', value: data.totalCopies, variant: 'success', icon: '📋' },
    { label: 'Available', value: data.availableCopies, variant: 'info', icon: '✅' },
    { label: 'Borrowed', value: data.borrowedCopies, variant: 'warning', icon: '📤' },
    { label: 'Low Stock', value: data.lowStock, variant: 'danger', icon: '⚠️' },
  ];

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Inventory Analytics</h1>
          <p className="page-subtitle">Real-time library collection insights</p>
        </div>
      </div>

      <div className="stats-grid mb-8">
        {statItems.map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon stat-icon-${s.variant}`}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px,1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Book Availability</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.availability} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {data.availability.map((_, i) => <Cell key={i} fill={i === 0 ? '#10b981' : '#ef4444'} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Books per Category</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.categoryData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">💡 Purchase Recommendations</span></div>
        <div className="card-body">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>Books recommended based on waiting lists, borrow frequency, and low stock.</p>
          {data.recommendations.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No recommendations at this time.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>#</th><th>Title</th><th>Author</th><th>Category</th><th>Available / Total</th><th>Waiting</th><th>Borrows</th><th>Priority</th></tr></thead>
                <tbody>
                  {data.recommendations.map((b, idx) => {
                    const priorityBadge = b.priority === 'urgent'
                      ? { cls: 'badge-danger',  label: '🔴 Urgent' }
                      : b.priority === 'high'
                      ? { cls: 'badge-warning', label: '🟡 High' }
                      : { cls: 'badge-primary', label: '🔵 Medium' };
                    return (
                      <tr key={b._id}>
                        <td style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{b.title}</td>
                        <td>{b.author}</td>
                        <td><span className="chip">{b.category}</span></td>
                        <td><span style={{ color: b.availableCopies <= 1 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{b.availableCopies}/{b.totalCopies}</span></td>
                        <td style={{ textAlign: 'center' }}>
                          {b.waitingCount > 0
                            ? <span className="badge badge-danger">{b.waitingCount} waiting</span>
                            : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>{b.borrowCount || 0}</td>
                        <td><span className={`badge ${priorityBadge.cls}`}>{priorityBadge.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default Analytics;
