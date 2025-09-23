import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Mail, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmailPreferences {
  id?: string;
  is_enabled: boolean;
  weak_section_updates: boolean;
  current_affairs_updates: boolean;
  test_notifications: boolean;
}

export const EmailSettings = () => {
  const [preferences, setPreferences] = useState<EmailPreferences>({
    is_enabled: true,
    weak_section_updates: true,
    current_affairs_updates: true,
    test_notifications: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      setUserEmail(user.email || "");

      const { data, error } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching email preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Please log in to save preferences",
          variant: "destructive",
        });
        return;
      }

      const preferencesData = {
        user_id: user.id,
        is_enabled: preferences.is_enabled,
        weak_section_updates: preferences.weak_section_updates,
        current_affairs_updates: preferences.current_affairs_updates,
        test_notifications: preferences.test_notifications,
      };

      const { error } = await supabase
        .from('email_preferences')
        .upsert(preferencesData, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email preferences saved successfully!",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    try {
      setSaving(true);
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          email: userEmail,
          subject: "Test Email from UPSC Prep Academy",
          message: "🎯 Test email from UPSC Prep Academy! Your email notifications are working correctly.",
          type: "test"
        }
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent!",
        description: "Check your email for the test message.",
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "Test Failed",
        description: "Could not send test email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Get notified via email about weak sections, test recommendations, and current affairs updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Display */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="font-medium">Your Email</span>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <span className="text-sm font-mono">{userEmail || "Not available"}</span>
          </div>
        </div>

        {/* Main Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <div className="font-medium">Enable Email Notifications</div>
            <div className="text-sm text-muted-foreground">
              Turn on/off all email notifications
            </div>
          </div>
          <Switch
            checked={preferences.is_enabled}
            onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, is_enabled: checked }))}
          />
        </div>

        {/* Notification Types */}
        {preferences.is_enabled && (
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Notification Types</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Weak Section Analysis</div>
                  <div className="text-xs text-muted-foreground">
                    Get notifications about your weak sections and study recommendations
                  </div>
                </div>
                <Switch
                  checked={preferences.weak_section_updates}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, weak_section_updates: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Current Affairs Updates</div>
                  <div className="text-xs text-muted-foreground">
                    Daily current affairs and important news updates
                  </div>
                </div>
                <Switch
                  checked={preferences.current_affairs_updates}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, current_affairs_updates: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Test Notifications</div>
                  <div className="text-xs text-muted-foreground">
                    Reminders for practice tests and performance updates
                  </div>
                </div>
                <Switch
                  checked={preferences.test_notifications}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, test_notifications: checked }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Information Note */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> Email notifications will be sent to your registered email address. 
            Make sure to check your spam folder if you don't receive emails.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={savePreferences} 
            disabled={saving}
            className="flex-1"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
          
          {userEmail && preferences.is_enabled && (
            <Button 
              variant="outline" 
              onClick={sendTestEmail}
              disabled={saving}
            >
              Send Test
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};