import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const emptyForm = {
  title: '',
  category: 'Principles',
  description: '',
  content: '',
  pdf_url: '',
  video_url: '',
  image_url: '',
  sort_order: 0,
  is_published: true,
  tags: '',
};

const CATEGORIES = [
  'Principles',
  'IHL (International Humanitarian Law)',
  'Movement History',
  'Emblem Protection',
  'Humanitarian Values',
  'General',
];

function Dissemination() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchItems = () => {
    setLoading(true);
    api.get('/admin/dissemination')
      .then((res) => {
        if (res.data.success) setItems(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item.id);
    setForm({
      title: item.title || '',
      category: item.category || 'Principles',
      description: item.description || '',
      content: item.content || '',
      pdf_url: item.pdf_url || '',
      video_url: item.video_url || '',
      image_url: item.image_url || '',
      sort_order: item.sort_order || 0,
      is_published: item.is_published !== false,
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title) return alert('Title is required');

    const payload = {
      ...form,
      sort_order: Number(form.sort_order) || 0,
      tags: typeof form.tags === 'string' ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : form.tags,
    };

    try {
      if (editing) {
        await api.patch(`/admin/dissemination/${editing}`, payload);
      } else {
        await api.post('/admin/dissemination', payload);
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save dissemination module');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this dissemination module?')) {
      try {
        await api.delete(`/admin/dissemination/${id}`);
        fetchItems();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const togglePublished = async (item) => {
    try {
      await api.patch(`/admin/dissemination/${item.id}`, { is_published: !item.is_published });
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dissemination & IHL Knowledge</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Manage Red Cross Fundamental Principles, International Humanitarian Law, and dissemination modules.
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          + Add Dissemination Module
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search modules..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: '1 1 250px',
            padding: '0.6rem 1rem',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
          }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: '0.6rem 1rem',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
          }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="empty-state">Loading dissemination modules...</div>
      ) : (
        <div className="resources-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="resource-card"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
              }}
            >
              <div>
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginBottom: '1rem' }}
                  />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span className="badge badge-approved" style={{ fontSize: '0.75rem' }}>
                    {item.category || 'General'}
                  </span>
                  <button
                    onClick={() => togglePublished(item)}
                    style={{
                      border: 'none',
                      background: item.is_published ? '#def7ec' : '#fde8e8',
                      color: item.is_published ? '#03543f' : '#9b1c1c',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {item.is_published ? 'Published' : 'Draft'}
                  </button>
                </div>
                <h3 style={{ margin: '0.5rem 0', fontSize: '1.1rem' }}>{item.title}</h3>
                <p className="resource-desc" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.4' }}>
                  {item.description || item.content?.slice(0, 120) + '...'}
                </p>
                {item.pdf_url && (
                  <a
                    href={item.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'inline-block', marginTop: '0.5rem' }}
                  >
                    📄 Download PDF Guide
                  </a>
                )}
              </div>

              <div className="resource-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button className="btn-edit" onClick={() => openEdit(item)} style={{ flex: 1 }}>
                  Edit
                </button>
                <button className="btn-danger" onClick={() => handleDelete(item.id)} style={{ flex: 1 }}>
                  Delete
                </button>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
              No dissemination modules found. Click "+ Add Dissemination Module" to create one.
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', width: '90%' }}>
            <h2>{editing ? 'Edit Dissemination Module' : 'Add Dissemination Module'}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. 7 Fundamental Principles of Red Cross"
                />
              </div>

              <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Sort Order</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Short Description / Overview</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief summary displayed on cards..."
                />
              </div>

              <div className="form-group">
                <label>Full Content / Details</label>
                <textarea
                  rows={5}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Detailed text, rules, historical context, or guidelines..."
                />
              </div>

              <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Image URL</label>
                  <input
                    type="text"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Video URL / Embed</label>
                  <input
                    type="text"
                    value={form.video_url}
                    onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="form-group">
                <label>PDF Document URL</label>
                <input
                  type="text"
                  value={form.pdf_url}
                  onChange={(e) => setForm({ ...form, pdf_url: e.target.value })}
                  placeholder="https://.../handbook.pdf"
                />
              </div>

              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="IHL, Geneva Convention, Humanity"
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="is_published"
                  checked={form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                />
                <label htmlFor="is_published" style={{ marginBottom: 0 }}>
                  Publish immediately (visible in member portal)
                </label>
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editing ? 'Save Changes' : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dissemination;
