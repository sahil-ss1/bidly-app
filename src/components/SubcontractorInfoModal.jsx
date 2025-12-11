import { useState, useEffect } from 'react';
import { X, Star, Briefcase, MapPin, Mail, Phone, Building2, Award, CheckCircle, Loader2 } from 'lucide-react';
import { usersAPI } from '../services/api';
import './SubcontractorInfoModal.css';

function SubcontractorInfoModal({ isOpen, onClose, subcontractorId }) {
  const [subDetails, setSubDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalBids: 0,
    acceptedBids: 0,
    completedProjects: 0,
    rating: null,
  });

  useEffect(() => {
    if (isOpen && subcontractorId) {
      loadSubDetails();
    } else {
      setSubDetails(null);
      setStats({ totalBids: 0, acceptedBids: 0, completedProjects: 0, rating: null });
    }
  }, [isOpen, subcontractorId]);

  const loadSubDetails = async () => {
    setLoading(true);
    try {
      // Fetch subcontractor details
      const response = await usersAPI.getById(subcontractorId);
      setSubDetails(response.data);

      // TODO: Fetch stats from backend when endpoint is available
      // For now, we'll use placeholder data or calculate from available data
      // You can add an endpoint like: GET /api/users/:id/stats
      
    } catch (error) {
      console.error('Failed to load subcontractor details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - Math.ceil(rating);

    return (
      <div className="rating-stars">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} size={16} className="star filled" fill="currentColor" />
        ))}
        {hasHalfStar && (
          <Star size={16} className="star half" fill="currentColor" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={i} size={16} className="star empty" />
        ))}
        <span className="rating-value">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="sub-info-modal-overlay" onClick={onClose}>
      <div className="sub-info-modal" onClick={e => e.stopPropagation()}>
        <div className="sub-info-modal-header">
          <h3>Subcontractor Details</h3>
          <button className="sub-info-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="sub-info-modal-body">
          {loading ? (
            <div className="sub-info-loading">
              <Loader2 size={24} className="animate-spin" />
              <span>Loading details...</span>
            </div>
          ) : subDetails ? (
            <>
              {/* Header Section */}
              <div className="sub-info-header">
                <div className="sub-info-avatar-large">
                  {getInitials(subDetails.name)}
                </div>
                <div className="sub-info-title">
                  <h4>{subDetails.company_name || subDetails.name}</h4>
                  {subDetails.trade && (
                    <span className="sub-info-trade-badge">{subDetails.trade}</span>
                  )}
                  {subDetails.subscription_tier && subDetails.subscription_tier !== 'free' && (
                    <span className={`sub-info-tier-badge tier-${subDetails.subscription_tier}`}>
                      {subDetails.subscription_tier}
                    </span>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="sub-info-section">
                <h5>Contact Information</h5>
                <div className="sub-info-contact">
                  {subDetails.name && (
                    <div className="sub-info-contact-item">
                      <Building2 size={16} />
                      <span>{subDetails.name}</span>
                    </div>
                  )}
                  {subDetails.email && (
                    <div className="sub-info-contact-item">
                      <Mail size={16} />
                      <span>{subDetails.email}</span>
                    </div>
                  )}
                  {subDetails.phone && (
                    <div className="sub-info-contact-item">
                      <Phone size={16} />
                      <span>{subDetails.phone}</span>
                    </div>
                  )}
                  {subDetails.region && (
                    <div className="sub-info-contact-item">
                      <MapPin size={16} />
                      <span>{subDetails.region}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="sub-info-section">
                <h5>Performance Statistics</h5>
                <div className="sub-info-stats-grid">
                  <div className="sub-info-stat-card">
                    <div className="sub-info-stat-icon">
                      <Briefcase size={20} />
                    </div>
                    <div className="sub-info-stat-content">
                      <div className="sub-info-stat-value">{stats.completedProjects}</div>
                      <div className="sub-info-stat-label">Projects Completed</div>
                    </div>
                  </div>
                  <div className="sub-info-stat-card">
                    <div className="sub-info-stat-icon">
                      <CheckCircle size={20} />
                    </div>
                    <div className="sub-info-stat-content">
                      <div className="sub-info-stat-value">{stats.totalBids}</div>
                      <div className="sub-info-stat-label">Total Bids</div>
                    </div>
                  </div>
                  <div className="sub-info-stat-card">
                    <div className="sub-info-stat-icon success">
                      <Award size={20} />
                    </div>
                    <div className="sub-info-stat-content">
                      <div className="sub-info-stat-value">{stats.acceptedBids}</div>
                      <div className="sub-info-stat-label">Accepted Bids</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating */}
              {stats.rating && (
                <div className="sub-info-section">
                  <h5>Rating</h5>
                  {renderStars(stats.rating)}
                </div>
              )}

              {/* Additional Info */}
              {subDetails.bio && (
                <div className="sub-info-section">
                  <h5>About</h5>
                  <p className="sub-info-bio">{subDetails.bio}</p>
                </div>
              )}
            </>
          ) : (
            <div className="sub-info-error">
              <p>Failed to load subcontractor details</p>
            </div>
          )}
        </div>

        <div className="sub-info-modal-footer">
          <button className="btn-close-modal" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubcontractorInfoModal;

