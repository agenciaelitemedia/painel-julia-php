-- Enable realtime replica identity
ALTER TABLE public.contacts REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;