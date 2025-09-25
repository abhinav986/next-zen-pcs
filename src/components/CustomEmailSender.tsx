import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const CustomEmailSender = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [userCount, setUserCount] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchUserCount = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from('email_preferences')
        .select('user_id', { count: 'exact' })
        .eq('is_enabled', true);

      if (error) throw error;
      setUserCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching user count:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user count",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const sendCustomEmail = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both subject and message",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get all users with email notifications enabled
      const { data: preferences, error: prefsError } = await supabase
        .from('email_preferences')
        .select(`
          user_id,
          profiles!inner(email)
        `)
        .eq('is_enabled', true);

      if (prefsError) throw prefsError;

      if (!preferences || preferences.length === 0) {
        toast({
          title: "No Recipients",
          description: "No users found with email notifications enabled",
          variant: "destructive",
        });
        return;
      }

      // Send emails to all users
      let successCount = 0;
      let errorCount = 0;

      for (const pref of preferences) {
        try {
          const { error } = await supabase.functions.invoke('send-email', {
            body: {
              email: (pref as any).profiles.email,
              subject: subject,
              message: message,
              type: 'custom_notification'
            }
          });

          if (error) {
            console.error('Email send error:', error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error('Email send error:', err);
          errorCount++;
        }
      }

      toast({
        title: "Email Campaign Complete",
        description: `Successfully sent: ${successCount}, Failed: ${errorCount}`,
        variant: successCount > 0 ? "default" : "destructive",
      });

      // Clear form on success
      if (successCount > 0) {
        setSubject('');
        setMessage('');
      }

    } catch (error) {
      console.error('Error sending custom emails:', error);
      toast({
        title: "Error",
        description: "Failed to send custom emails",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'color', 'background', 'link'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Custom Email to All Users</CardTitle>
        <CardDescription>
          Send a custom email notification to all users with email notifications enabled
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={fetchUserCount}
            disabled={isFetching}
          >
            {isFetching ? 'Checking...' : 'Check Active Recipients'}
          </Button>
          {userCount !== null && (
            <span className="text-sm text-muted-foreground">
              {userCount} users will receive this email
            </span>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Email Subject</Label>
          <Input
            id="subject"
            placeholder="Enter email subject..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Email Message</Label>
          <div className="border rounded-md">
            <ReactQuill
              theme="snow"
              value={message}
              onChange={setMessage}
              modules={modules}
              formats={formats}
              placeholder="Write your email message here..."
              style={{ minHeight: '200px' }}
            />
          </div>
        </div>

        <Button 
          onClick={sendCustomEmail} 
          disabled={isLoading || !subject.trim() || !message.trim()}
          className="w-full"
        >
          {isLoading ? 'Sending Emails...' : 'Send Email to All Users'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CustomEmailSender;