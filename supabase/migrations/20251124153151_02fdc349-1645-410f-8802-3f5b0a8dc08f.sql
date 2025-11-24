-- Create mains_submissions table
CREATE TABLE public.mains_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  test_series_id UUID REFERENCES public.test_series(id),
  original_pdf_url TEXT NOT NULL,
  checked_pdf_url TEXT,
  score NUMERIC,
  max_score NUMERIC DEFAULT 250,
  feedback TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mains_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view their own submissions"
ON public.mains_submissions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own submissions
CREATE POLICY "Users can create their own submissions"
ON public.mains_submissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
ON public.mains_submissions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Admins can update submissions
CREATE POLICY "Admins can update submissions"
ON public.mains_submissions
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_mains_submissions_updated_at
BEFORE UPDATE ON public.mains_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets for mains submissions
INSERT INTO storage.buckets (id, name, public) 
VALUES ('mains-submissions', 'mains-submissions', false);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('mains-checked', 'mains-checked', false);

-- Storage policies for mains-submissions bucket
CREATE POLICY "Users can upload their own submissions"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'mains-submissions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own submission files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'mains-submissions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for mains-checked bucket
CREATE POLICY "Admins can upload checked papers"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'mains-checked' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view their checked papers"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'mains-checked'
);

CREATE POLICY "Admins can update checked papers"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'mains-checked' AND
  auth.uid() IS NOT NULL
);