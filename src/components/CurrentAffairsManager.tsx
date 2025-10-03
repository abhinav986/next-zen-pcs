import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";

export function CurrentAffairsManager() {
  const [jsonInput, setJsonInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async () => {
    if (!jsonInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter JSON data",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const parsedData = JSON.parse(jsonInput);
      
      // Ensure it's an array
      const articles = Array.isArray(parsedData) ? parsedData : [parsedData];
      
      // Upsert each article (insert or update if article_id exists)
      for (const article of articles) {
        const { error } = await supabase
          .from('current_affairs')
          .upsert({
            article_id: article.id,
            title: article.title,
            image: article.image,
            url: article.url,
            summary: article.summary,
            details: article.details,
          }, {
            onConflict: 'article_id'
          });

        if (error) {
          throw error;
        }
      }

      toast({
        title: "Success",
        description: `Successfully added/updated ${articles.length} article(s)`,
      });
      
      setJsonInput("");
    } catch (error: any) {
      console.error("Error uploading current affairs:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload current affairs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Current Affairs</CardTitle>
        <CardDescription>
          Upload current affairs articles in JSON format. The structure should match the existing format with id, title, image, url, summary, and details fields.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder='Paste JSON here... Example:
[
  {
    "id": "article-id",
    "title": "Article Title",
    "image": "/path/to/image.jpg",
    "url": "/current-affairs/article-id",
    "summary": "Brief summary...",
    "details": { ... }
  }
]'
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          className="min-h-[300px] font-mono text-sm"
        />
        <Button onClick={handleUpload} disabled={isLoading}>
          <Upload className="h-4 w-4 mr-2" />
          {isLoading ? "Uploading..." : "Upload Current Affairs"}
        </Button>
      </CardContent>
    </Card>
  );
}
