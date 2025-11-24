import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

interface MainsSubmissionFormProps {
  onSuccess: () => void;
}

const MainsSubmissionForm = ({ onSuccess }: MainsSubmissionFormProps) => {
  const [selectedTestSeries, setSelectedTestSeries] = useState<string>("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: testSeries } = useQuery({
    queryKey: ["mains-test-series"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_series")
        .select("*")
        .eq("test_type", "mains")
        .eq("is_active", true);
      
      if (error) throw error;
      return data;
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      toast.error("Please select a PDF file");
    }
  };

  const handleSubmit = async () => {
    if (!pdfFile) {
      toast.error("Please select a PDF file");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileName = `${user.id}/${Date.now()}_${pdfFile.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("mains-submissions")
        .upload(fileName, pdfFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("mains-submissions")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("mains_submissions")
        .insert({
          user_id: user.id,
          test_series_id: selectedTestSeries || null,
          original_pdf_url: publicUrl,
          status: "pending",
        });

      if (insertError) throw insertError;

      toast.success("Answer sheet uploaded successfully!");
      setPdfFile(null);
      setSelectedTestSeries("");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload answer sheet");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="test-series">Select Test Series (Optional)</Label>
        <Select value={selectedTestSeries} onValueChange={setSelectedTestSeries}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a test series or skip" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Test Series</SelectItem>
            {testSeries?.map((test) => (
              <SelectItem key={test.id} value={test.id}>
                {test.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pdf-upload">Upload Answer Sheet (PDF)</Label>
        <Input
          id="pdf-upload"
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          disabled={uploading}
        />
        {pdfFile && (
          <p className="text-sm text-muted-foreground">Selected: {pdfFile.name}</p>
        )}
      </div>

      <Button 
        onClick={handleSubmit} 
        disabled={!pdfFile || uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Submit Answer Sheet
          </>
        )}
      </Button>
    </div>
  );
};

export default MainsSubmissionForm;
