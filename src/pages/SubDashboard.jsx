import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, FolderKanban, FileText, Clock, MapPin, 
  RefreshCw, LogOut, Menu, LayoutDashboard, Settings, 
  HelpCircle, Inbox, Calendar, Mail, CheckCircle, Crown, Briefcase, Target,
  TrendingUp, Zap, ExternalLink, Award, Gift
} from 'lucide-react';
import { authAPI, subProjectsAPI } from '../services/api';
import ReferralCard from '../components/ReferralCard';
import './Dashboard.css';

function SubDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
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

        if (userData.role !== 'sub') {
          navigate('/gc/dashboard');
          return;
        }

        try {
          const projectsResponse = await subProjectsAPI.getSubProjects();
          setProjects(projectsResponse.data || []);
        } catch (err) {
          console.error('Failed to load projects:', err);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const projectsResponse = await subProjectsAPI.getSubProjects();
      setProjects(projectsResponse.data || []);
    } catch (err) {
      console.error('Failed to refresh:', err);
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
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'SC';
  };

  const pendingInvitations = projects.filter(p => p.invitation_status === 'pending').length;
  const acceptedInvitations = projects.filter(p => p.invitation_status === 'accepted').length;
  const submittedBids = projects.filter(p => p.my_bid).length;

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
            <div className="nav-item" onClick={() => {
              setSidebarOpen(false);
              document.getElementById('invitations-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}>
              <Inbox size={20} className="nav-item-icon" />
              <span>Invitations</span>
              {pendingInvitations > 0 && (
                <span className="nav-item-badge">{pendingInvitations}</span>
              )}
            </div>
            <div className="nav-item" onClick={() => {
              setSidebarOpen(false);
              document.getElementById('bids-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}>
              <FileText size={20} className="nav-item-icon" />
              <span>My Bids</span>
              {submittedBids > 0 && <span className="nav-item-badge">{submittedBids}</span>}
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
              <div className="user-role">Subcontractor</div>
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
          {/* Guaranteed Bids Banner */}
          <div className={`guarantee-banner tier-${user.subscription_tier || 'free'}`}>
            <div className="guarantee-header">
              <div className="guarantee-title">
                <div className={`guarantee-icon tier-${user.subscription_tier || 'free'}`}>
                  {user.subscription_tier === 'elite' ? <Award size={24} /> :
                   user.subscription_tier === 'pro' ? <Zap size={24} /> :
                   user.subscription_tier === 'standard' ? <TrendingUp size={24} /> :
                   <Crown size={24} />}
                </div>
                <div>
                  <h3>
                    {(user.subscription_tier || 'free').charAt(0).toUpperCase() + (user.subscription_tier || 'free').slice(1)} Plan
                    {user.subscription_tier === 'elite' && <span className="elite-badge-inline">Elite Pro</span>}
                    <span className="guarantee-badge">
                      {user.guaranteed_invites_per_month || 3} Guaranteed Invites/Month
                    </span>
                  </h3>
                  <p className="guarantee-meta">
                    {user.trade && <span><Briefcase size={14} /> {user.trade}</span>}
                    {user.region && <span><MapPin size={14} /> {user.region}</span>}
                  </p>
                </div>
              </div>
              {user.subscription_tier !== 'elite' && (
                <a href="/pricing" className="upgrade-btn">
                  Upgrade Plan <ExternalLink size={14} />
                </a>
              )}
            </div>
            
            <div className="guarantee-progress-section">
              <div className="guarantee-progress-header">
                <span className="progress-label">
                  <Target size={16} />
                  Monthly Invite Progress
                </span>
                <span className="progress-count">
                  {user.invites_received_this_month || 0} of {user.guaranteed_invites_per_month || 5} invites received
                </span>
              </div>
              <div className="guarantee-progress-bar">
                <div 
                  className="guarantee-progress-fill"
                  style={{ 
                    width: `${Math.min(100, ((user.invites_received_this_month || 0) / (user.guaranteed_invites_per_month || 5)) * 100)}%` 
                  }}
                />
              </div>
              <div className="guarantee-progress-footer">
                {(user.invites_received_this_month || 0) >= (user.guaranteed_invites_per_month || 5) ? (
                  <span className="guarantee-met">
                    <CheckCircle size={14} /> Monthly guarantee met!
                  </span>
                ) : (
                  <span className="guarantee-remaining">
                    {(user.guaranteed_invites_per_month || 5) - (user.invites_received_this_month || 0)} more invite(s) guaranteed this month
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-grid stagger-children">
            <div className="stat-card">
              <div className="stat-icon primary">
                <FolderKanban size={24} />
              </div>
              <div className="stat-content">
                <h3>{projects.length}</h3>
                <p>Total Invitations</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon warning">
                <Mail size={24} />
              </div>
              <div className="stat-content">
                <h3>{pendingInvitations}</h3>
                <p>Pending Review</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success">
                <CheckCircle size={24} />
              </div>
              <div className="stat-content">
                <h3>{acceptedInvitations}</h3>
                <p>Accepted</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon secondary">
                <FileText size={24} />
              </div>
              <div className="stat-content">
                <h3>{submittedBids}</h3>
                <p>Bids Submitted</p>
              </div>
            </div>
          </div>

          {/* Referral Card - Growth Flywheel */}
          <ReferralCard userRole="sub" />

          {/* Pending Invitations Section */}
          <div id="invitations-section" className="section-header">
            <h2 className="section-title">
              <Inbox size={22} />
              Pending Invitations
              {pendingInvitations > 0 && <span className="section-badge">{pendingInvitations}</span>}
            </h2>
            <div className="section-actions">
              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          {projects.filter(p => !p.my_bid && (p.invitation_status === 'pending' || p.invitation_status === 'viewed')).length === 0 ? (
            <div className="empty-state small">
              <div className="empty-state-icon">
                <Inbox size={28} />
              </div>
              <h3>No pending invitations</h3>
              <p>New bid invitations will appear here.</p>
            </div>
          ) : (
            <div className="projects-grid stagger-children">
              {projects.filter(p => !p.my_bid && (p.invitation_status === 'pending' || p.invitation_status === 'viewed')).map((project) => (
                <div
                  key={project.id}
                  className={`project-card invitation-${project.invitation_status}`}
                  onClick={() => navigate(`/sub/projects/${project.id}`)}
                >
                  <div className="project-card-header">
                    <h3>{project.title}</h3>
                    <span className={`status-badge status-${project.invitation_status}`}>
                      {project.invitation_status === 'viewed' ? 'Viewed' : 'New'}
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
                    {project.gc_name && (
                      <div className="project-meta-item">
                        <Building2 size={14} />
                        <span>From: {project.gc_name}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="project-card-actions">
                    <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/sub/projects/${project.id}`); }}>
                      View & Bid
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* My Bids Section */}
          <div id="bids-section" className="section-header" style={{ marginTop: 'var(--spacing-xl)' }}>
            <h2 className="section-title">
              <FileText size={22} />
              My Submitted Bids
              {submittedBids > 0 && <span className="section-badge">{submittedBids}</span>}
            </h2>
          </div>

          {projects.filter(p => p.my_bid).length === 0 ? (
            <div className="empty-state small">
              <div className="empty-state-icon">
                <FileText size={28} />
              </div>
              <h3>No bids submitted yet</h3>
              <p>Once you submit bids, they'll appear here so you can track their status.</p>
            </div>
          ) : (
            <div className="projects-grid stagger-children">
              {projects.filter(p => p.my_bid).map((project) => (
                <div
                  key={project.id}
                  className="project-card has-bid"
                  onClick={() => navigate(`/sub/projects/${project.id}`)}
                >
                  <div className="project-card-header">
                    <h3>{project.title}</h3>
                    <span className={`status-badge status-${project.my_bid?.status || 'submitted'}`}>
                      {project.my_bid?.status || 'Submitted'}
                    </span>
                  </div>
                  
                  {project.description && (
                    <p className="project-description">{project.description}</p>
                  )}
                  
                  <div className="project-meta">
                    {project.my_bid?.amount && (
                      <div className="project-meta-item">
                        <strong style={{ color: 'var(--color-primary)' }}>${Number(project.my_bid.amount).toLocaleString()}</strong>
                      </div>
                    )}
                    {project.location && (
                      <div className="project-meta-item">
                        <MapPin size={14} />
                        <span>{project.location}</span>
                      </div>
                    )}
                    {project.gc_name && (
                      <div className="project-meta-item">
                        <Building2 size={14} />
                        <span>{project.gc_name}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="project-stats">
                    <div className="project-stat">
                      <span className="project-stat-value">
                        <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />
                      </span>
                      <span className="project-stat-label">Bid Submitted</span>
                    </div>
                    <div className="project-stat">
                      <span className="project-stat-value" style={{ textTransform: 'capitalize' }}>
                        {project.my_bid?.status || 'Submitted'}
                      </span>
                      <span className="project-stat-label">Status</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default SubDashboard;
