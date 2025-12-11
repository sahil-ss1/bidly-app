-- ============================================
-- Bidly Database Schema (PostgreSQL)
-- ============================================

-- Drop existing tables if recreating (comment out in production)
-- DROP TABLE IF EXISTS referrals CASCADE;
-- DROP TABLE IF EXISTS ai_summaries CASCADE;
-- DROP TABLE IF EXISTS bids CASCADE;
-- DROP TABLE IF EXISTS project_sub_invitations CASCADE;
-- DROP TABLE IF EXISTS project_plan_files CASCADE;
-- DROP TABLE IF EXISTS projects CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'sub' CHECK (role IN ('gc', 'sub', 'admin')),
  company_name VARCHAR(255),
  phone VARCHAR(50),
  -- Subcontractor-specific fields
  trade VARCHAR(100),
  region VARCHAR(255),
  -- Subcontractor onboarding fields
  ca_licensed VARCHAR(10),
  ca_license_number VARCHAR(100),
  need_entity_help VARCHAR(10),
  need_insurance_help VARCHAR(10),
  need_licensing_help VARCHAR(10),
  insurance_type VARCHAR(255),
  has_general_liability VARCHAR(10),
  general_liability_amount VARCHAR(100),
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'standard', 'pro', 'elite')),
  guaranteed_invites_per_month INT DEFAULT 0,
  invites_received_this_month INT DEFAULT 0,
  -- Referral system
  referral_code VARCHAR(50) UNIQUE,
  referred_by INT REFERENCES users(id) ON DELETE SET NULL,
  referral_count INT DEFAULT 0,
  -- Access control
  bidly_access BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_trade ON users(trade);
CREATE INDEX IF NOT EXISTS idx_users_region ON users(region);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- ============================================
-- AI Summaries Table (created first for FK)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_summaries (
  id SERIAL PRIMARY KEY,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('plan', 'bid', 'comparison')),
  item_id INT NOT NULL,
  summary_text TEXT,
  meta JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_summaries_item_type ON ai_summaries(item_type);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_item_id ON ai_summaries(item_id);

-- ============================================
-- Projects Table
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  gc_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  trades_needed JSONB,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'awarded')),
  bid_deadline TIMESTAMP,
  guaranteed_min_bids INT DEFAULT 3,
  ai_plan_summary_id INT REFERENCES ai_summaries(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_gc_id ON projects(gc_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ============================================
-- Project Plan Files Table
-- ============================================
CREATE TABLE IF NOT EXISTS project_plan_files (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plan_files_project_id ON project_plan_files(project_id);

-- ============================================
-- Project Sub Invitations Table
-- ============================================
CREATE TABLE IF NOT EXISTS project_sub_invitations (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  gc_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sub_id INT REFERENCES users(id) ON DELETE SET NULL,
  invite_email VARCHAR(255) NOT NULL,
  invite_token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'accepted', 'declined', 'expired')),
  viewed_at TIMESTAMP,
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, invite_email)
);

CREATE INDEX IF NOT EXISTS idx_invitations_project_id ON project_sub_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_invitations_invite_token ON project_sub_invitations(invite_token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON project_sub_invitations(status);

-- ============================================
-- Bids Table
-- ============================================
CREATE TABLE IF NOT EXISTS bids (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sub_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bid_file_url TEXT,
  amount DECIMAL(15, 2),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'shortlisted', 'rejected', 'awarded')),
  ai_summary_id INT REFERENCES ai_summaries(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bids_project_id ON bids(project_id);
CREATE INDEX IF NOT EXISTS idx_bids_sub_id ON bids(sub_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);

-- ============================================
-- Referrals Table (Growth Flywheel)
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  referrer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id INT REFERENCES users(id) ON DELETE SET NULL,
  referred_email VARCHAR(255) NOT NULL,
  referral_code VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'activated', 'rewarded')),
  reward_type VARCHAR(50),
  reward_amount INT,
  referred_role VARCHAR(10) CHECK (referred_role IN ('gc', 'sub')),
  registered_at TIMESTAMP,
  activated_at TIMESTAMP,
  rewarded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_email ON referrals(referred_email);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- ============================================
-- Function to update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
            CREATE TRIGGER update_%s_updated_at
            BEFORE UPDATE ON %s
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$ language 'plpgsql';

-- ============================================
-- Sample Admin User (password: admin123)
-- ============================================
-- INSERT INTO users (name, email, password, role, bidly_access)
-- VALUES ('Admin', 'admin@bidly.com', '$2a$10$rPqMhJ8XNQDsqXB9JjJxGOqJXGqrPqMhJ8XNQDsqXB9JjJxGOq', 'admin', TRUE)
-- ON CONFLICT (email) DO NOTHING;
