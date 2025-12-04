import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, ArrowLeft, Check, Crown, Zap, Award, Star,
  Mail, Bell, Search, Clock, Bot, Shield, TrendingUp,
  ExternalLink, Sparkles
} from 'lucide-react';
import { authAPI } from '../services/api';
import './PricingPage.css';

const PRICING_TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    guaranteed: 3,
    tagline: 'Get started with Bidly',
    icon: Star,
    popular: false,
    features: [
      { text: '3 bid invitations per month', included: true },
      { text: '1 monthly freebie guaranteed', included: true },
      { text: 'Basic profile', included: true },
      { text: 'Can submit bids', included: true },
      { text: 'Priority listing', included: false },
      { text: 'SMS notifications', included: false },
      { text: 'AI features', included: false },
    ]
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 250,
    period: 'month',
    guaranteed: 2,
    tagline: 'For growing subcontractors',
    icon: TrendingUp,
    popular: false,
    features: [
      { text: '2 guaranteed job invitations/month', included: true, highlight: true },
      { text: 'Priority listing in searches', included: true },
      { text: 'Instant SMS notifications', included: true },
      { text: 'Enhanced profile', included: true },
      { text: 'Can submit unlimited bids', included: true },
      { text: 'Higher ranking', included: false },
      { text: 'AI bid organization', included: false },
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 500,
    period: 'month',
    guaranteed: 5,
    tagline: 'Most popular for serious pros',
    icon: Zap,
    popular: true,
    features: [
      { text: '5 guaranteed invitations/month', included: true, highlight: true },
      { text: 'Higher ranking in GC searches', included: true },
      { text: 'Early access to new job postings', included: true },
      { text: 'AI bid organization', included: true },
      { text: 'Priority SMS & email alerts', included: true },
      { text: 'Performance analytics', included: true },
      { text: 'First-access priority', included: false },
    ]
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 1000,
    period: 'month',
    guaranteed: 10,
    tagline: 'Maximum opportunity flow',
    icon: Crown,
    popular: false,
    elite: true,
    features: [
      { text: '10 guaranteed invitations/month', included: true, highlight: true },
      { text: 'First-access priority on all jobs', included: true },
      { text: '"Elite Pro" badge & top placement', included: true },
      { text: 'Advanced AI insights', included: true },
      { text: 'Dedicated account support', included: true },
      { text: 'Custom profile branding', included: true },
      { text: 'Unlimited everything', included: true },
    ]
  }
];

function PricingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await authAPI.getMe();
        setUser(response.data);
      }
    } catch (error) {
      // User not logged in, that's okay
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (tierId) => {
    if (!user) {
      navigate(`/register?role=sub&plan=${tierId}`);
    } else {
      // Redirect to Pali Builds for payment
      window.open('https://palibuilds.com/pricing', '_blank');
    }
  };

  const getButtonText = (tier) => {
    if (!user) return 'Get Started';
    if (user.subscription_tier === tier.id) return 'Current Plan';
    if (tier.price === 0) return 'Downgrade';
    return 'Upgrade Now';
  };

  const isCurrentPlan = (tierId) => user?.subscription_tier === tierId;

  return (
    <div className="pricing-page">
      <nav className="pricing-nav">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={18} />
          Back
        </button>
        <Link to="/" className="pricing-logo">
          <Building2 size={24} />
          <span>Bidly</span>
        </Link>
        {!user && (
          <Link to="/login" className="login-link">
            Sign In
          </Link>
        )}
      </nav>

      <div className="pricing-hero">
        <h1>Simple, Opportunity-Based Pricing</h1>
        <p>Pay for job opportunities, not software features. Get guaranteed bid invitations every month.</p>
        
        <div className="value-props">
          <div className="value-prop">
            <Mail size={20} />
            <span>Guaranteed Invitations</span>
          </div>
          <div className="value-prop">
            <Search size={20} />
            <span>Priority Visibility</span>
          </div>
          <div className="value-prop">
            <Bot size={20} />
            <span>AI-Powered Tools</span>
          </div>
        </div>
      </div>

      <div className="pricing-grid">
        {PRICING_TIERS.map((tier) => {
          const Icon = tier.icon;
          return (
            <div 
              key={tier.id} 
              className={`pricing-card ${tier.popular ? 'popular' : ''} ${tier.elite ? 'elite' : ''} ${isCurrentPlan(tier.id) ? 'current' : ''}`}
            >
              {tier.popular && (
                <div className="popular-badge">
                  <Sparkles size={14} />
                  Most Popular
                </div>
              )}
              {tier.elite && (
                <div className="elite-badge">
                  <Crown size={14} />
                  Elite
                </div>
              )}
              {isCurrentPlan(tier.id) && (
                <div className="current-badge">
                  <Check size={14} />
                  Your Plan
                </div>
              )}

              <div className="card-header">
                <div className={`tier-icon ${tier.id}`}>
                  <Icon size={24} />
                </div>
                <h3>{tier.name}</h3>
                <p className="tier-tagline">{tier.tagline}</p>
              </div>

              <div className="card-price">
                <span className="price-amount">
                  {tier.price === 0 ? 'Free' : `$${tier.price}`}
                </span>
                {tier.price > 0 && <span className="price-period">/{tier.period}</span>}
              </div>

              <div className="guaranteed-highlight">
                <Shield size={18} />
                <span><strong>{tier.guaranteed}</strong> guaranteed invitations/month</span>
              </div>

              <ul className="features-list">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className={`${feature.included ? 'included' : 'not-included'} ${feature.highlight ? 'highlight' : ''}`}>
                    <Check size={16} />
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>

              <button 
                className={`select-plan-btn ${tier.id} ${isCurrentPlan(tier.id) ? 'current' : ''}`}
                onClick={() => handleSelectPlan(tier.id)}
                disabled={isCurrentPlan(tier.id)}
              >
                {getButtonText(tier)}
                {!isCurrentPlan(tier.id) && tier.price > 0 && <ExternalLink size={16} />}
              </button>
            </div>
          );
        })}
      </div>

      <div className="pricing-faq">
        <h2>Frequently Asked Questions</h2>
        
        <div className="faq-grid">
          <div className="faq-item">
            <h4>What are "guaranteed invitations"?</h4>
            <p>Each month, we guarantee you'll receive a minimum number of bid invitations from GCs in your trade and region. If we don't deliver, we'll extend your subscription.</p>
          </div>
          <div className="faq-item">
            <h4>Can I change plans anytime?</h4>
            <p>Yes! Upgrade or downgrade at any time. Changes take effect on your next billing cycle.</p>
          </div>
          <div className="faq-item">
            <h4>How does priority listing work?</h4>
            <p>Paid subscribers appear higher in GC searches. Elite members always appear first.</p>
          </div>
          <div className="faq-item">
            <h4>What if I don't get enough invitations?</h4>
            <p>Our guarantee is real. If you don't receive your guaranteed invitations, contact us for a pro-rated credit.</p>
          </div>
        </div>
      </div>

      <div className="pricing-cta">
        <h2>Ready to grow your business?</h2>
        <p>Join thousands of subcontractors winning more jobs with Bidly.</p>
        {!user ? (
          <Link to="/register?role=sub" className="cta-btn">
            Get Started Free
            <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
          </Link>
        ) : (
          <button 
            className="cta-btn"
            onClick={() => window.open('https://palibuilds.com/pricing', '_blank')}
          >
            Upgrade Your Plan
            <ExternalLink size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

export default PricingPage;

