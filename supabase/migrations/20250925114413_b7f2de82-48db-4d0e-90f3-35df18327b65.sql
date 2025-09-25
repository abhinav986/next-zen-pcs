-- Add foreign key constraint between email_preferences and profiles
ALTER TABLE public.email_preferences 
ADD CONSTRAINT fk_email_preferences_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;