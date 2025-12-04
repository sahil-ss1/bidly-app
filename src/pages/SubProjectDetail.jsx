import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Calendar, FileText, Eye, Sparkles, 
  DollarSign, MessageSquare, Upload, CheckCircle, Loader2, Send, XCircle, ThumbsUp
} from 'lucide-react';
import { subProjectsAPI, bidsAPI } from '../services/api';
import './ProjectDetail.css';

function SubProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBidForm, setShowBidForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [responding, setResponding] = useState(false);
  const [bidData, setBidData] = useState({
    amount: '',
    notes: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [myBid, setMyBid] = useState(null);
  const [invitationStatus, setInvitationStatus] = useState('pending');

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const response = await subProjectsAPI.getSubProject(id);
      setProject(response.data);
      setInvitationStatus(response.data.invitation_status || 'viewed');
      
      if (response.data.my_bid) {
        setMyBid(response.data.my_bid);
      }
    } catch (error) {
      alert(error.message || 'Failed to load project');
      navigate('/sub/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToInvitation = async (response) => {
    setResponding(true);
    try {
      await subProjectsAPI.respondToInvitation(id, response);
      setInvitationStatus(response);
      if (response === 'declined') {
        navigate('/sub/dashboard');
      }
    } catch (error) {
      alert(error.message || 'Failed to respond to invitation');
    } finally {
      setResponding(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`/api/bids/project/${id}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setSelectedFile(null);
      loadProject();
    } catch (error) {
      alert(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await bidsAPI.submitBid(id, bidData);
      setBidData({ amount: '', notes: '' });
      setShowBidForm(false);
      loadProject();
    } catch (error) {
      alert(error.message || 'Failed to submit bid');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span className="loading-text">Loading project...</span>
      </div>
    );
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <div className="project-detail-page">
      <nav className="project-top-nav">
        <button onClick={() => navigate('/sub/dashboard')} className="back-btn">
          <ArrowLeft size={18} />
          Back
        </button>
        <h1>{project.title}</h1>
      </nav>

      <div className="project-page-content">
        {/* Project Header */}
        <div className="project-header-card">
          <div className="project-header-top">
            <div>
              <h2 className="project-header-title">{project.title}</h2>
              <div className="project-header-meta">
                <span className={`status-badge status-${project.status}`}>
                  {project.status}
                </span>
                {project.location && (
                  <span className="project-header-meta-item">
                    <MapPin size={16} />
                    {project.location}
                  </span>
                )}
                {project.bid_deadline && (
                  <span className="project-header-meta-item">
                    <Calendar size={16} />
                    Due: {new Date(project.bid_deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          {project.description && (
            <p className="project-description-text">{project.description}</p>
          )}
        </div>

        {/* Invitation Response Section */}
        {!myBid && (invitationStatus === 'pending' || invitationStatus === 'viewed') && (
          <div className="invitation-response-card" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h3>
              <ThumbsUp size={20} />
              Respond to Invitation
            </h3>
            <p>You've been invited to bid on this project. Accept to start preparing your bid, or decline if you're not interested.</p>
            <div className="invitation-actions" style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
              <button 
                className="btn btn-primary"
                onClick={() => handleRespondToInvitation('accepted')}
                disabled={responding}
              >
                {responding ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                Accept Invitation
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => handleRespondToInvitation('declined')}
                disabled={responding}
              >
                {responding ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                Decline
              </button>
            </div>
          </div>
        )}

        {invitationStatus === 'accepted' && !myBid && (
          <div className="invitation-accepted-banner" style={{ 
            background: 'var(--color-primary-subtle)', 
            padding: 'var(--spacing-md)', 
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            color: 'var(--color-primary-dark)'
          }}>
            <CheckCircle size={18} />
            <span>You accepted this invitation. You can now submit your bid below.</span>
          </div>
        )}

        {/* AI Plan Summary */}
        {project.ai_plan_summary && (
          <div className="ai-summary-card" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h3>
              <Sparkles size={20} />
              AI Plan Summary
            </h3>
            <p>{project.ai_plan_summary.summary_text}</p>
          </div>
        )}

        {/* Plan Files */}
        {project.plan_files && project.plan_files.length > 0 && (
          <div className="tab-content-section" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h3 className="tab-section-title" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <FileText size={20} />
              Plan Files
            </h3>
            <div className="files-grid">
              {project.plan_files.map((file) => (
                <div key={file.id} className="file-card">
                  <div className="file-icon-wrapper">
                    <FileText size={22} />
                  </div>
                  <div className="file-info">
                    <p className="file-name">{file.file_name}</p>
                    <p className="file-meta">
                      {file.file_size ? `${(file.file_size / 1024).toFixed(2)} KB` : ''}
                    </p>
                  </div>
                  <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="file-action-btn">
                    <Eye size={16} style={{ marginRight: '6px' }} />
                    View
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bid Section */}
        <div className="tab-content-section">
          <h3 className="tab-section-title" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <Send size={20} />
            Your Bid
          </h3>
          
          {myBid ? (
            <div className="my-bid-card">
              <h4>
                <CheckCircle size={20} />
                Bid Submitted
              </h4>
              <div className="my-bid-details">
                <p>
                  <strong>Status:</strong>
                  <span className={`status-badge status-${myBid.status}`} style={{ marginLeft: '8px' }}>
                    {myBid.status}
                  </span>
                </p>
                {myBid.amount && (
                  <p>
                    <DollarSign size={16} />
                    <strong>Amount:</strong> ${Number(myBid.amount).toLocaleString()}
                  </p>
                )}
                {myBid.notes && (
                  <p>
                    <MessageSquare size={16} />
                    <strong>Notes:</strong> {myBid.notes}
                  </p>
                )}
                {myBid.bid_file_url && (
                  <a href={myBid.bid_file_url} target="_blank" rel="noopener noreferrer" className="file-action-btn" style={{ marginTop: 'var(--spacing-md)', display: 'inline-flex', alignItems: 'center' }}>
                    <Eye size={16} style={{ marginRight: '6px' }} />
                    View Bid File
                  </a>
                )}
              </div>
              
              {myBid.ai_summary && (
                <div className="bid-ai-summary" style={{ marginTop: 'var(--spacing-lg)' }}>
                  <strong>
                    <Sparkles size={14} />
                    AI Summary
                  </strong>
                  <p>{myBid.ai_summary}</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {!showBidForm ? (
                <div className="tab-empty-state">
                  <div className="tab-empty-state-icon">
                    <Send size={28} />
                  </div>
                  <h4>Ready to bid?</h4>
                  <p>Submit your bid to compete for this project.</p>
                  <button className="btn btn-primary" onClick={() => setShowBidForm(true)}>
                    <Send size={18} />
                    Submit Bid
                  </button>
                </div>
              ) : (
                <div className="bid-form-card">
                  <h4>
                    <Send size={18} />
                    Submit Your Bid
                  </h4>
                  <form onSubmit={handleSubmitBid}>
                    <div className="form-group">
                      <label>Bid Amount ($)</label>
                      <div style={{ position: 'relative' }}>
                        <DollarSign size={18} style={{ 
                          position: 'absolute', 
                          left: '14px', 
                          top: '50%', 
                          transform: 'translateY(-50%)',
                          color: 'var(--color-text-muted)'
                        }} />
                        <input
                          type="number"
                          step="0.01"
                          value={bidData.amount}
                          onChange={(e) => setBidData({ ...bidData, amount: e.target.value })}
                          placeholder="Enter bid amount"
                          style={{ paddingLeft: '44px' }}
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Notes</label>
                      <textarea
                        value={bidData.notes}
                        onChange={(e) => setBidData({ ...bidData, notes: e.target.value })}
                        placeholder="Additional notes or comments about your bid..."
                        rows={4}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Upload Bid File (PDF)</label>
                      <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setSelectedFile(e.target.files[0])}
                          style={{ flex: 1 }}
                        />
                        {selectedFile && (
                          <button 
                            type="button" 
                            className="btn btn-secondary btn-sm" 
                            onClick={handleFileUpload}
                            disabled={uploading}
                          >
                            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                            {uploading ? 'Uploading...' : 'Upload'}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send size={18} />
                            Submit Bid
                          </>
                        )}
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => setShowBidForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SubProjectDetail;
