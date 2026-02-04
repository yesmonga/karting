-- Migration: Sécuriser les tables avec authentification utilisateur

-- =====================================================
-- ÉTAPE 1: Ajouter user_id à la table teams
-- =====================================================

ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- =====================================================
-- ÉTAPE 2: Supprimer les anciennes politiques publiques
-- =====================================================

-- Teams
DROP POLICY IF EXISTS "Public read access for teams" ON public.teams;
DROP POLICY IF EXISTS "Public insert access for teams" ON public.teams;
DROP POLICY IF EXISTS "Public update access for teams" ON public.teams;
DROP POLICY IF EXISTS "Public delete access for teams" ON public.teams;

-- Drivers
DROP POLICY IF EXISTS "Public read access for drivers" ON public.drivers;
DROP POLICY IF EXISTS "Public insert access for drivers" ON public.drivers;
DROP POLICY IF EXISTS "Public update access for drivers" ON public.drivers;
DROP POLICY IF EXISTS "Public delete access for drivers" ON public.drivers;

-- Races
DROP POLICY IF EXISTS "Public read access for races" ON public.races;
DROP POLICY IF EXISTS "Public insert access for races" ON public.races;
DROP POLICY IF EXISTS "Public update access for races" ON public.races;
DROP POLICY IF EXISTS "Public delete access for races" ON public.races;

-- Race Laps
DROP POLICY IF EXISTS "Public read access for race_laps" ON public.race_laps;
DROP POLICY IF EXISTS "Public insert access for race_laps" ON public.race_laps;

-- Pit Stops
DROP POLICY IF EXISTS "Public read access for pit_stops" ON public.pit_stops;
DROP POLICY IF EXISTS "Public insert access for pit_stops" ON public.pit_stops;

-- Stints
DROP POLICY IF EXISTS "Public read access for stints" ON public.stints;
DROP POLICY IF EXISTS "Public insert access for stints" ON public.stints;
DROP POLICY IF EXISTS "Public update access for stints" ON public.stints;

-- =====================================================
-- ÉTAPE 3: Créer les nouvelles politiques sécurisées
-- =====================================================

-- ===== TEAMS =====
CREATE POLICY "Users can view own teams" 
ON public.teams FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own teams" 
ON public.teams FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own teams" 
ON public.teams FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own teams" 
ON public.teams FOR DELETE 
USING (auth.uid() = user_id);

-- ===== DRIVERS =====
CREATE POLICY "Users can view drivers of own teams" 
ON public.drivers FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE teams.id = drivers.team_id 
    AND teams.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create drivers for own teams" 
ON public.drivers FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE teams.id = team_id 
    AND teams.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update drivers of own teams" 
ON public.drivers FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE teams.id = drivers.team_id 
    AND teams.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete drivers of own teams" 
ON public.drivers FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE teams.id = drivers.team_id 
    AND teams.user_id = auth.uid()
  )
);

-- ===== RACES =====
CREATE POLICY "Users can view races of own teams" 
ON public.races FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE teams.id = races.team_id 
    AND teams.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create races for own teams" 
ON public.races FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE teams.id = team_id 
    AND teams.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update races of own teams" 
ON public.races FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE teams.id = races.team_id 
    AND teams.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete races of own teams" 
ON public.races FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE teams.id = races.team_id 
    AND teams.user_id = auth.uid()
  )
);

-- ===== RACE_LAPS =====
CREATE POLICY "Users can view laps of own races" 
ON public.race_laps FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.races 
    JOIN public.teams ON teams.id = races.team_id
    WHERE races.id = race_laps.race_id 
    AND teams.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create laps for own races" 
ON public.race_laps FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.races 
    JOIN public.teams ON teams.id = races.team_id
    WHERE races.id = race_id 
    AND teams.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update laps of own races" 
ON public.race_laps FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.races 
    JOIN public.teams ON teams.id = races.team_id
    WHERE races.id = race_laps.race_id 
    AND teams.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete laps of own races" 
ON public.race_laps FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.races 
    JOIN public.teams ON teams.id = races.team_id
    WHERE races.id = race_laps.race_id 
    AND teams.user_id = auth.uid()
  )
);

-- ===== PIT_STOPS =====
CREATE POLICY "Users can view pit stops of own races" 
ON public.pit_stops FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.races 
    JOIN public.teams ON teams.id = races.team_id
    WHERE races.id = pit_stops.race_id 
    AND teams.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create pit stops for own races" 
ON public.pit_stops FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.races 
    JOIN public.teams ON teams.id = races.team_id
    WHERE races.id = race_id 
    AND teams.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update pit stops of own races" 
ON public.pit_stops FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.races 
    JOIN public.teams ON teams.id = races.team_id
    WHERE races.id = pit_stops.race_id 
    AND teams.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete pit stops of own races" 
ON public.pit_stops FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.races 
    JOIN public.teams ON teams.id = races.team_id
    WHERE races.id = pit_stops.race_id 
    AND teams.user_id = auth.uid()
  )
);

-- ===== STINTS =====
CREATE POLICY "Users can view stints of own races" 
ON public.stints FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.races 
    JOIN public.teams ON teams.id = races.team_id
    WHERE races.id = stints.race_id 
    AND teams.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create stints for own races" 
ON public.stints FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.races 
    JOIN public.teams ON teams.id = races.team_id
    WHERE races.id = race_id 
    AND teams.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update stints of own races" 
ON public.stints FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.races 
    JOIN public.teams ON teams.id = races.team_id
    WHERE races.id = stints.race_id 
    AND teams.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete stints of own races" 
ON public.stints FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.races 
    JOIN public.teams ON teams.id = races.team_id
    WHERE races.id = stints.race_id 
    AND teams.user_id = auth.uid()
  )
);

-- =====================================================
-- ÉTAPE 4: Index pour performance des politiques RLS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_teams_user ON public.teams(user_id);