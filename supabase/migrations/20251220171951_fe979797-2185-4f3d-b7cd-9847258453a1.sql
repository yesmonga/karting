-- Add policy for public read access to live_sessions (spectators)
CREATE POLICY "Anyone can view sessions by id" 
ON public.live_sessions 
FOR SELECT 
USING (true);