import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, Shield, UserCheck, UserX, 
  RefreshCw, LogOut, Menu, LayoutDashboard, Settings, 
  HelpCircle, CheckCircle, XCircle, Search, Crown, TrendingUp, Zap, Award
} from 'lucide-react';
import { authAPI, adminAPI } from '../services/api';
import './Dashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

        if (userData.role !== 'admin') {
          navigate('/dashboard');
          return;
        }

        try {
          const usersResponse = await adminAPI.getUsers();
          setUsers(usersResponse.data || []);
        } catch (err) {
          console.error('Failed to load users:', err);
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
      const usersResponse = await adminAPI.getUsers();
      setUsers(usersResponse.data || []);
    } catch (err) {
      console.error('Failed to refresh:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleAccess = async (userId, currentAccess) => {
    try {
      await adminAPI.toggleBidlyAccess(userId, !currentAccess);
      const usersResponse = await adminAPI.getUsers();
      setUsers(usersResponse.data || []);
    } catch (error) {
      alert(error.message || 'Failed to update access');
    }
  };

  const updateTier = async (userId, newTier) => {
    try {
      await adminAPI.updateSubscriptionTier(userId, newTier);
      const usersResponse = await adminAPI.getUsers();
      setUsers(usersResponse.data || []);
    } catch (error) {
      alert(error.message || 'Failed to update tier');
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'standard': return <TrendingUp size={14} />;
      case 'pro': return <Zap size={14} />;
      case 'elite': return <Award size={14} />;
      default: return <Crown size={14} />;
    }
  };

  const getTierBadgeClass = (tier) => {
    switch (tier) {
      case 'standard': return 'tier-standard';
      case 'pro': return 'tier-pro';
      case 'elite': return 'tier-elite';
      default: return 'tier-free';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD';
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalGCs = users.filter(u => u.role === 'gc').length;
  const totalSubs = users.filter(u => u.role === 'sub').length;
  const activeAccess = users.filter(u => u.bidly_access).length;

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span className="loading-text">Loading admin panel...</span>
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
            <div className="nav-section-title">Admin Panel</div>
            <div className="nav-item active">
              <LayoutDashboard size={20} className="nav-item-icon" />
              <span>Dashboard</span>
            </div>
            <div className="nav-item">
              <Users size={20} className="nav-item-icon" />
              <span>Users</span>
              <span className="nav-item-badge">{users.length}</span>
            </div>
            <div className="nav-item">
              <Shield size={20} className="nav-item-icon" />
              <span>Access Control</span>
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
              <div className="user-role">Administrator</div>
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
            <h1 className="page-title">Admin Dashboard</h1>
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
          {/* Stats */}
          <div className="stats-grid stagger-children">
            <div className="stat-card">
              <div className="stat-icon primary">
                <Users size={24} />
              </div>
              <div className="stat-content">
                <h3>{users.length}</h3>
                <p>Total Users</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon warning">
                <UserCheck size={24} />
              </div>
              <div className="stat-content">
                <h3>{totalGCs}</h3>
                <p>General Contractors</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon secondary">
                <UserX size={24} />
              </div>
              <div className="stat-content">
                <h3>{totalSubs}</h3>
                <p>Subcontractors</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success">
                <Shield size={24} />
              </div>
              <div className="stat-content">
                <h3>{activeAccess}</h3>
                <p>Active Access</p>
              </div>
            </div>
          </div>

          {/* Users Section */}
          <div className="section-header">
            <h2 className="section-title">User Management</h2>
            <div className="section-actions">
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)'
                }} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    paddingLeft: '40px', 
                    width: '250px',
                    height: '40px'
                  }}
                />
              </div>
            </div>
          </div>

          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-lg)', fontSize: '0.875rem' }}>
            Toggle Bidly access for users who have paid through Pali Builds
          </p>

          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Tier</th>
                  <th>Trade/Region</th>
                  <th>Bidly Access</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-cell-avatar">
                          {getInitials(u.name)}
                        </div>
                        <span>{u.name}</span>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`status-badge ${u.role === 'gc' ? 'status-open' : u.role === 'admin' ? 'status-awarded' : 'status-submitted'}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {u.role === 'sub' ? (
                        <select
                          className={`tier-select ${getTierBadgeClass(u.subscription_tier)}`}
                          value={u.subscription_tier || 'free'}
                          onChange={(e) => updateTier(u.id, e.target.value)}
                        >
                          <option value="free">Free</option>
                          <option value="standard">Standard ($250)</option>
                          <option value="pro">Pro ($500)</option>
                          <option value="elite">Elite ($1000)</option>
                        </select>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      {u.role === 'sub' ? (
                        <div style={{ fontSize: '0.8125rem' }}>
                          <div>{u.trade || '-'}</div>
                          <div style={{ color: 'var(--color-text-muted)' }}>{u.region || '-'}</div>
                        </div>
                      ) : (
                        <span className="text-muted">{u.company_name || '-'}</span>
                      )}
                    </td>
                    <td>
                      <div className={`access-indicator ${u.bidly_access ? 'active' : 'inactive'}`}>
                        {u.bidly_access ? (
                          <>
                            <CheckCircle size={16} />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle size={16} />
                            Inactive
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${u.bidly_access ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleAccess(u.id, u.bidly_access)}
                      >
                        {u.bidly_access ? (
                          <>
                            <XCircle size={16} />
                            Revoke
                          </>
                        ) : (
                          <>
                            <CheckCircle size={16} />
                            Grant
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
