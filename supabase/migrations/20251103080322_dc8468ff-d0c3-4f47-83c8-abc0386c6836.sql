-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_new_user_notify_admin ON public.profiles;
DROP FUNCTION IF EXISTS public.notify_admin_new_user();

-- Recreate the function to use supabase extension instead of net
CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_users_count INTEGER;
  user_email TEXT;
  user_name TEXT;
  payload jsonb;
BEGIN
  -- Get total user count
  SELECT COUNT(*) INTO total_users_count FROM public.profiles;
  
  -- Get user details
  user_email := NEW.email;
  user_name := COALESCE(NEW.display_name, 'Unknown User');
  
  -- Prepare payload
  payload := jsonb_build_object(
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
  );
  
  -- Send email notification via edge function using supabase_functions
  PERFORM supabase_functions.http_request(
    'https://pxilycwmsbejejzbeedd.supabase.co/functions/v1/send-email',
    'POST',
    jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4aWx5Y3dtc2JlamVqemJlZWRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NDAzNjgsImV4cCI6MjA3MjExNjM2OH0.peUbF6gszfjraPsepLUlHARrld9F8PP63HUsarjGpvg',
      'Content-Type', 'application/json'
    ),
    payload::text
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to send admin notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_new_user_notify_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_user();