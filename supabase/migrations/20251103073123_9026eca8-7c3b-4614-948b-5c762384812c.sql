-- Create function to notify admin of new user registration
CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_users_count INTEGER;
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Get total user count
  SELECT COUNT(*) INTO total_users_count FROM public.profiles;
  
  -- Get user details
  user_email := NEW.email;
  user_name := COALESCE(NEW.display_name, 'Unknown User');
  
  -- Send email notification via edge function
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'email', 'abhinav.jha986@gmail.com',
      'subject', '🎉 New User Registration - UPSC Prep Academy',
      'message', format(
        E'New User Registration Alert\n\n' ||
        E'👤 User Details:\n' ||
        E'Name: %s\n' ||
        E'Email: %s\n\n' ||
        E'📊 Total Users: %s\n\n' ||
        E'🎯 UPSC Prep Academy Admin',
        user_name,
        COALESCE(user_email, 'Not provided'),
        total_users_count
      ),
      'type', 'test'
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to send admin notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger for new user notifications
DROP TRIGGER IF EXISTS on_new_user_notify_admin ON public.profiles;
CREATE TRIGGER on_new_user_notify_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_user();