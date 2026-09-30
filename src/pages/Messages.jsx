import React, { useState, useEffect } from 'react';
import './Messages.css';
import api from '../utils/api';

function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySubject, setReplySubject] = useState('');

  const fetchMessages = () => {
    setLoading(true);
    api.get('/admin/messages')
      .then(res => {
        if (res.data.success) setMessages(res.data.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSendBroadcast = async () => {
    if (!replyText) return;
    try {
      await api.post('/admin/messages', { text: replyText, subject: replySubject || undefined });
      setShowReply(false);
      setReplyText('');
      setReplySubject('');
      fetchMessages();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to send message');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/admin/messages/${id}/read`);
      fetchMessages();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete message?')) {
      try {
        await api.delete(`/admin/messages/${id}`);
        fetchMessages();
      } catch (e) { console.error(e); }
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Messages</h1>
        <button className="btn-primary" onClick={() => setShowReply(true)}>+ Send Broadcast</button>
      </div>

      {loading ? (
        <div className="empty-state">Loading...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sender</th>
                <th>Message</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.map(m => (
                <tr key={m.id} style={{ opacity: m.is_read ? 0.7 : 1 }}>
                  <td>{m.sender_name || 'Unknown'}</td>
                  <td>{m.text}</td>
                  <td>{m.is_broadcast ? '📢 Broadcast' : '💬 Direct'}</td>
                  <td>{m.is_read ? '✓ Read' : '● Unread'}</td>
                  <td>
                    {!m.is_read && (
                      <button className="btn-edit" onClick={() => handleMarkRead(m.id)}>Mark Read</button>
                    )}
                    <button className="btn-danger" onClick={() => handleDelete(m.id)} style={{ marginLeft: '0.25rem' }}>Delete</button>
                  </td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No messages found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showReply && (
        <div className="modal-overlay" onClick={() => setShowReply(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Send Broadcast Message</h2>
            <div className="form-group">
              <label>Subject (optional)</label>
              <input value={replySubject} onChange={e => setReplySubject(e.target.value)} placeholder="Message subject" />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your message..." rows={4} />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowReply(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSendBroadcast}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;
