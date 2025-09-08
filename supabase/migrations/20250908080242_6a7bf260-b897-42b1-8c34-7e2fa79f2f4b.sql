-- Add foreign key relationship between chat_messages and auth.users
ALTER TABLE public.chat_messages 
ADD CONSTRAINT chat_messages_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;