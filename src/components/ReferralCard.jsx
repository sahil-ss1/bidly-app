import { useState, useEffect } from 'react';
import { 
  Users, Gift, Copy, Check, Send, Mail, TrendingUp, 
  Award, Star, Crown, ExternalLink, Loader2, X
} from 'lucide-react';
import { referralsAPI } from '../services/api';
import './ReferralCard.css';

function ReferralCard({ userRole }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState(userRole === 'gc' ? 'sub' : 'gc');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await referralsAPI.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load referral stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (stats?.referral_link) {
      navigator.clipboard.writeText(stats.referral_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    setSuccess('');

    try {
      await referralsAPI.sendInvite(inviteEmail, inviteRole);
      setSuccess('Invitation sent successfully!');
      setInviteEmail('');
      loadStats(); // Refresh stats
      setTimeout(() => {
        setSuccess('');
        setShowInviteModal(false);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="referral-card loading">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  const rewardDescription = userRole === 'gc' 
    ? '+5 guaranteed bids/month per sub invited'
    : '+2 guaranteed invites/month per GC invited';

  return (
    <>
      <div className="referral-card">
        <div className="referral-header">
          <div className="referral-header-icon">
            <Gift size={24} />
          </div>
          <div>
            <h3>Grow Your Network</h3>
            <p>Invite {userRole === 'gc' ? 'subcontractors' : 'general contractors'} and earn rewards</p>
          </div>
        </div>

        <div className="referral-stats-row">
          <div className="referral-stat">
            <Users size={18} />
            <span className="referral-stat-value">{stats?.total_referrals || 0}</span>
            <span className="referral-stat-label">Referrals</span>
          </div>
          <div className="referral-stat">
            <Gift size={18} />
            <span className="referral-stat-value">{stats?.total_rewards || 0}</span>
            <span className="referral-stat-label">Rewards Earned</span>
          </div>
          <div className="referral-stat milestone">
            {stats?.milestones?.network_builder ? (
              <Award size={18} className="milestone-achieved" />
            ) : (
              <Award size={18} />
            )}
            <span className="referral-stat-label">
              {stats?.milestones?.power_connector ? 'Power Connector' : 
               stats?.milestones?.network_builder ? 'Network Builder' : 
               `${3 - (stats?.total_referrals || 0)} to badge`}
            </span>
          </div>
        </div>

        <div className="referral-reward-info">
          <TrendingUp size={16} />
          <span>{rewardDescription}</span>
        </div>

        <div className="referral-link-section">
          <label>Your Referral Link</label>
          <div className="referral-link-box">
            <input 
              type="text" 
              value={stats?.referral_link || ''} 
              readOnly 
            />
            <button 
              className="copy-btn"
              onClick={copyLink}
              title="Copy link"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          <span className="referral-code">Code: <strong>{stats?.referral_code}</strong></span>
        </div>

        <div className="referral-actions">
          <button 
            className="btn-invite"
            onClick={() => setShowInviteModal(true)}
          >
            <Send size={18} />
            Invite by Email
          </button>
        </div>

        {stats?.recent_referrals?.length > 0 && (
          <div className="recent-referrals">
            <h4>Recent Referrals</h4>
            <div className="referral-list">
              {stats.recent_referrals.slice(0, 3).map((ref) => (
                <div key={ref.id} className={`referral-item status-${ref.status}`}>
                  <div className="referral-item-icon">
                    {ref.status === 'activated' ? <Check size={14} /> : <Mail size={14} />}
                  </div>
                  <div className="referral-item-info">
                    <span className="referral-email">{ref.referred_name || ref.referred_email}</span>
                    <span className={`referral-status ${ref.status}`}>{ref.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="invite-modal" onClick={e => e.stopPropagation()}>
            <div className="invite-modal-header">
              <h3>
                <Send size={20} />
                Invite Someone
              </h3>
              <button className="close-btn" onClick={() => setShowInviteModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendInvite}>
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message"><Check size={16} /> {success}</div>}

              <div className="form-group">
                <label>Email Address</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>They are a...</label>
                <div className="role-selector">
                  <label className="role-option">
                    <input
                      type="radio"
                      name="invite_role"
                      value="gc"
                      checked={inviteRole === 'gc'}
                      onChange={(e) => setInviteRole(e.target.value)}
                    />
                    <span>General Contractor</span>
                  </label>
                  <label className="role-option">
                    <input
                      type="radio"
                      name="invite_role"
                      value="sub"
                      checked={inviteRole === 'sub'}
                      onChange={(e) => setInviteRole(e.target.value)}
                    />
                    <span>Subcontractor</span>
                  </label>
                </div>
              </div>

              <div className="reward-preview">
                <Gift size={18} />
                <span>
                  When they sign up, you'll earn: <strong>
                    {inviteRole === 'sub' ? '+5 guaranteed bids/month' : '+2 guaranteed invites/month'}
                  </strong>
                </span>
              </div>

              <button 
                type="submit" 
                className="btn-send-invite"
                disabled={sending || !inviteEmail}
              >
                {sending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Invitation
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default ReferralCard;

