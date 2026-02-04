-- Migration: Rétablir l'accès public (suppression authentification)
-- Cette migration supprime les politiques RLS basées sur auth.uid() 
-- et les remplace par des politiques publiques

-- =====================================================
-- ÉTAPE 1: Supprimer les politiques d'authentification
-- =====================================================

-- Teams
DROP POLICY IF EXISTS "Users can view own teams" ON public.teams;
DROP POLICY IF EXISTS "Users can create own teams" ON public.teams;
DROP POLICY IF EXISTS "Users can update own teams" ON public.teams;
DROP POLICY IF EXISTS "Users can delete own teams" ON public.teams;

-- Drivers
DROP POLICY IF EXISTS "Users can view drivers of own teams" ON public.drivers;
DROP POLICY IF EXISTS "Users can create drivers for own teams" ON public.drivers;
DROP POLICY IF EXISTS "Users can update drivers of own teams" ON public.drivers;
DROP POLICY IF EXISTS "Users can delete drivers of own teams" ON public.drivers;

-- Races
DROP POLICY IF EXISTS "Users can view races of own teams" ON public.races;
DROP POLICY IF EXISTS "Users can create races for own teams" ON public.races;
DROP POLICY IF EXISTS "Users can update races of own teams" ON public.races;
DROP POLICY IF EXISTS "Users can delete races of own teams" ON public.races;

-- Race Laps
DROP POLICY IF EXISTS "Users can view laps of own races" ON public.race_laps;
DROP POLICY IF EXISTS "Users can create laps for own races" ON public.race_laps;
DROP POLICY IF EXISTS "Users can update laps of own races" ON public.race_laps;
DROP POLICY IF EXISTS "Users can delete laps of own races" ON public.race_laps;

-- Pit Stops
DROP POLICY IF EXISTS "Users can view pit stops of own races" ON public.pit_stops;
DROP POLICY IF EXISTS "Users can create pit stops for own races" ON public.pit_stops;
DROP POLICY IF EXISTS "Users can update pit stops of own races" ON public.pit_stops;
DROP POLICY IF EXISTS "Users can delete pit stops of own races" ON public.pit_stops;

-- Stints
DROP POLICY IF EXISTS "Users can view stints of own races" ON public.stints;
DROP POLICY IF EXISTS "Users can create stints for own races" ON public.stints;
DROP POLICY IF EXISTS "Users can update stints of own races" ON public.stints;
DROP POLICY IF EXISTS "Users can delete stints of own races" ON public.stints;

-- Live Sessions
DROP POLICY IF EXISTS "Users can view own live sessions" ON public.live_sessions;
DROP POLICY IF EXISTS "Users can create own live sessions" ON public.live_sessions;
DROP POLICY IF EXISTS "Users can update own live sessions" ON public.live_sessions;
DROP POLICY IF EXISTS "Users can delete own live sessions" ON public.live_sessions;
DROP POLICY IF EXISTS "Public can view live sessions" ON public.live_sessions;

-- =====================================================
-- ÉTAPE 2: Créer les politiques publiques
-- =====================================================

-- Teams
CREATE POLICY "Public full access teams" ON public.teams FOR ALL USING (true) WITH CHECK (true);

-- Drivers  
CREATE POLICY "Public full access drivers" ON public.drivers FOR ALL USING (true) WITH CHECK (true);

-- Races
CREATE POLICY "Public full access races" ON public.races FOR ALL USING (true) WITH CHECK (true);

-- Race Laps
CREATE POLICY "Public full access race_laps" ON public.race_laps FOR ALL USING (true) WITH CHECK (true);

-- Pit Stops
CREATE POLICY "Public full access pit_stops" ON public.pit_stops FOR ALL USING (true) WITH CHECK (true);

-- Stints
CREATE POLICY "Public full access stints" ON public.stints FOR ALL USING (true) WITH CHECK (true);

-- Live Sessions
CREATE POLICY "Public full access live_sessions" ON public.live_sessions FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- ÉTAPE 3: Rendre user_id optionnel
-- =====================================================

ALTER TABLE public.teams ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.live_sessions ALTER COLUMN user_id DROP NOT NULL;
