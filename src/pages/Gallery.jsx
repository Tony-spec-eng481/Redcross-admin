import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './Gallery.css';
import api from '../utils/api';
import {
  Image as ImageIcon,
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Star,
  Filter,
  RefreshCw,
  Upload,
  Eye,
  AlertCircle,
  User,
  ExternalLink,
  Heart
} from 'lucide-react';

const CATEGORIES = ['General', 'Team', 'Outreach', 'Events', 'Training', 'Community', 'Blood Donation', 'Campus'];

const INITIAL_FORM = {
  title: '',
  image_url: '',
  category: 'General',
  description: '',
  is_favourite: false,
};

export default function Gallery() {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  // Reject modal
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Delete modal
  const [deletingItem, setDeletingItem] = useState(null);

  // Preview modal
  const [previewItem, setPreviewItem] = useState(null);

  // Image upload
  const [uploading, setUploading] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchGallery = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/gallery');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setGallery(res.data.data);
      } else if (Array.isArray(res.data)) {
        setGallery(res.data);
      }
    } catch (err) {
      console.error('Error fetching gallery:', err);
      showToast('Failed to load gallery items.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  // Stats
  const stats = useMemo(() => {
    const total = gallery.length;
    const approved = gallery.filter(i => i.status === 'approved').length;
    const pending = gallery.filter(i => i.status === 'pending').length;
    const rejected = gallery.filter(i => i.status === 'rejected').length;
    const favourites = gallery.filter(i => i.is_favourite).length;
    return { total, approved, pending, rejected, favourites };
  }, [gallery]);

  // Filtered gallery
  const filteredGallery = useMemo(() => {
    return gallery.filter(item => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (categoryFilter !== 'all' && (item.category || 'General') !== categoryFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchDesc = (item.description || '').toLowerCase().includes(q);
        const matchSubmitter = (item.submitted_by_name || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchSubmitter) return false;
      }
      return true;
    });
  }, [gallery, filter, searchTerm, categoryFilter]);

  // Image upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'gallery');

    setUploading(true);
    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success && res.data?.data?.url) {
        setForm(prev => ({ ...prev, image_url: res.data.data.url }));
        showToast('Image uploaded successfully!');
      }
    } catch (err) {
      console.error('Upload error:', err);
      showToast('Failed to upload image.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || '',
      image_url: item.image_url || '',
      category: item.category || 'General',
      description: item.description || '',
      is_favourite: item.is_favourite || false,
    });
    setShowModal(true);
  };

  // Save gallery item (create or update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.image_url) {
      showToast('Please upload or enter an image URL.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/admin/gallery/${editingId}`, form);
        showToast('Gallery item updated successfully!');
      } else {
        await api.post('/admin/gallery', form);
        showToast('Gallery item added successfully!');
      }
      setShowModal(false);
      setForm(INITIAL_FORM);
      setEditingId(null);
      fetchGallery();
    } catch (err) {
      console.error('Save error:', err);
      showToast('Failed to save gallery item.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Approve
  const handleApprove = async (id) => {
    try {
      await api.patch(`/admin/gallery/${id}/approve`);
      showToast('Gallery item approved!');
      fetchGallery();
    } catch (err) {
      console.error(err);
      showToast('Failed to approve.', 'error');
    }
  };

  // Reject
  const handleReject = async () => {
    if (!rejectingItem) return;
    try {
      await api.patch(`/admin/gallery/${rejectingItem.id}/reject`, { reason: rejectionReason });
      showToast('Gallery item rejected.');
      setRejectingItem(null);
      setRejectionReason('');
      fetchGallery();
    } catch (err) {
      console.error(err);
      showToast('Failed to reject.', 'error');
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await api.delete(`/admin/gallery/${deletingItem.id}`);
      showToast('Gallery item deleted.');
      setDeletingItem(null);
      fetchGallery();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete.', 'error');
    }
  };

  // Toggle favourite
  const handleToggleFavourite = async (id) => {
    try {
      const res = await api.patch(`/admin/gallery/${id}/favourite`);
      showToast(res.data?.message || 'Favourite toggled!');
      fetchGallery();
    } catch (err) {
      console.error(err);
      showToast('Failed to toggle favourite.', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { className: 'gal-badge-pending', icon: <AlertCircle size={12} />, label: 'Pending' },
      approved: { className: 'gal-badge-approved', icon: <CheckCircle2 size={12} />, label: 'Approved' },
      rejected: { className: 'gal-badge-rejected', icon: <XCircle size={12} />, label: 'Rejected' },
    };
    const badge = map[status] || map.pending;
    return (
      <span className={`gal-badge ${badge.className}`}>
        {badge.icon} {badge.label}
      </span>
    );
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="gallery-management">
      {/* Toast */}
      {toast && (
        <div className={`gal-toast gal-toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      {/* Page Header */}
      <div className="gal-page-header">
        <div className="gal-header-left">
          <div className="gal-header-icon">
            <ImageIcon size={24} />
          </div>
          <div>
            <h1>Gallery Management</h1>
            <p className="gal-header-sub">Manage photos, approve submissions, and curate the frontend gallery</p>
          </div>
        </div>
        <div className="gal-header-actions">
          <button className="gal-btn gal-btn-outline" onClick={fetchGallery} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Refresh
          </button>
          <button className="gal-btn gal-btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> Add Photo
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="gal-stats-row">
        {[
          { label: 'Total', value: stats.total, color: '#6366f1', icon: <ImageIcon size={18} /> },
          { label: 'Approved', value: stats.approved, color: '#22c55e', icon: <CheckCircle2 size={18} /> },
          { label: 'Pending', value: stats.pending, color: '#f59e0b', icon: <AlertCircle size={18} /> },
          { label: 'Rejected', value: stats.rejected, color: '#ef4444', icon: <XCircle size={18} /> },
          { label: 'On Frontend', value: stats.favourites, color: '#ec4899', icon: <Star size={18} /> },
        ].map(stat => (
          <div className="gal-stat-card" key={stat.label}>
            <div className="gal-stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="gal-stat-info">
              <span className="gal-stat-value">{stat.value}</span>
              <span className="gal-stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="gal-toolbar">
        <div className="gal-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search gallery..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && <button className="gal-search-clear" onClick={() => setSearchTerm('')}><X size={14} /></button>}
        </div>
        <div className="gal-filter-group">
          <div className="gal-filter-tabs">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: `Pending (${stats.pending})` },
              { key: 'approved', label: `Approved (${stats.approved})` },
              { key: 'rejected', label: `Rejected (${stats.rejected})` },
            ].map(f => (
              <button
                key={f.key}
                className={`gal-filter-tab ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <select className="gal-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="gal-loading">
          <RefreshCw size={32} className="spinning" />
          <p>Loading gallery items...</p>
        </div>
      ) : filteredGallery.length === 0 ? (
        <div className="gal-empty">
          <ImageIcon size={48} />
          <h3>No gallery items found</h3>
          <p>Try adjusting your filters or add a new photo.</p>
          <button className="gal-btn gal-btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> Add Photo
          </button>
        </div>
      ) : (
        <div className="gal-grid">
          {filteredGallery.map(item => (
            <div key={item.id} className={`gal-card ${item.is_favourite ? 'gal-card-favourite' : ''}`}>
              {/* Image */}
              <div className="gal-card-img-wrapper" onClick={() => setPreviewItem(item)}>
                <img src={item.image_url} alt={item.title || 'Gallery'} className="gal-card-img" loading="lazy" />
                <div className="gal-card-overlay">
                  <Eye size={20} />
                  <span>Preview</span>
                </div>
                {item.is_favourite && (
                  <div className="gal-favourite-badge">
                    <Star size={12} fill="currentColor" /> Frontend
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="gal-card-body">
                <div className="gal-card-top">
                  {getStatusBadge(item.status)}
                  <span className="gal-card-category">{item.category || 'General'}</span>
                </div>
                <h3 className="gal-card-title">{item.title || 'Untitled'}</h3>
                {item.description && <p className="gal-card-desc">{item.description}</p>}
                <div className="gal-card-meta">
                  {item.submitted_by_name && (
                    <span className="gal-card-submitter"><User size={12} /> {item.submitted_by_name}</span>
                  )}
                  <span className="gal-card-date">{formatDate(item.created_at)}</span>
                </div>

                {/* Actions */}
                <div className="gal-card-actions">
                  {/* Favourite Toggle */}
                  <button
                    className={`gal-action-btn ${item.is_favourite ? 'gal-action-favourite-active' : 'gal-action-favourite'}`}
                    onClick={() => handleToggleFavourite(item.id)}
                    title={item.is_favourite ? 'Remove from frontend' : 'Show on frontend'}
                  >
                    <Star size={14} fill={item.is_favourite ? 'currentColor' : 'none'} />
                  </button>

                  {/* Approve / Reject (if pending) */}
                  {item.status === 'pending' && (
                    <>
                      <button className="gal-action-btn gal-action-approve" onClick={() => handleApprove(item.id)} title="Approve">
                        <CheckCircle2 size={14} />
                      </button>
                      <button className="gal-action-btn gal-action-reject" onClick={() => { setRejectingItem(item); setRejectionReason(''); }} title="Reject">
                        <XCircle size={14} />
                      </button>
                    </>
                  )}

                  {/* Edit */}
                  <button className="gal-action-btn gal-action-edit" onClick={() => openEditModal(item)} title="Edit">
                    <Edit2 size={14} />
                  </button>

                  {/* Delete */}
                  <button className="gal-action-btn gal-action-delete" onClick={() => setDeletingItem(item)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create/Edit Modal ── */}
      {showModal && (
        <div className="gal-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="gal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gal-modal-header">
              <h2>{editingId ? 'Edit Gallery Item' : 'Add New Photo'}</h2>
              <button className="gal-modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="gal-modal-body">
              {/* Image Upload */}
              <div className="gal-form-group">
                <label>Image</label>
                <div className="gal-upload-area">
                  {form.image_url ? (
                    <div className="gal-upload-preview">
                      <img src={form.image_url} alt="Preview" />
                      <button type="button" className="gal-upload-remove" onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="gal-upload-dropzone">
                      <Upload size={28} />
                      <span>Click to upload image</span>
                      <span className="gal-upload-hint">JPG, PNG, WebP — max 10MB</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                    </label>
                  )}
                </div>
                {uploading && <p className="gal-uploading">Uploading...</p>}
                <div className="gal-url-input">
                  <span>Or paste URL:</span>
                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    value={form.image_url}
                    onChange={(e) => setForm(prev => ({ ...prev, image_url: e.target.value }))}
                  />
                </div>
              </div>

              {/* Title */}
              <div className="gal-form-group">
                <label>Title</label>
                <input
                  type="text"
                  placeholder="Enter a title for this photo"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              {/* Category */}
              <div className="gal-form-group">
                <label>Category</label>
                <select value={form.category} onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Description */}
              <div className="gal-form-group">
                <label>Description (optional)</label>
                <textarea
                  placeholder="Brief description of the photo..."
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Favourite Toggle */}
              <div className="gal-form-group gal-form-toggle">
                <label className="gal-toggle-label">
                  <input
                    type="checkbox"
                    checked={form.is_favourite}
                    onChange={(e) => setForm(prev => ({ ...prev, is_favourite: e.target.checked }))}
                  />
                  <span className="gal-toggle-switch"></span>
                  <span>Show on frontend website</span>
                </label>
                <p className="gal-form-hint">When enabled, this image will appear in the public Photo Gallery section</p>
              </div>

              <div className="gal-modal-footer">
                <button type="button" className="gal-btn gal-btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="gal-btn gal-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Photo' : 'Add Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reject Modal ── */}
      {rejectingItem && (
        <div className="gal-modal-backdrop" onClick={() => setRejectingItem(null)}>
          <div className="gal-modal gal-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="gal-modal-header gal-modal-header-danger">
              <h2><XCircle size={20} /> Reject Gallery Item</h2>
              <button className="gal-modal-close" onClick={() => setRejectingItem(null)}><X size={20} /></button>
            </div>
            <div className="gal-modal-body">
              <div className="gal-reject-preview">
                <img src={rejectingItem.image_url} alt={rejectingItem.title} />
                <div>
                  <strong>{rejectingItem.title}</strong>
                  {rejectingItem.submitted_by_name && <span>by {rejectingItem.submitted_by_name}</span>}
                </div>
              </div>
              <div className="gal-form-group">
                <label>Rejection Reason (optional)</label>
                <textarea
                  placeholder="Explain why this image is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="gal-modal-footer">
                <button className="gal-btn gal-btn-outline" onClick={() => setRejectingItem(null)}>Cancel</button>
                <button className="gal-btn gal-btn-danger" onClick={handleReject}>Reject Item</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deletingItem && (
        <div className="gal-modal-backdrop" onClick={() => setDeletingItem(null)}>
          <div className="gal-modal gal-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="gal-modal-header gal-modal-header-danger">
              <h2><Trash2 size={20} /> Delete Gallery Item</h2>
              <button className="gal-modal-close" onClick={() => setDeletingItem(null)}><X size={20} /></button>
            </div>
            <div className="gal-modal-body">
              <div className="gal-delete-warning">
                <AlertCircle size={40} />
                <p>Are you sure you want to delete <strong>"{deletingItem.title}"</strong>? This action cannot be undone.</p>
              </div>
              <div className="gal-modal-footer">
                <button className="gal-btn gal-btn-outline" onClick={() => setDeletingItem(null)}>Cancel</button>
                <button className="gal-btn gal-btn-danger" onClick={handleDelete}>Delete Permanently</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Preview Modal ── */}
      {previewItem && (
        <div className="gal-preview-backdrop" onClick={() => setPreviewItem(null)}>
          <div className="gal-preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="gal-preview-close" onClick={() => setPreviewItem(null)}><X size={24} /></button>
            <img src={previewItem.image_url} alt={previewItem.title} className="gal-preview-img" />
            <div className="gal-preview-info">
              <h3>{previewItem.title}</h3>
              <div className="gal-preview-meta">
                {getStatusBadge(previewItem.status)}
                {previewItem.is_favourite && <span className="gal-badge gal-badge-favourite"><Star size={12} fill="currentColor" /> On Frontend</span>}
                <span className="gal-card-category">{previewItem.category || 'General'}</span>
              </div>
              {previewItem.description && <p>{previewItem.description}</p>}
              <div className="gal-preview-actions">
                <a href={previewItem.image_url} target="_blank" rel="noreferrer" className="gal-btn gal-btn-outline">
                  <ExternalLink size={14} /> Open Original
                </a>
                <button className="gal-btn gal-btn-primary" onClick={() => { setPreviewItem(null); openEditModal(previewItem); }}>
                  <Edit2 size={14} /> Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
