import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw } from "lucide-react";
import { upscSubjects } from "@/data/upscSubjects";

export function TestQuestionsUpdater() {
  const [jsonInput, setJsonInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(false);
  const [testSeries, setTestSeries] = useState<any[]>([]);
  const [selectedTestSeriesId, setSelectedTestSeriesId] = useState<string>("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
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

  const fetchQuestions = async () => {
    if (!selectedTestSeriesId) {
      toast({
        title: "Error",
        description: "Please select a test series first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsFetchingQuestions(true);
      const { data, error } = await supabase
        .from("test_questions")
        .select("*")
        .eq("test_series_id", selectedTestSeriesId)
        .order("question_order", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "No Questions Found",
          description: "This test series has no questions yet",
        });
        setJsonInput("");
        return;
      }

      // Format questions for display
      const formattedQuestions = data.map(q => ({
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        topic: q.topic,
        question_order: q.question_order,
      }));

      setJsonInput(JSON.stringify(formattedQuestions, null, 2));
      
      toast({
        title: "Success",
        description: `Loaded ${data.length} question(s)`,
      });
    } catch (error: any) {
      console.error("Error fetching questions:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch questions",
        variant: "destructive",
      });
    } finally {
      setIsFetchingQuestions(false);
    }
  };

  const handleUpdate = async () => {
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
      
      // First, delete all existing questions for this test series
      const { error: deleteError } = await supabase
        .from('test_questions')
        .delete()
        .eq('test_series_id', selectedTestSeriesId);

      if (deleteError) {
        throw deleteError;
      }

      // Then insert the new questions
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
      await supabase
        .from('test_series')
        .update({ total_questions: questions.length })
        .eq('id', selectedTestSeriesId);

      toast({
        title: "Success",
        description: `Successfully updated with ${questions.length} question(s)`,
      });
      
      setJsonInput("");
    } catch (error: any) {
      console.error("Error updating questions:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update questions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Test Questions (JSON Upload)</CardTitle>
        <CardDescription>
          Replace all questions for a test series with new JSON data. Select a test series first, then paste your questions data. This will delete all existing questions and replace them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Filter by Subject</label>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {upscSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.icon} {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Select Test Series</label>
            <Select value={selectedTestSeriesId} onValueChange={setSelectedTestSeriesId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a test series" />
              </SelectTrigger>
              <SelectContent>
                {testSeries
                  .filter(series => subjectFilter === "all" || series.subject_id === subjectFilter)
                  .map((series) => (
                  <SelectItem key={series.id} value={series.id}>
                    {series.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Questions JSON</label>
            <Button 
              onClick={fetchQuestions} 
              disabled={isFetchingQuestions || !selectedTestSeriesId}
              variant="outline"
              size="sm"
            >
              {isFetchingQuestions ? "Loading..." : "Load Existing Questions"}
            </Button>
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
        </div>
        <Button onClick={handleUpdate} disabled={isLoading || !selectedTestSeriesId} variant="destructive">
          <RefreshCw className="h-4 w-4 mr-2" />
          {isLoading ? "Updating..." : "Update All Questions"}
        </Button>
      </CardContent>
    </Card>
  );
}
