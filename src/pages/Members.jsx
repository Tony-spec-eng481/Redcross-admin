import React, { useState, useEffect } from 'react';
import './Members.css';
import api from '../utils/api';

function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'Member' });

  const fetchMembers = () => {
    setLoading(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get(`/admin/members${params}`)
      .then(res => {
        if (res.data.success) setMembers(res.data.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMembers();
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', role: 'Member' });
    setShowModal(true);
  };

  const openEdit = (m) => {
    setEditing(m.id);
    setForm({ name: m.name, email: m.email, phone: m.phone || '', role: m.role || 'Member' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return;
    try {
      if (editing) {
        await api.patch(`/admin/members/${editing}`, form);
      } else {
        await api.post('/admin/members', form);
      }
      setShowModal(false);
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving member');
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/admin/members/${id}/status`, { status: newStatus });
      fetchMembers();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete member?')) {
      try {
        await api.delete(`/admin/members/${id}`);
        fetchMembers();
      } catch (e) { console.error(e); }
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Members</h1>
        <div className="page-header-actions">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search members by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </form>
          <button className="btn-primary" onClick={openAdd}>+ Add Member</button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading members...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td><strong>{m.name}</strong></td>
                  <td>{m.email}</td>
                  <td>{m.phone || '—'}</td>
                  <td>{m.role}</td>
                  <td>
                    <span className={`badge badge-${m.status}`}>{m.status}</span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn-edit" onClick={() => openEdit(m)}>Edit</button>
                      <button
                        className={m.status === 'active' ? 'btn-reject' : 'btn-approve'}
                        onClick={() => handleStatusToggle(m.id, m.status)}
                      >
                        {m.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn-danger" onClick={() => handleDelete(m.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No members found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editing ? 'Edit Member' : 'Add Member'}</h2>
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. John Doe" />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="e.g. member@ku.ac.ke" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone Number</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+254..." />
              </div>
              <div className="form-group">
                <label>Chapter Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="Member">Member</option>
                  <option value="Volunteer">Volunteer</option>
                  <option value="First Aider">First Aider</option>
                  <option value="Coordinator">Coordinator</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>{editing ? 'Update Member' : 'Save Member'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Members;
