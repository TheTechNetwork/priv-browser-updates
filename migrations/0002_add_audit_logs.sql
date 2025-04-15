-- Add audit logs table for security events
CREATE TABLE IF NOT EXISTS auditLogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  user_id TEXT,
  ip_address TEXT,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_auditLogs_event_type ON auditLogs(event_type);
CREATE INDEX IF NOT EXISTS idx_auditLogs_user_id ON auditLogs(user_id);
CREATE INDEX IF NOT EXISTS idx_auditLogs_created_at ON auditLogs(created_at);

-- Add sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_login TEXT NOT NULL,
  user_name TEXT,
  user_avatar TEXT,
  is_admin INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Add timestamp columns to existing tables
ALTER TABLE updateRequests ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE releases ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE releases ADD COLUMN created_by TEXT;

-- Add configurations table for application settings
CREATE TABLE IF NOT EXISTS configurations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT
);

-- Insert default configurations
INSERT OR IGNORE INTO configurations (key, value) VALUES ('githubOwner', '');
INSERT OR IGNORE INTO configurations (key, value) VALUES ('githubRepo', '');
INSERT OR IGNORE INTO configurations (key, value) VALUES ('cacheDuration', '3600');
INSERT OR IGNORE INTO configurations (key, value) VALUES ('stableChannel', 'true');
INSERT OR IGNORE INTO configurations (key, value) VALUES ('betaChannel', 'true');
INSERT OR IGNORE INTO configurations (key, value) VALUES ('devChannel', 'false');