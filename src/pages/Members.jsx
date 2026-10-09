import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './Members.css';
import api from '../utils/api';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Search,
  X,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Check,
  Ban,
  PlayCircle,
  Key,
  Lock,
  ShieldAlert
} from 'lucide-react';

const ROLES = [
  'Member',
  'Volunteer',
  'First Aider',
  'Coordinator',
  'Youth Leader',
  'Chapter Patron',
  'Secretary',
  'Treasurer',
  'Admin',
  'Super Admin'
];

const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  role: 'Member',
  status: 'active',
  password: 'Redcross',
  joined: new Date().toISOString().split('T')[0],
  notes: ''
};

// Generates an avatar gradient based on the member's name
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
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const getInitials = (name = '') => {
  if (!name) return 'RC';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Modals & Drawers
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [viewingMember, setViewingMember] = useState(null);
  const [rejectingMember, setRejectingMember] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [deletingMember, setDeletingMember] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Toast feedback
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchMembers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (sortBy) params.append('sort', sortBy);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get(`/admin/members${queryString}`);
      if (res.data.success) {
        setMembers(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
      showToast(err.response?.data?.message || 'Error fetching members from server', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, roleFilter, sortBy]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Real-time metric counts across all loaded members or via query
  const stats = useMemo(() => {
    const total = members.length;
    let active = 0;
    let pending = 0;
    let inactive = 0;
    let rejected = 0;

    members.forEach((m) => {
      const s = (m.status || '').toLowerCase();
      if (s === 'active' || s === 'approved') active++;
      else if (s === 'pending') pending++;
      else if (s === 'inactive') inactive++;
      else if (s === 'rejected') rejected++;
    });

    return { total, active, pending, inactive, rejected };
  }, [members]);

  // Open Add Member Modal
  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({ ...INITIAL_FORM, password: 'Redcross' });
    setFormErrors({});
    setShowAddEditModal(true);
  };

  // Open Edit Member Modal
  const handleOpenEdit = (m) => {
    setEditingId(m.id);
    setForm({
      name: m.name || '',
      email: m.email || '',
      phone: m.phone || '',
      role: m.role || 'Member',
      status: m.status || 'active',
      password: '',
      joined: m.joined ? m.joined.split('T')[0] : new Date().toISOString().split('T')[0],
      notes: m.notes || ''
    });
    setFormErrors({});
    setShowAddEditModal(true);
    if (viewingMember) setViewingMember(null);
  };

  // Open Reset Password Dialog
  const handleOpenReset = (m) => {
    setResettingMember(m);
    setResetPasswordInput('Redcross');
  };

  // Confirm Reset Password
  const handleConfirmReset = async () => {
    if (!resettingMember) return;
    setIsResetting(true);
    try {
      const res = await api.post(`/admin/members/${resettingMember.id}/reset-password`, {
        newPassword: resetPasswordInput.trim() || 'Redcross'
      });
      if (res.data.success) {
        showToast(`Password for "${resettingMember.name}" reset to "${resetPasswordInput.trim() || 'Redcross'}" and email dispatched.`);
        setResettingMember(null);
      }
    } catch (err) {
      console.error('Password reset error:', err);
      showToast(err.response?.data?.message || 'Failed to reset member password', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Full name is required';
    if (!form.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save (Create or Update)
  const handleSaveMember = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        const res = await api.patch(`/admin/members/${editingId}`, form);
        if (res.data.success) {
          showToast(`Member "${form.name}" updated successfully.`);
        }
      } else {
        const res = await api.post('/admin/members', form);
        if (res.data.success) {
          showToast(`New member "${form.name}" added successfully.`);
        }
      }
      setShowAddEditModal(false);
      fetchMembers();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to save member details', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Accept / Approve Member Application
  const handleAcceptMember = async (member) => {
    setActionLoadingId(member.id);
    try {
      const res = await api.patch(`/admin/members/${member.id}/accept`);
      if (res.data.success) {
        showToast(`Accepted application for "${member.name}". Status changed to Active.`);
        fetchMembers();
        if (viewingMember && viewingMember.id === member.id) {
          setViewingMember({ ...viewingMember, status: 'active' });
        }
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to accept member', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Reject Dialog
  const handleOpenReject = (member) => {
    setRejectingMember(member);
    setRejectionReason('');
  };

  // Confirm Reject Application
  const handleConfirmReject = async () => {
    if (!rejectingMember) return;
    setActionLoadingId(rejectingMember.id);
    try {
      const res = await api.patch(`/admin/members/${rejectingMember.id}/reject`, {
        reason: rejectionReason || 'Application rejected by chapter admin'
      });
      if (res.data.success) {
        showToast(`Application for "${rejectingMember.name}" has been rejected.`);
        setRejectingMember(null);
        fetchMembers();
        if (viewingMember && viewingMember.id === rejectingMember.id) {
          setViewingMember({ ...viewingMember, status: 'rejected', notes: rejectionReason || viewingMember.notes });
        }
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to reject member application', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Toggle Deactivate / Activate
  const handleToggleStatus = async (member) => {
    const isCurrentlyActive = member.status === 'active' || member.status === 'approved';
    const newStatus = isCurrentlyActive ? 'inactive' : 'active';
    setActionLoadingId(member.id);
    try {
      const res = await api.patch(`/admin/members/${member.id}/status`, { status: newStatus });
      if (res.data.success) {
        showToast(`Member "${member.name}" is now ${newStatus}.`);
        fetchMembers();
        if (viewingMember && viewingMember.id === member.id) {
          setViewingMember({ ...viewingMember, status: newStatus });
        }
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to update member status', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Member
  const handleConfirmDelete = async () => {
    if (!deletingMember) return;
    setActionLoadingId(deletingMember.id);
    try {
      const res = await api.delete(`/admin/members/${deletingMember.id}`);
      if (res.data.success) {
        showToast(`Member "${deletingMember.name}" deleted successfully.`);
        setDeletingMember(null);
        if (viewingMember && viewingMember.id === deletingMember.id) {
          setViewingMember(null);
        }
        fetchMembers();
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to delete member', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Render role badge with unique palette
  const renderRoleBadge = (role = 'Member') => {
    const formatted = role.toLowerCase().replace(/\s+/g, '');
    let className = 'role-member';
    if (formatted.includes('superadmin')) className = 'role-superadmin';
    else if (formatted.includes('admin')) className = 'role-admin';
    else if (formatted.includes('firstaid')) className = 'role-firstaider';
    else if (formatted.includes('coordinator')) className = 'role-coordinator';
    else if (formatted.includes('volunteer')) className = 'role-volunteer';
    else if (formatted.includes('patron')) className = 'role-patron';

    return <span className={`role-badge ${className}`}>{role}</span>;
  };

  // Render status badge with dot
  const renderStatusBadge = (status = 'active') => {
    const s = status.toLowerCase();
    return (
      <span className={`badge-status ${s}`}>
        <span className="badge-status-dot" />
        {status}
      </span>
    );
  };

  return (
    <div className="members-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`member-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="members-header">
        <div className="members-header-title">
          <h1>
            <Users size={26} color="var(--redcross-red)" />
            Chapter Members & Volunteers
          </h1>
          <p>Manage registrations, approve pending applicants, update roles and membership statuses</p>
        </div>

        <div className="members-header-actions">
          <button
            className={`btn-refresh ${refreshing ? 'spinning' : ''}`}
            onClick={() => fetchMembers(true)}
            title="Refresh list"
            disabled={refreshing}
          >
            <RefreshCw size={15} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button className="btn-primary" onClick={handleOpenAdd}>
            <UserPlus size={16} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="members-stats-grid">
        <div
          className={`member-stat-card ${statusFilter === 'all' ? 'active-filter' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          <div className="member-stat-info">
            <span className="member-stat-label">Total Registered</span>
            <span className="member-stat-value">{stats.total}</span>
          </div>
          <div className="member-stat-icon stat-icon-total">
            <Users size={22} />
          </div>
        </div>

        <div
          className={`member-stat-card ${statusFilter === 'active' ? 'active-filter' : ''}`}
          onClick={() => setStatusFilter('active')}
        >
          <div className="member-stat-info">
            <span className="member-stat-label">Active Members</span>
            <span className="member-stat-value">{stats.active}</span>
          </div>
          <div className="member-stat-icon stat-icon-active">
            <UserCheck size={22} />
          </div>
        </div>

        <div
          className={`member-stat-card ${statusFilter === 'pending' ? 'active-filter' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          <div className="member-stat-info">
            <span className="member-stat-label">Pending Applications</span>
            <span className="member-stat-value">{stats.pending}</span>
          </div>
          <div className="member-stat-icon stat-icon-pending">
            <Clock size={22} />
          </div>
        </div>

        <div
          className={`member-stat-card ${statusFilter === 'inactive' ? 'active-filter' : ''}`}
          onClick={() => setStatusFilter('inactive')}
        >
          <div className="member-stat-info">
            <span className="member-stat-label">Inactive / Suspended</span>
            <span className="member-stat-value">{stats.inactive}</span>
          </div>
          <div className="member-stat-icon stat-icon-inactive">
            <UserX size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="members-filter-bar">
        <div className="filter-row-top">
          {/* Status Tabs */}
          <div className="status-tabs">
            <button
              className={`status-tab ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All Members
              <span className="status-tab-count">{stats.total}</span>
            </button>
            <button
              className={`status-tab ${statusFilter === 'active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >
              Active
              <span className="status-tab-count">{stats.active}</span>
            </button>
            <button
              className={`status-tab ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pending')}
            >
              Pending
              <span className="status-tab-count">{stats.pending}</span>
            </button>
            <button
              className={`status-tab ${statusFilter === 'inactive' ? 'active' : ''}`}
              onClick={() => setStatusFilter('inactive')}
            >
              Inactive
              <span className="status-tab-count">{stats.inactive}</span>
            </button>
            <button
              className={`status-tab ${statusFilter === 'rejected' ? 'active' : ''}`}
              onClick={() => setStatusFilter('rejected')}
            >
              Rejected
              <span className="status-tab-count">{stats.rejected}</span>
            </button>
          </div>
        </div>

        <div className="filter-row-controls">
          {/* Search Box */}
          <div className="search-box-wrapper">
            <Search size={16} className="search-box-icon" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-box-input"
            />
            {search && (
              <button className="clear-search-btn" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <select
            className="filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name_asc">Name (A - Z)</option>
            <option value="name_desc">Name (Z - A)</option>
          </select>
        </div>
      </div>

      {/* Members Data Table */}
      {loading ? (
        <div className="empty-state">
          <RefreshCw size={24} className="spinning" style={{ marginBottom: 10 }} />
          <div>Loading members database...</div>
        </div>
      ) : members.length === 0 ? (
        <div className="empty-state">
          <AlertCircle size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
          <h3>No members found</h3>
          <p style={{ marginTop: 6, fontSize: 13 }}>
            {search || statusFilter !== 'all' || roleFilter !== 'all'
              ? 'Try resetting your search filters to find members.'
              : 'No members are registered in the system yet.'}
          </p>
          {(search || statusFilter !== 'all' || roleFilter !== 'all') && (
            <button
              className="btn-secondary"
              style={{ marginTop: 14 }}
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setRoleFilter('all');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="members-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Joined / Applied</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const s = (m.status || '').toLowerCase();
                const isPending = s === 'pending';
                const isActive = s === 'active' || s === 'approved';
                const isRejected = s === 'rejected';
                const isInactive = s === 'inactive';
                const isActing = actionLoadingId === m.id;

                return (
                  <tr key={m.id}>
                    {/* Member Info */}
                    <td>
                      <div className="member-info-cell">
                        <div
                          className="member-avatar"
                          style={{ background: getAvatarGradient(m.name) }}
                        >
                          {getInitials(m.name)}
                        </div>
                        <div className="member-meta">
                          <span className="member-name">
                            {m.name}
                            {m.is_admin && (
                              <span className="admin-tag" title="Registered Administrator Account">
                                <ShieldCheck size={11} /> Admin
                              </span>
                            )}
                          </span>
                          <span className="member-email">{m.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td>
                      {m.phone ? (
                        <a href={`tel:${m.phone}`} className="member-phone">
                          <Phone size={13} />
                          {m.phone}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-subtle)' }}>—</span>
                      )}
                    </td>

                    {/* Role */}
                    <td>{renderRoleBadge(m.role)}</td>

                    {/* Joined Date */}
                    <td style={{ whiteSpace: 'nowrap', fontSize: 13, color: 'var(--text-muted)' }}>
                      {formatDate(m.joined || m.created_at)}
                    </td>

                    {/* Status */}
                    <td>{renderStatusBadge(m.status)}</td>

                    {/* Actions */}
                    <td>
                      <div className="members-actions-cell" style={{ justifyContent: 'flex-end' }}>
                        {/* View Details Button */}
                        <button
                          className="btn-action-icon btn-action-view"
                          onClick={() => setViewingMember(m)}
                          title="View Full Profile"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Accept & Reject for Pending Applications */}
                        {isPending && (
                          <>
                            <button
                              className="btn-action-icon btn-action-accept"
                              onClick={() => handleAcceptMember(m)}
                              title="Accept Application"
                              disabled={isActing}
                            >
                              <Check size={15} />
                            </button>
                            <button
                              className="btn-action-icon btn-action-reject"
                              onClick={() => handleOpenReject(m)}
                              title="Reject Application"
                              disabled={isActing}
                            >
                              <X size={15} />
                            </button>
                          </>
                        )}

                        {/* Re-accept button if rejected */}
                        {isRejected && (
                          <button
                            className="btn-action-icon btn-action-accept"
                            onClick={() => handleAcceptMember(m)}
                            title="Re-activate / Accept Member"
                            disabled={isActing}
                          >
                            <Check size={15} />
                          </button>
                        )}

                        {/* Activate / Deactivate button for Active & Inactive */}
                        {isActive && (
                          <button
                            className="btn-action-deactivate"
                            onClick={() => handleToggleStatus(m)}
                            title="Deactivate Member"
                            disabled={isActing}
                          >
                            <Ban size={13} />
                            <span>Deactivate</span>
                          </button>
                        )}

                        {isInactive && (
                          <button
                            className="btn-action-activate"
                            onClick={() => handleToggleStatus(m)}
                            title="Activate Member"
                            disabled={isActing}
                          >
                            <PlayCircle size={13} />
                            <span>Activate</span>
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          className="btn-action-icon btn-action-edit"
                          onClick={() => handleOpenEdit(m)}
                          title="Edit Member"
                          disabled={isActing}
                        >
                          <Edit size={14} />
                        </button>

                        {/* Delete Button */}
                        <button
                          className="btn-action-icon btn-action-delete"
                          onClick={() => setDeletingMember(m)}
                          title="Delete Member"
                          disabled={isActing}
                        >
                          <Trash2 size={14} />
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

      {/* ── MODAL: Add / Edit Member ── */}
      {showAddEditModal && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setShowAddEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header-with-badge">
              <h2>{editingId ? 'Edit Member Details' : 'Add New Member'}</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowAddEditModal(false)}
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMember}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Samuel Mwangi"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={formErrors.name ? { borderColor: 'var(--redcross-red)' } : {}}
                />
                {formErrors.name && <span style={{ color: 'var(--redcross-red)', fontSize: 12 }}>{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. member@ku.ac.ke"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={formErrors.email ? { borderColor: 'var(--redcross-red)' } : {}}
                />
                {formErrors.email && <span style={{ color: 'var(--redcross-red)', fontSize: 12 }}>{formErrors.email}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    placeholder="+254 7..."
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Chapter Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Membership Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending Application</option>
                    <option value="inactive">Inactive</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Joined / Applied Date</label>
                  <input
                    type="date"
                    value={form.joined}
                    onChange={(e) => setForm({ ...form, joined: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes / Certifications / Student Info</label>
                <textarea
                  rows={3}
                  placeholder="e.g. First Aid Level 1 Certified, Blood Group O+, Student ID: KU/1234/2024"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
                <span className="form-helper-text">Optional notes or chapter qualifications.</span>
              </div>

              <div className="form-group">
                <label>
                  <Lock size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Member Password (Default: Redcross)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Redcross"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
                <span className="form-helper-text" style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <ShieldAlert size={13} style={{ flexShrink: 0, marginTop: 2, color: '#ef4444' }} />
                  Default password is "Redcross". The member will receive their login credentials in their email after registration along with a guide on how to change it in their profile section.
                </span>
              </div>

              <div className="form-actions" style={{ marginTop: 24 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddEditModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Member' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Member Details Profile Drawer ── */}
      {viewingMember && (
        <div className="modal-overlay" onClick={() => setViewingMember(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header-with-badge">
              <h2>Member Profile</h2>
              <button className="modal-close-btn" onClick={() => setViewingMember(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="member-details-card">
              <div className="member-details-hero">
                <div
                  className="member-details-avatar"
                  style={{ background: getAvatarGradient(viewingMember.name) }}
                >
                  {getInitials(viewingMember.name)}
                </div>
                <div>
                  <h3 style={{ fontSize: 18, margin: 0, fontWeight: 800 }}>
                    {viewingMember.name}
                    {viewingMember.is_admin && (
                      <span className="admin-tag" style={{ fontSize: 11, marginLeft: 8 }}>
                        <ShieldCheck size={12} /> Chapter Administrator
                      </span>
                    )}
                  </h3>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                    {renderRoleBadge(viewingMember.role)}
                    {renderStatusBadge(viewingMember.status)}
                  </div>
                </div>
              </div>

              <div className="member-details-grid">
                <div className="member-details-item">
                  <label>Email Address</label>
                  <span>
                    <Mail size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                    {viewingMember.email}
                  </span>
                </div>

                <div className="member-details-item">
                  <label>Phone Number</label>
                  <span>
                    <Phone size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                    {viewingMember.phone || 'Not provided'}
                  </span>
                </div>

                <div className="member-details-item">
                  <label>Joined / Applied</label>
                  <span>
                    <Calendar size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                    {formatDate(viewingMember.joined || viewingMember.created_at)}
                  </span>
                </div>

                <div className="member-details-item">
                  <label>Database Record ID</label>
                  <span>#{viewingMember.id}</span>
                </div>
              </div>

              {viewingMember.notes && (
                <div className="member-details-item">
                  <label>Notes & Qualifications</label>
                  <div className="member-details-notes">
                    {viewingMember.notes}
                  </div>
                </div>
              )}

              {/* Quick Actions in View Profile */}
              <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                {viewingMember.status === 'pending' && (
                  <>
                    <button
                      className="btn-approve"
                      style={{ flex: 1 }}
                      onClick={() => handleAcceptMember(viewingMember)}
                    >
                      <Check size={15} style={{ marginRight: 6 }} /> Accept Application
                    </button>
                    <button
                      className="btn-reject"
                      style={{ flex: 1 }}
                      onClick={() => handleOpenReject(viewingMember)}
                    >
                      <X size={15} style={{ marginRight: 6 }} /> Reject
                    </button>
                  </>
                )}

                {viewingMember.status === 'active' && (
                  <button
                    className="btn-reject"
                    style={{ flex: 1 }}
                    onClick={() => handleToggleStatus(viewingMember)}
                  >
                    <Ban size={15} style={{ marginRight: 6 }} /> Deactivate Member
                  </button>
                )}

                {viewingMember.status === 'inactive' && (
                  <button
                    className="btn-approve"
                    style={{ flex: 1 }}
                    onClick={() => handleToggleStatus(viewingMember)}
                  >
                    <PlayCircle size={15} style={{ marginRight: 6 }} /> Activate Member
                  </button>
                )}

                <button
                  className="btn-edit"
                  onClick={() => handleOpenEdit(viewingMember)}
                >
                  <Edit size={15} style={{ marginRight: 6 }} /> Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Reject Application Reason ── */}
      {rejectingMember && (
        <div className="modal-overlay" onClick={() => setRejectingMember(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header-with-badge">
              <h2 style={{ color: 'var(--redcross-red)' }}>Reject Application</h2>
              <button className="modal-close-btn" onClick={() => setRejectingMember(null)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: 13.5, color: 'var(--text-body)', marginBottom: 16 }}>
              Are you sure you want to reject the application for <strong>{rejectingMember.name}</strong>?
            </p>

            <div className="form-group">
              <label>Rejection Reason / Internal Note (Optional)</label>
              <textarea
                rows={3}
                placeholder="e.g. Incomplete application or outside chapter jurisdiction..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>

            <div className="form-actions" style={{ marginTop: 20 }}>
              <button
                className="btn-secondary"
                onClick={() => setRejectingMember(null)}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleConfirmReject}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete Member Confirmation ── */}
      {deletingMember && (
        <div className="modal-overlay" onClick={() => setDeletingMember(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header-with-badge">
              <h2 style={{ color: '#dc2626' }}>Delete Member</h2>
              <button className="modal-close-btn" onClick={() => setDeletingMember(null)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.6 }}>
              Are you sure you want to permanently delete <strong>{deletingMember.name}</strong> ({deletingMember.email}) from the database?
            </p>

            <div className="form-actions" style={{ marginTop: 24 }}>
              <button
                className="btn-secondary"
                onClick={() => setDeletingMember(null)}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleConfirmDelete}
              >
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Members;
