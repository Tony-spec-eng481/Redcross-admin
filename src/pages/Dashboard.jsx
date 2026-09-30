import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import api from '../utils/api';

function Dashboard({ setCurrentPage }) {
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeEvents: 0,
    pendingImages: 0,
    totalMessages: 0,
    unansweredQuestions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(res => {
        if (res.data.success) setStats(res.data.data);
      })
      .catch(err => console.error('Dashboard stats error:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome to the Red Cross Admin Portal</p>
      </div>

      {loading ? (
        <div className="empty-state">Loading stats...</div>
      ) : (
        <div className="stats-grid">
          <div className="stat-card" onClick={() => setCurrentPage('members')}>
            <div className="stat-icon members-icon">👥</div>
            <div className="stat-content">
              <h3>Total Members</h3>
              <p className="stat-number">{stats.totalMembers}</p>
            </div>
          </div>

          <div className="stat-card" onClick={() => setCurrentPage('events')}>
            <div className="stat-icon events-icon">📅</div>
            <div className="stat-content">
              <h3>Active Events</h3>
              <p className="stat-number">{stats.activeEvents}</p>
            </div>
          </div>

          <div className="stat-card" onClick={() => setCurrentPage('gallery')}>
            <div className="stat-icon gallery-icon">🖼️</div>
            <div className="stat-content">
              <h3>Pending Images</h3>
              <p className="stat-number">{stats.pendingImages}</p>
            </div>
          </div>

          <div className="stat-card" onClick={() => setCurrentPage('messages')}>
            <div className="stat-icon messages-icon">💬</div>
            <div className="stat-content">
              <h3>Messages</h3>
              <p className="stat-number">{stats.totalMessages}</p>
            </div>
          </div>

          <div className="stat-card" onClick={() => setCurrentPage('questions')}>
            <div className="stat-icon questions-icon">❓</div>
            <div className="stat-content">
              <h3>Unanswered Questions</h3>
              <p className="stat-number">{stats.unansweredQuestions}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
