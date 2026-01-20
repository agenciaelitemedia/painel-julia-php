-- Create crm_boards table for panels
CREATE TABLE public.crm_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'layout-dashboard',
  color TEXT DEFAULT '#6366f1',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_boards ENABLE ROW LEVEL SECURITY;

-- Create policies for crm_boards
CREATE POLICY "Users can view their client boards"
ON public.crm_boards
FOR SELECT
USING (
  (client_id = get_user_client_id(auth.uid())) OR
  has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Users can insert their client boards"
ON public.crm_boards
FOR INSERT
WITH CHECK (
  (client_id = get_user_client_id(auth.uid())) OR
  has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Users can update their client boards"
ON public.crm_boards
FOR UPDATE
USING (
  (client_id = get_user_client_id(auth.uid())) OR
  has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Users can delete their client boards"
ON public.crm_boards
FOR DELETE
USING (
  (client_id = get_user_client_id(auth.uid())) OR
  has_role(auth.uid(), 'admin'::user_role)
);

-- Add board_id to crm_pipelines
ALTER TABLE public.crm_pipelines
ADD COLUMN board_id UUID REFERENCES public.crm_boards(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_crm_pipelines_board_id ON public.crm_pipelines(board_id);
CREATE INDEX idx_crm_boards_client_id ON public.crm_boards(client_id);

-- Create trigger for automatic timestamp updates on crm_boards
CREATE TRIGGER update_crm_boards_updated_at
BEFORE UPDATE ON public.crm_boards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();