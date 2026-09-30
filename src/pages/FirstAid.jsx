import React, { useState, useEffect } from 'react';
import './FirstAid.css';
import api from '../utils/api';

const emptyForm = { title: '', content: '', video_url: '', image_url: '', category: '' };

function FirstAid() {
  const [resources, setResources] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchResources = () => {
    setLoading(true);
    api.get('/admin/firstaid')
      .then(res => {
        if (res.data.success) setResources(res.data.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (res) => {
    setEditing(res.id);
    setForm({
      title: res.title,
      content: res.content || '',
      video_url: res.video_url || '',
      image_url: res.image_url || '',
      category: res.category || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title) return;
    try {
      if (editing) {
        await api.patch(`/admin/firstaid/${editing}`, form);
      } else {
        await api.post('/admin/firstaid', form);
      }
      setShowModal(false);
      fetchResources();
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving resource');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this resource?')) {
      try {
        await api.delete(`/admin/firstaid/${id}`);
        fetchResources();
      } catch (e) { console.error(e); }
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>First Aid Resources</h1>
        <button className="btn-primary" onClick={openAdd}>+ Add Resource</button>
      </div>

      {loading ? (
        <div className="empty-state">Loading...</div>
      ) : (
        <div className="resources-grid">
          {resources.map(res => (
            <div key={res.id} className="resource-card">
              <h3>{res.title}</h3>
              {res.category && <span className="badge badge-approved" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>{res.category}</span>}
              <p className="resource-desc">{res.content}</p>
              <div className="resource-actions">
                <button className="btn-edit" onClick={() => openEdit(res)}>Edit</button>
                <button className="btn-danger" onClick={() => handleDelete(res.id)}>Delete</button>
              </div>
            </div>
          ))}
          {resources.length === 0 && <div className="empty-state">No resources found</div>}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editing ? 'Edit Resource' : 'Add Resource'}</h2>
            <div className="form-group">
              <label>Title</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Emergency, General" />
            </div>
            <div className="form-group">
              <label>Content</label>
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Video URL</label>
              <input value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Image URL</label>
              <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FirstAid;
