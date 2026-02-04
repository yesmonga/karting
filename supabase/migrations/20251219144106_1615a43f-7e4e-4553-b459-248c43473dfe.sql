-- Create table for teams (équipes de kart)
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for drivers (pilotes)
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT,
  code TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  weight_kg NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for races (courses)
CREATE TABLE public.races (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for race laps (tours de course)
CREATE TABLE public.race_laps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id UUID REFERENCES public.races(id) ON DELETE CASCADE NOT NULL,
  lap_number INTEGER NOT NULL,
  lap_time_ms INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for pit stops (arrêts aux stands)
CREATE TABLE public.pit_stops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id UUID REFERENCES public.races(id) ON DELETE CASCADE NOT NULL,
  lap_number INTEGER NOT NULL,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for stints
CREATE TABLE public.stints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id UUID REFERENCES public.races(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  stint_number INTEGER NOT NULL,
  start_lap INTEGER NOT NULL,
  end_lap INTEGER NOT NULL,
  best_lap_ms INTEGER,
  avg_lap_ms INTEGER,
  total_laps INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables (currently public access for development)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_laps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pit_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stints ENABLE ROW LEVEL SECURITY;

-- Public access policies (will be restricted later when auth is added)
CREATE POLICY "Public read access for teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public insert access for teams" ON public.teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for teams" ON public.teams FOR UPDATE USING (true);
CREATE POLICY "Public delete access for teams" ON public.teams FOR DELETE USING (true);

CREATE POLICY "Public read access for drivers" ON public.drivers FOR SELECT USING (true);
CREATE POLICY "Public insert access for drivers" ON public.drivers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for drivers" ON public.drivers FOR UPDATE USING (true);
CREATE POLICY "Public delete access for drivers" ON public.drivers FOR DELETE USING (true);

CREATE POLICY "Public read access for races" ON public.races FOR SELECT USING (true);
CREATE POLICY "Public insert access for races" ON public.races FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for races" ON public.races FOR UPDATE USING (true);
CREATE POLICY "Public delete access for races" ON public.races FOR DELETE USING (true);

CREATE POLICY "Public read access for race_laps" ON public.race_laps FOR SELECT USING (true);
CREATE POLICY "Public insert access for race_laps" ON public.race_laps FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access for pit_stops" ON public.pit_stops FOR SELECT USING (true);
CREATE POLICY "Public insert access for pit_stops" ON public.pit_stops FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access for stints" ON public.stints FOR SELECT USING (true);
CREATE POLICY "Public insert access for stints" ON public.stints FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for stints" ON public.stints FOR UPDATE USING (true);

-- Create indexes for performance
CREATE INDEX idx_drivers_team ON public.drivers(team_id);
CREATE INDEX idx_races_team ON public.races(team_id);
CREATE INDEX idx_race_laps_race ON public.race_laps(race_id);
CREATE INDEX idx_pit_stops_race ON public.pit_stops(race_id);
CREATE INDEX idx_stints_race ON public.stints(race_id);
CREATE INDEX idx_stints_driver ON public.stints(driver_id);