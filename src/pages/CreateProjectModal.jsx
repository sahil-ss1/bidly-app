import { useState, useEffect, useMemo } from 'react';
import { 
  X, Upload, Plus, Info, Check, Users, FileText, 
  MapPin, Building2, Import, Loader2, Send, Sparkles, Filter, Crown
} from 'lucide-react';
import { projectsAPI, usersAPI } from '../services/api';
import './CreateProjectModal.css';

const QUICK_SCOPE_TEMPLATES = [
  'New Construction (SFH)',
  'Kitchen Remodel',
  'Bath Addition',
  'Roof Replacement',
  'Deck Build',
];

const PROJECT_TAGS = [
  'General',
  'Plumbing',
  'Electrical',
  'Framing',
  'Roofing',
  'HVAC',
  'Concrete',
  'Finish',
  'Landscaping',
  'Painting',
  'Carpentry',
  'Drywall',
  'Flooring',
  'Excavation',
  'Masonry',
  'Insulation',
];

function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    description: '',
    bid_deadline: '',
  });
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedSubs, setSelectedSubs] = useState([]);
  const [subcontractors, setSubcontractors] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importResults, setImportResults] = useState(null);
  const [selectedUnmatchedEmails, setSelectedUnmatchedEmails] = useState([]);
  const [pendingInviteEmails, setPendingInviteEmails] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadSubcontractors();
    }
  }, [isOpen]);

  const loadSubcontractors = async () => {
    setLoadingSubs(true);
    try {
      // Load all subcontractors
      const response = await usersAPI.getSubcontractors();
      setSubcontractors(response.data || []);
    } catch (err) {
      console.error('Failed to load subcontractors:', err);
      setSubcontractors([]);
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleTemplateClick = (template) => {
    if (selectedTemplates.includes(template)) {
      setSelectedTemplates(selectedTemplates.filter(t => t !== template));
    } else {
      setSelectedTemplates([...selectedTemplates, template]);
    }
  };

  const handleTagClick = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubToggle = (subId) => {
    if (selectedSubs.includes(subId)) {
      setSelectedSubs(selectedSubs.filter(id => id !== subId));
    } else {
      setSelectedSubs([...selectedSubs, subId]);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Track invitation results
    let inviteSuccessCount = 0;
    let inviteFailCount = 0;
    const failedEmails = [];

    try {
      // Build description with templates and tags
      let fullDescription = formData.description;
      if (selectedTemplates.length > 0) {
        fullDescription = `Scope: ${selectedTemplates.join(', ')}\n\n${fullDescription}`;
      }
      if (selectedTags.length > 0) {
        fullDescription = `${fullDescription}\n\nTrades: ${selectedTags.join(', ')}`;
      }

      // Create project
      const projectData = {
        title: formData.title || formData.location || 'Untitled Project',
        description: fullDescription,
        location: formData.location,
        bid_deadline: formData.bid_deadline || null,
      };

      const response = await projectsAPI.createProject(projectData);
      const projectId = response.data.id;

      // Send invitations to selected subcontractors
      for (const subId of selectedSubs) {
        const sub = subcontractors.find(s => s.id === subId);
        if (sub?.email) {
          try {
            await projectsAPI.inviteSub(projectId, { invite_email: sub.email });
            inviteSuccessCount++;
          } catch (err) {
            console.error('Failed to invite:', sub.email, err);
            inviteFailCount++;
            failedEmails.push(sub.email);
          }
        }
      }

      // Send invitations to pending (unregistered) emails
      for (const email of pendingInviteEmails) {
        try {
          await projectsAPI.inviteSub(projectId, { invite_email: email });
          inviteSuccessCount++;
        } catch (err) {
          console.error('Failed to invite unregistered:', email, err);
          inviteFailCount++;
          failedEmails.push(email);
        }
      }

      // Upload files if any - Use the correct API URL
      const API_BASE = import.meta.env.VITE_API_URL || '';
      for (const file of selectedFiles) {
        const fileData = new FormData();
        fileData.append('file', file);
        try {
          await fetch(`${API_BASE}/api/projects/gc/${projectId}/plans`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: fileData,
          });
        } catch (err) {
          console.error('Failed to upload file:', file.name, err);
        }
      }

      // Reset form
      setFormData({ title: '', location: '', description: '', bid_deadline: '' });
      setSelectedTemplates([]);
      setSelectedTags([]);
      setSelectedSubs([]);
      setSelectedFiles([]);
      setPendingInviteEmails([]);

      // Show feedback if some invitations failed
      if (inviteFailCount > 0) {
        alert(`Project created! ${inviteSuccessCount} invitation(s) sent successfully. ${inviteFailCount} failed: ${failedEmails.join(', ')}`);
      }

      onProjectCreated(response.data);
      onClose();
    } catch (error) {
      alert(error.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  };

  // Auto-suggest subs based on selected trades
  const suggestedSubs = useMemo(() => {
    if (selectedTags.length === 0) return [];
    return subcontractors.filter(sub => 
      sub.trade && selectedTags.some(tag => 
        sub.trade.toLowerCase().includes(tag.toLowerCase()) ||
        tag.toLowerCase().includes(sub.trade.toLowerCase())
      )
    );
  }, [subcontractors, selectedTags]);

  // Auto-select suggested subs when tags change
  const handleAutoSelectSuggested = () => {
    const suggestedIds = suggestedSubs.map(s => s.id);
    const newSelected = [...new Set([...selectedSubs, ...suggestedIds])];
    setSelectedSubs(newSelected);
  };

  // Import list functionality
  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setImportText(text);
      processImportText(text);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const processImportText = (text) => {
    // Parse emails from text (supports CSV, newline-separated, comma-separated)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const foundEmails = text.match(emailRegex) || [];
    const uniqueEmails = [...new Set(foundEmails.map(e => e.toLowerCase()))];

    // Match emails with existing subcontractors
    const matchedSubs = subcontractors.filter(sub => 
      uniqueEmails.includes(sub.email?.toLowerCase())
    );
    const unmatchedEmails = uniqueEmails.filter(email => 
      !subcontractors.some(sub => sub.email?.toLowerCase() === email)
    );

    setImportResults({
      totalFound: uniqueEmails.length,
      matched: matchedSubs,
      unmatched: unmatchedEmails
    });
    // Auto-select all unmatched emails for invite
    setSelectedUnmatchedEmails(unmatchedEmails);
  };

  const handleToggleUnmatchedEmail = (email) => {
    if (selectedUnmatchedEmails.includes(email)) {
      setSelectedUnmatchedEmails(selectedUnmatchedEmails.filter(e => e !== email));
    } else {
      setSelectedUnmatchedEmails([...selectedUnmatchedEmails, email]);
    }
  };

  const handleSelectAllUnmatched = () => {
    if (importResults?.unmatched) {
      setSelectedUnmatchedEmails([...importResults.unmatched]);
    }
  };

  const handleClearUnmatched = () => {
    setSelectedUnmatchedEmails([]);
  };

  const handleApplyImport = () => {
    if (importResults?.matched) {
      const matchedIds = importResults.matched.map(s => s.id);
      const newSelected = [...new Set([...selectedSubs, ...matchedIds])];
      setSelectedSubs(newSelected);
    }
    // Store unmatched emails that were selected for inviting
    if (selectedUnmatchedEmails.length > 0) {
      setPendingInviteEmails([...new Set([...pendingInviteEmails, ...selectedUnmatchedEmails])]);
    }
    setShowImportModal(false);
    setImportText('');
    setImportResults(null);
    setSelectedUnmatchedEmails([]);
  };

  const handleCloseImport = () => {
    setShowImportModal(false);
    setImportText('');
    setImportResults(null);
    setSelectedUnmatchedEmails([]);
  };

  const handleRemovePendingInvite = (email) => {
    setPendingInviteEmails(pendingInviteEmails.filter(e => e !== email));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Project</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="modal-grid">
              {/* Left Column */}
              <div className="modal-left-column">
                {/* Project Name */}
                <div className="form-group">
                  <label>Project Name (Optional)</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Smith Kitchen Remodel"
                  />
                  <span className="form-hint">If blank, address will be used.</span>
                </div>

                {/* Address */}
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="123 Main St"
                  />
                </div>

                {/* Quick Scope Templates */}
                <div className="form-group">
                  <label>Quick Scope Templates</label>
                  <div className="template-tags">
                    {QUICK_SCOPE_TEMPLATES.map((template) => (
                      <button
                        key={template}
                        type="button"
                        className={`template-tag ${selectedTemplates.includes(template) ? 'selected' : ''}`}
                        onClick={() => handleTemplateClick(template)}
                      >
                        <Plus size={14} />
                        {template}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the work to be done..."
                    rows={3}
                  />
                </div>

                {/* Project Tags */}
                <div className="form-group">
                  <label>Project Tags (Trades needed)</label>
                  <div className="project-tags">
                    {PROJECT_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={`project-tag ${selectedTags.includes(tag) ? 'selected' : ''}`}
                        onClick={() => handleTagClick(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="modal-right-column">
                {/* Select Subcontractors */}
                <div className="form-group subcontractors-section">
                  <div className="section-header-row">
                    <label>
                      Select Subcontractors <span className="count">({selectedSubs.length})</span>
                    </label>
                    <button type="button" className="import-btn" onClick={() => setShowImportModal(true)}>
                      <Import size={14} />
                      Import List
                    </button>
                  </div>
                  
                  {/* Auto-suggest banner */}
                  {suggestedSubs.length > 0 && (
                    <div className="auto-suggest-banner">
                      <div className="suggest-info">
                        <Sparkles size={16} />
                        <span><strong>{suggestedSubs.length}</strong> subs match your selected trades</span>
                      </div>
                      <button 
                        type="button" 
                        className="auto-select-btn"
                        onClick={handleAutoSelectSuggested}
                      >
                        <Filter size={14} />
                        Auto-Select All
                      </button>
                    </div>
                  )}
                  
                  <div className="subcontractors-list">
                    {loadingSubs ? (
                      <div className="loading-subs">
                        <Loader2 size={20} className="animate-spin" />
                        <span>Loading subcontractors...</span>
                      </div>
                    ) : subcontractors.length === 0 ? (
                      <div className="no-subs">
                        <Users size={24} />
                        <p>No subcontractors found</p>
                        <span>Subcontractors will appear here once they register</span>
                      </div>
                    ) : (
                      <>
                        {/* Show suggested subs first */}
                        {suggestedSubs.length > 0 && (
                          <>
                            <div className="subs-section-label">
                              <Sparkles size={14} />
                              Matching Trades ({suggestedSubs.length})
                            </div>
                            {suggestedSubs.map((sub) => (
                              <div 
                                key={sub.id} 
                                className={`subcontractor-item suggested ${selectedSubs.includes(sub.id) ? 'selected' : ''}`}
                                onClick={() => handleSubToggle(sub.id)}
                              >
                                <div className="sub-info">
                                  <div className="sub-avatar suggested">
                                    {getInitials(sub.name)}
                                  </div>
                                  <div className="sub-details">
                                    <div className="sub-name">
                                      {sub.company_name || sub.name}
                                      <span className="trade-badge">{sub.trade}</span>
                                      {sub.subscription_tier && sub.subscription_tier !== 'free' && (
                                        <span className={`tier-badge tier-${sub.subscription_tier}`}>
                                          <Crown size={10} />
                                          {sub.subscription_tier}
                                        </span>
                                      )}
                                    </div>
                                    <div className="sub-meta">
                                      {sub.name} {sub.region && `• ${sub.region}`}
                                    </div>
                                  </div>
                                </div>
                                <div className={`sub-checkbox ${selectedSubs.includes(sub.id) ? 'checked' : ''}`}>
                                  {selectedSubs.includes(sub.id) && <Check size={14} />}
                                </div>
                              </div>
                            ))}
                            {subcontractors.filter(s => !suggestedSubs.includes(s)).length > 0 && (
                              <div className="subs-section-label other">
                                <Users size={14} />
                                Other Subcontractors
                              </div>
                            )}
                          </>
                        )}
                        {/* Show other subs (already sorted by tier from backend) */}
                        {subcontractors.filter(s => !suggestedSubs.find(ss => ss.id === s.id)).map((sub) => (
                          <div 
                            key={sub.id} 
                            className={`subcontractor-item ${selectedSubs.includes(sub.id) ? 'selected' : ''}`}
                            onClick={() => handleSubToggle(sub.id)}
                          >
                            <div className="sub-info">
                              <div className="sub-avatar">
                                {getInitials(sub.name)}
                              </div>
                              <div className="sub-details">
                                <div className="sub-name">
                                  {sub.company_name || sub.name}
                                  {sub.trade && <span className="trade-badge muted">{sub.trade}</span>}
                                  {sub.subscription_tier && sub.subscription_tier !== 'free' && (
                                    <span className={`tier-badge tier-${sub.subscription_tier}`}>
                                      <Crown size={10} />
                                      {sub.subscription_tier}
                                    </span>
                                  )}
                                </div>
                                <div className="sub-meta">
                                  {sub.name} {sub.region && `• ${sub.region}`}
                                </div>
                              </div>
                            </div>
                            <div className={`sub-checkbox ${selectedSubs.includes(sub.id) ? 'checked' : ''}`}>
                              {selectedSubs.includes(sub.id) && <Check size={14} />}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Pending Invite Emails */}
                  {pendingInviteEmails.length > 0 && (
                    <div className="pending-invites">
                      <label>
                        <Send size={14} />
                        Pending Invites ({pendingInviteEmails.length})
                      </label>
                      <div className="pending-invites-list">
                        {pendingInviteEmails.map(email => (
                          <div key={email} className="pending-invite-item">
                            <span>{email}</span>
                            <button type="button" onClick={() => handleRemovePendingInvite(email)}>
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Plans */}
                <div className="form-group upload-section">
                  <label>Upload Plans (PDF/Images)</label>
                  <div 
                    className="upload-area"
                    onClick={() => document.getElementById('file-input').click()}
                  >
                    <input
                      id="file-input"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      multiple
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <Upload size={28} strokeWidth={1.5} />
                    <span className="upload-text">Click to upload files</span>
                    <span className="upload-hint">(PDF, PNG, JPG accepted)</span>
                  </div>
                  
                  {selectedFiles.length > 0 && (
                    <div className="selected-files">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="selected-file">
                          <FileText size={16} />
                          <span>{file.name}</span>
                          <button type="button" onClick={() => removeFile(index)}>
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-create" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Publish & Invite {(selectedSubs.length + pendingInviteEmails.length) > 0 && `(${selectedSubs.length + pendingInviteEmails.length})`}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Import List Modal */}
        {showImportModal && (
          <div className="import-modal-overlay" onClick={handleCloseImport}>
            <div className="import-modal" onClick={e => e.stopPropagation()}>
              <div className="import-modal-header">
                <h3>Import Subcontractor List</h3>
                <button className="import-close-btn" onClick={handleCloseImport}>
                  <X size={18} />
                </button>
              </div>
              
              <div className="import-modal-body">
                <p className="import-hint">
                  Upload a CSV/TXT file or paste emails below. We'll match them with registered subcontractors.
                </p>
                
                <div className="import-upload-section">
                  <input
                    id="import-file-input"
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleImportFile}
                    style={{ display: 'none' }}
                  />
                  <button 
                    type="button" 
                    className="import-upload-btn"
                    onClick={() => document.getElementById('import-file-input').click()}
                  >
                    <Upload size={16} />
                    Upload File
                  </button>
                  <span className="import-or">or</span>
                </div>

                <textarea
                  className="import-textarea"
                  placeholder="Paste emails here (one per line or comma-separated)&#10;&#10;Example:&#10;john@example.com&#10;jane@contractor.com, mike@builder.com"
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    if (e.target.value.trim()) {
                      processImportText(e.target.value);
                    } else {
                      setImportResults(null);
                    }
                  }}
                  rows={6}
                />

                {importResults && (
                  <div className="import-results">
                    <div className="import-summary">
                      <span className="import-stat success">
                        <Check size={14} />
                        {importResults.matched.length} registered
                      </span>
                      {importResults.unmatched.length > 0 && (
                        <span className="import-stat warning">
                          <Send size={14} />
                          {selectedUnmatchedEmails.length}/{importResults.unmatched.length} to invite
                        </span>
                      )}
                    </div>

                    <div className="import-lists-container">
                      {importResults.matched.length > 0 && (
                        <div className="import-matched-list">
                          <label>
                            <Check size={12} />
                            Registered ({importResults.matched.length}) - Will be selected
                          </label>
                          <div className="import-list-scroll">
                            {importResults.matched.map(sub => (
                              <div key={sub.id} className="import-matched-item">
                                <div className="import-checkbox checked">
                                  <Check size={10} />
                                </div>
                                <span className="import-name">{sub.company_name || sub.name}</span>
                                <span className="import-email">{sub.email}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {importResults.unmatched.length > 0 && (
                        <div className="import-unmatched-list">
                          <div className="import-list-header">
                            <label>
                              <Send size={12} />
                              Not Registered ({importResults.unmatched.length}) - Send Invite?
                            </label>
                            <div className="import-list-actions">
                              <button type="button" onClick={handleSelectAllUnmatched}>
                                Select All
                              </button>
                              <button type="button" onClick={handleClearUnmatched}>
                                Clear
                              </button>
                            </div>
                          </div>
                          <div className="import-list-scroll">
                            {importResults.unmatched.map(email => (
                              <div 
                                key={email} 
                                className={`import-unmatched-item ${selectedUnmatchedEmails.includes(email) ? 'selected' : ''}`}
                                onClick={() => handleToggleUnmatchedEmail(email)}
                              >
                                <div className={`import-checkbox ${selectedUnmatchedEmails.includes(email) ? 'checked' : ''}`}>
                                  {selectedUnmatchedEmails.includes(email) && <Check size={10} />}
                                </div>
                                <span className="import-email-full">{email}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="import-modal-footer">
                <button type="button" className="btn-cancel" onClick={handleCloseImport}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn-import-apply"
                  onClick={handleApplyImport}
                  disabled={!importResults?.matched?.length && !selectedUnmatchedEmails.length}
                >
                  <Check size={16} />
                  Apply ({importResults?.matched?.length || 0} registered{selectedUnmatchedEmails.length > 0 ? ` + ${selectedUnmatchedEmails.length} invites` : ''})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateProjectModal;

