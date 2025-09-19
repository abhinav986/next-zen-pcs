import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Phone, MessageCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WhatsappPreferences {
  id?: string;
  phone_number: string;
  is_enabled: boolean;
  weak_section_updates: boolean;
  current_affairs_updates: boolean;
  test_notifications: boolean;
}

export const WhatsappSettings = () => {
  const [preferences, setPreferences] = useState<WhatsappPreferences>({
    phone_number: "",
    is_enabled: true,
    weak_section_updates: true,
    current_affairs_updates: true,
    test_notifications: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('whatsapp_preferences')
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
      console.error('Error fetching WhatsApp preferences:', error);
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

      // Validate phone number format
      if (!preferences.phone_number || !/^\+\d{10,15}$/.test(preferences.phone_number)) {
        toast({
          title: "Invalid Phone Number",
          description: "Please enter a valid phone number with country code (e.g., +1234567890)",
          variant: "destructive",
        });
        return;
      }

      const preferencesData = {
        user_id: user.id,
        phone_number: preferences.phone_number,
        is_enabled: preferences.is_enabled,
        weak_section_updates: preferences.weak_section_updates,
        current_affairs_updates: preferences.current_affairs_updates,
        test_notifications: preferences.test_notifications,
      };

      const { error } = await supabase
        .from('whatsapp_preferences')
        .upsert(preferencesData, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Success",
        description: "WhatsApp preferences saved successfully!",
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

  const testWhatsappConnection = async () => {
    try {
      setSaving(true);
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          phone_number: preferences.phone_number,
          message: "🎯 Test message from UPSC Prep Academy! Your WhatsApp notifications are working correctly.",
          type: "test"
        }
      });

      if (error) throw error;

      toast({
        title: "Test Message Sent!",
        description: "Check your WhatsApp for the test message.",
      });
    } catch (error) {
      console.error('Error sending test message:', error);
      toast({
        title: "Test Failed",
        description: "Could not send test message. Please check your phone number and try again.",
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
            <MessageCircle className="h-5 w-5 text-green-600" />
            WhatsApp Notifications
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
          <MessageCircle className="h-5 w-5 text-green-600" />
          WhatsApp Notifications
        </CardTitle>
        <CardDescription>
          Get notified on WhatsApp about weak sections, test recommendations, and current affairs updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Phone Number Input */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            WhatsApp Phone Number
          </Label>
          <Input
            id="phone"
            placeholder="+1234567890"
            value={preferences.phone_number}
            onChange={(e) => setPreferences(prev => ({ ...prev, phone_number: e.target.value }))}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Include country code (e.g., +91 for India, +1 for US)
          </p>
        </div>

        {/* Main Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <div className="font-medium">Enable WhatsApp Notifications</div>
            <div className="text-sm text-muted-foreground">
              Turn on/off all WhatsApp notifications
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

        {/* Warning about WhatsApp Business API */}
        <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> WhatsApp notifications require WhatsApp Business API setup. 
            Messages will be sent from our official business number.
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
          
          {preferences.phone_number && preferences.is_enabled && (
            <Button 
              variant="outline" 
              onClick={testWhatsappConnection}
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