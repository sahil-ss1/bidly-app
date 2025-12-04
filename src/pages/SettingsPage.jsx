import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, ArrowLeft, User, Bell, Shield, CreditCard,
  Mail, Phone, Save, Loader2, Check, Eye, EyeOff,
  Lock, Trash2, ExternalLink, ChevronRight, Wrench, MapPin, Crown,
  ChevronDown, X
} from 'lucide-react';
import { authAPI, usersAPI } from '../services/api';
import './SettingsPage.css';

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

function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    company_name: '',
    phone: '',
    trades: [],
    region: '',
  });
  const [saveError, setSaveError] = useState('');
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
    const newTrades = profileData.trades.includes(trade)
      ? profileData.trades.filter(t => t !== trade)
      : [...profileData.trades, trade];
    setProfileData({ ...profileData, trades: newTrades });
  };

  const removeTrade = (trade) => {
    setProfileData({ ...profileData, trades: profileData.trades.filter(t => t !== trade) });
  };
  
  const [notifications, setNotifications] = useState({
    email_new_bid: true,
    email_bid_status: true,
    email_project_updates: true,
    email_invitations: true,
    email_marketing: false,
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data);
      // Parse trade string into array (trades are stored as comma-separated)
      const tradesArray = response.data.trade 
        ? response.data.trade.split(',').map(t => t.trim()).filter(t => t)
        : [];
      setProfileData({
        name: response.data.name || '',
        email: response.data.email || '',
        company_name: response.data.company_name || '',
        phone: response.data.phone || '',
        trades: tradesArray,
        region: response.data.region || '',
      });
    } catch (error) {
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    
    try {
      // Convert trades array to comma-separated string for API
      const dataToSave = {
        ...profileData,
        trade: profileData.trades.join(', '),
      };
      delete dataToSave.trades;
      
      const response = await usersAPI.updateProfile(dataToSave);
      setUser(response.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      setSaveError(error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 500);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('Passwords do not match');
      return;
    }
    
    if (passwordData.new_password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span className="loading-text">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <nav className="settings-nav">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="settings-nav-logo">
          <Building2 size={20} />
          <span>Settings</span>
        </div>
      </nav>

      <div className="settings-content">
        <div className="settings-grid">
          {/* Sidebar */}
          <aside className="settings-sidebar">
            <div className="settings-user-card">
              <div className="settings-user-avatar">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="settings-user-info">
                <h3>{user?.name}</h3>
                <p>{user?.role === 'gc' ? 'General Contractor' : user?.role === 'sub' ? 'Subcontractor' : 'Admin'}</p>
              </div>
            </div>

            <nav className="settings-menu">
              <button
                className={`settings-menu-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={18} />
                <span>Profile</span>
                <ChevronRight size={16} className="menu-arrow" />
              </button>
              <button
                className={`settings-menu-item ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                <Bell size={18} />
                <span>Notifications</span>
                <ChevronRight size={16} className="menu-arrow" />
              </button>
              <button
                className={`settings-menu-item ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <Shield size={18} />
                <span>Security</span>
                <ChevronRight size={16} className="menu-arrow" />
              </button>
              <button
                className={`settings-menu-item ${activeTab === 'billing' ? 'active' : ''}`}
                onClick={() => setActiveTab('billing')}
              >
                <CreditCard size={18} />
                <span>Billing</span>
                <ChevronRight size={16} className="menu-arrow" />
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="settings-main">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>Profile Settings</h2>
                  <p>Manage your personal information</p>
                </div>

                {/* Subscription tier badge for subs */}
                {user?.role === 'sub' && (
                  <div className={`subscription-tier-card tier-${user.subscription_tier || 'free'}`}>
                    <div className="tier-info">
                      <Crown size={20} />
                      <div>
                        <h4>{(user.subscription_tier || 'free').charAt(0).toUpperCase() + (user.subscription_tier || 'free').slice(1)} Plan</h4>
                        <p>
                          {user.invites_received_this_month || 0} / {user.guaranteed_invites_per_month || 5} invites this month
                        </p>
                      </div>
                    </div>
                    <a href="https://palibuilds.com" target="_blank" rel="noopener noreferrer" className="upgrade-link">
                      Upgrade <ExternalLink size={14} />
                    </a>
                  </div>
                )}

                {saveError && (
                  <div className="error-message">{saveError}</div>
                )}

                <form onSubmit={handleSaveProfile} className="settings-form">
                  <div className="form-group">
                    <label>Full Name</label>
                    <div className="input-with-icon">
                      <User size={18} className="input-icon" />
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        placeholder="Enter your name"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <div className="input-with-icon">
                      <Mail size={18} className="input-icon" />
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Company Name</label>
                    <div className="input-with-icon">
                      <Building2 size={18} className="input-icon" />
                      <input
                        type="text"
                        value={profileData.company_name}
                        onChange={(e) => setProfileData({ ...profileData, company_name: e.target.value })}
                        placeholder="Enter company name"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <div className="input-with-icon">
                      <Phone size={18} className="input-icon" />
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  {/* Trade and Region fields for Subcontractors */}
                  {user?.role === 'sub' && (
                    <>
                      <div className="form-section-divider">
                        <span>Trade & Coverage Area</span>
                      </div>

                      <div className="form-group">
                        <label>Your Trades/Specialties <span className="label-hint">(Select all that apply)</span></label>
                        <div className="multi-select-container" ref={tradesDropdownRef}>
                          <div 
                            className="multi-select-trigger"
                            onClick={() => setShowTradesDropdown(!showTradesDropdown)}
                          >
                            <Wrench size={18} className="trigger-icon" />
                            <div className="selected-trades-display">
                              {profileData.trades.length === 0 ? (
                                <span className="placeholder">Select your trades...</span>
                              ) : (
                                <div className="selected-trades-tags">
                                  {profileData.trades.slice(0, 3).map(trade => (
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
                                  {profileData.trades.length > 3 && (
                                    <span className="more-trades">+{profileData.trades.length - 3} more</span>
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
                                  className={`dropdown-option ${profileData.trades.includes(trade) ? 'selected' : ''}`}
                                  onClick={() => handleTradeToggle(trade)}
                                >
                                  <div className={`option-checkbox ${profileData.trades.includes(trade) ? 'checked' : ''}`}>
                                    {profileData.trades.includes(trade) && <Check size={12} />}
                                  </div>
                                  <span>{trade}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="form-hint">This helps GCs find you for relevant projects</span>
                      </div>

                      <div className="form-group">
                        <label>Service Region / Coverage Area</label>
                        <div className="input-with-icon">
                          <MapPin size={18} className="input-icon" />
                          <input
                            type="text"
                            value={profileData.region}
                            onChange={(e) => setProfileData({ ...profileData, region: e.target.value })}
                            placeholder="e.g., Los Angeles County, CA"
                          />
                        </div>
                        <span className="form-hint">Areas where you can take on projects</span>
                      </div>
                    </>
                  )}

                  <div className="form-actions">
                    <button type="submit" className="btn-save" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Saving...
                        </>
                      ) : saved ? (
                        <>
                          <Check size={18} />
                          Saved!
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>Notification Preferences</h2>
                  <p>Choose what updates you want to receive</p>
                </div>

                <div className="notification-settings">
                  <div className="notification-group">
                    <h3>Email Notifications</h3>
                    
                    <div className="notification-item">
                      <div className="notification-info">
                        <h4>New Bid Received</h4>
                        <p>Get notified when a subcontractor submits a bid</p>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={notifications.email_new_bid}
                          onChange={(e) => setNotifications({ ...notifications, email_new_bid: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="notification-item">
                      <div className="notification-info">
                        <h4>Bid Status Updates</h4>
                        <p>Get notified when your bid status changes</p>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={notifications.email_bid_status}
                          onChange={(e) => setNotifications({ ...notifications, email_bid_status: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="notification-item">
                      <div className="notification-info">
                        <h4>Project Updates</h4>
                        <p>Get notified about project changes and deadlines</p>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={notifications.email_project_updates}
                          onChange={(e) => setNotifications({ ...notifications, email_project_updates: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="notification-item">
                      <div className="notification-info">
                        <h4>New Invitations</h4>
                        <p>Get notified when you're invited to bid on a project</p>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={notifications.email_invitations}
                          onChange={(e) => setNotifications({ ...notifications, email_invitations: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="notification-item">
                      <div className="notification-info">
                        <h4>Marketing & Updates</h4>
                        <p>Receive news, tips, and product updates</p>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={notifications.email_marketing}
                          onChange={(e) => setNotifications({ ...notifications, email_marketing: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button className="btn-save" onClick={handleSaveNotifications} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Saving...
                        </>
                      ) : saved ? (
                        <>
                          <Check size={18} />
                          Saved!
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Save Preferences
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>Security Settings</h2>
                  <p>Manage your password and account security</p>
                </div>

                <form onSubmit={handleChangePassword} className="settings-form">
                  <h3 className="form-section-title">Change Password</h3>
                  
                  <div className="form-group">
                    <label>Current Password</label>
                    <div className="input-with-icon password-input">
                      <Lock size={18} className="input-icon" />
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      >
                        {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <div className="input-with-icon password-input">
                      <Lock size={18} className="input-icon" />
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      >
                        {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <div className="input-with-icon password-input">
                      <Lock size={18} className="input-icon" />
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      >
                        {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-save" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Updating...
                        </>
                      ) : saved ? (
                        <>
                          <Check size={18} />
                          Updated!
                        </>
                      ) : (
                        <>
                          <Lock size={18} />
                          Update Password
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="danger-zone">
                  <h3>Danger Zone</h3>
                  <div className="danger-item">
                    <div className="danger-info">
                      <h4>Delete Account</h4>
                      <p>Permanently delete your account and all associated data</p>
                    </div>
                    <button className="btn-danger">
                      <Trash2 size={18} />
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>Billing & Subscription</h2>
                  <p>Manage your subscription and payment methods</p>
                </div>

                <div className="billing-card">
                  <div className="billing-plan">
                    <div className="plan-info">
                      <h3>Current Plan</h3>
                      <div className="plan-badge">
                        {user?.bidly_access ? 'Bidly Pro' : 'Free'}
                      </div>
                    </div>
                    <p>
                      {user?.bidly_access 
                        ? 'You have full access to all Bidly features including AI summaries and bid comparisons.'
                        : 'Upgrade to Bidly Pro to access all features including project creation and AI tools.'}
                    </p>
                  </div>

                  <div className="billing-actions">
                    <a 
                      href="https://palibuilds.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-billing"
                    >
                      <CreditCard size={18} />
                      Manage Subscription
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>

                <div className="billing-info">
                  <h3>Billing Information</h3>
                  <p>
                    Your billing and subscription is managed through Pali Builds. 
                    Click the button above to view invoices, update payment methods, 
                    or change your subscription plan.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;

