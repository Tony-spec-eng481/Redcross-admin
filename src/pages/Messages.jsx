import React, { useState, useEffect, useRef } from 'react';
import './Messages.css';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

/**
 * Helper to extract email from strings like "Jane Doe (jane@example.com)"
 */
function extractEmail(str) {
  if (!str) return null;
  const match = str.match(/\(([^)]+)\)/);
  if (match && match[1].includes('@')) return match[1].trim();
  const directMatch = str.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (directMatch) return directMatch[0].trim();
  return null;
}

/**
 * Group flat message records into WhatsApp-style unique conversation threads
 */
function groupMessagesIntoConversations(messages, currentAdminEmail) {
  const adminEmail = (currentAdminEmail || 'waruijohnkar@gmail.com').toLowerCase().trim();
  const convMap = new Map();

  // Sort messages chronologically oldest to newest first
  const sorted = [...messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  for (const msg of sorted) {
    if (msg.is_broadcast) {
      const convKey = `broadcast-${msg.id}`;
      convMap.set(convKey, {
        id: convKey,
        is_broadcast: true,
        partnerName: 'Chapter Broadcast',
        partnerEmail: null,
        subject: msg.subject || 'Official Announcement',
        lastMessage: msg.text,
        lastMessageTime: msg.created_at,
        is_read: msg.is_read !== false,
        unreadCount: msg.is_read === false ? 1 : 0,
        messages: [msg],
      });
      continue;
    }

    const sEmail = (msg.sender_email || extractEmail(msg.sender_name) || extractEmail(msg.text) || '').toLowerCase().trim();
    const rEmail = (msg.receiver_email || extractEmail(msg.receiver_name) || '').toLowerCase().trim();

    const isSentByAdmin =
      (adminEmail && sEmail === adminEmail) ||
      msg.sender_name?.toLowerCase() === 'admin' ||
      msg.sender_name?.toLowerCase() === 'super admin';

    let partnerEmail = '';
    let partnerName = '';

    if (isSentByAdmin) {
      partnerEmail = rEmail;
      partnerName = msg.receiver_name || (rEmail ? rEmail.split('@')[0] : 'Member');
    } else {
      partnerEmail = sEmail;
      partnerName = msg.sender_name?.replace(/\([^)]*\)/g, '').trim() || 'Visitor';
    }

    // Determine unique thread key
    let convKey = '';
    if (partnerEmail) {
      convKey = `partner-${partnerEmail}`;
    } else if (partnerName) {
      convKey = `partner-${partnerName.toLowerCase()}`;
    } else {
      convKey = `msg-${msg.id}`;
    }

    if (convMap.has(convKey)) {
      const existing = convMap.get(convKey);
      existing.messages.push(msg);
      existing.lastMessage = msg.text;
      existing.lastMessageTime = msg.created_at;
      if (msg.subject && !existing.subject) {
        existing.subject = msg.subject;
      }
      if (!isSentByAdmin && msg.is_read === false) {
        existing.unreadCount = (existing.unreadCount || 0) + 1;
        existing.is_read = false;
      }
      if (!existing.partnerEmail && partnerEmail) {
        existing.partnerEmail = partnerEmail;
      }
      if ((!existing.partnerName || existing.partnerName === 'Member') && partnerName) {
        existing.partnerName = partnerName;
      }
    } else {
      convMap.set(convKey, {
        id: convKey,
        is_broadcast: false,
        partnerName: partnerName || 'Visitor',
        partnerEmail: partnerEmail || null,
        subject: msg.subject || 'Direct Message',
        lastMessage: msg.text,
        lastMessageTime: msg.created_at,
        is_read: isSentByAdmin ? true : (msg.is_read !== false),
        unreadCount: (!isSentByAdmin && msg.is_read === false) ? 1 : 0,
        messages: [msg],
      });
    }
  }

  // Convert to array and sort conversations by latest message timestamp descending (most recent on top)
  return Array.from(convMap.values()).sort(
    (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
  );
}

function Messages() {
  const { admin } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [draftConversation, setDraftConversation] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'direct', 'broadcast', 'unread'
  const [searchQuery, setSearchQuery] = useState('');

  // Chat reply input state
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState('');

  // Members Directory Modal state
  const [showDirectory, setShowDirectory] = useState(false);
  const [directoryUsers, setDirectoryUsers] = useState([]);
  const [directorySearch, setDirectorySearch] = useState('');
  const [loadingDirectory, setLoadingDirectory] = useState(false);

  // Broadcast Modal state
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const chatEndRef = useRef(null);

  const fetchMessages = () => {
    setLoading(true);
    api.get('/admin/messages')
      .then(res => {
        if (res.data.success) {
          const fetched = res.data.data || [];
          setMessages(fetched);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const fetchDirectory = () => {
    setLoadingDirectory(true);
    api.get('/messages/users')
      .then(res => {
        if (res.data.success) {
          setDirectoryUsers(res.data.data || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingDirectory(false));
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Compute grouped conversations
  const conversations = groupMessagesIntoConversations(messages, admin?.email);

  // If we have a draft conversation, keep it at top
  const allConversations = draftConversation
    ? [draftConversation, ...conversations.filter(c => c.id !== draftConversation.id)]
    : conversations;

  // Auto-select first conversation on initial load if none selected
  useEffect(() => {
    if (!selectedConvId && allConversations.length > 0) {
      setSelectedConvId(allConversations[0].id);
    }
  }, [allConversations.length]);

  // Find currently active conversation
  const activeConversation =
    draftConversation && draftConversation.id === selectedConvId
      ? draftConversation
      : allConversations.find(c => c.id === selectedConvId) || allConversations[0] || null;

  // Auto-scroll chat stream to bottom when active conversation or messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConvId, activeConversation?.messages?.length, messages.length]);

  const handleOpenDirectory = () => {
    setShowDirectory(true);
    fetchDirectory();
  };

  const handleSelectUserToChat = (user) => {
    setShowDirectory(false);
    const targetEmail = (user.email || '').toLowerCase().trim();
    const existingConv = conversations.find(
      c => c.partnerEmail && c.partnerEmail.toLowerCase() === targetEmail
    );

    if (existingConv) {
      setSelectedConvId(existingConv.id);
      setDraftConversation(null);
    } else {
      // Create new draft conversation thread
      const newDraft = {
        id: `draft-${targetEmail || Date.now()}`,
        isDraft: true,
        partnerName: user.name,
        partnerEmail: user.email,
        subject: `Direct Chat with ${user.name}`,
        lastMessage: 'Start typing a message below...',
        lastMessageTime: new Date().toISOString(),
        is_read: true,
        unreadCount: 0,
        messages: [],
      };
      setDraftConversation(newDraft);
      setSelectedConvId(newDraft.id);
    }
  };

  const handleSelectConversation = async (conv) => {
    setSelectedConvId(conv.id);
    if (draftConversation && draftConversation.id !== conv.id) {
      setDraftConversation(null);
    }

    // Mark unread messages in this conversation as read
    const unreadMsgs = conv.messages?.filter(m => !m.is_read) || [];
    if (unreadMsgs.length > 0) {
      for (const m of unreadMsgs) {
        api.patch(`/admin/messages/${m.id}/read`).catch(() => {});
      }
      setMessages(prev =>
        prev.map(m => (unreadMsgs.some(u => u.id === m.id) ? { ...m, is_read: true } : m))
      );
    }
  };

  const handleSendChatReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !activeConversation) return;

    setSendingReply(true);
    setFeedbackNotice('');

    const targetEmail = activeConversation.partnerEmail;
    const targetName = activeConversation.partnerName;
    const rootMessage = activeConversation.messages?.[0];

    try {
      const payload = {
        text: replyText.trim(),
        subject: activeConversation.subject ? `Re: ${activeConversation.subject.replace(/^Re:\s*/i, '')}` : 'Direct Message',
        receiver_name: targetName,
        receiver_email: targetEmail || undefined,
        reply_to_id: rootMessage?.id || undefined,
        is_broadcast: false,
      };

      const res = await api.post('/admin/messages', payload);

      if (res.data.success) {
        setReplyText('');
        setFeedbackNotice(
          targetEmail
            ? `✓ Sent to ${targetName} & emailed to ${targetEmail}`
            : '✓ Message posted to chat.'
        );
        setTimeout(() => setFeedbackNotice(''), 5000);

        // Clear draft if active
        if (activeConversation.isDraft) {
          setDraftConversation(null);
        }

        fetchMessages();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastText.trim()) return;
    setSendingBroadcast(true);
    try {
      await api.post('/admin/messages', {
        text: broadcastText.trim(),
        subject: broadcastSubject.trim() || 'Official Chapter Announcement',
        is_broadcast: true,
      });
      setShowBroadcastModal(false);
      setBroadcastText('');
      setBroadcastSubject('');
      fetchMessages();
      alert('Broadcast dispatched to all chapter members and email stream!');
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to dispatch broadcast');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleDeleteConversation = async (conv, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Delete conversation with ${conv.partnerName}?`)) {
      try {
        const msgIds = conv.messages.map(m => m.id);
        for (const id of msgIds) {
          await api.delete(`/admin/messages/${id}`).catch(() => {});
        }
        setMessages(prev => prev.filter(m => !msgIds.includes(m.id)));
        if (selectedConvId === conv.id) {
          setSelectedConvId(null);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getInitials = (name) => {
    if (!name) return 'RC';
    const clean = name.replace(/\([^)]*\)/g, '').trim();
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return clean.slice(0, 2).toUpperCase() || 'RC';
  };

  // Filter conversations
  const filteredConversations = allConversations.filter(c => {
    if (filter === 'unread' && (c.is_read || c.unreadCount === 0)) return false;
    if (filter === 'broadcast' && !c.is_broadcast) return false;
    if (filter === 'direct' && c.is_broadcast) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.partnerName?.toLowerCase().includes(q) ||
        c.partnerEmail?.toLowerCase().includes(q) ||
        c.subject?.toLowerCase().includes(q) ||
        c.lastMessage?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  // Filter directory users in modal
  const filteredDirectoryUsers = directoryUsers.filter(u => {
    if (!directorySearch.trim()) return true;
    const q = directorySearch.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Messages & Communications</h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '4px' }}>
            Unified conversation threads with live chat and automatic Brevo email dispatch
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={handleOpenDirectory}>
            👥 Choose Member to Chat
          </button>
          <button className="btn-primary" onClick={() => setShowBroadcastModal(true)}>
            📢 New Broadcast
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <button
          className={filter === 'all' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '6px 14px', fontSize: '13px' }}
          onClick={() => setFilter('all')}
        >
          All Chats ({conversations.length})
        </button>
        <button
          className={filter === 'direct' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '6px 14px', fontSize: '13px' }}
          onClick={() => setFilter('direct')}
        >
          Direct & Inquiries ({conversations.filter(c => !c.is_broadcast).length})
        </button>
        <button
          className={filter === 'broadcast' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '6px 14px', fontSize: '13px' }}
          onClick={() => setFilter('broadcast')}
        >
          Broadcasts ({conversations.filter(c => c.is_broadcast).length})
        </button>
        <button
          className={filter === 'unread' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '6px 14px', fontSize: '13px' }}
          onClick={() => setFilter('unread')}
        >
          Unread ({totalUnread})
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading messages...</div>
      ) : allConversations.length === 0 ? (
        <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📬</div>
          <h3>No Conversations Yet</h3>
          <p style={{ color: '#64748B', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            Start a direct chat with any member or dispatch a broadcast announcement.
          </p>
          <button className="btn-primary" onClick={handleOpenDirectory}>
            👥 Pick a Member to Chat
          </button>
        </div>
      ) : (
        <div className="messages-layout">
          {/* Left Column: WhatsApp-style Single Conversation per Person */}
          <div className="messages-list-card">
            <div className="messages-list-header">
              <h3>Conversations</h3>
              {totalUnread > 0 && <span className="unread-count">{totalUnread} unread</span>}
            </div>

            <div className="messages-search-box">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="messages-list-items">
              {filteredConversations.map(conv => {
                const isActive = activeConversation?.id === conv.id;
                const hasUnread = conv.unreadCount > 0;

                return (
                  <div
                    key={conv.id}
                    className={`message-item ${isActive ? 'active' : ''} ${hasUnread ? 'unread' : ''}`}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div className={`msg-avatar ${conv.is_broadcast ? 'admin-avatar' : ''}`}>
                      {conv.is_broadcast ? '📢' : getInitials(conv.partnerName)}
                    </div>
                    <div className="message-item-content">
                      <div className="message-item-top">
                        <span className="message-from">
                          {conv.partnerName}
                        </span>
                        <span className="message-time">
                          {new Date(conv.lastMessageTime).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="message-subject">
                        {conv.is_broadcast ? '📢 ' : ''}
                        {conv.subject}
                      </div>
                      <div className="message-preview">
                        {conv.lastMessage}
                      </div>
                    </div>
                    {conv.unreadCount > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="unread-count">{conv.unreadCount}</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredConversations.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                  No chats match search.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Chat Stream for the Single Selected Conversation */}
          {activeConversation ? (
            <div className="message-detail-card">
              {/* Conversation Header */}
              <div className="message-detail-header">
                <div className={`msg-avatar large ${activeConversation.is_broadcast ? 'admin-avatar' : ''}`}>
                  {activeConversation.is_broadcast ? '📢' : getInitials(activeConversation.partnerName)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3>{activeConversation.partnerName}</h3>
                      <div className="message-detail-subject">
                        {activeConversation.partnerEmail && (
                          <span><strong>Email:</strong> {activeConversation.partnerEmail} • </span>
                        )}
                        <strong>Topic:</strong> {activeConversation.subject || 'Direct Conversation'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {activeConversation.partnerEmail && (
                        <a
                          href={`mailto:${activeConversation.partnerEmail}?subject=Re: ${encodeURIComponent(activeConversation.subject || 'Inquiry')} - Kenya Red Cross KyU`}
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px', textDecoration: 'none' }}
                        >
                          ✉ External Email
                        </a>
                      )}
                      {!activeConversation.isDraft && (
                        <button
                          className="btn-danger"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                          onClick={(e) => handleDeleteConversation(activeConversation, e)}
                        >
                          Delete Thread
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chronological Chat Messages Stream */}
              <div className="chat-timeline">
                {activeConversation.messages && activeConversation.messages.length > 0 ? (
                  activeConversation.messages.map(msg => {
                    const adminEmail = (admin?.email || '').toLowerCase().trim();
                    const sEmail = (msg.sender_email || extractEmail(msg.sender_name) || '').toLowerCase().trim();
                    const isOutgoing =
                      (adminEmail && sEmail === adminEmail) ||
                      msg.sender_name === admin?.name ||
                      msg.sender_name === 'Admin' ||
                      msg.sender_name === 'Super Admin';

                    return (
                      <div
                        key={msg.id}
                        className={`chat-bubble-row ${isOutgoing ? 'outgoing' : 'incoming'}`}
                      >
                        <div className="chat-bubble">
                          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', opacity: 0.9 }}>
                            {isOutgoing ? 'You (Admin)' : (msg.sender_name?.replace(/\([^)]*\)/g, '').trim() || 'Sender')}
                          </div>
                          <div style={{ whiteSpace: 'pre-line' }}>
                            {msg.text}
                          </div>
                          <div className="chat-bubble-meta">
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {msg.receiver_email && (
                              <span className="email-dispatched-tag">
                                ✉ Emailed to {msg.receiver_email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 0' }}>
                    <p>Start your conversation with <strong>{activeConversation.partnerName}</strong> below.</p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="chat-input-container">
                {feedbackNotice && (
                  <div style={{ color: '#059669', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                    {feedbackNotice}
                  </div>
                )}
                <div className="chat-reply-header">
                  <span>
                    💬 Replying to <strong>{activeConversation.partnerName}</strong>{' '}
                    {activeConversation.partnerEmail ? `(${activeConversation.partnerEmail})` : ''}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Press Enter to send (Shift+Enter for newline)
                  </span>
                </div>

                <form onSubmit={handleSendChatReply} className="chat-input-wrapper">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChatReply();
                      }
                    }}
                    placeholder={`Type your reply to ${activeConversation.partnerName}... (sent to portal & via email)`}
                    rows={2}
                    disabled={sendingReply}
                  />
                  <button
                    type="submit"
                    className="btn-send-chat"
                    disabled={sendingReply || !replyText.trim()}
                  >
                    {sendingReply ? (
                      'Sending...'
                    ) : (
                      <>
                        <span>Send</span> <span>✈</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="message-detail-card" style={{ display: 'grid', placeItems: 'center', color: '#94A3B8' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                <h3>Select a Conversation</h3>
                <p>Choose a chat from the left or click "Choose Member to Chat".</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Members Directory Modal */}
      {showDirectory && (
        <div className="modal-overlay" onClick={() => setShowDirectory(false)}>
          <div className="modal directory-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ margin: 0 }}>Select a Member to Chat</h2>
              <button
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '12px' }}
                onClick={() => setShowDirectory(false)}
              >
                ✕ Close
              </button>
            </div>

            <p style={{ color: '#64748B', fontSize: '13px', margin: '0 0 12px 0' }}>
              Choose any registered member or admin to start a direct message thread with instant web & email dispatch.
            </p>

            <input
              type="text"
              className="directory-search"
              placeholder="Search by name, email, or role..."
              value={directorySearch}
              onChange={e => setDirectorySearch(e.target.value)}
              autoFocus
            />

            {loadingDirectory ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                Loading member directory...
              </div>
            ) : filteredDirectoryUsers.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                No members found matching "{directorySearch}".
              </div>
            ) : (
              <div className="directory-list">
                {filteredDirectoryUsers.map(user => (
                  <div
                    key={`${user.type}-${user.id}`}
                    className="directory-item"
                    onClick={() => handleSelectUserToChat(user)}
                  >
                    <div className="directory-item-info">
                      <div className={`msg-avatar ${user.type === 'admin' ? 'admin-avatar' : ''}`}>
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {user.email} {user.phone ? `• ${user.phone}` : ''}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className={`directory-role-badge ${user.type === 'admin' ? 'admin' : ''}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send Broadcast Modal */}
      {showBroadcastModal && (
        <div className="modal-overlay" onClick={() => setShowBroadcastModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Send Broadcast Announcement</h2>
            <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '16px' }}>
              This announcement will be published to the portal feed and emailed to all members via Brevo.
            </p>
            <div className="form-group">
              <label>Announcement Subject</label>
              <input
                value={broadcastSubject}
                onChange={e => setBroadcastSubject(e.target.value)}
                placeholder="e.g. Campus Emergency Drill & General Meeting"
              />
            </div>
            <div className="form-group">
              <label>Message Content</label>
              <textarea
                value={broadcastText}
                onChange={e => setBroadcastText(e.target.value)}
                placeholder="Type your official announcement..."
                rows={5}
              />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowBroadcastModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSendBroadcast}
                disabled={sendingBroadcast || !broadcastText.trim()}
              >
                {sendingBroadcast ? 'Dispatching...' : 'Dispatch Broadcast'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;
