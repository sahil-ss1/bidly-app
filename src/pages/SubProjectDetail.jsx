import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Calendar, FileText, Eye, Sparkles, 
  DollarSign, MessageSquare, Upload, CheckCircle, Loader2, Send, X
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
  const [bidData, setBidData] = useState({
    amount: '',
    notes: '',
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [myBid, setMyBid] = useState(null);

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const response = await subProjectsAPI.getSubProject(id);
      setProject(response.data);
      
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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles([...selectedFiles, ...files]);
    e.target.value = ''; // Reset input to allow selecting same file again
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      
      // If files are selected, upload and submit in one step
      if (selectedFiles.length > 0) {
        // Upload the first selected file and create bid in one step
        const formData = new FormData();
        formData.append('file', selectedFiles[0]);
        if (bidData.amount) formData.append('amount', bidData.amount);
        if (bidData.notes) formData.append('notes', bidData.notes);

        const uploadResponse = await fetch(`${API_BASE}/api/bids/project/${id}/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || 'Failed to upload and submit bid');
        }
        
        // If there are additional files, upload them separately (optional - for future enhancement)
        // For now, we'll just use the first file
      } else {
        // Submit bid without file
        await bidsAPI.submitBid(id, bidData);
      }
      
      // Reset form
      setBidData({ amount: '', notes: '' });
      setSelectedFiles([]);
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
              {/* GC Info - Prominent */}
              {(project.gc_company || project.gc_name) && (
                <div className="project-gc-info-header">
                  <Building2 size={18} />
                  <span className="gc-label">From:</span>
                  <span className="gc-name-large">{project.gc_company || project.gc_name}</span>
                </div>
              )}
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
                      <label>Upload Bid Files (PDF)</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        <input
                          type="file"
                          accept=".pdf"
                          multiple
                          onChange={handleFileSelect}
                          style={{ width: '100%' }}
                        />
                        {selectedFiles.length > 0 && (
                          <div className="selected-files-list">
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="selected-file-item">
                                <FileText size={16} />
                                <span>{file.name}</span>
                                <button 
                                  type="button" 
                                  className="remove-file-btn"
                                  onClick={() => removeFile(index)}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="form-hint" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                          Select one or more PDF files to include with your bid. All files will be uploaded when you submit.
                        </p>
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            {selectedFiles.length > 0 ? 'Uploading & Submitting...' : 'Submitting...'}
                          </>
                        ) : (
                          <>
                            <Send size={18} />
                            {selectedFiles.length > 0 ? 'Upload & Submit Bid' : 'Submit Bid'}
                          </>
                        )}
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => {
                          setShowBidForm(false);
                          setBidData({ amount: '', notes: '' });
                          setSelectedFiles([]);
                        }}
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
