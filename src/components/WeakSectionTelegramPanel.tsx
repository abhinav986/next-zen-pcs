import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send } from "lucide-react";

export const WeakSectionTelegramPanel = () => {
  const [chatId, setChatId] = useState("");
  const [customMessage, setCustomMessage] = useState(
    "📊 Weak Section Analysis Report\n\nHello! Here are your areas that need improvement:"
  );
  const [studyMaterialUrl, setStudyMaterialUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [userCount, setUserCount] = useState<number | null>(null);

  const fetchUserCount = async () => {
    try {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      setUserCount(count || 0);
      toast.success(`Found ${count} users in the system`);
    } catch (error) {
      console.error("Error fetching user count:", error);
      toast.error("Failed to fetch user count");
    }
  };

  const sendWeakSectionReports = async () => {
    if (!chatId.trim()) {
      toast.error("Please enter a Telegram Chat ID");
      return;
    }

    if (!studyMaterialUrl.trim()) {
      toast.error("Please provide a study material URL");
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Fetch all users
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("user_id, display_name, email");

      if (usersError) throw usersError;

      if (!users || users.length === 0) {
        toast.error("No users found");
        setLoading(false);
        return;
      }

      // Process each user
      for (const user of users) {
        try {
          // Fetch weak sections for this user
          const { data: weakSections, error: weakError } = await supabase
            .from("weak_sections")
            .select("*")
            .eq("user_id", user.user_id)
            .eq("is_weak", true)
            .order("accuracy_percentage", { ascending: true })
            .limit(3);

          if (weakError) {
            console.error(`Error fetching weak sections for user ${user.user_id}:`, weakError);
            errorCount++;
            continue;
          }

          if (!weakSections || weakSections.length === 0) {
            console.log(`No weak sections found for user ${user.user_id}`);
            continue;
          }

          // Build personalized message
          let message = `${customMessage}\n\n`;
          message += `<b>Dear ${user.display_name || "Student"},</b>\n\n`;
          message += `Based on your recent test performance, here are your top weak areas:\n\n`;

          weakSections.forEach((section, index) => {
            message += `${index + 1}. <b>${section.section_name}</b> - ${section.sub_section_name}\n`;
            message += `   📉 Accuracy: ${section.accuracy_percentage.toFixed(1)}%\n`;
            if (section.recommendation) {
              message += `   💡 Tip: ${section.recommendation}\n`;
            }
            message += `\n`;
          });

          message += `\n📚 <b>Study Materials:</b>\n${studyMaterialUrl}\n\n`;
          message += `Keep practicing and you'll improve! 💪`;

          // Send Telegram message
          const { error: sendError } = await supabase.functions.invoke("send-telegram", {
            body: {
              chatId: chatId,
              message: message,
            },
          });

          if (sendError) {
            console.error(`Error sending Telegram to user ${user.user_id}:`, sendError);
            errorCount++;
          } else {
            successCount++;
          }

          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error processing user ${user.user_id}:`, error);
          errorCount++;
        }
      }

      toast.success(
        `Telegram reports sent! Success: ${successCount}, Errors: ${errorCount}`
      );

      // Reset form
      setChatId("");
      setCustomMessage("📊 Weak Section Analysis Report\n\nHello! Here are your areas that need improvement:");
      setStudyMaterialUrl("");
    } catch (error) {
      console.error("Error sending weak section reports:", error);
      toast.error("Failed to send reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send Weak Section Telegram Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="chatId">Telegram Chat ID</Label>
          <Input
            id="chatId"
            placeholder="Enter Telegram Chat ID (e.g., 123456789)"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Get your chat ID by messaging @userinfobot on Telegram
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="studyMaterialUrl">Study Material URL</Label>
          <Input
            id="studyMaterialUrl"
            type="url"
            placeholder="https://your-study-materials.com/link"
            value={studyMaterialUrl}
            onChange={(e) => setStudyMaterialUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customMessage">Custom Message (Optional)</Label>
          <Textarea
            id="customMessage"
            placeholder="Add a custom message for students..."
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={4}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={fetchUserCount}
            variant="outline"
            disabled={loading}
          >
            Check Recipients
          </Button>
          {userCount !== null && (
            <p className="flex items-center text-sm text-muted-foreground">
              {userCount} users found
            </p>
          )}
        </div>

        <Button
          onClick={sendWeakSectionReports}
          disabled={loading || !chatId || !studyMaterialUrl}
          className="w-full"
        >
          {loading ? "Sending..." : "Send Telegram Reports"}
        </Button>

        <p className="text-sm text-muted-foreground">
          This will send personalized weak section analysis to all users via
          Telegram.
        </p>
      </CardContent>
    </Card>
  );
};
