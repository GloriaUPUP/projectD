-- Initialize the delivery_app database
-- This script runs when the PostgreSQL container starts for the first time

CREATE DATABASE IF NOT EXISTS delivery_app;

-- Grant all privileges to the user
GRANT ALL PRIVILEGES ON DATABASE delivery_app TO gloriaupup;