-- Add telegram_chat_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN telegram_chat_id text;

-- Add index for faster lookups
CREATE INDEX idx_profiles_telegram_chat_id ON public.profiles(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;

COMMENT ON COLUMN public.profiles.telegram_chat_id IS 'Telegram chat ID for sending bot messages to users';