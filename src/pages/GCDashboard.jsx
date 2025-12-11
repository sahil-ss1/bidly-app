import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, FolderKanban, Users, FileText, Clock, MapPin, 
  Plus, RefreshCw, LogOut, Menu, X, AlertTriangle, 
  LayoutDashboard, Settings, HelpCircle, ChevronRight, Loader2,
  Calendar, Briefcase, Gift
} from 'lucide-react';
import { authAPI, projectsAPI } from '../services/api';
import CreateProjectModal from './CreateProjectModal';
import ReferralCard from '../components/ReferralCard';
import './Dashboard.css';

function GCDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const userResponse = await authAPI.getMe();
        const userData = userResponse.data;
        setUser(userData);

        if (userData.role !== 'gc') {
          navigate('/sub/dashboard');
          return;
        }

        try {
          const projectsResponse = await projectsAPI.getGCProjects();
          if (projectsResponse && projectsResponse.data) {
            setProjects(Array.isArray(projectsResponse.data) ? projectsResponse.data : []);
            setError('');
          } else {
            setProjects([]);
          }
        } catch (err) {
          if (err.message && err.message.includes('Bidly access required')) {
            setError('Bidly access required to view projects. Please contact admin to grant access.');
            setProjects([]);
          } else {
            setError(`Failed to load projects: ${err.message || 'Unknown error'}`);
          }
        }
      } catch (error) {
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleProjectCreated = (newProject) => {
    setProjects([newProject, ...projects]);
    setError('');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const projectsResponse = await projectsAPI.getGCProjects();
      setProjects(projectsResponse.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to refresh projects');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'GC';
  };

  const totalBids = projects.reduce((acc, p) => acc + (p.bids_count || 0), 0);
  const totalInvitations = projects.reduce((acc, p) => acc + (p.invitations_count || 0), 0);
  const openProjects = projects.filter(p => p.status === 'open').length;

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span className="loading-text">Loading dashboard...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar overlay for mobile */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <Building2 size={22} />
            </div>
            <span>Bidly</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Main Menu</div>
            <div className="nav-item active">
              <LayoutDashboard size={20} className="nav-item-icon" />
              <span>Dashboard</span>
            </div>
            <div className="nav-item" onClick={() => navigate('/gc/projects')}>
              <FolderKanban size={20} className="nav-item-icon" />
              <span>Projects</span>
              <span className="nav-item-badge">{projects.length}</span>
            </div>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Support</div>
            <div className="nav-item" onClick={() => navigate('/help')}>
              <HelpCircle size={20} className="nav-item-icon" />
              <span>Help Center</span>
            </div>
            <div className="nav-item" onClick={() => navigate('/settings')}>
              <Settings size={20} className="nav-item-icon" />
              <span>Settings</span>
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-menu" onClick={handleLogout}>
            <div className="user-avatar">{getInitials(user.name)}</div>
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-role">General Contractor</div>
            </div>
            <LogOut size={18} />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h1 className="page-title">Dashboard</h1>
          </div>
          <div className="header-right">
            <button 
              className="header-btn" 
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <div className="page-content">
          {/* Access Banner */}
          {!user.bidly_access && (
            <div className="access-banner">
              <div className="access-banner-icon">
                <AlertTriangle size={24} />
              </div>
              <div className="access-banner-content">
                <h3>Bidly Access Required</h3>
                <p>Subscribe through Pali Builds dashboard to unlock all features and start managing your projects.</p>
                <button onClick={() => window.open('https://palibuilds.com', '_blank')}>
                  Get Access
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="error-banner">
              <div className="error-banner-icon">
                <AlertTriangle size={24} />
              </div>
              <div className="error-banner-content">
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="stats-grid stagger-children">
            <div className="stat-card">
              <div className="stat-icon primary">
                <FolderKanban size={24} />
              </div>
              <div className="stat-content">
                <h3>{projects.length}</h3>
                <p>Total Projects</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success">
                <Briefcase size={24} />
              </div>
              <div className="stat-content">
                <h3>{openProjects}</h3>
                <p>Open Projects</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon secondary">
                <FileText size={24} />
              </div>
              <div className="stat-content">
                <h3>{totalBids}</h3>
                <p>Total Bids</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon warning">
                <Users size={24} />
              </div>
              <div className="stat-content">
                <h3>{totalInvitations}</h3>
                <p>Invitations Sent</p>
              </div>
            </div>
          </div>

          {/* Dashboard Sections Container - Reorderable for mobile */}
          <div className="dashboard-sections">
            {/* New Project Section - Mobile First */}
            {user.bidly_access && (
              <div className="new-project-section-mobile">
                <button 
                  className="btn btn-primary btn-new-project-mobile"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus size={18} />
                  New Project
                </button>
              </div>
            )}

            {/* Referral Card - Growth Flywheel */}
            <div className="referral-card-wrapper">
              <ReferralCard userRole="gc" />
            </div>

            {/* Projects Section */}
            <div className="projects-section-wrapper">
              <div className="section-header">
                <h2 className="section-title">My Projects</h2>
                <div className="section-actions section-actions-desktop">
                  {user.bidly_access && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <Plus size={18} />
                      New Project
                    </button>
                  )}
                </div>
              </div>

              {projects.length === 0 && !error ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <FolderKanban size={32} />
                  </div>
                  <h3>No projects yet</h3>
                  <p>Create your first project to start receiving bids from subcontractors.</p>
                  {user.bidly_access && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <Plus size={18} />
                      Create Your First Project
                    </button>
                  )}
                </div>
              ) : (
                <div className="projects-grid stagger-children">
                  {projects.map((project) => (
                    <div 
                      key={project.id} 
                      className="project-card"
                      onClick={() => navigate(`/gc/projects/${project.id}`)}
                    >
                      <div className="project-card-header">
                        <h3>{project.title}</h3>
                        <span className={`status-badge status-${project.status}`}>
                          {project.status}
                        </span>
                      </div>
                      
                      {project.description && (
                        <p className="project-description">{project.description}</p>
                      )}
                      
                      <div className="project-meta">
                        {project.location && (
                          <div className="project-meta-item">
                            <MapPin size={14} />
                            <span>{project.location}</span>
                          </div>
                        )}
                        {project.bid_deadline && (
                          <div className="project-meta-item">
                            <Calendar size={14} />
                            <span>Due: {new Date(project.bid_deadline).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="project-stats">
                        <div className="project-stat">
                          <span className="project-stat-value">{project.bids_count || 0}</span>
                          <span className="project-stat-label">Bids</span>
                        </div>
                        <div className="project-stat">
                          <span className="project-stat-value">{project.invitations_count || 0}</span>
                          <span className="project-stat-label">Invites</span>
                        </div>
                        <div className="project-stat">
                          <span className="project-stat-value">
                            {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="project-stat-label">Created</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Create Project Modal */}
      <CreateProjectModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}

export default GCDashboard;
