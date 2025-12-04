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
          } catch (err) {
            console.error('Failed to invite:', sub.email, err);
          }
        }
      }

      // Upload files if any
      for (const file of selectedFiles) {
        const fileData = new FormData();
        fileData.append('file', file);
        try {
          await fetch(`/api/projects/gc/${projectId}/plans`, {
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

  // Helper to parse trades string into array
  const parseSubTrades = (tradeString) => {
    if (!tradeString) return [];
    return tradeString.split(',').map(t => t.trim()).filter(t => t);
  };

  // Auto-suggest subs based on selected trades
  const suggestedSubs = useMemo(() => {
    if (selectedTags.length === 0) return [];
    return subcontractors.filter(sub => {
      const subTrades = parseSubTrades(sub.trade);
      return subTrades.some(subTrade => 
        selectedTags.some(tag => 
          subTrade.toLowerCase().includes(tag.toLowerCase()) ||
          tag.toLowerCase().includes(subTrade.toLowerCase())
        )
      );
    });
  }, [subcontractors, selectedTags]);

  // Auto-select suggested subs when tags change
  const handleAutoSelectSuggested = () => {
    const suggestedIds = suggestedSubs.map(s => s.id);
    const newSelected = [...new Set([...selectedSubs, ...suggestedIds])];
    setSelectedSubs(newSelected);
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
                    <button type="button" className="import-btn">
                      <Plus size={14} />
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
                                      {sub.subscription_tier && sub.subscription_tier !== 'free' && (
                                        <span className={`tier-badge tier-${sub.subscription_tier}`}>
                                          <Crown size={10} />
                                          {sub.subscription_tier}
                                        </span>
                                      )}
                                    </div>
                                    <div className="sub-trades">
                                      {parseSubTrades(sub.trade).slice(0, 3).map((trade, idx) => (
                                        <span key={idx} className="trade-badge">{trade}</span>
                                      ))}
                                      {parseSubTrades(sub.trade).length > 3 && (
                                        <span className="trade-badge more">+{parseSubTrades(sub.trade).length - 3}</span>
                                      )}
                                    </div>
                                    <div className="sub-meta">
                                      {sub.name} {sub.region && `• ${sub.region}`} {sub.license_number && `• Lic: ${sub.license_number}`}
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
                                  {sub.subscription_tier && sub.subscription_tier !== 'free' && (
                                    <span className={`tier-badge tier-${sub.subscription_tier}`}>
                                      <Crown size={10} />
                                      {sub.subscription_tier}
                                    </span>
                                  )}
                                </div>
                                {sub.trade && (
                                  <div className="sub-trades">
                                    {parseSubTrades(sub.trade).slice(0, 3).map((trade, idx) => (
                                      <span key={idx} className="trade-badge muted">{trade}</span>
                                    ))}
                                    {parseSubTrades(sub.trade).length > 3 && (
                                      <span className="trade-badge muted more">+{parseSubTrades(sub.trade).length - 3}</span>
                                    )}
                                  </div>
                                )}
                                <div className="sub-meta">
                                  {sub.name} {sub.region && `• ${sub.region}`} {sub.license_number && `• Lic: ${sub.license_number}`}
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
                  Publish & Invite {selectedSubs.length > 0 && `(${selectedSubs.length})`}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProjectModal;

