import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, ArrowLeft, Search, ChevronDown, ChevronRight,
  HelpCircle, BookOpen, MessageCircle, Mail, Phone,
  FileText, Users, FolderKanban, Upload, Send, Shield,
  CreditCard, Bell, Settings, ExternalLink
} from 'lucide-react';
import './HelpCenter.css';

const FAQ_CATEGORIES = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    questions: [
      {
        q: 'How do I create my first project?',
        a: 'Click the "+ New Project" button on your dashboard. Fill in the project details including name, address, description, and select the trades needed. You can also upload plan files (PDFs or images) and invite subcontractors directly from the project creation form.'
      },
      {
        q: 'What is the difference between a General Contractor and Subcontractor account?',
        a: 'General Contractors (GCs) can create projects, upload plans, invite subcontractors, and review/compare bids. Subcontractors receive project invitations, view plans, and submit bids on projects they\'re invited to.'
      },
      {
        q: 'How do I get Bidly access?',
        a: 'Bidly access is granted through your Pali Builds subscription. Once you subscribe, an admin will activate your Bidly access, allowing you to create projects and access all features.'
      }
    ]
  },
  {
    id: 'projects',
    title: 'Managing Projects',
    icon: FolderKanban,
    questions: [
      {
        q: 'How do I invite subcontractors to my project?',
        a: 'Open your project, go to the "Invitations" tab, and click "+ Invite Sub". Enter the subcontractor\'s email address. They will receive an invitation to view your project and submit a bid. You can also select multiple subcontractors when creating a new project.'
      },
      {
        q: 'What file formats can I upload for project plans?',
        a: 'Bidly supports PDF, PNG, JPG, and JPEG file formats for project plans. We recommend using PDF for construction documents as they maintain quality and are easier to view.'
      },
      {
        q: 'How do I change the status of my project?',
        a: 'Project status is automatically managed based on actions: Draft (just created), Open (has invitations), Closed (deadline passed), Awarded (bid accepted). You can manually update status from the project detail page.'
      }
    ]
  },
  {
    id: 'bids',
    title: 'Bids & Invitations',
    icon: FileText,
    questions: [
      {
        q: 'How do I submit a bid as a subcontractor?',
        a: 'When you receive a project invitation, go to the project detail page from your dashboard. Review the plans and project details, then click "Submit Bid". Enter your bid amount, add any notes, and optionally upload a bid file.'
      },
      {
        q: 'Can I modify my bid after submitting?',
        a: 'Currently, bids cannot be modified after submission. Make sure to review all details before submitting. Contact the GC directly if you need to make changes.'
      },
      {
        q: 'What do the bid statuses mean?',
        a: 'Submitted: Bid received. Reviewed: GC has seen your bid. Shortlisted: You\'re being considered. Rejected: Bid not selected. Awarded: You won the project!'
      }
    ]
  },
  {
    id: 'ai-features',
    title: 'AI Features',
    icon: Shield,
    questions: [
      {
        q: 'What is the AI Plan Summary?',
        a: 'When you upload project plans, our AI analyzes the documents and generates a summary highlighting key project details, scope of work, and important specifications. This helps subcontractors quickly understand the project.'
      },
      {
        q: 'How does AI Bid Comparison work?',
        a: 'Once you have 2 or more bids on a project, you can generate an AI comparison. The AI analyzes all bids and provides insights on pricing, strengths, and helps you make informed decisions.'
      }
    ]
  },
  {
    id: 'account',
    title: 'Account & Billing',
    icon: CreditCard,
    questions: [
      {
        q: 'How do I update my profile information?',
        a: 'Go to Settings from the sidebar menu. You can update your name, company name, phone number, and email address from the Profile section.'
      },
      {
        q: 'How do I manage my subscription?',
        a: 'Subscription and billing are managed through the Pali Builds dashboard. Visit palibuilds.com to manage your subscription, update payment methods, or change your plan.'
      }
    ]
  }
];

function HelpCenter() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState('getting-started');
  const [expandedQuestions, setExpandedQuestions] = useState({});

  const toggleQuestion = (categoryId, questionIndex) => {
    const key = `${categoryId}-${questionIndex}`;
    setExpandedQuestions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const filteredCategories = FAQ_CATEGORIES.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="help-page">
      <nav className="help-nav">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="help-nav-logo">
          <Building2 size={20} />
          <span>Bidly Help Center</span>
        </div>
      </nav>

      <div className="help-content">
        {/* Hero Section */}
        <div className="help-hero">
          <h1>How can we help you?</h1>
          <p>Find answers to common questions about using Bidly</p>
          <div className="help-search">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="quick-links">
          <div className="quick-link-card" onClick={() => setExpandedCategory('getting-started')}>
            <div className="quick-link-icon">
              <BookOpen size={24} />
            </div>
            <h3>Getting Started</h3>
            <p>New to Bidly? Start here</p>
          </div>
          <div className="quick-link-card" onClick={() => setExpandedCategory('projects')}>
            <div className="quick-link-icon">
              <FolderKanban size={24} />
            </div>
            <h3>Projects</h3>
            <p>Create & manage projects</p>
          </div>
          <div className="quick-link-card" onClick={() => setExpandedCategory('bids')}>
            <div className="quick-link-icon">
              <FileText size={24} />
            </div>
            <h3>Bids</h3>
            <p>Submit & review bids</p>
          </div>
          <div className="quick-link-card" onClick={() => setExpandedCategory('ai-features')}>
            <div className="quick-link-icon">
              <Shield size={24} />
            </div>
            <h3>AI Features</h3>
            <p>Smart summaries & comparisons</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          
          <div className="faq-grid">
            {/* Category Sidebar */}
            <div className="faq-categories">
              {FAQ_CATEGORIES.map(category => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    className={`faq-category-btn ${expandedCategory === category.id ? 'active' : ''}`}
                    onClick={() => setExpandedCategory(category.id)}
                  >
                    <Icon size={18} />
                    <span>{category.title}</span>
                    <ChevronRight size={16} className="category-arrow" />
                  </button>
                );
              })}
            </div>

            {/* Questions List */}
            <div className="faq-questions">
              {(searchQuery ? filteredCategories : FAQ_CATEGORIES.filter(c => c.id === expandedCategory)).map(category => (
                <div key={category.id} className="faq-category-content">
                  {searchQuery && <h3 className="category-title">{category.title}</h3>}
                  {category.questions.map((item, index) => {
                    const isExpanded = expandedQuestions[`${category.id}-${index}`];
                    return (
                      <div key={index} className={`faq-item ${isExpanded ? 'expanded' : ''}`}>
                        <button
                          className="faq-question"
                          onClick={() => toggleQuestion(category.id, index)}
                        >
                          <span>{item.q}</span>
                          <ChevronDown size={18} className="faq-arrow" />
                        </button>
                        {isExpanded && (
                          <div className="faq-answer">
                            <p>{item.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="contact-section">
          <h2>Still need help?</h2>
          <p>Our support team is here to assist you</p>
          
          <div className="contact-cards">
            <div className="contact-card">
              <div className="contact-icon">
                <Mail size={24} />
              </div>
              <h3>Email Support</h3>
              <p>Get help via email within 24 hours</p>
              <a href="mailto:support@bidly.com">support@bidly.com</a>
            </div>
            <div className="contact-card">
              <div className="contact-icon">
                <MessageCircle size={24} />
              </div>
              <h3>Live Chat</h3>
              <p>Chat with us during business hours</p>
              <button className="chat-btn">Start Chat</button>
            </div>
            <div className="contact-card">
              <div className="contact-icon">
                <Phone size={24} />
              </div>
              <h3>Phone Support</h3>
              <p>Mon-Fri, 9am-5pm EST</p>
              <a href="tel:+1234567890">+1 (234) 567-890</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelpCenter;

