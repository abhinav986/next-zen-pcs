-- Create likes table for chat messages
CREATE TABLE public.chat_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL DEFAULT '👍',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, message_id, emoji)
);

-- Create comments table for chat messages
CREATE TABLE public.chat_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for chat_likes
ALTER TABLE public.chat_likes ENABLE ROW LEVEL SECURITY;

-- Enable RLS for chat_comments
ALTER TABLE public.chat_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_likes
CREATE POLICY "Users can view all likes" 
ON public.chat_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own likes" 
ON public.chat_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON public.chat_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for chat_comments
CREATE POLICY "Users can view all comments" 
ON public.chat_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own comments" 
ON public.chat_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.chat_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.chat_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add foreign key constraints
ALTER TABLE public.chat_likes 
ADD CONSTRAINT fk_chat_likes_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.chat_comments 
ADD CONSTRAINT fk_chat_comments_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Create trigger for updating updated_at in comments
CREATE TRIGGER update_chat_comments_updated_at
BEFORE UPDATE ON public.chat_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();