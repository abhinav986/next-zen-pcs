import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Loader2 } from 'lucide-react';

export const DailyQuizNotifier = () => {
  const [title, setTitle] = useState('Daily UPSC Quiz Challenge 📚');
  const [message, setMessage] = useState('New quiz available! Test your knowledge and track your progress.');
  const [url, setUrl] = useState('/test-series');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title and message are required.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title: title.trim(),
          body: message.trim(),
          url: url.trim() || '/',
          tag: 'daily-quiz',
        },
      });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: `Sent to ${data.sent} users successfully.`,
      });

      // Reset form
      setTitle('Daily UPSC Quiz Challenge 📚');
      setMessage('New quiz available! Test your knowledge and track your progress.');
      setUrl('/test-series');
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to send notifications. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Send Daily Quiz Notification
        </CardTitle>
        <CardDescription>
          Send push notifications to all subscribed users about daily UPSC quizzes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Notification Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter notification title..."
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter notification message..."
            rows={4}
            maxLength={200}
          />
          <p className="text-sm text-muted-foreground">
            {message.length}/200 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">Redirect URL (optional)</Label>
          <Input
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/test-series"
          />
          <p className="text-sm text-muted-foreground">
            Where users will be redirected when they click the notification
          </p>
        </div>

        <Button
          onClick={sendNotification}
          disabled={isLoading || !title.trim() || !message.trim()}
          className="w-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Sending...' : 'Send Notification to All Users'}
        </Button>

        <p className="text-sm text-muted-foreground">
          💡 Tip: Keep messages concise and engaging. Best time to send is early morning (6-8 AM) or evening (6-8 PM).
        </p>
      </CardContent>
    </Card>
  );
};
