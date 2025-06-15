
-- Create load_calculations table to store load calculation results
CREATE TABLE public.load_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parameters JSONB NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.load_calculations ENABLE ROW LEVEL SECURITY;

-- Create policies for load_calculations
CREATE POLICY "Users can view their own load calculations" 
  ON public.load_calculations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own load calculations" 
  ON public.load_calculations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own load calculations" 
  ON public.load_calculations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own load calculations" 
  ON public.load_calculations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_load_calculations_updated_at
  BEFORE UPDATE ON public.load_calculations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
