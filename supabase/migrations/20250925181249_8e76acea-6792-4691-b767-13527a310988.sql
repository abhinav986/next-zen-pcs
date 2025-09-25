-- Add support for message editing
ALTER TABLE public.chat_messages 
ADD COLUMN is_edited BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;

-- Create trigger to set edited_at when is_edited changes to true
CREATE OR REPLACE FUNCTION public.set_edited_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_edited = true AND OLD.is_edited = false THEN
    NEW.edited_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_message_edited_timestamp
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.set_edited_timestamp();