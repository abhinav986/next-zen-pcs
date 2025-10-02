-- Create a trigger to send email notifications when a comment is added to a chat message
CREATE OR REPLACE FUNCTION notify_comment_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payload json;
BEGIN
  -- Create payload with comment details
  payload := json_build_object(
    'message_id', NEW.message_id,
    'user_id', NEW.user_id,
    'content', NEW.content,
    'comment_id', NEW.id
  );

  -- Call the edge function via pg_net
  PERFORM net.http_post(
    url := 'https://pxilycwmsbejejzbeedd.supabase.co/functions/v1/notify-comment',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('record', payload)
  );

  RETURN NEW;
END;
$$;

-- Create trigger on chat_comments table
DROP TRIGGER IF EXISTS on_comment_created ON chat_comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON chat_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_owner();