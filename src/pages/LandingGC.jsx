import { Link } from 'react-router-dom';
import './Landing.css';

function LandingGC() {
  return (
    <div className="landing-page">
      <div className="landing-hero">
        <div className="hero-content">
          <h1>Bidly for General Contractors</h1>
          <p className="hero-subtitle">
            Streamline your bidding process. Get organized bids from subcontractors in one place.
          </p>
          <div className="cta-buttons">
            <Link to="/register?role=gc" className="cta-primary">
              Get Started as GC
            </Link>
            <Link to="/login" className="cta-secondary">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <h2>Why GCs Choose Bidly</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h3>Organized Bidding</h3>
              <p>Create projects, upload plans, and manage all bids in one centralized dashboard.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI-Powered Summaries</h3>
              <p>Automatically generate summaries of plans and bids. Compare multiple bids instantly.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📧</div>
              <h3>Easy Invitations</h3>
              <p>Send bid requests to subcontractors with a simple link. Track who's bidding.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Save Time</h3>
              <p>No more email chains or scattered PDFs. Everything organized and accessible.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Bid Comparison</h3>
              <p>AI automatically compares multiple bids and highlights the best options.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Private</h3>
              <p>All files stored securely in Google Cloud. Only invited subs can access projects.</p>
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
              <h3>Create Your Project</h3>
              <p>Add project details, location, and deadline</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Upload Plan PDFs</h3>
              <p>Upload your construction plans. AI automatically generates summaries.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Invite Subcontractors</h3>
              <p>Send invitation links to your preferred subcontractors</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Review Bids</h3>
              <p>View all submitted bids with AI summaries. Compare and award projects.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <div className="container">
          <h2>Ready to Streamline Your Bidding?</h2>
          <p>Join hundreds of GCs already using Bidly</p>
          <Link to="/register?role=gc" className="cta-primary large">
            Start Managing Bids Today
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LandingGC;

