-- Create table for storing section-wise performance analysis
CREATE TABLE public.section_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  test_attempt_id UUID REFERENCES test_attempts(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  section_name TEXT NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  accuracy_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  average_time_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for storing weak sections analysis
CREATE TABLE public.weak_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  test_attempt_id UUID REFERENCES test_attempts(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  section_name TEXT NOT NULL,
  accuracy_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  recommendation TEXT,
  is_weak BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.section_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weak_sections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for section_performance
CREATE POLICY "Users can view their own section performance" 
ON public.section_performance 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own section performance" 
ON public.section_performance 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own section performance" 
ON public.section_performance 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own section performance" 
ON public.section_performance 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for weak_sections
CREATE POLICY "Users can view their own weak sections" 
ON public.weak_sections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weak sections" 
ON public.weak_sections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weak sections" 
ON public.weak_sections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weak sections" 
ON public.weak_sections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_section_performance_user_id ON public.section_performance(user_id);
CREATE INDEX idx_section_performance_test_name ON public.section_performance(test_name);
CREATE INDEX idx_weak_sections_user_id ON public.weak_sections(user_id);
CREATE INDEX idx_weak_sections_test_name ON public.weak_sections(test_name);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_section_performance_updated_at
BEFORE UPDATE ON public.section_performance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weak_sections_updated_at
BEFORE UPDATE ON public.weak_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();