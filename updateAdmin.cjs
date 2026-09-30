const fs = require('fs');
const path = require('path');

const fileContent = `import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom';
import { Users, Calendar, MessageSquare, LayoutDashboard, Settings, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import './App.css';

function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="brand">Redcross Admin</div>
        <nav>
          <Link to="/"><LayoutDashboard size={20} /> Dashboard</Link>
          <Link to="/members"><Users size={20} /> Members</Link>
          <Link to="/events"><Calendar size={20} /> Events</Link>
          <Link to="/gallery"><ImageIcon size={20} /> Gallery</Link>
          <Link to="/messages"><MessageSquare size={20} /> Messages</Link>
          <Link to="/settings"><Settings size={20} /> Settings</Link>
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <h2>Admin Portal</h2>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState({ totalMembers: 0, activeEvents: 0, pendingImages: 0 });
  useEffect(() => {
    axios.get('http://localhost:5000/api/admin/stats').then(res => setStats(res.data));
  }, []);
  return (
    <div>
      <h3>Dashboard Overview</h3>
      <div className="stats-grid">
        <div className="stat-card"><p>Total Members</p><h2>{stats.totalMembers}</h2></div>
        <div className="stat-card"><p>Active Events</p><h2>{stats.activeEvents}</h2></div>
        <div className="stat-card"><p>Pending Images</p><h2>{stats.pendingImages}</h2></div>
      </div>
    </div>
  );
}

function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '' });

  const fetchEvents = () => axios.get('http://localhost:5000/api/events').then(res => setEvents(res.data));
  useEffect(() => { fetchEvents(); }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    await axios.post('http://localhost:5000/api/admin/events', form);
    setForm({ title: '', description: '', date: '', time: '' });
    fetchEvents();
  };

  const handleDelete = async (id) => {
    await axios.delete(\`http://localhost:5000/api/admin/events/\${id}\`);
    fetchEvents();
  };

  return (
    <div>
      <h3>Manage Events</h3>
      <form onSubmit={handlePost} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <input placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
        <input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
        <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
        <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} required />
        <button type="submit" style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }}>Post Event</button>
      </form>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {events.map(ev => (
          <div key={ev.id} style={{ background: 'white', padding: '1rem', border: '1px solid #ccc', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <strong>{ev.title}</strong> - {ev.date} {ev.time}
              <p>{ev.description}</p>
            </div>
            <button onClick={() => handleDelete(ev.id)} style={{ color: 'red' }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminGallery() {
  const [pending, setPending] = useState([]);
  
  const fetchPending = () => axios.get('http://localhost:5000/api/admin/gallery/pending').then(res => setPending(res.data));
  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (id) => {
    await axios.put(\`http://localhost:5000/api/admin/gallery/\${id}/approve\`);
    fetchPending();
  };

  const handleReject = async (id) => {
    await axios.delete(\`http://localhost:5000/api/admin/gallery/\${id}\`);
    fetchPending();
  };

  return (
    <div>
      <h3>Pending Gallery Submissions</h3>
      {pending.length === 0 && <p>No pending images.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {pending.map(img => (
          <div key={img.id} style={{ border: '1px solid #ccc', padding: '0.5rem' }}>
            <img src={img.url} alt="pending" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <button onClick={() => handleApprove(img.id)} style={{ color: 'green' }}>Approve</button>
              <button onClick={() => handleReject(img.id)} style={{ color: 'red' }}>Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="members" element={<div>Members List (Coming Soon)</div>} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="messages" element={<div>Messages (Coming Soon)</div>} />
          <Route path="settings" element={<div>Settings (Coming Soon)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;`;

fs.writeFileSync(path.join('c:/Users/DELL/Desktop/redcross/admin/src', 'App.jsx'), fileContent);
console.log('Admin updated.');
