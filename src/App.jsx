import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Leaders from './pages/Leaders';
import Events from './pages/Events';
import Gallery from './pages/Gallery';
import FirstAid from './pages/FirstAid';
import Messages from './pages/Messages';
import Questions from './pages/Questions';
import Profile from './pages/Profile';
import './App.css';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isResetFlow, setIsResetFlow] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('token') || window.location.pathname === '/reset-password') {
      setIsResetFlow(true);
    }
  }, []);

  // Show nothing while checking token validity on mount
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f1117' }}>
        <div style={{ textAlign: 'center', color: '#ccc' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✚</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (isResetFlow) {
    return <ResetPassword onBackToLogin={() => setIsResetFlow(false)} />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard setCurrentPage={setCurrentPage} />;
      case 'members': return <Members />;
      case 'leaders': return <Leaders />;
      case 'events': return <Events />;
      case 'gallery': return <Gallery />;
      case 'firstaid': return <FirstAid />;
      case 'messages': return <Messages />;
      case 'questions': return <Questions />;
      case 'profile': return <Profile />;
      default: return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;