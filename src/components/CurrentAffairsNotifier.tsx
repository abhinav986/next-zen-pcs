import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Send, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendCurrentAffairsUpdate } from "@/utils/emailNotifications";

export const CurrentAffairsNotifier = () => {
  const [updates, setUpdates] = useState<string[]>([
    "India's GDP growth rate reaches 7.8% in Q3 FY2024",
    "Supreme Court ruling on Article 370 constitutional validity",
    "RBI announces new digital payment security guidelines",
    "PM Modi inaugurates new healthcare initiative covering rural areas",
    "India signs strategic partnership agreement with Japan on renewable energy"
  ]);
  const [newUpdate, setNewUpdate] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const addUpdate = () => {
    if (newUpdate.trim()) {
      setUpdates(prev => [newUpdate.trim(), ...prev.slice(0, 9)]); // Keep only 10 updates
      setNewUpdate("");
    }
  };

  const removeUpdate = (index: number) => {
    setUpdates(prev => prev.filter((_, i) => i !== index));
  };

  const sendToAllUsers = async () => {
    try {
      setSending(true);
      
      // Get all users with current affairs notifications enabled
      const { data: users, error } = await supabase
        .from('email_preferences')
        .select('user_id')
        .eq('is_enabled', true)
        .eq('current_affairs_updates', true);

      if (error) {
        throw error;
      }

      if (!users || users.length === 0) {
        toast({
          title: "No recipients",
          description: "No users have enabled current affairs WhatsApp notifications.",
          variant: "destructive",
        });
        return;
      }

      // Send notifications to all users
      const sendPromises = users.map(user => 
        sendCurrentAffairsUpdate(user.user_id, updates.slice(0, 5))
      );

      await Promise.all(sendPromises);

      toast({
        title: "Success!",
        description: `Current affairs update sent to ${users.length} users via WhatsApp.`,
      });

    } catch (error) {
      console.error('Error sending current affairs update:', error);
      toast({
        title: "Error",
        description: "Failed to send current affairs updates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-blue-600" />
          Current Affairs WhatsApp Notifications
        </CardTitle>
        <CardDescription>
          Manage and send daily current affairs updates to users via WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Update */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Add New Update</label>
          <div className="flex gap-2">
            <Textarea
              placeholder="Enter important current affairs update..."
              value={newUpdate}
              onChange={(e) => setNewUpdate(e.target.value)}
              className="flex-1"
              rows={2}
            />
            <Button onClick={addUpdate} disabled={!newUpdate.trim()}>
              Add
            </Button>
          </div>
        </div>

        {/* Current Updates List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Today's Updates ({updates.length})</h4>
            <Button 
              onClick={sendToAllUsers} 
              disabled={sending || updates.length === 0}
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              {sending ? "Sending..." : "Send to All Users"}
            </Button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {updates.map((update, index) => (
              <div key={index} className="flex items-start gap-2 p-3 border rounded-lg">
                <Badge variant="secondary" className="mt-1 text-xs">
                  {index + 1}
                </Badge>
                <div className="flex-1 text-sm">{update}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUpdate(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
          
          {updates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No current affairs updates added yet. Add some important news above.
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
          <strong>Note:</strong> Only the top 5 updates will be sent via WhatsApp to avoid message length limits. 
          Updates are sent to users who have enabled current affairs notifications in their WhatsApp preferences.
        </div>
      </CardContent>
    </Card>
  );
};