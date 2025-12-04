import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  User, Mail, Lock, Phone, Building2, HardHat, Wrench, 
  UserPlus, Loader2, FileCheck, Users, ArrowRight, MapPin, Briefcase, Gift,
  Eye, EyeOff, ChevronDown, X, Check
} from 'lucide-react';
import { authAPI } from '../services/api';
import './Register.css';

const TRADE_OPTIONS = [
  'General',
  'Plumbing',
  'Electrical',
  'HVAC',
  'Roofing',
  'Concrete',
  'Framing',
  'Drywall',
  'Painting',
  'Flooring',
  'Landscaping',
  'Excavation',
  'Masonry',
  'Carpentry',
  'Insulation',
  'Windows & Doors',
  'Siding',
  'Demolition',
  'Other'
];

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role') || 'gc';
  const referralCode = searchParams.get('ref') || '';
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: roleParam === 'sub' ? 'sub' : 'gc',
    company_name: '',
    phone: '',
    trades: [],
    region: '',
    referral_code: referralCode,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTradesDropdown, setShowTradesDropdown] = useState(false);
  const tradesDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tradesDropdownRef.current && !tradesDropdownRef.current.contains(event.target)) {
        setShowTradesDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTradeToggle = (trade) => {
    const newTrades = formData.trades.includes(trade)
      ? formData.trades.filter(t => t !== trade)
      : [...formData.trades, trade];
    setFormData({ ...formData, trades: newTrades });
  };

  const removeTrade = (trade) => {
    setFormData({ ...formData, trades: formData.trades.filter(t => t !== trade) });
  };

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

    const trimmedData = {
      name: (formData.name || '').trim(),
      email: (formData.email || '').trim(),
      password: (formData.password || '').trim(),
      confirmPassword: (formData.confirmPassword || '').trim(),
      role: formData.role || 'gc',
      company_name: (formData.company_name || '').trim(),
      phone: (formData.phone || '').trim(),
      trade: formData.trades.join(', '), // Convert array to comma-separated string
      region: (formData.region || '').trim(),
    };

    if (!trimmedData.name) {
      setError('Full name is required');
      setLoading(false);
      return;
    }

    if (!trimmedData.email) {
      setError('Email address is required');
      setLoading(false);
      return;
    }

    if (!trimmedData.password) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    if (trimmedData.password !== trimmedData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (trimmedData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...userData } = trimmedData;
      const response = await authAPI.register(userData);
      
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
      console.error('Registration error:', err);
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      {/* Left side - Branding */}
      <div className="register-branding">
        <div className="branding-content">
          <div className="branding-logo">
            <div className="branding-logo-icon">
              <Building2 size={28} />
            </div>
            <span>Bidly</span>
          </div>
          
          <h1>Join the Modern Way to Manage Bids</h1>
          <p>
            Whether you're a general contractor looking to streamline project bidding,
            or a subcontractor seeking new opportunities, Bidly has you covered.
          </p>
          
          <div className="branding-features">
            <div className="feature-item">
              <div className="feature-icon">
                <FileCheck size={22} />
              </div>
              <span>AI-powered plan analysis and summaries</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <Users size={22} />
              </div>
              <span>Seamless contractor collaboration</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <ArrowRight size={22} />
              </div>
              <span>Faster bidding, better decisions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="register-form-container">
        <div className="register-card">
          <div className="register-header">
            <div className="register-logo">
              <div className="register-logo-icon">
                <Building2 size={24} />
              </div>
              <span>Bidly</span>
            </div>
            <h2>Create your account</h2>
            <p>Get started with Bidly in minutes</p>
          </div>

          <div className="register-form-card">
            {error && (
              <div className="error-message">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="register-form">
              {/* Referral banner */}
              {referralCode && (
                <div className="referral-welcome-banner">
                  <Gift size={20} />
                  <div>
                    <strong>You've been referred!</strong>
                    <span>Sign up to unlock bonus rewards for you and your referrer.</span>
                  </div>
                </div>
              )}

              {/* Role selector */}
              <div className="form-group">
                <label>I am a</label>
                <div className="role-selector">
                  <label className="role-option">
                    <input
                      type="radio"
                      name="role"
                      value="gc"
                      checked={formData.role === 'gc'}
                      onChange={handleChange}
                    />
                    <div className="role-card">
                      <div className="role-icon">
                        <HardHat size={24} />
                      </div>
                      <h4>General Contractor</h4>
                      <p>Post projects & manage</p>
                    </div>
                  </label>
                  <label className="role-option">
                    <input
                      type="radio"
                      name="role"
                      value="sub"
                      checked={formData.role === 'sub'}
                      onChange={handleChange}
                    />
                    <div className="role-card">
                      <div className="role-icon">
                        <Wrench size={24} />
                      </div>
                      <h4>Subcontractor</h4>
                      <p>Find & bid on projects</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

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
                  />
                </div>
              </div>

              {formData.role === 'gc' && (
                <div className="form-group">
                  <label htmlFor="company_name">Company Name</label>
                  <div className="input-with-icon">
                    <Building2 size={18} className="input-icon" />
                    <input
                      type="text"
                      id="company_name"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      placeholder="Enter your company name"
                    />
                  </div>
                </div>
              )}

              {formData.role === 'sub' && (
                <>
                  <div className="form-group">
                    <label htmlFor="company_name">Company Name</label>
                    <div className="input-with-icon">
                      <Building2 size={18} className="input-icon" />
                      <input
                        type="text"
                        id="company_name"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        placeholder="Enter your company name"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Trades / Specialties * <span className="label-hint">(Select all that apply)</span></label>
                    <div className="multi-select-container" ref={tradesDropdownRef}>
                      <div 
                        className="multi-select-trigger"
                        onClick={() => setShowTradesDropdown(!showTradesDropdown)}
                      >
                        <Briefcase size={18} className="input-icon" />
                        <div className="selected-trades-display">
                          {formData.trades.length === 0 ? (
                            <span className="placeholder">Select your trades...</span>
                          ) : (
                            <div className="selected-trades-tags">
                              {formData.trades.slice(0, 3).map(trade => (
                                <span key={trade} className="trade-tag">
                                  {trade}
                                  <button 
                                    type="button" 
                                    onClick={(e) => { e.stopPropagation(); removeTrade(trade); }}
                                  >
                                    <X size={12} />
                                  </button>
                                </span>
                              ))}
                              {formData.trades.length > 3 && (
                                <span className="more-trades">+{formData.trades.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>
                        <ChevronDown size={18} className={`dropdown-arrow ${showTradesDropdown ? 'open' : ''}`} />
                      </div>
                      
                      {showTradesDropdown && (
                        <div className="multi-select-dropdown">
                          {TRADE_OPTIONS.map(trade => (
                            <div 
                              key={trade} 
                              className={`dropdown-option ${formData.trades.includes(trade) ? 'selected' : ''}`}
                              onClick={() => handleTradeToggle(trade)}
                            >
                              <div className={`option-checkbox ${formData.trades.includes(trade) ? 'checked' : ''}`}>
                                {formData.trades.includes(trade) && <Check size={12} />}
                              </div>
                              <span>{trade}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {formData.trades.length === 0 && <span className="form-hint required">Please select at least one trade</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="region">Service Region *</label>
                    <div className="input-with-icon">
                      <MapPin size={18} className="input-icon" />
                      <input
                        type="text"
                        id="region"
                        name="region"
                        value={formData.region}
                        onChange={handleChange}
                        placeholder="e.g. Los Angeles, CA"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <div className="input-with-icon">
                  <Phone size={18} className="input-icon" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Min 6 characters"
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="Confirm password"
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="submit-btn" 
                disabled={loading || !formData.name || !formData.email || !formData.password || !formData.confirmPassword}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    Create Account
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="register-footer">
            <p>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
