-- Table pour les messages onboard (PC vers téléphone)
CREATE TABLE public.onboard_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  kart_number TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS: Lecture publique, écriture authentifiée
ALTER TABLE public.onboard_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read onboard messages" 
ON public.onboard_messages FOR SELECT USING (true);

CREATE POLICY "Authenticated users can send messages" 
ON public.onboard_messages FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Index pour performance
CREATE INDEX idx_onboard_messages_kart ON public.onboard_messages(kart_number);
CREATE INDEX idx_onboard_messages_session ON public.onboard_messages(session_id);

-- Activer le realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.onboard_messages;