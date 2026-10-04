import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './Leaders.css';
import api from '../utils/api';
import {
  Award,
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  UploadCloud,
  LayoutGrid,
  List,
  Shield,
  ArrowUpDown,
  ExternalLink,
  Users,
  Star,
  Crown,
  Medal,
  ChevronDown,
  Filter,
  MoreVertical,
  Eye,
  EyeOff
} from 'lucide-react';

const COMMON_ROLES = [
  'Chairperson',
  'Vice Chairperson',
  'Secretary',
  'Treasurer',
  'First Aid Officer',
  'Asst. First Aid Officer',
  'Organising Secretary',
  'Dissemination Officer',
  'IT Personnel',
  'Public Relations Officer',
  'Logistics Coordinator',
  'Youth Representative',
  'Chapter Patron',
  'Advisor'
];

const EXECUTIVE_ROLES = ['Chairperson', 'Vice Chairperson', 'Secretary', 'Treasurer'];

const INITIAL_FORM = {
  name: '',
  role: 'Chairperson',
  custom_role: '',
  image: '',
  bio: '',
  email: '',
  phone: '',
  sort_order: 1,
  status: 'active'
};

const getAvatarGradient = (name = '') => {
  const colors = [
    'linear-gradient(135deg, #ef4444, #b91c1c)',
    'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    'linear-gradient(135deg, #10b981, #047857)',
    'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    'linear-gradient(135deg, #f59e0b, #b45309)',
    'linear-gradient(135deg, #ec4899, #be185d)',
    'linear-gradient(135deg, #06b6d4, #0e7490)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (!parts.length || !parts[0]) return 'RC';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const resolveLeaderImage = (img) => {
  if (!img) return null;
  if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:') || img.startsWith('/uploads/')) {
    return img;
  }
  return `https://kyuchapter.netlify.app/images/${img}`;
};

const getRoleIcon = (role) => {
  if (role === 'Chairperson') return <Crown size={14} />;
  if (role === 'Vice Chairperson') return <Star size={14} />;
  if (EXECUTIVE_ROLES.includes(role)) return <Shield size={14} />;
  return <Medal size={14} />;
};

const getRoleBadgeClass = (role) => {
  if (role === 'Chairperson') return 'role-chairperson';
  if (role === 'Vice Chairperson') return 'role-vice';
  if (EXECUTIVE_ROLES.includes(role)) return 'role-executive';
  return 'role-officer';
};

export default function Leaders() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('sort_order');
  const [viewMode, setViewMode] = useState('grid');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingLeader, setDeletingLeader] = useState(null);
  const [toast, setToast] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchLeaders = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get('/admin/leaders');
      if (res.data?.success) {
        setLeaders(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to load leaders', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchLeaders();
  }, [fetchLeaders]);

  const handleOpenAdd = () => {
    setEditingId(null);
    const nextOrder = leaders.length > 0 ? Math.max(...leaders.map(l => Number(l.sort_order) || 0)) + 1 : 1;
    setForm({
      ...INITIAL_FORM,
      sort_order: nextOrder
    });
    setShowModal(true);
  };

  const handleOpenEdit = (leader) => {
    setEditingId(leader.id);
    const isCustom = !COMMON_ROLES.includes(leader.role);
    setForm({
      name: leader.name || '',
      role: isCustom ? 'Other' : leader.role,
      custom_role: isCustom ? leader.role : '',
      image: leader.image || '',
      bio: leader.bio || '',
      email: leader.email || '',
      phone: leader.phone || '',
      sort_order: leader.sort_order ?? 0,
      status: leader.status || 'active'
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'leaders');

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        const fileUrl = res.data.data?.url;
        setForm(prev => ({ ...prev, image: fileUrl }));
        showToast('Image uploaded successfully!');
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Image upload failed', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Please enter the leader full name', 'error');
      return;
    }

    const finalRole = form.role === 'Other' ? (form.custom_role.trim() || 'Leader') : form.role;
    const payload = {
      name: form.name.trim(),
      role: finalRole,
      image: form.image.trim() || null,
      bio: form.bio.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      sort_order: parseInt(form.sort_order, 10) || 0,
      status: form.status
    };

    setIsSubmitting(true);
    try {
      if (editingId) {
        await api.patch(`/admin/leaders/${editingId}`, payload);
        showToast('Leader updated successfully!');
      } else {
        await api.post('/admin/leaders', payload);
        showToast('New leader added successfully!');
      }
      setShowModal(false);
      fetchLeaders();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to save leader profile', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingLeader) return;
    try {
      await api.delete(`/admin/leaders/${deletingLeader.id}`);
      showToast(`Leader "${deletingLeader.name}" deleted.`);
      setDeletingLeader(null);
      fetchLeaders();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to delete leader', 'error');
    }
  };

  const handleToggleStatus = async (leader) => {
    const nextStatus = leader.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/admin/leaders/${leader.id}`, { status: nextStatus });
      showToast(`Leader marked as ${nextStatus}`);
      fetchLeaders();
    } catch (err) {
      console.error(err);
      showToast('Failed to update status', 'error');
    }
  };

  const filteredLeaders = useMemo(() => {
    return leaders.filter(l => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          (l.name && l.name.toLowerCase().includes(q)) ||
          (l.role && l.role.toLowerCase().includes(q)) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          (l.phone && l.phone.includes(q));
        if (!match) return false;
      }
      if (roleFilter !== 'all' && l.role !== roleFilter) return false;
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'sort_order') return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
      if (sortBy === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      return 0;
    });
  }, [leaders, search, roleFilter, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const total = leaders.length;
    const active = leaders.filter(l => l.status === 'active').length;
    const inactive = leaders.filter(l => l.status === 'inactive').length;
    const executive = leaders.filter(l => EXECUTIVE_ROLES.includes(l.role)).length;
    return { total, active, inactive, executive };
  }, [leaders]);

  return (
    <div className="leaders-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`leader-toast ${toast.type}`}>
          <div className="toast-icon-wrap">
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          </div>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="leaders-header">
        <div className="leaders-header-title">
          <div className="header-icon-badge">
            <Award size={24} />
          </div>
          <div>
            <h1>Leadership Team</h1>
            <p>Manage chapter executives and department officers displayed on the public website</p>
          </div>
        </div>

        <div className="leaders-header-actions">
          <button
            className={`btn-refresh ${refreshing ? 'spinning' : ''}`}
            onClick={() => fetchLeaders(true)}
            title="Refresh list"
          >
            <RefreshCw size={17} />
          </button>
          <button className="btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>Add New Leader</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="leaders-stats-grid">
        <div className="leader-stat-card">
          <div className="leader-stat-icon total">
            <Users size={22} />
          </div>
          <div className="leader-stat-content">
            <span className="leader-stat-number">{stats.total}</span>
            <span className="leader-stat-label">Total Leaders</span>
          </div>
          <div className="stat-accent" />
        </div>

        <div className="leader-stat-card">
          <div className="leader-stat-icon active">
            <CheckCircle2 size={22} />
          </div>
          <div className="leader-stat-content">
            <span className="leader-stat-number">{stats.active}</span>
            <span className="leader-stat-label">Active on Website</span>
          </div>
          <div className="stat-accent" />
        </div>

        <div className="leader-stat-card">
          <div className="leader-stat-icon executive">
            <Shield size={22} />
          </div>
          <div className="leader-stat-content">
            <span className="leader-stat-number">{stats.executive}</span>
            <span className="leader-stat-label">Executive Officers</span>
          </div>
          <div className="stat-accent" />
        </div>

        <div className="leader-stat-card">
          <div className="leader-stat-icon inactive">
            <ArrowUpDown size={22} />
          </div>
          <div className="leader-stat-content">
            <span className="leader-stat-number">{stats.inactive}</span>
            <span className="leader-stat-label">Inactive Profiles</span>
          </div>
          <div className="stat-accent" />
        </div>
      </div>

      {/* Controls Bar */}
      <div className="leaders-controls-card">
        <div className="controls-left">
          <div className="leader-search-wrap">
            <Search size={16} className="leader-search-icon" />
            <input
              type="text"
              placeholder="Search by name, role, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="leader-search-input"
            />
            {search && (
              <button className="clear-search-btn" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <button
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={15} />
            <span>Filters</span>
            <ChevronDown size={14} className={`chevron ${showFilters ? 'rotated' : ''}`} />
          </button>

          {showFilters && (
            <>
              <select
                className="controls-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                {COMMON_ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <select
                className="controls-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              <select
                className="controls-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="sort_order">Display Order</option>
                <option value="name_asc">Name (A - Z)</option>
                <option value="name_desc">Name (Z - A)</option>
                <option value="newest">Recently Added</option>
              </select>
            </>
          )}
        </div>

        <div className="controls-right">
          <div className="view-mode-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid size={15} />
              <span>Cards</span>
            </button>
            <button
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List size={15} />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="leaders-empty-state">
          <div className="loading-spinner">
            <RefreshCw size={28} className="spinning" />
          </div>
          <div>Loading leadership profiles...</div>
        </div>
      ) : filteredLeaders.length === 0 ? (
        <div className="leaders-empty-state">
          <div className="empty-icon-wrap">
            <Award size={36} />
          </div>
          <h3>No leaders found</h3>
          <p>
            {search || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search query or filters.'
              : 'Add your first leadership team member to showcase them on the website.'}
          </p>
          <button className="btn-primary" style={{ marginTop: 14 }} onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>Add Leader</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="leaders-card-grid">
          {filteredLeaders.map((leader) => {
            const resolvedImg = resolveLeaderImage(leader.image);
            const isActive = leader.status === 'active';
            const isExecutive = EXECUTIVE_ROLES.includes(leader.role);
            const isChair = leader.role === 'Chairperson';

            return (
              <article className={`leader-grid-card ${isChair ? 'chair-card' : ''} ${isExecutive ? 'executive-card' : ''}`} key={leader.id}>
                <div className="leader-card-banner">
                  <div className="banner-gradient" />
                  <div className="banner-pattern" />
                  <span className="leader-order-badge">
                    <span className="order-hash">#</span>
                    {leader.sort_order ?? 0}
                  </span>
                  <button
                    className={`leader-status-pill ${isActive ? 'active' : 'inactive'}`}
                    onClick={() => handleToggleStatus(leader)}
                    title="Click to toggle status"
                  >
                    {isActive ? <Eye size={11} /> : <EyeOff size={11} />}
                    <span>{leader.status}</span>
                  </button>
                </div>

                <div className="leader-card-avatar-wrap">
                  <div className="avatar-ring">
                    {resolvedImg ? (
                      <img
                        src={resolvedImg}
                        alt={leader.name}
                        className="leader-card-photo"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="leader-card-initials"
                      style={{
                        background: getAvatarGradient(leader.name),
                        display: resolvedImg ? 'none' : 'flex'
                      }}
                    >
                      {getInitials(leader.name)}
                    </div>
                  </div>
                  {isChair && (
                    <div className="chair-crown-badge" title="Chairperson">
                      <Crown size={14} />
                    </div>
                  )}
                </div>

                <div className="leader-card-body">
                  <h3 className="leader-card-name">{leader.name}</h3>
                  <div className={`leader-role-badge ${getRoleBadgeClass(leader.role)}`}>
                    {getRoleIcon(leader.role)}
                    <span>{leader.role}</span>
                  </div>
                  {leader.bio && <p className="leader-card-bio">{leader.bio}</p>}

                  {(leader.email || leader.phone) && (
                    <div className="leader-card-contacts">
                      {leader.email && (
                        <a href={`mailto:${leader.email}`} className="leader-contact-link">
                          <Mail size={13} />
                          <span>{leader.email}</span>
                        </a>
                      )}
                      {leader.phone && (
                        <a href={`tel:${leader.phone}`} className="leader-contact-link">
                          <Phone size={13} />
                          <span>{leader.phone}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="leader-card-actions">
                  <button
                    className="leader-action-btn leader-action-edit"
                    onClick={() => handleOpenEdit(leader)}
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    className="leader-action-btn leader-action-delete"
                    onClick={() => setDeletingLeader(leader)}
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="leaders-table-wrap">
          <table className="leaders-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>Order</th>
                <th>Leader</th>
                <th>Role / Position</th>
                <th>Contact</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaders.map((leader) => {
                const resolvedImg = resolveLeaderImage(leader.image);
                return (
                  <tr key={leader.id}>
                    <td>
                      <span className="leader-order-badge table-order">
                        #{leader.sort_order ?? 0}
                      </span>
                    </td>
                    <td>
                      <div className="leader-table-user-cell">
                        <div className="table-avatar-ring">
                          {resolvedImg ? (
                            <img
                              src={resolvedImg}
                              alt={leader.name}
                              className="leader-table-thumb"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="leader-table-initials"
                            style={{
                              background: getAvatarGradient(leader.name),
                              display: resolvedImg ? 'none' : 'flex'
                            }}
                          >
                            {getInitials(leader.name)}
                          </div>
                        </div>
                        <div className="table-user-info">
                          <strong>{leader.name}</strong>
                          {leader.email && <span>{leader.email}</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`leader-role-badge table-role ${getRoleBadgeClass(leader.role)}`}>
                        {getRoleIcon(leader.role)}
                        <span>{leader.role}</span>
                      </span>
                    </td>
                    <td>
                      {leader.phone ? (
                        <span className="table-phone">{leader.phone}</span>
                      ) : (
                        <span className="table-empty">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`leader-status-pill table-status ${leader.status}`}>
                        {leader.status === 'active' ? <Eye size={11} /> : <EyeOff size={11} />}
                        <span>{leader.status}</span>
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="leader-action-btn leader-action-edit"
                          onClick={() => handleOpenEdit(leader)}
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="leader-action-btn leader-action-delete"
                          onClick={() => setDeletingLeader(leader)}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL: Add / Edit Leader ── */}
      {showModal && (
        <div className="leader-modal-overlay" onClick={() => !isSubmitting && setShowModal(false)}>
          <div className="leader-modal" onClick={(e) => e.stopPropagation()}>
            <div className="leader-modal-header">
              <div className="modal-header-content">
                <div className="modal-header-icon">
                  {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                </div>
                <div>
                  <h2>{editingId ? 'Edit Leader Profile' : 'Add Leadership Team Member'}</h2>
                  <p>{editingId ? 'Update the details of this leader' : 'Fill in the details to add a new leader'}</p>
                </div>
              </div>
              <button
                className="leader-modal-close"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="leader-modal-body">
                <div className="leader-form-group">
                  <label>Full Name <span className="required">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dennis Kiptanui"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="leader-form-input"
                  />
                </div>

                <div className="leader-form-row">
                  <div className="leader-form-group">
                    <label>Leadership Role / Title <span className="required">*</span></label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="leader-form-select"
                    >
                      {COMMON_ROLES.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                      <option value="Other">Other (Custom Title)</option>
                    </select>
                  </div>

                  {form.role === 'Other' && (
                    <div className="leader-form-group">
                      <label>Custom Title <span className="required">*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. Head of First Aid Training"
                        value={form.custom_role}
                        onChange={(e) => setForm({ ...form, custom_role: e.target.value })}
                        className="leader-form-input"
                      />
                    </div>
                  )}

                  <div className="leader-form-group">
                    <label>Display Priority / Order #</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="1, 2, 3..."
                      value={form.sort_order}
                      onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                      className="leader-form-input"
                    />
                  </div>
                </div>

                {/* Profile Photo / Upload */}
                <div className="leader-form-group">
                  <label>Leader Photo</label>
                  <div className="image-input-row">
                    <input
                      type="text"
                      placeholder="Image URL or filename (e.g. Dennis.jpeg)"
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                      className="leader-form-input"
                      style={{ flex: 1 }}
                    />
                    <label className="btn-upload">
                      <UploadCloud size={16} />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                  {form.image && (
                    <div className="image-preview-box">
                      <div className="preview-avatar-ring">
                        <img
                          src={resolveLeaderImage(form.image)}
                          alt="Preview"
                          className="image-preview-thumb"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/56?text=Image'; }}
                        />
                      </div>
                      <div className="preview-info">
                        <div className="preview-label">Image Source:</div>
                        <div className="preview-value">{form.image}</div>
                        <a
                          href={resolveLeaderImage(form.image)}
                          target="_blank"
                          rel="noreferrer"
                          className="preview-link"
                        >
                          <span>Open full photo</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="leader-form-row">
                  <div className="leader-form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="leader@kyu.ac.ke"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="leader-form-input"
                    />
                  </div>

                  <div className="leader-form-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      placeholder="+254 7..."
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="leader-form-input"
                    />
                  </div>
                </div>

                <div className="leader-form-row">
                  <div className="leader-form-group">
                    <label>Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="leader-form-select"
                    >
                      <option value="active">Active (Visible on Website)</option>
                      <option value="inactive">Inactive (Hidden)</option>
                    </select>
                  </div>
                </div>

                <div className="leader-form-group">
                  <label>Short Bio / Note</label>
                  <textarea
                    rows={3}
                    placeholder="Short summary of role, vision or dedication..."
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    className="leader-form-textarea"
                  />
                </div>
              </div>

              <div className="leader-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting || uploadingImage}>
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Leader' : 'Save Leader'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete Confirmation ── */}
      {deletingLeader && (
        <div className="leader-modal-overlay" onClick={() => setDeletingLeader(null)}>
          <div className="leader-modal delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="leader-modal-header delete-header">
              <div className="modal-header-content">
                <div className="modal-header-icon delete-icon">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h2>Confirm Removal</h2>
                  <p>This action cannot be undone</p>
                </div>
              </div>
              <button className="leader-modal-close" onClick={() => setDeletingLeader(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="leader-modal-body">
              <div className="delete-warning-box">
                <AlertCircle size={20} />
                <div>
                  <p className="delete-main-text">
                    Are you sure you want to remove <strong>{deletingLeader.name}</strong> ({deletingLeader.role}) from the leadership team?
                  </p>
                  <p className="delete-sub-text">
                    They will no longer appear on the public "Meet Our Leadership Team" section.
                  </p>
                </div>
              </div>
            </div>
            <div className="leader-modal-footer">
              <button className="btn-secondary" onClick={() => setDeletingLeader(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDelete}>
                <Trash2 size={15} />
                Delete Leader
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}