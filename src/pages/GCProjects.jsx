import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, ArrowLeft, Plus, Search, Filter, MoreVertical,
  Edit, Trash2, Eye, MapPin, Calendar, Users, FileText,
  FolderKanban, RefreshCw, Loader2, AlertTriangle, X
} from 'lucide-react';
import { authAPI, projectsAPI } from '../services/api';
import CreateProjectModal from './CreateProjectModal';
import './GCProjects.css';

function GCProjects() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const userResponse = await authAPI.getMe();
      setUser(userResponse.data);

      if (userResponse.data.role !== 'gc') {
        navigate('/sub/dashboard');
        return;
      }

      await loadProjects();
    } catch (error) {
      localStorage.removeItem('token');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.getGCProjects();
      setProjects(response.data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const handleProjectCreated = (newProject) => {
    setProjects([newProject, ...projects]);
  };

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
    setActiveMenu(null);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    
    setDeleting(true);
    try {
      await projectsAPI.deleteProject(projectToDelete.id);
      setProjects(projects.filter(p => p.id !== projectToDelete.id));
      setShowDeleteModal(false);
      setProjectToDelete(null);
    } catch (error) {
      alert(error.message || 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: projects.length,
    draft: projects.filter(p => p.status === 'draft').length,
    open: projects.filter(p => p.status === 'open').length,
    closed: projects.filter(p => p.status === 'closed').length,
    awarded: projects.filter(p => p.status === 'awarded').length,
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span className="loading-text">Loading projects...</span>
      </div>
    );
  }

  return (
    <div className="gc-projects-page">
      <nav className="projects-nav">
        <button onClick={() => navigate('/gc/dashboard')} className="back-btn">
          <ArrowLeft size={18} />
          Dashboard
        </button>
        <div className="nav-logo">
          <Building2 size={20} />
          <span>My Projects</span>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          disabled={!user?.bidly_access}
        >
          <Plus size={18} />
          New Project
        </button>
      </nav>

      <div className="projects-content">
        {/* Filters Bar */}
        <div className="filters-bar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="status-filters">
            {Object.entries(statusCounts).map(([status, count]) => (
              <button
                key={status}
                className={`status-filter-btn ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                <span className="filter-label">{status === 'all' ? 'All' : status}</span>
                <span className="filter-count">{count}</span>
              </button>
            ))}
          </div>

          <button 
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Projects Table */}
        {filteredProjects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FolderKanban size={32} />
            </div>
            <h3>{searchQuery || statusFilter !== 'all' ? 'No matching projects' : 'No projects yet'}</h3>
            <p>
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first project to start receiving bids'}
            </p>
            {!searchQuery && statusFilter === 'all' && user?.bidly_access && (
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={18} />
                Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="projects-table-container">
            <table className="projects-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Bids</th>
                  <th>Invites</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <div className="project-cell">
                        <div className="project-icon">
                          <FolderKanban size={18} />
                        </div>
                        <div className="project-info">
                          <h4>{project.title}</h4>
                          {project.description && (
                            <p>{project.description.substring(0, 60)}...</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {project.location ? (
                        <div className="location-cell">
                          <MapPin size={14} />
                          <span>{project.location}</span>
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge status-${project.status}`}>
                        {project.status}
                      </span>
                    </td>
                    <td>
                      <div className="stat-cell">
                        <FileText size={14} />
                        <span>{project.bids_count || 0}</span>
                      </div>
                    </td>
                    <td>
                      <div className="stat-cell">
                        <Users size={14} />
                        <span>{project.invitations_count || 0}</span>
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        <Calendar size={14} />
                        <span>{new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button 
                          className="action-btn view"
                          onClick={() => navigate(`/gc/projects/${project.id}`)}
                          title="View Project"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="action-btn edit"
                          onClick={() => navigate(`/gc/projects/${project.id}`)}
                          title="Edit Project"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDeleteClick(project)}
                          title="Delete Project"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stats Summary */}
        <div className="projects-summary">
          <div className="summary-item">
            <span className="summary-value">{projects.length}</span>
            <span className="summary-label">Total Projects</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{projects.reduce((acc, p) => acc + (p.bids_count || 0), 0)}</span>
            <span className="summary-label">Total Bids</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{projects.reduce((acc, p) => acc + (p.invitations_count || 0), 0)}</span>
            <span className="summary-label">Total Invites</span>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProjectCreated={handleProjectCreated}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="delete-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <AlertTriangle size={32} />
            </div>
            <h3>Delete Project?</h3>
            <p>Are you sure you want to delete <strong>"{projectToDelete?.title}"</strong>? This action cannot be undone.</p>
            <div className="delete-modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GCProjects;

