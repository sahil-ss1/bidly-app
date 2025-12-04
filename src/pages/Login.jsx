import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, Building2, FileCheck, Users, ArrowRight, Loader2 } from 'lucide-react';
import { authAPI } from '../services/api';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const email = formData.email.trim();
    const password = formData.password.trim();

    if (!email || !password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.login(email, password);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      if (response.data.user.role === 'gc') {
        navigate('/gc/dashboard');
      } else if (response.data.user.role === 'sub') {
        navigate('/sub/dashboard');
      } else if (response.data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left side - Branding */}
      <div className="login-branding">
        <div className="branding-content">
          <div className="branding-logo">
            <div className="branding-logo-icon">
              <Building2 size={28} />
            </div>
            <span>Bidly</span>
          </div>
          
          <h1>Streamline Your Construction Bidding</h1>
          <p>
            Connect general contractors with subcontractors. Manage projects, 
            send invitations, and receive bids all in one powerful platform.
          </p>
          
          <div className="branding-features">
            <div className="feature-item">
              <div className="feature-icon">
                <FileCheck size={22} />
              </div>
              <span>Upload plans and get AI-powered summaries</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <Users size={22} />
              </div>
              <span>Invite subcontractors to bid on projects</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <ArrowRight size={22} />
              </div>
              <span>Compare bids with intelligent analysis</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="login-form-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <div className="login-logo-icon">
                <Building2 size={24} />
              </div>
              <span>Bidly</span>
            </div>
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          <div className="login-form-card">
            {error && (
              <div className="error-message">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="login-footer">
            <p>
              Don't have an account? <Link to="/register">Create account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
