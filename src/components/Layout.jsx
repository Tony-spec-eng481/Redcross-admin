import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

function Layout({ children, currentPage, setCurrentPage }) {
  // Sidebar is closed by default, opens only when user clicks hamburger menu
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-container">
      <Navbar
        toggleSidebar={toggleSidebar}
        setCurrentPage={(page) => {
          setCurrentPage(page);
          closeSidebar();
        }}
        sidebarOpen={sidebarOpen}
      />
      
      {/* Backdrop Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        currentPage={currentPage}
        setCurrentPage={(page) => {
          setCurrentPage(page);
          closeSidebar();
        }}
      />

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;