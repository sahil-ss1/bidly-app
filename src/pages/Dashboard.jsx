import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, LogOut, User, Mail, Briefcase, Building, 
  CheckCircle, XCircle, ExternalLink, Loader2, Shield
} from 'lucide-react';
import { authAPI } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await authAPI.getMe();
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="loading">
        <Loader2 size={24} className="animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-logo">
          <Building2 size={24} />
          <h1>Bidly</h1>
        </div>
        <div className="nav-user">
          <User size={18} />
          <span>Welcome, {user.name}</span>
          <button onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </nav>
      
      <div className="dashboard-content">
        <h2>Dashboard</h2>
        <div className="user-info">
          <p>
            <Mail size={16} />
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <Briefcase size={16} />
            <strong>Role:</strong> {user.role.toUpperCase()}
          </p>
          {user.company_name && (
            <p>
              <Building size={16} />
              <strong>Company:</strong> {user.company_name}
            </p>
          )}
          <p>
            <Shield size={16} />
            <strong>Bidly Access:</strong> 
            {user.bidly_access ? (
              <span className="access-active">
                <CheckCircle size={16} />
                Active
              </span>
            ) : (
              <span className="access-inactive">
                <XCircle size={16} />
                Not Active
              </span>
            )}
          </p>
        </div>
        
        {!user.bidly_access && (
          <div className="upgrade-banner">
            <h3>Bidly Access Required</h3>
            <p>Please subscribe through Pali Builds dashboard to access Bidly features.</p>
            <button onClick={() => window.open('https://palibuilds.com', '_blank')}>
              <ExternalLink size={18} />
              Go to Pali Builds Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

