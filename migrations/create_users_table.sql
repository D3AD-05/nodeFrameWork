-- Create users table for the Node.js backend framework
-- This script should be run manually in your MySQL database

-- CREATE DATABASE IF NOT EXISTS newDB;
USE newDB;

CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role INT DEFAULT 2,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_is_active (is_active),
  INDEX idx_created_at (created_at)
);

-- Insert default admin user (admin123)
INSERT INTO users (
  email,
  password,
  first_name,
  last_name,
  role,
  is_active
) VALUES (
  'admin@example.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLCW5eH1.Axa5mG', -- bcrypt of admin123
  'System',
  'Admin',
  1,
  1
) ON DUPLICATE KEY UPDATE email = VALUES(email);