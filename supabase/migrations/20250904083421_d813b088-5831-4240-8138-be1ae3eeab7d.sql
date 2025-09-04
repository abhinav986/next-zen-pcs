-- Create test_series table for storing test information
CREATE TABLE public.test_series (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject_id TEXT, -- references subject from upscSubjects
  duration INTEGER NOT NULL, -- in minutes
  total_questions INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'Medium',
  test_type TEXT NOT NULL DEFAULT 'general', -- 'general', 'chapter', 'full'
  chapter_name TEXT, -- for chapter-specific tests
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create test_questions table for storing questions
CREATE TABLE public.test_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_series_id UUID REFERENCES public.test_series(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- array of options
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty TEXT DEFAULT 'Medium',
  topic TEXT,
  question_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.test_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for test_series (public read, admin write)
CREATE POLICY "Test series are viewable by everyone" 
ON public.test_series 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage test series" 
ON public.test_series 
FOR ALL 
USING (auth.uid() IS NOT NULL); -- For now, any authenticated user can manage

-- Create policies for test_questions (public read, admin write)
CREATE POLICY "Test questions are viewable by everyone" 
ON public.test_questions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.test_series 
  WHERE id = test_questions.test_series_id 
  AND is_active = true
));

CREATE POLICY "Admins can manage test questions" 
ON public.test_questions 
FOR ALL 
USING (auth.uid() IS NOT NULL); -- For now, any authenticated user can manage

-- Create function to update timestamps
CREATE TRIGGER update_test_series_updated_at
BEFORE UPDATE ON public.test_series
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_test_series_subject ON public.test_series(subject_id);
CREATE INDEX idx_test_series_type ON public.test_series(test_type);
CREATE INDEX idx_test_questions_series ON public.test_questions(test_series_id);
CREATE INDEX idx_test_questions_order ON public.test_questions(test_series_id, question_order);