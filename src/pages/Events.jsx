import React, { useState, useEffect } from 'react';
import './Events.css';
import api from '../utils/api';

const emptyForm = { title: '', date: '', time: '00:00', location: '', description: '', image_url: '' };

function Events() {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchEvents = () => {
    setLoading(true);
    api.get('/admin/events')
      .then(res => {
        if (res.data.success) setEvents(res.data.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (ev) => {
    setEditing(ev.id);
    setForm({
      title: ev.title,
      date: ev.date || '',
      time: ev.time || '',
      location: ev.location || '',
      description: ev.description || '',
      image_url: ev.image_url || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title) return;
    try {
      if (editing) {
        await api.patch(`/admin/events/${editing}`, form);
      } else {
        await api.post('/admin/events', form);
      }
      setShowModal(false);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving event');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/admin/events/${id}/approve`);
      fetchEvents();
    } catch (e) { console.error(e); }
  };

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason (optional):');
    try {
      await api.patch(`/admin/events/${id}/reject`, { reason });
      fetchEvents();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this event?')) {
      try {
        await api.delete(`/admin/events/${id}`);
        fetchEvents();
      } catch (e) { console.error(e); }
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Events</h1>
        <button className="btn-primary" onClick={openAdd}>+ Create Event</button>
      </div>

      {loading ? (
        <div className="empty-state">Loading...</div>
      ) : (
        <div className="events-grid">
          {events.map(ev => (
            <div key={ev.id} className="event-card">
              <div className="event-card-header">
                <span className="event-date">{ev.date} {ev.time}</span>
                <span className={`badge badge-${ev.status}`}>{ev.status}</span>
              </div>
              <h3>{ev.title}</h3>
              <p className="event-location">📍 {ev.location || 'No location'}</p>
              <p className="event-desc">{ev.description}</p>
              <div className="event-actions">
                {ev.status === 'pending' && (
                  <>
                    <button className="btn-approve" onClick={() => handleApprove(ev.id)}>Approve</button>
                    <button className="btn-reject" onClick={() => handleReject(ev.id)}>Reject</button>
                  </>
                )}
                <button className="btn-edit" onClick={() => openEdit(ev)}>Edit</button>
                <button className="btn-danger" onClick={() => handleDelete(ev.id)}>Delete</button>
              </div>
            </div>
          ))}
          {events.length === 0 && <div className="empty-state">No events found</div>}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editing ? 'Edit Event' : 'Create Event'}</h2>
            <div className="form-group">
              <label>Event Title</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Time</label>
                <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Event location" />
            </div>
            <div className="form-group">
              <label>Image URL</label>
              <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="URL" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the event..." />
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

export default Events;
