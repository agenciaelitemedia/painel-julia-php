-- Corrigir search_path nas funções para segurança

ALTER FUNCTION public.generate_verification_code() 
SET search_path = public;

ALTER FUNCTION public.generate_tracking_token() 
SET search_path = public;