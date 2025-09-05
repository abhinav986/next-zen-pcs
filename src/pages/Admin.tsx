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
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
  question_type?: string;
  options: any;
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
    question_type: "multiple_choice",
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
        question_type: newQuestion.question_type || "multiple_choice",
        options: newQuestion.question_type === "true_false" ? ["True", "False"] : (newQuestion.options || ["", "", "", ""]),
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
        question_type: "multiple_choice",
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
          question_type: editingQuestion.question_type,
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="duration">Duration (min)</Label>
                            <Input
                              id="duration"
                              type="number"
                              value={newTest.duration}
                              onChange={(e) => setNewTest({...newTest, duration: parseInt(e.target.value)})}
                              placeholder="Duration"
                            />
                          </div>
                          <div>
                            <Label htmlFor="total_questions">Total Questions</Label>
                            <Input
                              id="total_questions"
                              type="number"
                              value={newTest.total_questions}
                              onChange={(e) => setNewTest({...newTest, total_questions: parseInt(e.target.value)})}
                              placeholder="Total Questions"
                            />
                          </div>
                          <div>
                            <Label htmlFor="max_score">Max Score</Label>
                            <Input
                              id="max_score"
                              type="number"
                              value={newTest.max_score}
                              onChange={(e) => setNewTest({...newTest, max_score: parseInt(e.target.value)})}
                              placeholder="Max Score"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="difficulty">Difficulty</Label>
                          <Select value={newTest.difficulty} onValueChange={(value) => setNewTest({...newTest, difficulty: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Easy">Easy</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="is_active">Active</Label>
                          <Select value={newTest.is_active ? "true" : "false"} onValueChange={(value) => setNewTest({...newTest, is_active: value === "true"})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Active</SelectItem>
                              <SelectItem value="false">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="secondary" onClick={() => setIsAddingTest(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" onClick={handleAddTest}>Create</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {testSeries.map((test) => (
                    <Card key={test.id} className="bg-card text-card-foreground shadow-md">
                      <CardHeader>
                        <CardTitle>{test.title}</CardTitle>
                        <CardDescription>
                          <Badge variant="secondary">{test.subject_id}</Badge>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="font-medium">Duration:</span> {test.duration} minutes
                          </p>
                          <p>
                            <span className="font-medium">Questions:</span> {test.total_questions}
                          </p>
                          <p>
                            <span className="font-medium">Max Score:</span> {test.max_score}
                          </p>
                          <p>
                            <span className="font-medium">Difficulty:</span> {test.difficulty}
                          </p>
                          <p>
                            <span className="font-medium">Type:</span> {test.test_type}
                          </p>
                          {test.chapter_name && (
                            <p>
                              <span className="font-medium">Chapter:</span> {test.chapter_name}
                            </p>
                          )}
                          <p>
                            <span className="font-medium">Status:</span> {test.is_active ? "Active" : "Inactive"}
                          </p>
                        </div>
                      </CardContent>
                      <div className="flex justify-between p-4">
                        <Dialog open={editingTest?.id === test.id} onOpenChange={(open) => {
                            if (!open) setEditingTest(null);
                            else setEditingTest(test);
                          }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit Test Series</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="title">Title</Label>
                                <Input
                                  id="title"
                                  value={editingTest?.title || ""}
                                  onChange={(e) => setEditingTest({...editingTest, title: e.target.value} as TestSeries)}
                                  placeholder="Enter test title"
                                />
                              </div>
                              <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                  id="description"
                                  value={editingTest?.description || ""}
                                  onChange={(e) => setEditingTest({...editingTest, description: e.target.value} as TestSeries)}
                                  placeholder="Enter test description"
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="subject">Subject</Label>
                                  <Select value={editingTest?.subject_id} onValueChange={(value) => setEditingTest({...editingTest, subject_id: value} as TestSeries)}>
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
                                  <Select value={editingTest?.test_type} onValueChange={(value) => setEditingTest({...editingTest, test_type: value} as TestSeries)}>
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
                              {editingTest?.test_type === 'chapter' && (
                                <div>
                                  <Label htmlFor="chapter">Chapter Name</Label>
                                  <Input
                                    id="chapter"
                                    value={editingTest?.chapter_name || ""}
                                    onChange={(e) => setEditingTest({...editingTest, chapter_name: e.target.value} as TestSeries)}
                                    placeholder="Enter chapter name"
                                  />
                                </div>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label htmlFor="duration">Duration (min)</Label>
                                  <Input
                                    id="duration"
                                    type="number"
                                    value={editingTest?.duration}
                                    onChange={(e) => setEditingTest({...editingTest, duration: parseInt(e.target.value)} as TestSeries)}
                                    placeholder="Duration"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="difficulty">Difficulty</Label>
                                <Select value={editingTest?.difficulty} onValueChange={(value) => setEditingTest({...editingTest, difficulty: value} as TestSeries)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select difficulty" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Easy">Easy</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Hard">Hard</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="is_active">Active</Label>
                                <Select value={editingTest?.is_active ? "true" : "false"} onValueChange={(value) => setEditingTest({...editingTest, is_active: value === "true"} as TestSeries)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="true">Active</SelectItem>
                                    <SelectItem value="false">Inactive</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button type="button" variant="secondary" onClick={() => setEditingTest(null)}>
                                Cancel
                              </Button>
                              <Button type="submit" onClick={handleEditTest}>
                                Save
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the test series and all associated questions.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteTest(test.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Questions Management */}
            <TabsContent value="questions">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h2 className="text-2xl font-semibold">Questions</h2>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Select value={selectedTestId} onValueChange={setSelectedTestId}>
                      <SelectTrigger className="w-full sm:w-64">
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
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add New Question</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                          <div>
                            <Label>Question Type</Label>
                            <Select 
                              value={newQuestion.question_type} 
                              onValueChange={(value) => {
                                const resetOptions = value === "true_false" ? ["True", "False"] : ["", "", "", ""];
                                setNewQuestion({...newQuestion, question_type: value, options: resetOptions, correct_answer: ""});
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                <SelectItem value="true_false">True/False</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Question</Label>
                            <div className="border rounded-md">
                              <ReactQuill
                                value={newQuestion.question_text}
                                onChange={(value) => setNewQuestion({...newQuestion, question_text: value})}
                                placeholder="Enter question text"
                                modules={{
                                  toolbar: [
                                    [{ 'header': [1, 2, 3, false] }],
                                    ['bold', 'italic', 'underline'],
                                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                    ['clean']
                                  ]
                                }}
                                style={{ minHeight: '120px' }}
                              />
                            </div>
                          </div>
                          
                          {newQuestion.question_type === "multiple_choice" ? (
                            <div>
                              <Label>Options</Label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {newQuestion.options?.map((option, index) => (
                                  <Input
                                    key={index}
                                    value={option}
                                    onChange={(e) => {
                                      const updatedOptions = [...(newQuestion.options || [])];
                                      updatedOptions[index] = e.target.value;
                                      setNewQuestion({...newQuestion, options: updatedOptions});
                                    }}
                                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                  />
                                ))
