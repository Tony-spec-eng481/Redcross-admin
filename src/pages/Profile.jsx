import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

function Profile() {
  const { admin, updateProfile, changePassword, updateNotificationPreferences } = useAuth();
  const [form, setForm] = useState({
    name: admin?.name || '',
    email: admin?.email || '',
    phone: admin?.phone || '',
    role: admin?.role || '',
  });
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [pwdMsg, setPwdMsg] = useState({ text: '', type: '' });
  const [notifications, setNotifications] = useState(
    admin?.notification_preferences || { email: true, push: true, approvals: true, messages: false }
  );
  const [notifSaved, setNotifSaved] = useState(false);

  const handleSave = async () => {
    setSaveError('');
    const result = await updateProfile({ name: form.name, phone: form.phone });
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setSaveError(result.message);
    }
  };

  const handlePasswordChange = async () => {
    setPwdMsg({ text: '', type: '' });

    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setPwdMsg({ text: 'All fields are required.', type: 'error' });
      return;
    }

    if (passwords.new !== passwords.confirm) {
      setPwdMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    if (passwords.new.length < 6) {
      setPwdMsg({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    const result = await changePassword(passwords.current, passwords.new);
    if (result.success) {
      setPwdMsg({ text: 'Password updated successfully!', type: 'success' });
      setPasswords({ current: '', new: '', confirm: '' });
    } else {
      setPwdMsg({ text: result.message, type: 'error' });
    }
  };

  const handleNotifSave = async () => {
    const result = await updateNotificationPreferences(notifications);
    if (result.success) {
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 2000);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Profile & Settings</h1>
      </div>

      <div className="profile-layout">
        <div className="profile-sidebar card">
          <div className="profile-avatar-large">
            {admin?.name?.charAt(0) || 'A'}
          </div>
          <h3>{admin?.name}</h3>
          <p className="profile-role">{admin?.role}</p>
          <p className="profile-email">{admin?.email}</p>

          <div className="profile-tabs">
            <button className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
              Profile Info
            </button>
            <button className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>
              Change Password
            </button>
            <button className={`profile-tab ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
              Notifications
            </button>
          </div>
        </div>

        <div className="profile-content card">
          {activeTab === 'profile' && (
            <>
              <h2>Profile Information</h2>
              {saved && <div className="login-success">✓ Profile updated successfully!</div>}
              {saveError && <div className="login-error">{saveError}</div>}
              <div className="form-group">
                <label>Full Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input value={form.role} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={handleSave}>Save Changes</button>
              </div>
            </>
          )}

          {activeTab === 'password' && (
            <>
              <h2>Change Password</h2>
              {pwdMsg.text && (
                <div className={pwdMsg.type === 'success' ? 'login-success' : 'login-error'}>
                  {pwdMsg.type === 'success' ? '✓ ' : ''}{pwdMsg.text}
                </div>
              )}
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} />
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={handlePasswordChange}>Update Password</button>
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              <h2>Notification Preferences</h2>
              {notifSaved && <div className="login-success">✓ Preferences saved!</div>}
              <div className="notification-settings">
                {Object.entries(notifications).map(([key, val]) => (
                  <div key={key} className="notification-setting">
                    <div>
                      <p className="setting-label">
                        {key === 'email' && 'Email Notifications'}
                        {key === 'push' && 'Push Notifications'}
                        {key === 'approvals' && 'Approval Requests'}
                        {key === 'messages' && 'New Messages'}
                      </p>
                      <p className="setting-desc">Receive notifications via {key}</p>
                    </div>
                    <button
                      className={`toggle ${val ? 'on' : ''}`}
                      onClick={() => setNotifications({ ...notifications, [key]: !val })}
                    >
                      <span className="toggle-knob"></span>
                    </button>
                  </div>
                ))}
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={handleNotifSave}>Save Preferences</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;