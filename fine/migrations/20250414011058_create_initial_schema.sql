-- Create releases table
CREATE TABLE releases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL,
  channel TEXT NOT NULL,
  platform TEXT NOT NULL,
  downloadUrl TEXT NOT NULL,
  releaseNotes TEXT,
  fileSize INTEGER,
  sha256 TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  isActive BOOLEAN DEFAULT true
);

-- Create configurations table
CREATE TABLE configurations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create update_requests table
CREATE TABLE updateRequests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clientVersion TEXT,
  platform TEXT,
  channel TEXT,
  ip TEXT,
  userAgent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configurations
INSERT INTO configurations (key, value) VALUES
  ('githubOwner', ''),
  ('githubRepo', ''),
  ('githubToken', ''),
  ('cacheDuration', '3600'),
  ('stableChannel', 'true'),
  ('betaChannel', 'true'),
  ('devChannel', 'true');