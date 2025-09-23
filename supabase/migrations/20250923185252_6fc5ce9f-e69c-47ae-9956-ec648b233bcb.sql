-- Rename whatsapp_preferences table to email_preferences and remove phone_number
ALTER TABLE public.whatsapp_preferences RENAME TO email_preferences;

-- Remove phone_number column as we'll use the user's signed-in email
ALTER TABLE public.email_preferences DROP COLUMN phone_number;

-- Update RLS policy names and descriptions
DROP POLICY "Users can create their own WhatsApp preferences" ON public.email_preferences;
DROP POLICY "Users can delete their own WhatsApp preferences" ON public.email_preferences;
DROP POLICY "Users can update their own WhatsApp preferences" ON public.email_preferences;
DROP POLICY "Users can view their own WhatsApp preferences" ON public.email_preferences;

-- Create new RLS policies for email preferences
CREATE POLICY "Users can create their own email preferences" 
ON public.email_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email preferences" 
ON public.email_preferences 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own email preferences" 
ON public.email_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own email preferences" 
ON public.email_preferences 
FOR SELECT 
USING (auth.uid() = user_id);