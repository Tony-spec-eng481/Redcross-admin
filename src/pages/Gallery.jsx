import React, { useState, useEffect } from 'react';
import './Gallery.css';
import api from '../utils/api';

function Gallery() {
  const [gallery, setGallery] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchGallery = () => {
    setLoading(true);
    api.get('/admin/gallery')
      .then(res => {
        if (res.data.success) setGallery(res.data.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/admin/gallery/${id}/approve`);
      fetchGallery();
    } catch (e) { console.error(e); }
  };

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason (optional):');
    try {
      await api.patch(`/admin/gallery/${id}/reject`, { reason });
      fetchGallery();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete image?")) {
      try {
        await api.delete(`/admin/gallery/${id}`);
        fetchGallery();
      } catch (e) { console.error(e); }
    }
  };

  const filtered = filter === 'all' ? gallery : gallery.filter(item => item.status === filter);

  return (
    <div>
      <div className="page-header">
        <h1>Gallery Management</h1>
      </div>

      <div className="gallery-tabs">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} className={`gallery-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && ` (${gallery.filter(i => i.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">Loading gallery items...</div>
      ) : (
        <div className="gallery-grid">
          {filtered.map(item => (
            <div key={item.id} className="gallery-card">
              <img src={item.image_url} alt={item.title || 'Gallery item'} className="gallery-img" />
              <div className="gallery-info">
                <div>
                  <span className={`badge badge-${item.status}`}>{item.status}</span>
                  {item.title && <p className="gallery-title">{item.title}</p>}
                </div>
                <div className="gallery-actions">
                  {item.status === 'pending' && (
                    <>
                      <button className="btn-approve" onClick={() => handleApprove(item.id)}>Approve</button>
                      <button className="btn-reject" onClick={() => handleReject(item.id)}>Reject</button>
                    </>
                  )}
                  <button className="btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="empty-state">No images found for this filter</div>}
        </div>
      )}
    </div>
  );
}

export default Gallery;
