-- Drop the trigger and function that's causing the "schema net does not exist" error
-- The pg_net extension is not available, so this notification system can't work
DROP TRIGGER IF EXISTS on_comment_created ON public.chat_comments CASCADE;
DROP FUNCTION IF EXISTS public.notify_comment_owner() CASCADE;