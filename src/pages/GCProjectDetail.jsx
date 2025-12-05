import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Calendar, FileText, Users, Mail, 
  Plus, Upload, Send, Eye, Sparkles, BarChart3, X,
  Clock, Building2, Loader2, RefreshCw, CheckCircle, XCircle, EyeIcon,
  Target, Shield, TrendingUp, Edit, Save, LayoutDashboard
} from 'lucide-react';
import { projectsAPI, bidsAPI } from '../services/api';
import './ProjectDetail.css';

function GCProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    location: '',
    bid_deadline: '',
    status: ''
  });

  useEffect(() => {
    loadProject();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'comparison' && project) {
      loadComparison();
    }
  }, [activeTab, project]);

  const loadProject = async () => {
    try {
      const response = await projectsAPI.getGCProject(id);
      setProject(response.data);
      setEditData({
        title: response.data.title || '',
        description: response.data.description || '',
        location: response.data.location || '',
        bid_deadline: response.data.bid_deadline ? new Date(response.data.bid_deadline).toISOString().slice(0, 16) : '',
        status: response.data.status || 'draft'
      });
    } catch (error) {
      alert(error.message || 'Failed to load project');
      navigate('/gc/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async () => {
    setSaving(true);
    try {
      await projectsAPI.updateProject(id, editData);
      setEditing(false);
      loadProject();
    } catch (error) {
      alert(error.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleInviteSub = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await projectsAPI.inviteSub(id, { invite_email: inviteEmail });
      setInviteEmail('');
      setShowInviteForm(false);
      loadProject();
    } catch (error) {
      alert(error.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`/api/projects/gc/${id}/plans`, {
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
      setShowUploadForm(false);
      loadProject();
    } catch (error) {
      alert(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const loadComparison = async () => {
    try {
      const response = await projectsAPI.getComparison(id);
      setComparison(response.data);
    } catch (error) {
      setComparison(null);
    }
  };

  const handleGenerateComparison = async () => {
    try {
      await projectsAPI.generateComparison(id);
      loadComparison();
    } catch (error) {
      alert(error.message || 'Failed to generate comparison');
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
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
        <button onClick={() => navigate('/gc/dashboard')} className="back-btn">
          <ArrowLeft size={18} />
          Back
        </button>
        <h1>{project.title}</h1>
      </nav>

      <div className="project-page-content">
        {/* Project Header */}
        <div className="project-header-card">
          {editing ? (
            <div className="project-edit-form">
              <div className="form-group">
                <label>Project Title</label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  placeholder="Project title"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  placeholder="Project description"
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={editData.location}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    placeholder="Project location"
                  />
                </div>
                <div className="form-group">
                  <label>Bid Deadline</label>
                  <input
                    type="datetime-local"
                    value={editData.bid_deadline}
                    onChange={(e) => setEditData({ ...editData, bid_deadline: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="awarded">Awarded</option>
                </select>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleSaveProject} disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn btn-secondary" onClick={() => setEditing(false)}>
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
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
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
                  <Edit size={16} /> Edit
                </button>
              </div>
              {project.description && (
                <p className="project-description-text">{project.description}</p>
              )}
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="project-tabs">
          <button
            className={`project-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart3 size={18} />
            Overview
          </button>
          <button
            className={`project-tab ${activeTab === 'plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('plans')}
          >
            <FileText size={18} />
            Plans
            <span className="project-tab-badge">{project.plan_files?.length || 0}</span>
          </button>
          <button
            className={`project-tab ${activeTab === 'invitations' ? 'active' : ''}`}
            onClick={() => setActiveTab('invitations')}
          >
            <Mail size={18} />
            Invitations
            <span className="project-tab-badge">{project.invitations?.length || 0}</span>
          </button>
          <button
            className={`project-tab ${activeTab === 'bids' ? 'active' : ''}`}
            onClick={() => setActiveTab('bids')}
          >
            <Users size={18} />
            Bids
            <span className="project-tab-badge">{project.bids?.length || 0}</span>
          </button>
          <button
            className={`project-tab ${activeTab === 'comparison' ? 'active' : ''}`}
            onClick={() => setActiveTab('comparison')}
          >
            <Sparkles size={18} />
            AI Comparison
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content-section">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="overview-stats-grid">
                <div className="overview-stat-card">
                  <div className="overview-stat-value">{project.plan_files?.length || 0}</div>
                  <div className="overview-stat-label">Plan Files</div>
                </div>
                <div className="overview-stat-card">
                  <div className="overview-stat-value">{project.invitations?.length || 0}</div>
                  <div className="overview-stat-label">Invitations Sent</div>
                </div>
                <div className="overview-stat-card">
                  <div className="overview-stat-value">{project.bids?.length || 0}</div>
                  <div className="overview-stat-label">Bids Received</div>
                </div>
                <div className="overview-stat-card">
                  <div className="overview-stat-value">
                    {project.bids?.filter(b => b.status === 'awarded').length || 0}
                  </div>
                  <div className="overview-stat-label">Awarded</div>
                </div>
              </div>

              {/* Guaranteed Bids Status */}
              <div className="guaranteed-bids-card">
                <div className="guaranteed-bids-header">
                  <div className="guaranteed-bids-icon">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h3>Guaranteed Bids</h3>
                    <p>Bidly ensures you receive a minimum number of quality bids</p>
                  </div>
                </div>
                <div className="guaranteed-bids-content">
                  <div className="guaranteed-bids-progress">
                    <div className="guaranteed-progress-header">
                      <span>
                        <Target size={16} />
                        Bid Progress
                      </span>
                      <span className="guaranteed-count">
                        {project.bids?.length || 0} / {project.guaranteed_min_bids || 3} bids
                      </span>
                    </div>
                    <div className="guaranteed-progress-bar">
                      <div 
                        className="guaranteed-progress-fill"
                        style={{ 
                          width: `${Math.min(100, ((project.bids?.length || 0) / (project.guaranteed_min_bids || 3)) * 100)}%` 
                        }}
                      />
                    </div>
                    <div className="guaranteed-progress-footer">
                      {(project.bids?.length || 0) >= (project.guaranteed_min_bids || 3) ? (
                        <span className="guarantee-achieved">
                          <CheckCircle size={14} /> Minimum guarantee achieved!
                        </span>
                      ) : (
                        <span className="guarantee-pending">
                          <TrendingUp size={14} /> 
                          {(project.guaranteed_min_bids || 3) - (project.bids?.length || 0)} more bid(s) guaranteed
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="guaranteed-bids-stats">
                    <div className="gb-stat">
                      <span className="gb-stat-value">{project.invitations?.filter(i => i.status === 'viewed').length || 0}</span>
                      <span className="gb-stat-label">Viewed</span>
                    </div>
                    <div className="gb-stat">
                      <span className="gb-stat-value">{project.invitations?.filter(i => i.status === 'accepted').length || 0}</span>
                      <span className="gb-stat-label">Accepted</span>
                    </div>
                    <div className="gb-stat">
                      <span className="gb-stat-value">
                        {((project.bids?.length || 0) / Math.max(1, project.invitations?.length || 1) * 100).toFixed(0)}%
                      </span>
                      <span className="gb-stat-label">Response Rate</span>
                    </div>
                  </div>
                </div>
              </div>

              {project.ai_plan_summary && (
                <div className="ai-summary-card">
                  <h3>
                    <Sparkles size={20} />
                    AI Plan Summary
                  </h3>
                  <p>{project.ai_plan_summary.summary_text}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="plans-tab">
              <div className="tab-section-header">
                <h3 className="tab-section-title">
                  <FileText size={20} />
                  Plan Files
                </h3>
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={() => setShowUploadForm(!showUploadForm)}
                >
                  {showUploadForm ? <X size={16} /> : <Upload size={16} />}
                  {showUploadForm ? 'Cancel' : 'Upload Plan'}
                </button>
              </div>

              {showUploadForm && (
                <form className="tab-form" onSubmit={handleFileUpload}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    required
                  />
                  <button type="submit" className="btn btn-primary" disabled={uploading}>
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </form>
              )}

              {project.plan_files && project.plan_files.length > 0 ? (
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
                          {file.created_at && ` • ${new Date(file.created_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="file-action-btn">
                        <Eye size={16} style={{ marginRight: '6px' }} />
                        View
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="tab-empty-state">
                  <div className="tab-empty-state-icon">
                    <FileText size={28} />
                  </div>
                  <h4>No plan files yet</h4>
                  <p>Upload project plans to share with invited subcontractors.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'invitations' && (
            <div className="invitations-tab">
              <div className="tab-section-header">
                <h3 className="tab-section-title">
                  <Mail size={20} />
                  Subcontractor Invitations
                </h3>
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={() => setShowInviteForm(!showInviteForm)}
                >
                  {showInviteForm ? <X size={16} /> : <Plus size={16} />}
                  {showInviteForm ? 'Cancel' : 'Invite Sub'}
                </button>
              </div>

              {showInviteForm && (
                <form className="tab-form" onSubmit={handleInviteSub}>
                  <input
                    type="email"
                    placeholder="Enter subcontractor email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary" disabled={inviting}>
                    {inviting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {inviting ? 'Sending...' : 'Send Invite'}
                  </button>
                </form>
              )}

              {/* Invitation tracking summary */}
              {project.invitations && project.invitations.length > 0 && (
                <div className="invitation-tracking-summary">
                  <div className="tracking-stat">
                    <Mail size={16} />
                    <span>{project.invitations.length} Sent</span>
                  </div>
                  <div className="tracking-stat viewed">
                    <EyeIcon size={16} />
                    <span>{project.invitations.filter(i => i.status === 'viewed' || i.viewed_at).length} Viewed</span>
                  </div>
                  <div className="tracking-stat accepted">
                    <CheckCircle size={16} />
                    <span>{project.invitations.filter(i => i.status === 'accepted').length} Accepted</span>
                  </div>
                  <div className="tracking-stat declined">
                    <XCircle size={16} />
                    <span>{project.invitations.filter(i => i.status === 'declined').length} Declined</span>
                  </div>
                </div>
              )}

              {project.invitations && project.invitations.length > 0 ? (
                <div className="invitations-grid">
                  {project.invitations.map((inv) => (
                    <div key={inv.id} className={`invitation-card ${inv.status}`}>
                      <div className="invitation-info">
                        <div className={`invitation-avatar ${inv.status}`}>
                          {inv.status === 'accepted' ? <CheckCircle size={20} /> :
                           inv.status === 'viewed' ? <EyeIcon size={20} /> :
                           inv.status === 'declined' ? <XCircle size={20} /> :
                           <Mail size={20} />}
                        </div>
                        <div className="invitation-details">
                          <h4>{inv.sub_name || inv.invite_email}</h4>
                          {inv.sub_name && <p>{inv.invite_email}</p>}
                          {inv.sub_company && <p className="sub-company">{inv.sub_company}</p>}
                        </div>
                      </div>
                      <div className="invitation-meta">
                        <span className={`status-badge status-${inv.status}`}>{inv.status}</span>
                        <div className="invitation-dates">
                          <span className="invitation-date">
                            <Clock size={12} />
                            Sent: {new Date(inv.created_at).toLocaleDateString()}
                          </span>
                          {inv.viewed_at && (
                            <span className="invitation-date viewed">
                              <EyeIcon size={12} />
                              Viewed: {new Date(inv.viewed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="tab-empty-state">
                  <div className="tab-empty-state-icon">
                    <Users size={28} />
                  </div>
                  <h4>No invitations yet</h4>
                  <p>Invite subcontractors to bid on this project.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bids' && (
            <div className="bids-tab">
              <h3 className="tab-section-title" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <Users size={20} />
                Submitted Bids
              </h3>
              
              {project.bids && project.bids.length > 0 ? (
                <div className="bids-grid">
                  {project.bids.map((bid) => (
                    <div key={bid.id} className="bid-card">
                      <div className="bid-card-header">
                        <div className="bid-card-user">
                          <div className="bid-avatar">
                            {getInitials(bid.sub_name)}
                          </div>
                          <div className="bid-user-info">
                            <h4>{bid.sub_name || 'Unknown'}</h4>
                            {bid.sub_company && <p>{bid.sub_company}</p>}
                          </div>
                        </div>
                        <span className={`status-badge status-${bid.status}`}>{bid.status}</span>
                      </div>
                      
                      {bid.amount && (
                        <div className="bid-amount">${Number(bid.amount).toLocaleString()}</div>
                      )}
                      
                      {bid.notes && <p className="bid-notes">{bid.notes}</p>}
                      
                      {bid.ai_summary && (
                        <div className="bid-ai-summary">
                          <strong>
                            <Sparkles size={14} />
                            AI Summary
                          </strong>
                          <p>{bid.ai_summary}</p>
                        </div>
                      )}
                      
                      {bid.bid_file_url && (
                        <a href={bid.bid_file_url} target="_blank" rel="noopener noreferrer" className="file-action-btn" style={{ marginBottom: 'var(--spacing-md)', display: 'inline-flex', alignItems: 'center' }}>
                          <Eye size={16} style={{ marginRight: '6px' }} />
                          View Bid File
                        </a>
                      )}
                      
                      <div className="bid-card-footer">
                        <select
                          className="bid-status-select"
                          value={bid.status}
                          onChange={(e) => {
                            bidsAPI.updateBidStatus(bid.id, e.target.value)
                              .then(() => loadProject())
                              .catch(err => alert(err.message));
                          }}
                        >
                          <option value="submitted">Submitted</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                          <option value="awarded">Awarded</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="tab-empty-state">
                  <div className="tab-empty-state-icon">
                    <FileText size={28} />
                  </div>
                  <h4>No bids received yet</h4>
                  <p>Invite subcontractors to start receiving bids.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comparison' && (
            <div className="comparison-tab">
              <div className="tab-section-header">
                <h3 className="tab-section-title">
                  <Sparkles size={20} />
                  AI Bid Comparison
                </h3>
                {project.bids && project.bids.length > 1 && (
                  <button className="btn btn-primary btn-sm" onClick={handleGenerateComparison}>
                    <RefreshCw size={16} />
                    {comparison ? 'Regenerate' : 'Generate'}
                  </button>
                )}
              </div>
              
              {project.bids && project.bids.length < 2 ? (
                <div className="tab-empty-state">
                  <div className="tab-empty-state-icon">
                    <BarChart3 size={28} />
                  </div>
                  <h4>Need more bids</h4>
                  <p>At least 2 bids are required to generate an AI comparison.</p>
                </div>
              ) : comparison ? (
                <div className="comparison-content">
                  <pre>{comparison.summary_text}</pre>
                  {comparison.created_at && (
                    <p className="comparison-date">
                      Generated: {new Date(comparison.created_at).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="tab-empty-state">
                  <div className="tab-empty-state-icon">
                    <Sparkles size={28} />
                  </div>
                  <h4>No comparison yet</h4>
                  <p>Click "Generate" to create an AI-powered comparison of all received bids.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GCProjectDetail;
