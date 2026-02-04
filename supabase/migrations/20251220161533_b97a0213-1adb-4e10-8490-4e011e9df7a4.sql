-- Table pour stocker les codes de vérification
CREATE TABLE public.auth_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('signup', 'login')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX idx_auth_codes_email_code ON public.auth_codes(email, code);
CREATE INDEX idx_auth_codes_expires ON public.auth_codes(expires_at);

-- RLS - Pas de lecture publique, uniquement via edge functions avec service role
ALTER TABLE public.auth_codes ENABLE ROW LEVEL SECURITY;

-- Pas de politiques = pas d'accès public (edge functions utilisent service role)

-- Fonction pour nettoyer les codes expirés
CREATE OR REPLACE FUNCTION public.cleanup_expired_auth_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.auth_codes WHERE expires_at < now();
END;
$$;