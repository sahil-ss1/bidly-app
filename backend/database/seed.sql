-- Seed data for bidly_db
USE bidly_db;

-- Insert sample users (uncomment to use)
INSERT INTO users (name, email) VALUES
('John Doe', 'john@example.com'),
('Jane Smith', 'jane@example.com')
ON DUPLICATE KEY UPDATE name=VALUES(name);

