-- Create table for WhatsApp notification preferences
CREATE TABLE public.whatsapp_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  weak_section_updates BOOLEAN NOT NULL DEFAULT true,
  current_affairs_updates BOOLEAN NOT NULL DEFAULT true,
  test_notifications BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.whatsapp_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for WhatsApp preferences
CREATE POLICY "Users can view their own WhatsApp preferences" 
ON public.whatsapp_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own WhatsApp preferences" 
ON public.whatsapp_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp preferences" 
ON public.whatsapp_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WhatsApp preferences" 
ON public.whatsapp_preferences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_whatsapp_preferences_updated_at
BEFORE UPDATE ON public.whatsapp_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();