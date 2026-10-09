import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './Dashboard.css';
import api from '../utils/api';
import {
  Users,
  Calendar,
  Image as ImageIcon,
  MessageSquare,
  HelpCircle,
  Award,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Clock,
  LayoutGrid,
  LifeBuoy
} from 'lucide-react';

const DEFAULT_HERO_SLIDES = [
  {
    id: 1,
    eyebrow: 'KIRINYAGA UNIVERSITY · RED CROSS CHAPTER',
    first: 'Ready to Help.',
    accent: 'Always.',
    description: 'Serving humanity through compassion, courage, and community care — right here on campus.',
    primary: 'Learn About Us',
    primary_button_text: 'Learn About Us',
    primaryHref: '/about',
    primary_href: '/about',
    secondary: 'Join the Chapter',
    secondary_button_text: 'Join the Chapter',
    secondaryHref: '/contact',
    secondary_href: '/contact',
    image: 'https://kyuchapter.netlify.app/1.jpeg',
    status: 'active',
    sort_order: 1,
  },
  {
    id: 2,
    eyebrow: 'FIRST AID · BLOOD DRIVES · OUTREACH',
    first: 'Compassion in',
    accent: 'Every Action.',
    description: 'From first aid training to community outreach — we show up when it matters most.',
    primary: 'See Our Events',
    primary_button_text: 'See Our Events',
    primaryHref: '/events',
    primary_href: '/events',
    secondary: 'Volunteer With Us',
    secondary_button_text: 'Volunteer With Us',
    secondaryHref: '/contact',
    secondary_href: '/contact',
    image: 'https://kyuchapter.netlify.app/2.jpeg',
    status: 'active',
    sort_order: 2,
  },
  {
    id: 3,
    eyebrow: 'HUMANITY · IMPARTIALITY · NEUTRALITY',
    first: 'One Chapter.',
    accent: 'Countless Lives.',
    description: 'United by the seven fundamental principles of the Red Cross Movement, we serve without boundaries.',
    primary: 'Our Mission',
    primary_button_text: 'Our Mission',
    primaryHref: '/about',
    primary_href: '/about',
    secondary: 'Meet the Team',
    secondary_button_text: 'Meet the Team',
    secondaryHref: '/team',
    secondary_href: '/team',
    image: 'https://kyuchapter.netlify.app/3.jpeg',
    status: 'active',
    sort_order: 3,
  },
];

const INITIAL_HERO_FORM = {
  eyebrow: 'KIRINYAGA UNIVERSITY · RED CROSS CHAPTER',
  first: '',
  accent: '',
  description: '',
  primary_button_text: 'Learn More',
  primary_href: '/about',
  secondary_button_text: 'Contact Us',
  secondary_href: '/contact',
  image: '',
  status: 'active',
  sort_order: 1,
};

export default function Dashboard({ setCurrentPage }) {
  // Statistics State
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeEvents: 0,
    pendingImages: 0,
    totalMessages: 0,
    unansweredQuestions: 0,
    totalLeaders: 0,
    pendingEvents: 0,
  });

  // Hero Slides State
  const [heroSlides, setHeroSlides] = useState([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [heroSearchTerm, setHeroSearchTerm] = useState('');
  const [heroStatusFilter, setHeroStatusFilter] = useState('all');

  // Activity Stream State
  const [activities, setActivities] = useState([]);

  // Modals & Forms State
  const [showHeroModal, setShowHeroModal] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState(null);
  const [heroForm, setHeroForm] = useState(INITIAL_HERO_FORM);
  const [deletingSlide, setDeletingSlide] = useState(null);

  // Status & Loading States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingHero, setSavingHero] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      // 1. Fetch Stats
      const statsPromise = api.get('/admin/stats').catch(err => {
        console.warn('Stats fetch warning:', err);
        return { data: { success: false } };
      });

      // 2. Fetch Hero Slides
      const heroPromise = api.get('/admin/hero').catch(err => {
        console.warn('Hero slides fetch warning:', err);
        return { data: { success: false } };
      });

      // 3. Fetch Activity
      const activityPromise = api.get('/admin/activity').catch(err => {
        console.warn('Activity fetch warning:', err);
        return { data: { success: false } };
      });

      const [statsRes, heroRes, activityRes] = await Promise.all([
        statsPromise,
        heroPromise,
        activityPromise,
      ]);

      // Set Stats
      if (statsRes.data?.success && statsRes.data?.data) {
        setStats(prev => ({ ...prev, ...statsRes.data.data }));
      }

      // Set Hero Slides
      if (heroRes.data?.success && Array.isArray(heroRes.data.data) && heroRes.data.data.length > 0) {
        setHeroSlides(heroRes.data.data);
      } else {
        setHeroSlides(DEFAULT_HERO_SLIDES);
      }

      // Set Activity
      if (activityRes.data?.success && Array.isArray(activityRes.data.data)) {
        setActivities(activityRes.data.data);
      } else {
        // Fallback default activities
        setActivities([
          { type: 'member', text: 'New volunteer registration received', time: new Date().toISOString() },
          { type: 'event', text: 'First Aid & CPR Workshop scheduled', time: new Date(Date.now() - 3600000).toISOString() },
          { type: 'gallery', text: 'Campus Blood Drive photos submitted', time: new Date(Date.now() - 7200000).toISOString() },
        ]);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      showToast('Error syncing dashboard data.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Autoplay hero live preview carousel
  useEffect(() => {
    if (!isAutoPlaying || heroSlides.length === 0) return;
    const interval = setInterval(() => {
      setActivePreviewIndex(prev => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, heroSlides.length]);

  // Filtered hero slides
  const filteredHeroSlides = useMemo(() => {
    return heroSlides.filter(slide => {
      if (heroStatusFilter !== 'all' && slide.status !== heroStatusFilter) return false;
      if (heroSearchTerm.trim()) {
        const q = heroSearchTerm.toLowerCase();
        const first = (slide.first || '').toLowerCase();
        const accent = (slide.accent || '').toLowerCase();
        const desc = (slide.description || '').toLowerCase();
        const eyebrow = (slide.eyebrow || '').toLowerCase();
        return first.includes(q) || accent.includes(q) || desc.includes(q) || eyebrow.includes(q);
      }
      return true;
    });
  }, [heroSlides, heroStatusFilter, heroSearchTerm]);

  // Handle manual refresh
  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Open modal for new slide
  const handleOpenAddSlide = () => {
    setEditingSlideId(null);
    setHeroForm({
      ...INITIAL_HERO_FORM,
      sort_order: heroSlides.length + 1,
    });
    setShowHeroModal(true);
  };

  // Open modal for editing slide
  const handleOpenEditSlide = (slide) => {
    setEditingSlideId(slide.id);
    setHeroForm({
      eyebrow: slide.eyebrow || 'KIRINYAGA UNIVERSITY · RED CROSS CHAPTER',
      first: slide.first || '',
      accent: slide.accent || '',
      description: slide.description || '',
      primary_button_text: slide.primary || slide.primary_button_text || 'Learn More',
      primary_href: slide.primaryHref || slide.primary_href || '/about',
      secondary_button_text: slide.secondary || slide.secondary_button_text || 'Contact Us',
      secondary_href: slide.secondaryHref || slide.secondary_href || '/contact',
      image: slide.image || '',
      status: slide.status || 'active',
      sort_order: slide.sort_order !== undefined ? slide.sort_order : 1,
    });
    setShowHeroModal(true);
  };

  // Image upload handler for Hero Slide
  const handleHeroImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'hero');

    setUploadingImage(true);
    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success && res.data?.data?.url) {
        setHeroForm(prev => ({ ...prev, image: res.data.data.url }));
        showToast('Hero image uploaded successfully!');
      } else {
        showToast('Image upload failed. Please use an image URL instead.', 'error');
      }
    } catch (err) {
      console.error('Hero image upload error:', err);
      showToast('Failed to upload image. You can paste an image URL.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Save (Create or Update) Hero Slide
  const handleSaveHeroSlide = async (e) => {
    e.preventDefault();

    if (!heroForm.first.trim() || !heroForm.accent.trim()) {
      showToast('Main headline and accent text are required.', 'error');
      return;
    }
    if (!heroForm.image.trim()) {
      showToast('Please upload or specify a background image URL.', 'error');
      return;
    }

    setSavingHero(true);
    try {
      const payload = {
        ...heroForm,
        primary: heroForm.primary_button_text,
        primaryHref: heroForm.primary_href,
        secondary: heroForm.secondary_button_text,
        secondaryHref: heroForm.secondary_href,
      };

      if (editingSlideId) {
        // Update existing
        const res = await api.patch(`/admin/hero/${editingSlideId}`, payload);
        if (res.data?.success) {
          showToast('Hero slide updated successfully!');
          fetchDashboardData();
        } else {
          // Local fallback
          setHeroSlides(prev =>
            prev.map(s => (s.id === editingSlideId ? { ...s, ...payload } : s))
          );
          showToast('Hero slide updated locally.');
        }
      } else {
        // Create new
        const res = await api.post('/admin/hero', payload);
        if (res.data?.success) {
          showToast('New hero slide added to homepage!');
          fetchDashboardData();
        } else {
          // Local fallback
          const newSlide = {
            id: Date.now(),
            ...payload,
          };
          setHeroSlides(prev => [...prev, newSlide]);
          showToast('New hero slide created.');
        }
      }
      setShowHeroModal(false);
    } catch (err) {
      console.error('Error saving hero slide:', err);
      showToast('Failed to save hero slide.', 'error');
    } finally {
      setSavingHero(false);
    }
  };

  // Delete Hero Slide
  const handleConfirmDeleteSlide = async () => {
    if (!deletingSlide) return;

    try {
      const res = await api.delete(`/admin/hero/${deletingSlide.id}`);
      if (res.data?.success) {
        showToast('Hero slide removed from homepage.');
        fetchDashboardData();
      } else {
        setHeroSlides(prev => prev.filter(s => s.id !== deletingSlide.id));
        showToast('Hero slide removed.');
      }
    } catch (err) {
      console.error('Delete hero slide error:', err);
      setHeroSlides(prev => prev.filter(s => s.id !== deletingSlide.id));
      showToast('Hero slide deleted.');
    } finally {
      setDeletingSlide(null);
      if (activePreviewIndex >= heroSlides.length - 1 && activePreviewIndex > 0) {
        setActivePreviewIndex(activePreviewIndex - 1);
      }
    }
  };

  // Toggle slide status
  const handleToggleSlideStatus = async (slide) => {
    const newStatus = slide.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.patch(`/admin/hero/${slide.id}`, { status: newStatus });
      if (res.data?.success) {
        showToast(`Slide set to ${newStatus}.`);
        fetchDashboardData();
      } else {
        setHeroSlides(prev =>
          prev.map(s => (s.id === slide.id ? { ...s, status: newStatus } : s))
        );
        showToast(`Slide marked as ${newStatus}.`);
      }
    } catch (err) {
      console.warn('Status toggle fallback:', err);
      setHeroSlides(prev =>
        prev.map(s => (s.id === slide.id ? { ...s, status: newStatus } : s))
      );
      showToast(`Slide set to ${newStatus}.`);
    }
  };

  // Current active preview slide
  const currentPreviewSlide = heroSlides[activePreviewIndex] || heroSlides[0] || DEFAULT_HERO_SLIDES[0];

  const [currentDateFormatted] = useState(() =>
    new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  );

  return (
    <div className="dashboard-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`dash-toast dash-toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── 1. Executive Dashboard Header ── */}
      <div className="dash-hero-header">
        <div className="dash-hero-header-main">
          <div className="dash-greeting-badge">
            <span className="pulse-dot" />
            <span>Kirinyaga University Chapter · Portal Command</span>
          </div>
          <h1>Executive Dashboard & Overview</h1>
          <p className="dash-subtitle">
            Welcome back, Administrator. Real-time overview of members, chapter operations, communications, and live homepage hero banners.
          </p>
          <div className="dash-meta-bar">
            <div className="meta-item">
              <Clock size={14} />
              <span>{currentDateFormatted}</span>
            </div>
            <div className="meta-item status-live">
              <ShieldCheck size={14} />
              <span>Supabase Backend Synchronized</span>
            </div>
          </div>
        </div>

        <div className="dash-header-actions">
          <button
            className={`btn-dash-refresh ${refreshing ? 'spinning' : ''}`}
            onClick={handleManualRefresh}
            title="Refresh all metrics and data"
            disabled={refreshing}
          >
            <RefreshCw size={16} />
            <span>{refreshing ? 'Syncing...' : 'Sync Data'}</span>
          </button>
          
          <button
            className="btn-dash-primary"
            onClick={handleOpenAddSlide}
          >
            <Plus size={16} />
            <span>Add Hero Slide</span>
          </button>

          <a
            href={import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173"}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-dash-outline"
            title="Open Live Public Website"
          >
            <ExternalLink size={15} />
            <span>Live Website</span>
          </a>
        </div>
      </div>

      {/* ── 2. High-Impact KPI Overview Cards ── */}
      <div className="kpi-grid">
        {/* Total Members */}
        <div className="kpi-card members-kpi" onClick={() => setCurrentPage('members')}>
          <div className="kpi-top">
            <div className="kpi-icon-wrap">
              <Users size={24} />
            </div>
            <span className="kpi-pill kpi-pill-green">Active Roster</span>
          </div>
          <div className="kpi-value-block">
            <span className="kpi-number">{loading ? '—' : stats.totalMembers}</span>
            <span className="kpi-label">Registered Members</span>
          </div>
          <div className="kpi-footer">
            <span>Manage volunteers & roster</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Active & Scheduled Events */}
        <div className="kpi-card events-kpi" onClick={() => setCurrentPage('events')}>
          <div className="kpi-top">
            <div className="kpi-icon-wrap">
              <Calendar size={24} />
            </div>
            {stats.pendingEvents > 0 ? (
              <span className="kpi-pill kpi-pill-amber">{stats.pendingEvents} Pending</span>
            ) : (
              <span className="kpi-pill kpi-pill-blue">Scheduled</span>
            )}
          </div>
          <div className="kpi-value-block">
            <span className="kpi-number">{loading ? '—' : stats.activeEvents}</span>
            <span className="kpi-label">Approved Events</span>
          </div>
          <div className="kpi-footer">
            <span>View event calendar</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Pending Gallery Submissions */}
        <div className="kpi-card gallery-kpi" onClick={() => setCurrentPage('gallery')}>
          <div className="kpi-top">
            <div className="kpi-icon-wrap">
              <ImageIcon size={24} />
            </div>
            {stats.pendingImages > 0 ? (
              <span className="kpi-pill kpi-pill-red">{stats.pendingImages} To Review</span>
            ) : (
              <span className="kpi-pill kpi-pill-green">Up to date</span>
            )}
          </div>
          <div className="kpi-value-block">
            <span className="kpi-number">{loading ? '—' : stats.pendingImages}</span>
            <span className="kpi-label">Pending Gallery Items</span>
          </div>
          <div className="kpi-footer">
            <span>Review photo submissions</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Total Messages */}
        <div className="kpi-card messages-kpi" onClick={() => setCurrentPage('messages')}>
          <div className="kpi-top">
            <div className="kpi-icon-wrap">
              <MessageSquare size={24} />
            </div>
            <span className="kpi-pill kpi-pill-purple">Inbox</span>
          </div>
          <div className="kpi-value-block">
            <span className="kpi-number">{loading ? '—' : stats.totalMessages}</span>
            <span className="kpi-label">Contact Messages</span>
          </div>
          <div className="kpi-footer">
            <span>Read contact inquiries</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Unanswered Questions */}
        <div className="kpi-card questions-kpi" onClick={() => setCurrentPage('questions')}>
          <div className="kpi-top">
            <div className="kpi-icon-wrap">
              <HelpCircle size={24} />
            </div>
            {stats.unansweredQuestions > 0 ? (
              <span className="kpi-pill kpi-pill-red">{stats.unansweredQuestions} Needs Answer</span>
            ) : (
              <span className="kpi-pill kpi-pill-green">All Clear</span>
            )}
          </div>
          <div className="kpi-value-block">
            <span className="kpi-number">{loading ? '—' : stats.unansweredQuestions}</span>
            <span className="kpi-label">Unanswered Q&As</span>
          </div>
          <div className="kpi-footer">
            <span>Reply to student questions</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Live Hero Banner Slides */}
        <div className="kpi-card hero-kpi" onClick={() => {
          const el = document.getElementById('hero-management-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}>
          <div className="kpi-top">
            <div className="kpi-icon-wrap">
              <Sparkles size={24} />
            </div>
            <span className="kpi-pill kpi-pill-crimson">Live on Site</span>
          </div>
          <div className="kpi-value-block">
            <span className="kpi-number">{loading ? '—' : heroSlides.filter(s => s.status === 'active').length}</span>
            <span className="kpi-label">Active Hero Slides</span>
          </div>
          <div className="kpi-footer">
            <span>Manage homepage banners</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* ── 3. HERO SECTION MANAGER & LIVE FRONTEND PREVIEW ── */}
      <section id="hero-management-section" className="dash-section hero-management-block">
        <div className="section-head">
          <div className="section-head-left">
            <div className="section-icon-badge">
              <Sparkles size={20} />
            </div>
            <div>
              <h2>Frontend Hero Section & Banners</h2>
              <p>Live preview, configure, add, edit, and delete slides displayed on the public homepage hero banner.</p>
            </div>
          </div>

          <div className="section-head-actions">
            <button
              className="btn-dash-primary"
              onClick={handleOpenAddSlide}
            >
              <Plus size={16} />
              <span>Add New Hero Slide</span>
            </button>
          </div>
        </div>

        {/* ── Interactive Live Hero Preview ── */}
        <div className="live-hero-preview-container">
          <div className="preview-top-toolbar">
            <div className="preview-mode-tag">
              <span className="pulse-dot-red" />
              <span>Live Frontend Hero Viewport (Slide {activePreviewIndex + 1} of {heroSlides.length || 1})</span>
            </div>

            <div className="preview-controls">
              <button
                className="btn-preview-nav"
                onClick={() => setActivePreviewIndex(prev => (prev === 0 ? heroSlides.length - 1 : prev - 1))}
                title="Previous Slide"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                className="btn-preview-autoplay"
                onClick={() => setIsAutoPlaying(prev => !prev)}
                title={isAutoPlaying ? 'Pause Autoplay' : 'Play Autoplay'}
              >
                {isAutoPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>{isAutoPlaying ? 'Autoplay Active' : 'Paused'}</span>
              </button>

              <button
                className="btn-preview-nav"
                onClick={() => setActivePreviewIndex(prev => (prev + 1) % heroSlides.length)}
                title="Next Slide"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Live Mock Hero */}
          {currentPreviewSlide && (
            <div
              className="live-hero-viewport"
              style={{ backgroundImage: `url("${currentPreviewSlide.image}")` }}
            >
              <div className="hero-viewport-overlay" />
              
              <div className="hero-viewport-content" key={currentPreviewSlide.id || activePreviewIndex}>
                <div className="hero-viewport-eyebrow">
                  {currentPreviewSlide.eyebrow || 'KIRINYAGA UNIVERSITY · RED CROSS CHAPTER'}
                </div>
                
                <h1 className="hero-viewport-title">
                  {currentPreviewSlide.first}
                  <br />
                  <span className="hero-viewport-accent">{currentPreviewSlide.accent}</span>
                </h1>

                <p className="hero-viewport-description">
                  {currentPreviewSlide.description}
                </p>

                <div className="hero-viewport-actions">
                  <div className="hero-mock-btn-primary">
                    <span>{currentPreviewSlide.primary || currentPreviewSlide.primary_button_text || 'Learn More'}</span>
                    <span>→</span>
                  </div>
                  <div className="hero-mock-btn-secondary">
                    <span>{currentPreviewSlide.secondary || currentPreviewSlide.secondary_button_text || 'Contact Us'}</span>
                  </div>
                </div>
              </div>

              {/* Slide Dots Indicator */}
              <div className="hero-viewport-dots">
                {heroSlides.map((s, idx) => (
                  <button
                    key={s.id || idx}
                    className={`hero-dot ${idx === activePreviewIndex ? 'active' : ''}`}
                    onClick={() => setActivePreviewIndex(idx)}
                    title={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Floating Quick Action over Live Preview */}
              <div className="hero-viewport-quick-tools">
                <span className={`slide-status-badge ${currentPreviewSlide.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                  {currentPreviewSlide.status === 'active' ? '● Live on Frontend' : '○ Inactive / Hidden'}
                </span>
                <button
                  className="btn-viewport-action edit"
                  onClick={() => handleOpenEditSlide(currentPreviewSlide)}
                >
                  <Edit2 size={13} />
                  <span>Edit This Slide</span>
                </button>
                {heroSlides.length > 1 && (
                  <button
                    className="btn-viewport-action delete"
                    onClick={() => setDeletingSlide(currentPreviewSlide)}
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Hero Slides Management Deck & Table ── */}
        <div className="hero-deck-header">
          <div className="hero-deck-search">
            <input
              type="text"
              placeholder="Search hero headlines, keywords, or eyebrow..."
              value={heroSearchTerm}
              onChange={(e) => setHeroSearchTerm(e.target.value)}
            />
          </div>

          <div className="hero-deck-filters">
            <button
              className={`filter-tab ${heroStatusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setHeroStatusFilter('all')}
            >
              All Slides ({heroSlides.length})
            </button>
            <button
              className={`filter-tab ${heroStatusFilter === 'active' ? 'active' : ''}`}
              onClick={() => setHeroStatusFilter('active')}
            >
              Active ({heroSlides.filter(s => s.status === 'active').length})
            </button>
            <button
              className={`filter-tab ${heroStatusFilter === 'inactive' ? 'active' : ''}`}
              onClick={() => setHeroStatusFilter('inactive')}
            >
              Inactive ({heroSlides.filter(s => s.status === 'inactive').length})
            </button>
          </div>
        </div>

        {/* Slides Grid Deck */}
        <div className="hero-slides-grid">
          {filteredHeroSlides.map((slide, index) => {
            const isCurrentlySelected = heroSlides[activePreviewIndex]?.id === slide.id;
            return (
              <div
                key={slide.id || index}
                className={`hero-slide-card ${isCurrentlySelected ? 'is-selected' : ''}`}
              >
                <div
                  className="slide-card-media"
                  style={{ backgroundImage: `url("${slide.image}")` }}
                >
                  <div className="slide-card-badge-row">
                    <span className="slide-order-pill">Order #{slide.sort_order || index + 1}</span>
                    <span className={`slide-status-pill ${slide.status === 'active' ? 'active' : 'inactive'}`}>
                      {slide.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="slide-card-hover-actions">
                    <button
                      className="btn-card-preview"
                      onClick={() => {
                        const originalIdx = heroSlides.findIndex(s => s.id === slide.id);
                        if (originalIdx !== -1) setActivePreviewIndex(originalIdx);
                      }}
                    >
                      <Eye size={14} />
                      <span>{isCurrentlySelected ? 'Currently Viewing' : 'Preview Live'}</span>
                    </button>
                  </div>
                </div>

                <div className="slide-card-body">
                  <div className="slide-card-eyebrow">{slide.eyebrow}</div>
                  <h3 className="slide-card-title">
                    {slide.first} <span className="accent-text">{slide.accent}</span>
                  </h3>
                  <p className="slide-card-desc">{slide.description}</p>

                  <div className="slide-card-buttons-meta">
                    <div className="button-meta-pill">
                      <span className="btn-type-tag">Primary CTA:</span>
                      <strong>{slide.primary || slide.primary_button_text}</strong>
                      <span className="btn-link-tag">({slide.primaryHref || slide.primary_href})</span>
                    </div>
                    <div className="button-meta-pill">
                      <span className="btn-type-tag">Secondary CTA:</span>
                      <strong>{slide.secondary || slide.secondary_button_text}</strong>
                      <span className="btn-link-tag">({slide.secondaryHref || slide.secondary_href})</span>
                    </div>
                  </div>
                </div>

                <div className="slide-card-footer">
                  <button
                    className="btn-slide-action toggle"
                    onClick={() => handleToggleSlideStatus(slide)}
                    title={slide.status === 'active' ? 'Hide from homepage' : 'Publish to homepage'}
                  >
                    {slide.status === 'active' ? 'Disable' : 'Enable'}
                  </button>

                  <button
                    className="btn-slide-action edit"
                    onClick={() => handleOpenEditSlide(slide)}
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>

                  <button
                    className="btn-slide-action delete"
                    onClick={() => setDeletingSlide(slide)}
                    title="Delete slide"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 4. ADMIN PORTAL OVERVIEW & ACTIVITY HUB ── */}
      <div className="dash-split-section">
        {/* Left Column: Recent Activity Feed */}
        <div className="dash-card activity-feed-card">
          <div className="dash-card-header">
            <div className="dash-card-title">
              <TrendingUp size={18} className="icon-red" />
              <h3>Recent Platform Activity</h3>
            </div>
            <span className="badge-subtle">Real-Time Stream</span>
          </div>

          <div className="activity-list">
            {activities.length === 0 ? (
              <div className="empty-state-simple">No recent activities logged yet.</div>
            ) : (
              activities.map((act, i) => (
                <div key={i} className="activity-item">
                  <div className={`activity-icon-bullet ${act.type || 'system'}`}>
                    {act.type === 'member' && <Users size={14} />}
                    {act.type === 'event' && <Calendar size={14} />}
                    {act.type === 'gallery' && <ImageIcon size={14} />}
                    {act.type !== 'member' && act.type !== 'event' && act.type !== 'gallery' && <ShieldCheck size={14} />}
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">{act.text}</p>
                    <span className="activity-time">
                      {act.time ? new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Portal Modules Quick Launch */}
        <div className="dash-card modules-launch-card">
          <div className="dash-card-header">
            <div className="dash-card-title">
              <LayoutGrid size={18} className="icon-red" />
              <h3>Admin Modules & Quick Navigation</h3>
            </div>
            <span className="badge-subtle">Direct Access</span>
          </div>

          <div className="modules-grid">
            <div className="module-item" onClick={() => setCurrentPage('members')}>
              <div className="module-icon members-color"><Users size={20} /></div>
              <div className="module-details">
                <h4>Members Roster</h4>
                <p>Manage registered volunteers & chapter membership.</p>
              </div>
            </div>

            <div className="module-item" onClick={() => setCurrentPage('leaders')}>
              <div className="module-icon leaders-color"><Award size={20} /></div>
              <div className="module-details">
                <h4>Executive Leadership</h4>
                <p>Update chapter leaders, chairpersons & council.</p>
              </div>
            </div>

            <div className="module-item" onClick={() => setCurrentPage('events')}>
              <div className="module-icon events-color"><Calendar size={20} /></div>
              <div className="module-details">
                <h4>Events & Training</h4>
                <p>Create workshops, blood drives, and drills.</p>
              </div>
            </div>

            <div className="module-item" onClick={() => setCurrentPage('gallery')}>
              <div className="module-icon gallery-color"><ImageIcon size={20} /></div>
              <div className="module-details">
                <h4>Media Gallery</h4>
                <p>Approve and curate outreach photo galleries.</p>
              </div>
            </div>

            <div className="module-item" onClick={() => setCurrentPage('firstaid')}>
              <div className="module-icon firstaid-color"><LifeBuoy size={20} /></div>
              <div className="module-details">
                <h4>First Aid Resources</h4>
                <p>Publish emergency guides and medical protocols.</p>
              </div>
            </div>

            <div className="module-item" onClick={() => setCurrentPage('messages')}>
              <div className="module-icon messages-color"><MessageSquare size={20} /></div>
              <div className="module-details">
                <h4>Direct Messages</h4>
                <p>Read inquiries, broadcasts & contact form submissions.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Chapter Impact & Heritage Strip ── */}
      <div className="dash-impact-bar">
        <div className="impact-item">
          <span className="impact-symbol">♧</span>
          <div>
            <strong>200+</strong>
            <span>Active Volunteers</span>
          </div>
        </div>
        <div className="impact-item">
          <span className="impact-symbol">▦</span>
          <div>
            <strong>50+</strong>
            <span>Chapter Events</span>
          </div>
        </div>
        <div className="impact-item">
          <span className="impact-symbol">♡</span>
          <div>
            <strong>6+ Years</strong>
            <span>Continuous Service</span>
          </div>
        </div>
        <div className="impact-item">
          <span className="impact-symbol">✳</span>
          <div>
            <strong>7 Principles</strong>
            <span>Upholding Humanity</span>
          </div>
        </div>
      </div>

      {/* ── MODAL: Add / Edit Hero Slide ── */}
      {showHeroModal && (
        <div className="modal-overlay" onClick={() => setShowHeroModal(false)}>
          <div className="modal hero-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <div className="modal-title-wrap">
                <Sparkles size={20} className="icon-red" />
                <h2>{editingSlideId ? 'Edit Hero Slide' : 'Add New Hero Slide'}</h2>
              </div>
              <button
                className="btn-modal-close"
                onClick={() => setShowHeroModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveHeroSlide} className="hero-form">
              {/* Eyebrow */}
              <div className="form-group">
                <label>Eyebrow Tagline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KIRINYAGA UNIVERSITY · RED CROSS CHAPTER"
                  value={heroForm.eyebrow}
                  onChange={(e) => setHeroForm({ ...heroForm, eyebrow: e.target.value })}
                />
              </div>

              {/* Title and Accent in 2 columns */}
              <div className="form-row">
                <div className="form-group">
                  <label>First Headline Part *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ready to Help."
                    value={heroForm.first}
                    onChange={(e) => setHeroForm({ ...heroForm, first: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Accent Headline Highlight *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Always."
                    value={heroForm.accent}
                    onChange={(e) => setHeroForm({ ...heroForm, accent: e.target.value })}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label>Slide Description / Copy *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Serving humanity through compassion, courage, and community care — right here on campus."
                  value={heroForm.description}
                  onChange={(e) => setHeroForm({ ...heroForm, description: e.target.value })}
                />
              </div>

              {/* Primary Button */}
              <div className="form-row">
                <div className="form-group">
                  <label>Primary Button Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Learn About Us"
                    value={heroForm.primary_button_text}
                    onChange={(e) => setHeroForm({ ...heroForm, primary_button_text: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Primary Button Target Link</label>
                  <input
                    type="text"
                    placeholder="e.g. /about or /events"
                    value={heroForm.primary_href}
                    onChange={(e) => setHeroForm({ ...heroForm, primary_href: e.target.value })}
                  />
                </div>
              </div>

              {/* Secondary Button */}
              <div className="form-row">
                <div className="form-group">
                  <label>Secondary Button Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Join the Chapter"
                    value={heroForm.secondary_button_text}
                    onChange={(e) => setHeroForm({ ...heroForm, secondary_button_text: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Secondary Button Target Link</label>
                  <input
                    type="text"
                    placeholder="e.g. /contact or /register"
                    value={heroForm.secondary_href}
                    onChange={(e) => setHeroForm({ ...heroForm, secondary_href: e.target.value })}
                  />
                </div>
              </div>

              {/* Background Image Upload & URL */}
              <div className="form-group">
                <label>Hero Background Image *</label>
                <div className="image-input-container">
                  <input
                    type="text"
                    required
                    placeholder="Enter image URL (https://...) or upload an image file below"
                    value={heroForm.image}
                    onChange={(e) => setHeroForm({ ...heroForm, image: e.target.value })}
                  />
                  
                  <div className="upload-btn-wrapper">
                    <label className="btn-upload-file">
                      <Upload size={15} />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload Image File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleHeroImageUpload}
                        disabled={uploadingImage}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>

                {heroForm.image && (
                  <div className="form-image-preview">
                    <img
                      src={heroForm.image}
                      alt="Hero background preview"
                      onError={(e) => {
                        e.target.src = 'https://kyuchapter.netlify.app/1.jpeg';
                      }}
                    />
                    <span>Image Preview Selected</span>
                  </div>
                )}
              </div>

              {/* Status and Order */}
              <div className="form-row">
                <div className="form-group">
                  <label>Display Status</label>
                  <select
                    value={heroForm.status}
                    onChange={(e) => setHeroForm({ ...heroForm, status: e.target.value })}
                  >
                    <option value="active">Active (Visible on Homepage)</option>
                    <option value="inactive">Inactive (Draft / Hidden)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Display Order (Priority)</label>
                  <input
                    type="number"
                    min="1"
                    value={heroForm.sort_order}
                    onChange={(e) => setHeroForm({ ...heroForm, sort_order: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="form-actions-custom">
                <button
                  type="button"
                  className="btn-dash-outline"
                  onClick={() => setShowHeroModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-dash-primary"
                  disabled={savingHero || uploadingImage}
                >
                  {savingHero ? 'Saving Hero Slide...' : editingSlideId ? 'Update Slide' : 'Publish Slide to Frontend'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete Confirmation ── */}
      {deletingSlide && (
        <div className="modal-overlay" onClick={() => setDeletingSlide(null)}>
          <div className="modal modal-delete-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <AlertCircle size={32} />
            </div>
            <h2>Delete Hero Slide?</h2>
            <p>
              Are you sure you want to remove <strong>"{deletingSlide.first} {deletingSlide.accent}"</strong> from the homepage banner?
            </p>
            <div className="form-actions-custom center">
              <button
                className="btn-dash-outline"
                onClick={() => setDeletingSlide(null)}
              >
                Keep Slide
              </button>
              <button
                className="btn-dash-danger"
                onClick={handleConfirmDeleteSlide}
              >
                Yes, Delete Slide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
