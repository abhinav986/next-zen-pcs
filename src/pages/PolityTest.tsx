import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  correct_answer: string;
  explanation: string;
  difficulty: string;
  topic: string;
}

interface UserAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

const PolityTest = () => {
  // abhi
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [isLoading, setIsLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && !isTestCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleTestSubmit();
    }
  }, [timeLeft, isTestCompleted]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('polity_questions')
        .select('*')
        .limit(10);

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    if (!selectedAnswer) {
      toast.error('Please select an answer');
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;

    setUserAnswers([...userAnswers, {
      questionId: currentQuestion.id,
      answer: selectedAnswer,
      isCorrect
    }]);

    setSelectedAnswer("");

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleTestSubmit();
    }
  };

  const handleTestSubmit = async () => {
    setIsTestCompleted(true);
    const score = userAnswers.filter(answer => answer.isCorrect).length;
    const timeTaken = 1800 - timeLeft;

    try {
      // Note: This will require authentication to work properly
      const { error } = await supabase
        .from('test_attempts')
        .insert({
          test_name: 'Indian Polity Advanced Test',
          score,
          total_questions: questions.length,
          answers: JSON.stringify(userAnswers),
          time_taken: timeTaken
        });

      if (error) {
        console.error('Error saving test attempt:', error);
        toast.error('Failed to save test results');
      }
    } catch (error) {
      console.error('Error saving test attempt:', error);
    }

    setShowResults(true);
  };

  const getScorePercentage = () => {
    const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
    return Math.round((correctAnswers / questions.length) * 100);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading test questions...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Questions Available</h3>
            <p className="text-muted-foreground mb-4">
              Unable to load test questions. Please try again later.
            </p>
            <Button onClick={() => navigate('/test-series')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults) {
    const percentage = getScorePercentage();
    return (
      <div className="min-h-screen bg-background p-4">
        <SEOHead 
          title="Test Results - Indian Polity Advanced Test"
          description="View your Indian Polity test results and detailed explanations"
        />
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Test Completed!</CardTitle>
              <div className={`text-4xl font-bold ${getScoreColor(percentage)}`}>
                {percentage}%
              </div>
              <p className="text-muted-foreground">
                You scored {userAnswers.filter(a => a.isCorrect).length} out of {questions.length} questions correctly
              </p>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            {questions.map((question, index) => {
              const userAnswer = userAnswers[index];
              return (
                <Card key={question.id}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {userAnswer?.isCorrect ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">
                          Q{index + 1}. {question.question_text}
                        </h3>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="font-medium">Your answer:</span>{" "}
                            <span className={userAnswer?.isCorrect ? "text-green-600" : "text-red-600"}>
                              {userAnswer?.answer}
                            </span>
                          </p>
                          <p>
                            <span className="font-medium">Correct answer:</span>{" "}
                            <span className="text-green-600">{question.correct_answer}</span>
                          </p>
                          <p className="text-muted-foreground">
                            <span className="font-medium">Explanation:</span> {question.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          <div className="flex gap-4 mt-6">
            <Button onClick={() => navigate('/test-series')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tests
            </Button>
            <Button onClick={() => window.location.reload()}>
              Retake Test
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background p-4">
      <SEOHead 
        title="Indian Polity Advanced Test - UPSC Preparation"
        description="Take the comprehensive Indian Polity Advanced Test with MCQ and True/False questions for UPSC preparation"
      />
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/test-series')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit Test
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Question */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                {currentQuestion.difficulty}
              </span>
              <span className="px-2 py-1 bg-secondary/10 text-secondary-foreground text-xs rounded">
                {currentQuestion.topic}
              </span>
              <span className="px-2 py-1 bg-accent/10 text-accent-foreground text-xs rounded">
                {currentQuestion.question_type === 'mcq' ? 'Multiple Choice' : 'True/False'}
              </span>
            </div>
            <CardTitle className="text-lg leading-relaxed">
              {currentQuestion.question_text}
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
              {currentQuestion.question_type === 'mcq' ? (
                (Array.isArray(currentQuestion.options) ? currentQuestion.options : JSON.parse(currentQuestion.options || '[]')).map((option: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent/50 cursor-pointer">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent/50 cursor-pointer">
                    <RadioGroupItem value="true" id="true" />
                    <Label htmlFor="true" className="flex-1 cursor-pointer">True</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent/50 cursor-pointer">
                    <RadioGroupItem value="false" id="false" />
                    <Label htmlFor="false" className="flex-1 cursor-pointer">False</Label>
                  </div>
                </>
              )}
            </RadioGroup>
            
            <div className="flex justify-end mt-6">
              <Button onClick={handleNextQuestion} disabled={!selectedAnswer}>
                {currentQuestionIndex === questions.length - 1 ? 'Submit Test' : 'Next Question'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PolityTest;