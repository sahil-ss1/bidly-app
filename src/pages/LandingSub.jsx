import { Link } from 'react-router-dom';
import './Landing.css';

function LandingSub() {
  return (
    <div className="landing-page">
      <div className="landing-hero">
        <div className="hero-content">
          <h1>Bidly for Subcontractors</h1>
          <p className="hero-subtitle">
            Get more work opportunities. Submit bids easily and grow your business.
          </p>
          <div className="cta-buttons">
            <Link to="/register?role=sub" className="cta-primary">
              Sign Up as Subcontractor
            </Link>
            <Link to="/login" className="cta-secondary">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <h2>Why Subcontractors Love Bidly</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>More Opportunities</h3>
              <p>Get invited to bid on projects from trusted General Contractors.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h3>Easy Bid Submission</h3>
              <p>Upload your bid PDFs quickly. No complicated forms or processes.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Plan Summaries</h3>
              <p>Understand project requirements faster with AI-generated plan summaries.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3>Track Your Bids</h3>
              <p>See the status of your submitted bids. Know when you're shortlisted.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Free to Use</h3>
              <p>Subcontractors can use Bidly completely free. No subscription fees.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Simple & Fast</h3>
              <p>Submit bids in minutes. Focus on your work, not paperwork.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="how-it-works">
        <div className="container">
          <h2>How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Receive Invitation</h3>
              <p>Get invited by a General Contractor to bid on their project</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Review Project</h3>
              <p>View project details and plans. Read AI-generated summaries.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Submit Your Bid</h3>
              <p>Upload your bid PDF. Add notes and pricing if needed.</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Get Awarded</h3>
              <p>GC reviews your bid. Get notified when you're selected.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <div className="container">
          <h2>Ready to Get More Work?</h2>
          <p>Join hundreds of subcontractors already using Bidly</p>
          <Link to="/register?role=sub" className="cta-primary large">
            Sign Up Free Today
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LandingSub;

