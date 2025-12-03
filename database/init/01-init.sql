-- NJ Stars Platform - Database Initialization Script
-- This script runs when the PostgreSQL container is first created

-- Ensure the database exists (should already be created by POSTGRES_DB)
SELECT 'CREATE DATABASE njstars'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'njstars')\gexec

-- Connect to the database
\c njstars

-- Enable UUID extension (if needed in future)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schema version table for tracking migrations
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial version
INSERT INTO schema_version (version, description)
VALUES (1, 'Initial database setup')
ON CONFLICT (version) DO NOTHING;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE njstars TO njstars;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO njstars;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO njstars;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully';
END $$;
