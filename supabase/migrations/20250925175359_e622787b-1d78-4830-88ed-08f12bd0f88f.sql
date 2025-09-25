-- Add foreign key constraint between chat_messages and profiles
ALTER TABLE public.chat_messages 
ADD CONSTRAINT fk_chat_messages_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;