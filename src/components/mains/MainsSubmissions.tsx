import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

const MainsSubmissions = () => {
  const { data: submissions, isLoading } = useQuery({
    queryKey: ["mains-submissions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("mains_submissions")
        .select(`
          *,
          test_series:test_series_id (
            title
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case "checked":
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Checked</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading submissions...</div>;
  }

  if (!submissions || submissions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No submissions yet. Upload your first answer sheet!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission: any) => (
        <Card key={submission.id} className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-lg">
                {submission.test_series?.title || "General Submission"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Submitted on {format(new Date(submission.submitted_at), "PPP")}
              </p>
            </div>
            {getStatusBadge(submission.status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Your Answer Sheet</p>
              <Button variant="outline" size="sm" asChild>
                <a href={submission.original_pdf_url} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              </Button>
            </div>

            {submission.checked_pdf_url && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Checked Paper</p>
                <Button variant="outline" size="sm" asChild>
                  <a href={submission.checked_pdf_url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Download Checked Paper
                  </a>
                </Button>
              </div>
            )}
          </div>

          {submission.score !== null && (
            <div className="bg-primary/10 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Score:</span>
                <span className="text-2xl font-bold text-primary">
                  {submission.score} / {submission.max_score}
                </span>
              </div>
              {submission.feedback && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm font-medium mb-1">Feedback:</p>
                  <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                </div>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default MainsSubmissions;
