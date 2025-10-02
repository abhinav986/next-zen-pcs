import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, Users } from "lucide-react";

const WeakSectionEmailPanel = () => {
  const [subject, setSubject] = useState("📊 Your Personalized Weak Section Report");
  const [studyMaterialUrl, setStudyMaterialUrl] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userCount, setUserCount] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchUserCount = async () => {
    try {
      const { data: users, error } = await supabase
        .from("email_preferences")
        .select("user_id", { count: "exact" })
        .eq("is_enabled", true)
        .eq("weak_section_updates", true);

      if (error) throw error;

      const count = users?.length || 0;
      setUserCount(count);
      toast({
        title: "Active Recipients",
        description: `${count} user(s) will receive this notification`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch user count",
        variant: "destructive",
      });
    }
  };

  const sendWeakSectionReports = async () => {
    if (!studyMaterialUrl.trim()) {
      toast({
        title: "Error",
        description: "Please provide a study material URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get all users with weak section updates enabled
      const { data: preferences, error: prefError } = await supabase
        .from("email_preferences")
        .select(`
          user_id,
          profiles!inner(email, display_name)
        `)
        .eq("is_enabled", true)
        .eq("weak_section_updates", true);

      if (prefError) throw prefError;

      if (!preferences || preferences.length === 0) {
        toast({
          title: "No Recipients",
          description: "No users have enabled weak section updates",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      // Send email to each user
      for (const pref of preferences) {
        try {
          // Fetch user's weak sections
          const { data: weakSections, error: weakError } = await supabase
            .from("weak_sections")
            .select("*")
            .eq("user_id", pref.user_id)
            .eq("is_weak", true)
            .order("accuracy_percentage", { ascending: true })
            .limit(3);

          if (weakError) {
            console.error("Error fetching weak sections:", weakError);
            errorCount++;
            continue;
          }

          const userEmail = pref.profiles?.email;
          const userName = pref.profiles?.display_name || "Student";

          if (!userEmail) {
            errorCount++;
            continue;
          }

          let message = `Hi ${userName},

📊 Your Personalized Weak Section Report

${customMessage ? customMessage + "\n\n" : ""}`;

          if (!weakSections || weakSections.length === 0) {
            message += `🎉 Great news! You currently don't have any weak sections. Keep up the excellent work!

📚 Continue practicing to maintain your strong performance.`;
          } else {
            message += `🔍 Areas needing attention:

`;
            weakSections.forEach((section, index) => {
              message += `${index + 1}. ${section.section_name} (${section.test_name})
   📉 Accuracy: ${Number(section.accuracy_percentage).toFixed(1)}%
   💡 ${section.recommendation || "Focus on this topic and practice more questions"}

`;
            });

            message += `📚 Recommended Study Material:
🔗 ${studyMaterialUrl}

Focus on these topics in your next study session!`;
          }

          message += `

🎯 UPSC Prep Academy
Keep pushing forward! 💪`;

          const { error: emailError } = await supabase.functions.invoke("send-email", {
            body: {
              email: userEmail,
              subject: subject,
              message: message,
              type: "weak_section",
            },
          });

          if (emailError) {
            console.error("Error sending email:", emailError);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error("Error processing user:", error);
          errorCount++;
        }
      }

      toast({
        title: "Emails Sent",
        description: `Successfully sent ${successCount} email(s). ${errorCount > 0 ? `Failed: ${errorCount}` : ""}`,
      });

      // Reset form
      setStudyMaterialUrl("");
      setCustomMessage("");
    } catch (error: any) {
      console.error("Error sending weak section reports:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send weak section reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send Weak Section Reports
        </CardTitle>
        <CardDescription>
          Send personalized weak section reports with study material recommendations to users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Email Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="studyUrl">Study Material URL *</Label>
          <Input
            id="studyUrl"
            value={studyMaterialUrl}
            onChange={(e) => setStudyMaterialUrl(e.target.value)}
            placeholder="https://example.com/study-material"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customMessage">Custom Message (Optional)</Label>
          <Textarea
            id="customMessage"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Add a custom message to include in all emails..."
            rows={4}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={fetchUserCount}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Check Recipients ({userCount !== null ? userCount : "?"})
          </Button>
          <Button
            onClick={sendWeakSectionReports}
            disabled={loading || !studyMaterialUrl.trim()}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Reports
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeakSectionEmailPanel;