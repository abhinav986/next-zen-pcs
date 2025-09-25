-- Create a trigger to automatically create email preferences for new users
CREATE OR REPLACE FUNCTION public.create_default_email_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.email_preferences (user_id, is_enabled, weak_section_updates, current_affairs_updates, test_notifications)
  VALUES (NEW.user_id, true, true, true, true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger that fires when a new profile is created
CREATE TRIGGER create_email_preferences_on_profile_creation
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_default_email_preferences();