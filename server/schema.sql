-- DNF KART Database Schema for Railway PostgreSQL
-- This script is idempotent (safe to run multiple times)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT,
  code TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  weight_kg NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Races table
CREATE TABLE IF NOT EXISTS races (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  date DATE,
  track_name TEXT,
  ballast_target_kg NUMERIC(5,2) NOT NULL DEFAULT 80,
  kart_number INTEGER,
  position INTEGER,
  total_karts INTEGER,
  best_lap_ms INTEGER,
  best_lap_number INTEGER,
  total_laps INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Race laps table
CREATE TABLE IF NOT EXISTS race_laps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  race_id UUID REFERENCES races(id) ON DELETE CASCADE NOT NULL,
  lap_number INTEGER NOT NULL,
  lap_time_ms INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pit stops table
CREATE TABLE IF NOT EXISTS pit_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  race_id UUID REFERENCES races(id) ON DELETE CASCADE NOT NULL,
  lap_number INTEGER NOT NULL,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stints table
CREATE TABLE IF NOT EXISTS stints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  race_id UUID REFERENCES races(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  stint_number INTEGER NOT NULL,
  start_lap INTEGER NOT NULL,
  end_lap INTEGER NOT NULL,
  best_lap_ms INTEGER,
  avg_lap_ms INTEGER,
  total_laps INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Live sessions table
CREATE TABLE IF NOT EXISTS live_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  circuit_id TEXT NOT NULL,
  config JSONB NOT NULL,
  selected_kart TEXT NOT NULL,
  selected_team TEXT NOT NULL,
  stints JSONB,
  race_start_time BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Onboard messages table
CREATE TABLE IF NOT EXISTS onboard_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  kart_number TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_drivers_team ON drivers(team_id);
CREATE INDEX IF NOT EXISTS idx_races_team ON races(team_id);
CREATE INDEX IF NOT EXISTS idx_race_laps_race ON race_laps(race_id);
CREATE INDEX IF NOT EXISTS idx_pit_stops_race ON pit_stops(race_id);
CREATE INDEX IF NOT EXISTS idx_stints_race ON stints(race_id);
CREATE INDEX IF NOT EXISTS idx_stints_driver ON stints(driver_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_user ON live_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_onboard_messages_session ON onboard_messages(session_id);

-- Create default team if none exists
INSERT INTO teams (id, name, user_id)
SELECT '00000000-0000-0000-0000-000000000001', 'Mon Équipe', 'anonymous'
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE id = '00000000-0000-0000-0000-000000000001');
