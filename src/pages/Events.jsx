import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './Events.css';
import api from '../utils/api';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  RefreshCw,
  LayoutGrid,
  List,
  Tag,
  User,
  Image as ImageIcon,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

const CATEGORIES = [
  'General',
  'First Aid & CPR',
  'Blood Donation',
  'Community Outreach',
  'Training Workshop',
  'Disaster Preparedness',
  'Youth & Leadership',
  'Annual Meeting'
];

const INITIAL_FORM = {
  title: '',
  category: 'General',
  date: '',
  time: '09:00',
  location: '',
  description: '',
  image_url: '',
  status: 'approved'
};

const resolveEventImage = (img) => {
  if (!img) return 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800';
  if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:') || img.startsWith('/uploads/')) {
    return img;
  }
  return `https://kyuchapter.netlify.app/images/${img}`;
};

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  // Reject Modal
  const [rejectingEvent, setRejectingEvent] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Delete Modal
  const [deletingEvent, setDeletingEvent] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/events');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setEvents(res.data.data);
      } else if (Array.isArray(res.data)) {
        setEvents(res.data);
      } else if (res.data?.data) {
        setEvents(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      showToast('Failed to load events from server.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Filter and Sort Events
  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      // Status filter
      if (statusFilter !== 'all' && (ev.status || 'pending').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'all' && (ev.category || 'General').toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const titleMatch = (ev.title || '').toLowerCase().includes(q);
        const locMatch = (ev.location || '').toLowerCase().includes(q);
        const descMatch = (ev.description || '').toLowerCase().includes(q);
        const submitterMatch = (ev.submitted_by_name || '').toLowerCase().includes(q);
        if (!titleMatch && !locMatch && !descMatch && !submitterMatch) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      if (sortBy === 'date_asc') return new Date(a.date || '9999') - new Date(b.date || '9999');
      if (sortBy === 'date_desc') return new Date(b.date || '0000') - new Date(a.date || '0000');
      // Default newest
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [events, statusFilter, categoryFilter, searchTerm, sortBy]);

  // Stats Counters
  const stats = useMemo(() => {
    const total = events.length;
    const approved = events.filter(e => (e.status || '').toLowerCase() === 'approved').length;
    const pending = events.filter(e => (e.status || 'pending').toLowerCase() === 'pending').length;
    const rejected = events.filter(e => (e.status || '').toLowerCase() === 'rejected').length;
    return { total, approved, pending, rejected };
  }, [events]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setShowModal(true);
  };

  const openEditModal = (ev) => {
    setEditingId(ev.id);
    setForm({
      title: ev.title || '',
      category: ev.category || 'General',
      date: ev.date || '',
      time: ev.time || '09:00',
      location: ev.location || '',
      description: ev.description || '',
      image_url: ev.image_url || '',
      status: ev.status || 'approved'
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!form.title.trim()) {
      showToast('Event title is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const res = await api.patch(`/admin/events/${editingId}`, form);
        if (res.data?.success || res.status === 200) {
          showToast('Event updated successfully!');
          setShowModal(false);
          fetchEvents();
        }
      } else {
        const res = await api.post('/admin/events', form);
        if (res.data?.success || res.status === 201) {
          showToast('New event created and published!');
          setShowModal(false);
          fetchEvents();
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error saving event';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await api.patch(`/admin/events/${id}/approve`);
      if (res.data?.success || res.status === 200) {
        showToast('Event approved and published to website!');
        fetchEvents();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve event.', 'error');
    }
  };

  const openRejectDialog = (ev) => {
    setRejectingEvent(ev);
    setRejectionReason('Schedule conflict or requires more details.');
  };

  const confirmReject = async () => {
    if (!rejectingEvent) return;
    try {
      const res = await api.patch(`/admin/events/${rejectingEvent.id}/reject`, {
        reason: rejectionReason
      });
      if (res.data?.success || res.status === 200) {
        showToast(`Event "${rejectingEvent.title}" was marked as rejected.`);
        setRejectingEvent(null);
        fetchEvents();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject event.', 'error');
    }
  };

  const openDeleteDialog = (ev) => {
    setDeletingEvent(ev);
  };

  const confirmDelete = async () => {
    if (!deletingEvent) return;
    try {
      await api.delete(`/admin/events/${deletingEvent.id}`);
      showToast('Event removed successfully.');
      setDeletingEvent(null);
      fetchEvents();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete event.', 'error');
    }
  };

  return (
    <div className="events-container">
      {/* Toast Alert */}
      {toast && (
        <div className={`events-toast ${toast.type}`}>
          <div className="toast-icon-wrap">
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          </div>
          <span>{toast.message}</span>
          <button className="clear-search-btn" onClick={() => setToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="events-header">
        <div className="events-title-area">
          <h1>
            <Calendar size={28} color="#dc2626" />
            Events Management
          </h1>
          <p>Create, manage, review member-submitted events, and publish to the chapter website.</p>
        </div>
        <div className="events-header-actions">
          <button className="btn-events-secondary" onClick={fetchEvents} title="Refresh Events List">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <button className="btn-events-primary" onClick={openCreateModal}>
            <Plus size={18} />
            + Create Event
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="events-stats-grid">
        <div
          className={`events-stat-card ${statusFilter === 'all' ? 'active-stat' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          <div className="stat-icon-box total">
            <Calendar size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-num">{stats.total}</div>
            <div className="stat-label">Total Events</div>
          </div>
        </div>

        <div
          className={`events-stat-card ${statusFilter === 'pending' ? 'active-stat' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          <div className="stat-icon-box pending">
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-num">{stats.pending}</div>
            <div className="stat-label">Pending Approval</div>
          </div>
        </div>

        <div
          className={`events-stat-card ${statusFilter === 'approved' ? 'active-stat' : ''}`}
          onClick={() => setStatusFilter('approved')}
        >
          <div className="stat-icon-box approved">
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-num">{stats.approved}</div>
            <div className="stat-label">Live on Website</div>
          </div>
        </div>

        <div
          className={`events-stat-card ${statusFilter === 'rejected' ? 'active-stat' : ''}`}
          onClick={() => setStatusFilter('rejected')}
        >
          <div className="stat-icon-box rejected">
            <XCircle size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-num">{stats.rejected}</div>
            <div className="stat-label">Rejected / Archived</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="events-toolbar">
        <div className="toolbar-top">
          <div className="search-box-wrap">
            <Search className="search-icon-inside" size={17} />
            <input
              type="text"
              className="search-input-field"
              placeholder="Search by event title, location, category, submitter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
                <X size={15} />
              </button>
            )}
          </div>

          <div className="toolbar-controls">
            <select
              className="select-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              className="select-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Created: Newest First</option>
              <option value="oldest">Created: Oldest First</option>
              <option value="date_asc">Event Date: Upcoming</option>
              <option value="date_desc">Event Date: Furthest</option>
            </select>

            <div className="view-mode-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid Cards View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Table List View"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Status Pill Tabs */}
        <div className="status-tabs-strip">
          <button
            className={`status-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Events
            <span className="tab-badge">{stats.total}</span>
          </button>
          <button
            className={`status-tab-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending Review
            <span className={`tab-badge ${stats.pending > 0 ? 'pending-glow' : ''}`}>
              {stats.pending}
            </span>
          </button>
          <button
            className={`status-tab-btn ${statusFilter === 'approved' ? 'active' : ''}`}
            onClick={() => setStatusFilter('approved')}
          >
            Approved (Live)
            <span className="tab-badge">{stats.approved}</span>
          </button>
          <button
            className={`status-tab-btn ${statusFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => setStatusFilter('rejected')}
          >
            Rejected
            <span className="tab-badge">{stats.rejected}</span>
          </button>
        </div>
      </div>

      {/* Events List / Grid */}
      {loading ? (
        <div className="events-empty-state">
          <div className="empty-icon-circle spin">
            <RefreshCw size={24} />
          </div>
          <h3>Loading chapter events...</h3>
          <p>Connecting to database and fetching latest schedule.</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="events-empty-state">
          <div className="empty-icon-circle">
            <Calendar size={28} />
          </div>
          <h3>No events found</h3>
          <p>
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Try changing your search keywords or filter criteria.'
              : 'There are currently no events registered. Click "+ Create Event" to add the first one!'}
          </p>
          {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              className="btn-events-secondary"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCategoryFilter('all');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="admin-events-grid">
          {filteredEvents.map(ev => {
            const status = (ev.status || 'pending').toLowerCase();
            return (
              <div key={ev.id} className={`admin-event-card card-${status}`}>
                {/* Banner image & category overlay */}
                <div className="card-media-banner">
                  <img
                    src={resolveEventImage(ev.image_url)}
                    alt={ev.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800';
                    }}
                  />
                  <div className="card-media-overlay">
                    <span className="category-tag-pill">{ev.category || 'General'}</span>
                    <span className={`status-badge-pill ${status}`}>
                      {status === 'approved' && <CheckCircle2 size={12} />}
                      {status === 'pending' && <Clock size={12} />}
                      {status === 'rejected' && <XCircle size={12} />}
                      {status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="card-body-content">
                  <div className="card-meta-datetime">
                    <div className="meta-date-item">
                      <Calendar size={14} />
                      <span>{ev.date ? new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBD'}</span>
                    </div>
                    {ev.time && (
                      <div className="meta-time-item">
                        <Clock size={14} />
                        <span>{ev.time}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="card-title-text">{ev.title}</h3>

                  <div className="card-location-row">
                    <MapPin size={14} color="#dc2626" />
                    <span>{ev.location || 'Location to be communicated'}</span>
                  </div>

                  <p className="card-description-text">{ev.description || 'No detailed description provided.'}</p>

                  {/* Submitter Info */}
                  <div className="card-submitter-box">
                    <div className="submitter-avatar-circle">
                      {(ev.submitted_by_name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <span>
                      Submitted by: <strong>{ev.submitted_by_name || 'Administrator'}</strong>
                      {ev.submitted_by_email && ` (${ev.submitted_by_email})`}
                    </span>
                  </div>

                  {/* Rejection Note */}
                  {status === 'rejected' && ev.rejection_reason && (
                    <div className="rejection-reason-box">
                      <strong>Rejection Note:</strong>
                      {ev.rejection_reason}
                    </div>
                  )}
                </div>

                {/* Footer Action Bar */}
                <div className="card-actions-footer">
                  <div className="actions-left-group">
                    {status === 'pending' && (
                      <>
                        <button
                          className="btn-action-approve"
                          onClick={() => handleApprove(ev.id)}
                          title="Approve & Publish to website"
                        >
                          <CheckCircle2 size={14} />
                          Approve
                        </button>
                        <button
                          className="btn-action-reject"
                          onClick={() => openRejectDialog(ev)}
                          title="Reject event proposal"
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      </>
                    )}
                    {status === 'rejected' && (
                      <button
                        className="btn-action-approve"
                        onClick={() => handleApprove(ev.id)}
                        title="Re-approve this event"
                      >
                        <CheckCircle2 size={14} />
                        Re-approve
                      </button>
                    )}
                    {status === 'approved' && (
                      <button
                        className="btn-action-reject"
                        onClick={() => openRejectDialog(ev)}
                        title="Unpublish / Reject"
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    )}
                  </div>

                  <div className="actions-right-group">
                    <button
                      className="btn-action-edit"
                      onClick={() => openEditModal(ev)}
                      title="Edit event details"
                    >
                      <Edit2 size={13} />
                      Edit
                    </button>
                    <button
                      className="btn-action-delete"
                      onClick={() => openDeleteDialog(ev)}
                      title="Delete event completely"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="events-table-wrapper">
          <table className="events-data-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Category</th>
                <th>Date & Time</th>
                <th>Location</th>
                <th>Submitter</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map(ev => {
                const status = (ev.status || 'pending').toLowerCase();
                return (
                  <tr key={ev.id}>
                    <td>
                      <strong style={{ color: '#111827' }}>{ev.title}</strong>
                    </td>
                    <td>
                      <span className="category-tag-pill" style={{ background: '#f3f4f6', color: '#374151' }}>
                        {ev.category || 'General'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#dc2626' }}>
                        {ev.date ? new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
                      </span>
                      {ev.time && <div style={{ fontSize: '12px', color: '#6b7280' }}>{ev.time}</div>}
                    </td>
                    <td>{ev.location || '—'}</td>
                    <td>{ev.submitted_by_name || 'Administrator'}</td>
                    <td>
                      <span className={`status-badge-pill ${status}`}>
                        {status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {status === 'pending' && (
                          <button
                            className="btn-action-approve"
                            onClick={() => handleApprove(ev.id)}
                            title="Approve"
                          >
                            <CheckCircle2 size={13} />
                          </button>
                        )}
                        <button
                          className="btn-action-edit"
                          onClick={() => openEditModal(ev)}
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn-action-delete"
                          onClick={() => openDeleteDialog(ev)}
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

      {/* CREATE / EDIT EVENT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div className="events-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header-bar">
              <h2>{editingId ? 'Edit Event Details' : 'Create New Chapter Event'}</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-body-form">
              <div className="form-field-group">
                <label>Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basic First Aid & CPR Training Workshop"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="form-field-row">
                <div className="form-field-group">
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field-group">
                  <label>Initial Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="approved">Approved (Publish Immediately)</option>
                    <option value="pending">Pending Review</option>
                  </select>
                </div>
              </div>

              <div className="form-field-row">
                <div className="form-field-group">
                  <label>Event Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                  />
                </div>

                <div className="form-field-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={e => setForm({ ...form, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-field-group">
                <label>Event Location / Venue</label>
                <input
                  type="text"
                  placeholder="e.g. Main Auditorium B / Science Complex Lab 3"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                />
              </div>

              <div className="form-field-group">
                <label>Banner Image URL</label>
                <input
                  type="text"
                  placeholder="https://... or sample image name"
                  value={form.image_url}
                  onChange={e => setForm({ ...form, image_url: e.target.value })}
                />
                {form.image_url && (
                  <div className="image-preview-box">
                    <img src={resolveEventImage(form.image_url)} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="form-field-group">
                <label>Event Description & Agenda</label>
                <textarea
                  rows={4}
                  placeholder="Describe the event, target audience, schedule, what volunteers should bring..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn-events-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-events-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving Event...' : editingId ? 'Save Changes' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingEvent && (
        <div className="modal-overlay" onClick={() => setRejectingEvent(null)}>
          <div className="events-modal-card" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-bar">
              <h2>Reject Event Proposal</h2>
              <button className="modal-close-btn" onClick={() => setRejectingEvent(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-form">
              <p style={{ color: '#4b5563', fontSize: '14px', margin: 0 }}>
                You are rejecting <strong>"{rejectingEvent.title}"</strong> submitted by <em>{rejectingEvent.submitted_by_name || 'Member'}</em>.
              </p>

              <div className="form-field-group">
                <label>Reason for rejection (Visible to member):</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Provide feedback on why this proposal cannot be approved..."
                />
              </div>

              <div className="modal-footer-actions">
                <button
                  className="btn-events-secondary"
                  onClick={() => setRejectingEvent(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn-events-primary"
                  style={{ background: '#dc2626' }}
                  onClick={confirmReject}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deletingEvent && (
        <div className="modal-overlay" onClick={() => setDeletingEvent(null)}>
          <div className="events-modal-card" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-bar">
              <h2>Delete Event</h2>
              <button className="modal-close-btn" onClick={() => setDeletingEvent(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-form">
              <p style={{ color: '#4b5563', fontSize: '14px', margin: 0 }}>
                Are you sure you want to permanently delete <strong>"{deletingEvent.title}"</strong>?
                This action cannot be undone.
              </p>

              <div className="modal-footer-actions">
                <button
                  className="btn-events-secondary"
                  onClick={() => setDeletingEvent(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn-events-primary"
                  style={{ background: '#dc2626' }}
                  onClick={confirmDelete}
                >
                  Delete Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
