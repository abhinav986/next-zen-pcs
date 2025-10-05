import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";

export function TestQuestionsManager() {
  const [jsonInput, setJsonInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [testSeries, setTestSeries] = useState<any[]>([]);
  const [selectedTestSeriesId, setSelectedTestSeriesId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchTestSeries();
  }, []);

  const fetchTestSeries = async () => {
    const { data, error } = await supabase
      .from("test_series")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching test series:", error);
      return;
    }

    setTestSeries(data || []);
  };

  const handleUpload = async () => {
    if (!jsonInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter JSON data",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTestSeriesId) {
      toast({
        title: "Error",
        description: "Please select a test series",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const parsedData = JSON.parse(jsonInput);
      
      // Ensure it's an array
      const questions = Array.isArray(parsedData) ? parsedData : [parsedData];
      
      // Insert each question
      for (const question of questions) {
        const { error } = await supabase
          .from('test_questions')
          .insert([{
            test_series_id: selectedTestSeriesId,
            question_text: question.question_text,
            question_type: question.question_type || 'multiple_choice',
            options: question.question_type === 'true_false' 
              ? ["True", "False"] 
              : (question.options || ["", "", "", ""]),
            correct_answer: question.correct_answer,
            explanation: question.explanation,
            difficulty: question.difficulty || 'Medium',
            topic: question.topic,
            question_order: question.question_order || 1,
          }])
          .select()
          .single();

        if (error) {
          throw error;
        }
      }

      // Update question count in test series
      const { data: existingQuestions } = await supabase
        .from('test_questions')
        .select('id', { count: 'exact' })
        .eq('test_series_id', selectedTestSeriesId);

      await supabase
        .from('test_series')
        .update({ total_questions: existingQuestions?.length || 0 })
        .eq('id', selectedTestSeriesId);

      toast({
        title: "Success",
        description: `Successfully added ${questions.length} question(s)`,
      });
      
      setJsonInput("");
    } catch (error: any) {
      console.error("Error uploading questions:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload questions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Test Questions (JSON Upload)</CardTitle>
        <CardDescription>
          Upload test questions in JSON format. Select a test series first, then paste your questions data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Select Test Series</label>
          <Select value={selectedTestSeriesId} onValueChange={setSelectedTestSeriesId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a test series" />
            </SelectTrigger>
            <SelectContent>
              {testSeries.map((series) => (
                <SelectItem key={series.id} value={series.id}>
                  {series.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Textarea
          placeholder='Paste JSON here... Example:
[
  {
    "question_text": "What is the capital of India?",
    "question_type": "multiple_choice",
    "options": ["Mumbai", "Delhi", "Kolkata", "Chennai"],
    "correct_answer": "Delhi",
    "explanation": "New Delhi is the capital of India.",
    "difficulty": "Medium",
    "topic": "Geography",
    "question_order": 1
  }
]'
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          className="min-h-[300px] font-mono text-sm"
        />
        <Button onClick={handleUpload} disabled={isLoading || !selectedTestSeriesId}>
          <Upload className="h-4 w-4 mr-2" />
          {isLoading ? "Uploading..." : "Upload Questions"}
        </Button>
      </CardContent>
    </Card>
  );
}
