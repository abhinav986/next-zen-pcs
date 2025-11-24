import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Upload, CheckCircle, Clock, Download } from "lucide-react";
import { format } from "date-fns";

const MainsCheckingPanel = () => {
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [checkedPdf, setCheckedPdf] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["all-mains-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mains_submissions")
        .select(`
          *,
          test_series:test_series_id (
            title
          ),
          profiles!mains_submissions_user_id_fkey (
            display_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateSubmission = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from("mains_submissions")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-mains-submissions"] });
      toast.success("Submission updated successfully!");
      setSelectedSubmission(null);
      setScore("");
      setFeedback("");
      setCheckedPdf(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update submission");
    },
  });

  const handleSubmitChecking = async () => {
    if (!selectedSubmission) return;

    setUploading(true);
    try {
      let checkedPdfUrl = selectedSubmission.checked_pdf_url;

      if (checkedPdf) {
        const fileName = `checked/${selectedSubmission.user_id}/${Date.now()}_${checkedPdf.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from("mains-checked")
          .upload(fileName, checkedPdf);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("mains-checked")
          .getPublicUrl(fileName);

        checkedPdfUrl = publicUrl;
      }

      updateSubmission.mutate({
        id: selectedSubmission.id,
        updates: {
          checked_pdf_url: checkedPdfUrl,
          score: score ? parseFloat(score) : null,
          feedback: feedback || null,
          status: "checked",
        },
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to upload checked PDF");
    } finally {
      setUploading(false);
    }
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Mains Answer Sheets - Checking Panel</h2>
        <p className="text-muted-foreground">Review and grade student submissions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submissions List */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Submissions</h3>
          {!submissions || submissions.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No submissions yet</p>
            </Card>
          ) : (
            submissions.map((submission: any) => (
              <Card
                key={submission.id}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedSubmission?.id === submission.id ? "border-primary" : ""
                }`}
                onClick={() => setSelectedSubmission(submission)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{submission.profiles?.display_name || "Unknown User"}</p>
                    <p className="text-sm text-muted-foreground">{submission.profiles?.email}</p>
                  </div>
                  {getStatusBadge(submission.status)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {submission.test_series?.title || "General Submission"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(submission.submitted_at), "PPP")}
                </p>
              </Card>
            ))
          )}
        </div>

        {/* Checking Form */}
        <div className="space-y-4">
          {selectedSubmission ? (
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Check Submission</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Student Answer Sheet</Label>
                  <Button variant="outline" size="sm" className="mt-2 w-full" asChild>
                    <a href={selectedSubmission.original_pdf_url} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      View Original PDF
                    </a>
                  </Button>
                </div>

                <div>
                  <Label htmlFor="score">Score (out of {selectedSubmission.max_score})</Label>
                  <Input
                    id="score"
                    type="number"
                    placeholder="Enter score"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    max={selectedSubmission.max_score}
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="feedback">Feedback</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Provide feedback to the student..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="checked-pdf">Upload Checked PDF</Label>
                  <Input
                    id="checked-pdf"
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setCheckedPdf(e.target.files?.[0] || null)}
                    className="mt-2"
                  />
                  {checkedPdf && (
                    <p className="text-sm text-muted-foreground mt-1">Selected: {checkedPdf.name}</p>
                  )}
                </div>

                <Button
                  onClick={handleSubmitChecking}
                  disabled={uploading || (!score && !feedback && !checkedPdf)}
                  className="w-full"
                >
                  {uploading ? "Uploading..." : "Submit Evaluation"}
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Select a submission to check</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainsCheckingPanel;
