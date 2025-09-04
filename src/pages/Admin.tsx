import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { upscSubjects } from "@/data/upscSubjects";
import { useToast } from "@/hooks/use-toast";

interface TestSeries {
  id: string;
  title: string;
  description?: string;
  subject_id?: string;
  duration: number;
  total_questions: number;
  max_score: number;
  difficulty: string;
  test_type: string;
  chapter_name?: string;
  is_active: boolean;
  created_at: string;
}

interface TestQuestion {
  id: string;
  test_series_id?: string;
  question_text: string;
  options: any; // Json type from Supabase
  correct_answer: string;
  explanation?: string;
  difficulty: string;
  topic?: string;
  question_order: number;
}

const Admin = () => {
  const [testSeries, setTestSeries] = useState<TestSeries[]>([]);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  const [isAddingTest, setIsAddingTest] = useState(false);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingTest, setEditingTest] = useState<TestSeries | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<TestQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [newTest, setNewTest] = useState<Partial<TestSeries>>({
    title: "",
    description: "",
    subject_id: "",
    duration: 60,
    total_questions: 0,
    max_score: 0,
    difficulty: "Medium",
    test_type: "general",
    chapter_name: "",
    is_active: true
  });

  const [newQuestion, setNewQuestion] = useState<Partial<TestQuestion>>({
    question_text: "",
    options: ["", "", "", ""],
    correct_answer: "",
    explanation: "",
    difficulty: "Medium",
    topic: "",
    question_order: 1
  });

  useEffect(() => {
    fetchTestSeries();
  }, []);

  useEffect(() => {
    if (selectedTestId) {
      fetchQuestions(selectedTestId);
    }
  }, [selectedTestId]);

  const fetchTestSeries = async () => {
    try {
      const { data, error } = await supabase
        .from('test_series')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTestSeries(data || []);
    } catch (error) {
      console.error('Error fetching test series:', error);
      toast({
        title: "Error",
        description: "Failed to fetch test series",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (testId: string) => {
    try {
      const { data, error } = await supabase
        .from('test_questions')
        .select('*')
        .eq('test_series_id', testId)
        .order('question_order', { ascending: true });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive"
      });
    }
  };

  const handleAddTest = async () => {
    try {
      // Ensure required fields are set
      const testData = {
        ...newTest,
        title: newTest.title || "",
        duration: newTest.duration || 60,
        total_questions: newTest.total_questions || 0,
        max_score: newTest.max_score || 0
      };

      const { data, error } = await supabase
        .from('test_series')
        .insert([testData])
        .select()
        .single();

      if (error) throw error;

      setTestSeries([data, ...testSeries]);
      setNewTest({
        title: "",
        description: "",
        subject_id: "",
        duration: 60,
        total_questions: 0,
        max_score: 0,
        difficulty: "Medium",
        test_type: "general",
        chapter_name: "",
        is_active: true
      });
      setIsAddingTest(false);
      toast({
        title: "Success",
        description: "Test series created successfully"
      });
    } catch (error) {
      console.error('Error adding test:', error);
      toast({
        title: "Error",
        description: "Failed to create test series",
        variant: "destructive"
      });
    }
  };

  const handleAddQuestion = async () => {
    if (!selectedTestId) {
      toast({
        title: "Error",
        description: "Please select a test series first",
        variant: "destructive"
      });
      return;
    }

    try {
      const questionData = {
        test_series_id: selectedTestId,
        question_text: newQuestion.question_text || "",
        options: newQuestion.options || ["", "", "", ""],
        correct_answer: newQuestion.correct_answer || "",
        explanation: newQuestion.explanation,
        difficulty: newQuestion.difficulty || "Medium",
        topic: newQuestion.topic,
        question_order: questions.length + 1
      };

      const { data, error } = await supabase
        .from('test_questions')
        .insert([questionData])
        .select()
        .single();

      if (error) throw error;

      setQuestions([...questions, data]);
      setNewQuestion({
        question_text: "",
        options: ["", "", "", ""],
        correct_answer: "",
        explanation: "",
        difficulty: "Medium",
        topic: "",
        question_order: 1
      });
      setIsAddingQuestion(false);
      
      // Update test series total questions
      await updateTestQuestionCount(selectedTestId, questions.length + 1);
      
      toast({
        title: "Success",
        description: "Question added successfully"
      });
    } catch (error) {
      console.error('Error adding question:', error);
      toast({
        title: "Error",
        description: "Failed to add question",
        variant: "destructive"
      });
    }
  };

  const updateTestQuestionCount = async (testId: string, count: number) => {
    try {
      const { error } = await supabase
        .from('test_series')
        .update({ 
          total_questions: count,
          max_score: count * 2 // Assuming 2 marks per question
        })
        .eq('id', testId);

      if (error) throw error;
      
      // Update local state
      setTestSeries(testSeries.map(test => 
        test.id === testId 
          ? { ...test, total_questions: count, max_score: count * 2 }
          : test
      ));
    } catch (error) {
      console.error('Error updating question count:', error);
    }
  };

  const deleteTest = async (testId: string) => {
    try {
      const { error } = await supabase
        .from('test_series')
        .delete()
        .eq('id', testId);

      if (error) throw error;

      setTestSeries(testSeries.filter(test => test.id !== testId));
      if (selectedTestId === testId) {
        setSelectedTestId("");
        setQuestions([]);
      }
      
      toast({
        title: "Success",
        description: "Test series deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting test:', error);
      toast({
        title: "Error",
        description: "Failed to delete test series",
        variant: "destructive"
      });
    }
  };

  const deleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('test_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      setQuestions(questions.filter(q => q.id !== questionId));
      if (selectedTestId) {
        await updateTestQuestionCount(selectedTestId, questions.length - 1);
      }
      
      toast({
        title: "Success",
        description: "Question deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive"
      });
    }
  };

  const handleEditTest = async () => {
    if (!editingTest) return;

    try {
      const { error } = await supabase
        .from('test_series')
        .update({
          title: editingTest.title,
          description: editingTest.description,
          subject_id: editingTest.subject_id,
          duration: editingTest.duration,
          difficulty: editingTest.difficulty,
          test_type: editingTest.test_type,
          chapter_name: editingTest.chapter_name,
          is_active: editingTest.is_active
        })
        .eq('id', editingTest.id);

      if (error) throw error;

      setTestSeries(testSeries.map(test => 
        test.id === editingTest.id ? editingTest : test
      ));
      setEditingTest(null);
      
      toast({
        title: "Success",
        description: "Test series updated successfully"
      });
    } catch (error) {
      console.error('Error updating test:', error);
      toast({
        title: "Error",
        description: "Failed to update test series",
        variant: "destructive"
      });
    }
  };

  const handleEditQuestion = async () => {
    if (!editingQuestion) return;

    try {
      const { error } = await supabase
        .from('test_questions')
        .update({
          question_text: editingQuestion.question_text,
          options: editingQuestion.options,
          correct_answer: editingQuestion.correct_answer,
          explanation: editingQuestion.explanation,
          difficulty: editingQuestion.difficulty,
          topic: editingQuestion.topic
        })
        .eq('id', editingQuestion.id);

      if (error) throw error;

      setQuestions(questions.map(q => 
        q.id === editingQuestion.id ? editingQuestion : q
      ));
      setEditingQuestion(null);
      
      toast({
        title: "Success",
        description: "Question updated successfully"
      });
    } catch (error) {
      console.error('Error updating question:', error);
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Admin Panel - Test Series Management"
        description="Administrative interface for managing UPSC test series and questions"
        keywords="admin, test series, questions, management, UPSC"
      />
      
      <div className="min-h-screen bg-background pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-muted-foreground">Manage test series and questions</p>
            </div>
          </div>

          <Tabs defaultValue="tests" className="space-y-6">
            <TabsList>
              <TabsTrigger value="tests">Test Series</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
            </TabsList>

            {/* Test Series Management */}
            <TabsContent value="tests">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Test Series</h2>
                  <Dialog open={isAddingTest} onOpenChange={setIsAddingTest}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Test Series
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Test Series</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title">Title</Label>
                          <Input
                            id="title"
                            value={newTest.title}
                            onChange={(e) => setNewTest({...newTest, title: e.target.value})}
                            placeholder="Enter test title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={newTest.description}
                            onChange={(e) => setNewTest({...newTest, description: e.target.value})}
                            placeholder="Enter test description"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="subject">Subject</Label>
                            <Select value={newTest.subject_id} onValueChange={(value) => setNewTest({...newTest, subject_id: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select subject" />
                              </SelectTrigger>
                              <SelectContent>
                                {upscSubjects.map((subject) => (
                                  <SelectItem key={subject.id} value={subject.id}>
                                    {subject.icon} {subject.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="test_type">Test Type</Label>
                            <Select value={newTest.test_type} onValueChange={(value) => setNewTest({...newTest, test_type: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="chapter">Chapter</SelectItem>
                                <SelectItem value="full">Full Test</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {newTest.test_type === 'chapter' && (
                          <div>
                            <Label htmlFor="chapter">Chapter Name</Label>
                            <Input
                              id="chapter"
                              value={newTest.chapter_name}
                              onChange={(e) => setNewTest({...newTest, chapter_name: e.target.value})}
                              placeholder="Enter chapter name"
                            />
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="duration">Duration (min)</Label>
                            <Input
                              id="duration"
                              type="number"
                              value={newTest.duration}
                              onChange={(e) => setNewTest({...newTest, duration: parseInt(e.target.value)})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="difficulty">Difficulty</Label>
                            <Select value={newTest.difficulty} onValueChange={(value) => setNewTest({...newTest, difficulty: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Easy">Easy</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Hard">Hard</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleAddTest}>
                            <Save className="h-4 w-4 mr-2" />
                            Create Test
                          </Button>
                          <Button variant="outline" onClick={() => setIsAddingTest(false)}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Edit Test Dialog */}
                <Dialog open={!!editingTest} onOpenChange={() => setEditingTest(null)}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Edit Test Series</DialogTitle>
                    </DialogHeader>
                    {editingTest && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="edit-title">Title</Label>
                          <Input
                            id="edit-title"
                            value={editingTest.title}
                            onChange={(e) => setEditingTest({...editingTest, title: e.target.value})}
                            placeholder="Enter test title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-description">Description</Label>
                          <Textarea
                            id="edit-description"
                            value={editingTest.description || ""}
                            onChange={(e) => setEditingTest({...editingTest, description: e.target.value})}
                            placeholder="Enter test description"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit-subject">Subject</Label>
                            <Select value={editingTest.subject_id || ""} onValueChange={(value) => setEditingTest({...editingTest, subject_id: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select subject" />
                              </SelectTrigger>
                              <SelectContent>
                                {upscSubjects.map((subject) => (
                                  <SelectItem key={subject.id} value={subject.id}>
                                    {subject.icon} {subject.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="edit-test_type">Test Type</Label>
                            <Select value={editingTest.test_type} onValueChange={(value) => setEditingTest({...editingTest, test_type: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="chapter">Chapter</SelectItem>
                                <SelectItem value="full">Full Test</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {editingTest.test_type === 'chapter' && (
                          <div>
                            <Label htmlFor="edit-chapter">Chapter Name</Label>
                            <Input
                              id="edit-chapter"
                              value={editingTest.chapter_name || ""}
                              onChange={(e) => setEditingTest({...editingTest, chapter_name: e.target.value})}
                              placeholder="Enter chapter name"
                            />
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="edit-duration">Duration (min)</Label>
                            <Input
                              id="edit-duration"
                              type="number"
                              value={editingTest.duration}
                              onChange={(e) => setEditingTest({...editingTest, duration: parseInt(e.target.value)})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-difficulty">Difficulty</Label>
                            <Select value={editingTest.difficulty} onValueChange={(value) => setEditingTest({...editingTest, difficulty: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Easy">Easy</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Hard">Hard</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleEditTest}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={() => setEditingTest(null)}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

                <div className="grid gap-4">
                  {testSeries.map((test) => (
                    <Card key={test.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {test.title}
                              <Badge variant={test.is_active ? "default" : "secondary"}>
                                {test.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </CardTitle>
                            <CardDescription>{test.description}</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTestId(test.id)}
                            >
                              Manage Questions
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingTest(test)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Test Series</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{test.title}"? This will also delete all questions associated with this test series. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteTest(test.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Subject:</span>
                            <div className="font-medium">
                              {upscSubjects.find(s => s.id === test.subject_id)?.name || "General"}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duration:</span>
                            <div className="font-medium">{test.duration} min</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Questions:</span>
                            <div className="font-medium">{test.total_questions}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Max Score:</span>
                            <div className="font-medium">{test.max_score}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Questions Management */}
            <TabsContent value="questions">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Questions</h2>
                  <div className="flex gap-4">
                    <Select value={selectedTestId} onValueChange={setSelectedTestId}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select test series" />
                      </SelectTrigger>
                      <SelectContent>
                        {testSeries.map((test) => (
                          <SelectItem key={test.id} value={test.id}>
                            {test.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={isAddingQuestion} onOpenChange={setIsAddingQuestion}>
                      <DialogTrigger asChild>
                        <Button disabled={!selectedTestId}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Question
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Add New Question</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="question_text">Question</Label>
                            <Textarea
                              id="question_text"
                              value={newQuestion.question_text}
                              onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
                              placeholder="Enter question text"
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label>Options</Label>
                            <div className="space-y-2">
                              {newQuestion.options?.map((option, index) => (
                                <Input
                                  key={index}
                                  value={option}
                                  onChange={(e) => {
                                    const updatedOptions = [...(newQuestion.options || [])];
                                    updatedOptions[index] = e.target.value;
                                    setNewQuestion({...newQuestion, options: updatedOptions});
                                  }}
                                  placeholder={`Option ${index + 1}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="correct_answer">Correct Answer</Label>
                              <Input
                                id="correct_answer"
                                value={newQuestion.correct_answer}
                                onChange={(e) => setNewQuestion({...newQuestion, correct_answer: e.target.value})}
                                placeholder="Enter correct answer"
                              />
                            </div>
                            <div>
                              <Label htmlFor="difficulty">Difficulty</Label>
                              <Select value={newQuestion.difficulty} onValueChange={(value) => setNewQuestion({...newQuestion, difficulty: value})}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Easy">Easy</SelectItem>
                                  <SelectItem value="Medium">Medium</SelectItem>
                                  <SelectItem value="Hard">Hard</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="topic">Topic (Optional)</Label>
                              <Input
                                id="topic"
                                value={newQuestion.topic || ""}
                                onChange={(e) => setNewQuestion({...newQuestion, topic: e.target.value})}
                                placeholder="Enter topic"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="explanation">Explanation (Optional)</Label>
                            <Textarea
                              id="explanation"
                              value={newQuestion.explanation}
                              onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                              placeholder="Enter explanation for the answer"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleAddQuestion}>
                              <Save className="h-4 w-4 mr-2" />
                              Add Question
                            </Button>
                            <Button variant="outline" onClick={() => setIsAddingQuestion(false)}>
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {selectedTestId && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Questions for: {testSeries.find(t => t.id === selectedTestId)?.title}
                    </h3>
                    {questions.length === 0 ? (
                      <Card className="p-8 text-center">
                        <p className="text-muted-foreground">No questions added yet</p>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {questions.map((question, index) => (
                          <Card key={question.id}>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-base">
                                  Q{index + 1}. {question.question_text}
                                </CardTitle>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingQuestion(question)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Question</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this question? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteQuestion(question.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  {Array.isArray(question.options) ? question.options.map((option, optIndex) => (
                                    <div
                                      key={optIndex}
                                      className={`p-2 rounded border ${
                                        option === question.correct_answer
                                          ? 'bg-green-50 border-green-200 text-green-800'
                                          : 'bg-gray-50 border-gray-200'
                                      }`}
                                    >
                                      {String.fromCharCode(65 + optIndex)}. {option}
                                    </div>
                                  )) : null}
                                </div>
                                {question.explanation && (
                                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                    <strong>Explanation:</strong> {question.explanation}
                                  </div>
                                )}
                                <div className="flex gap-2 text-sm text-muted-foreground">
                                  <Badge variant="outline">{question.difficulty}</Badge>
                                  {question.topic && <Badge variant="outline">{question.topic}</Badge>}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                </div>
              )}
            </div>
          )}

          {/* Edit Question Dialog */}
          <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Question</DialogTitle>
              </DialogHeader>
              {editingQuestion && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-question-text">Question Text</Label>
                    <Textarea
                      id="edit-question-text"
                      value={editingQuestion.question_text}
                      onChange={(e) => setEditingQuestion({...editingQuestion, question_text: e.target.value})}
                      placeholder="Enter question text"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Options</Label>
                    <div className="space-y-2">
                      {(editingQuestion.options as string[]).map((option, index) => (
                        <Input
                          key={index}
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(editingQuestion.options as string[])];
                            newOptions[index] = e.target.value;
                            setEditingQuestion({...editingQuestion, options: newOptions});
                          }}
                          placeholder={`Option ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-correct-answer">Correct Answer</Label>
                      <Select 
                        value={editingQuestion.correct_answer} 
                        onValueChange={(value) => setEditingQuestion({...editingQuestion, correct_answer: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select correct answer" />
                        </SelectTrigger>
                        <SelectContent>
                          {(editingQuestion.options as string[])
                            .filter(option => option && option.trim() !== '')
                            .map((option, index) => (
                            <SelectItem key={index} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-question-difficulty">Difficulty</Label>
                      <Select value={editingQuestion.difficulty} onValueChange={(value) => setEditingQuestion({...editingQuestion, difficulty: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Easy">Easy</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-topic">Topic (Optional)</Label>
                      <Input
                        id="edit-topic"
                        value={editingQuestion.topic || ""}
                        onChange={(e) => setEditingQuestion({...editingQuestion, topic: e.target.value})}
                        placeholder="Enter topic"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-explanation">Explanation (Optional)</Label>
                    <Textarea
                      id="edit-explanation"
                      value={editingQuestion.explanation || ""}
                      onChange={(e) => setEditingQuestion({...editingQuestion, explanation: e.target.value})}
                      placeholder="Enter explanation"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleEditQuestion}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditingQuestion(null)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</div>
</>
);
};

export default Admin;