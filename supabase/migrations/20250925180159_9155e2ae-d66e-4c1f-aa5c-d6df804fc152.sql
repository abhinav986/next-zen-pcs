-- Create likes table for chat comments
CREATE TABLE public.chat_comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  comment_id UUID NOT NULL REFERENCES public.chat_comments(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL DEFAULT '👍',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, comment_id, emoji)
);

-- Enable RLS for chat_comment_likes
ALTER TABLE public.chat_comment_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_comment_likes
CREATE POLICY "Users can view all comment likes" 
ON public.chat_comment_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own comment likes" 
ON public.chat_comment_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment likes" 
ON public.chat_comment_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add foreign key constraint
ALTER TABLE public.chat_comment_likes 
ADD CONSTRAINT fk_chat_comment_likes_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;