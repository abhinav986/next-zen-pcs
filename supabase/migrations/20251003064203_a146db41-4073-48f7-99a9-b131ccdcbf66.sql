-- Create current_affairs table
CREATE TABLE public.current_affairs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id text NOT NULL UNIQUE,
  title text NOT NULL,
  image text,
  url text NOT NULL,
  summary text NOT NULL,
  details jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.current_affairs ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Current affairs are viewable by everyone"
ON public.current_affairs
FOR SELECT
USING (true);

-- Create policy for authenticated users to insert
CREATE POLICY "Authenticated users can insert current affairs"
ON public.current_affairs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create policy for authenticated users to update
CREATE POLICY "Authenticated users can update current affairs"
ON public.current_affairs
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Create policy for authenticated users to delete
CREATE POLICY "Authenticated users can delete current affairs"
ON public.current_affairs
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_current_affairs_updated_at
BEFORE UPDATE ON public.current_affairs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on created_at for pagination
CREATE INDEX idx_current_affairs_created_at ON public.current_affairs(created_at DESC);