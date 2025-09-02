-- Create table for polity test questions
CREATE TABLE public.polity_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('mcq', 'true_false')),
  options JSONB, -- For MCQ options, null for true/false
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  topic VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for test attempts
CREATE TABLE public.test_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  test_name VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  answers JSONB NOT NULL, -- Store user answers
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  time_taken INTEGER -- in seconds
);

-- Enable RLS
ALTER TABLE public.polity_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

-- Policies for questions (readable by everyone)
CREATE POLICY "Questions are viewable by everyone" 
ON public.polity_questions 
FOR SELECT 
USING (true);

-- Policies for test attempts (user-specific)
CREATE POLICY "Users can view their own test attempts" 
ON public.test_attempts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own test attempts" 
ON public.test_attempts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Insert sample polity questions
INSERT INTO public.polity_questions (question_text, question_type, options, correct_answer, explanation, difficulty, topic) VALUES
-- MCQ Questions
('Which article of the Indian Constitution deals with the Right to Equality?', 'mcq', '["Article 14", "Article 15", "Article 16", "All of the above"]', 'All of the above', 'Articles 14, 15, and 16 collectively deal with the Right to Equality.', 'medium', 'Fundamental Rights'),
('The President of India is elected by:', 'mcq', '["Direct election by people", "Electoral College", "Parliament", "Supreme Court"]', 'Electoral College', 'The President is elected by an Electoral College consisting of elected members of both Houses of Parliament and Legislative Assemblies.', 'medium', 'Executive'),
('Which schedule of the Constitution deals with languages?', 'mcq', '["7th Schedule", "8th Schedule", "9th Schedule", "10th Schedule"]', '8th Schedule', 'The 8th Schedule contains the list of 22 official languages of India.', 'hard', 'Constitutional Provisions'),
('The concept of Judicial Review in India is borrowed from:', 'mcq', '["USA", "UK", "Canada", "Australia"]', 'USA', 'Judicial Review is borrowed from the American Constitution.', 'medium', 'Constitutional Provisions'),
('Which article provides for the establishment of Finance Commission?', 'mcq', '["Article 270", "Article 275", "Article 280", "Article 285"]', 'Article 280', 'Article 280 provides for the establishment of Finance Commission every five years.', 'hard', 'Finance Commission'),

-- True/False Questions
('The Vice President of India is the ex-officio Chairman of the Rajya Sabha.', 'true_false', null, 'true', 'As per Article 64, the Vice President is the ex-officio Chairman of the Rajya Sabha.', 'easy', 'Executive'),
('Money Bills can be introduced in either House of Parliament.', 'true_false', null, 'false', 'Money Bills can only be introduced in the Lok Sabha as per Article 110.', 'medium', 'Parliament'),
('The Supreme Court of India has original, appellate, and advisory jurisdiction.', 'true_false', null, 'true', 'The Supreme Court has all three types of jurisdiction as mentioned.', 'easy', 'Judiciary'),
('The President can dissolve the Lok Sabha but not the Rajya Sabha.', 'true_false', null, 'true', 'The Rajya Sabha is a permanent body and cannot be dissolved, while the Lok Sabha can be dissolved.', 'medium', 'Executive'),
('Fundamental Duties were added to the Constitution by the 42nd Amendment.', 'true_false', null, 'true', 'The 42nd Amendment in 1976 added Fundamental Duties to the Constitution.', 'medium', 'Fundamental Duties');