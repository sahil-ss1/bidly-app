import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <h1>Bidly</h1>
        <div className="nav-user">
          <span>Welcome, {user.name}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      
      <div className="dashboard-content">
        <h2>Dashboard</h2>
        <div className="user-info">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role.toUpperCase()}</p>
          {user.company_name && <p><strong>Company:</strong> {user.company_name}</p>}
          <p><strong>Bidly Access:</strong> {user.bidly_access ? '✅ Active' : '❌ Not Active'}</p>
        </div>
        
        {!user.bidly_access && (
          <div className="upgrade-banner">
            <h3>Bidly Access Required</h3>
            <p>Please subscribe through Pali Builds dashboard to access Bidly features.</p>
            <button onClick={() => window.open('https://palibuilds.com', '_blank')}>
              Go to Pali Builds Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

