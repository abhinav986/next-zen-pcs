import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, XCircle, ArrowLeft, BookOpen, SkipForward, SkipBack, Pause, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";
import { QuestionNavigation } from "@/components/QuestionNavigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/context/LanguageContext";
import { User, Session } from "@supabase/supabase-js";

interface TestQuestion {
  id: string;
  question_text: string;
  options: any;
  correct_answer: string;
  explanation: string;
  difficulty: string;
  topic: string;
  question_order: number;
}

interface TestSeries {
  id: string;
  title: string;
  description: string;
  duration: number;
  total_questions: number;
  max_score: number;
  difficulty: string;
  test_type: string;
  chapter_name?: string;
  subject_id?: string;
}

interface UserAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  topic: string;
}

const TestSeriesTest = () => {
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  const { t } = useLanguage();
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [testSeries, setTestSeries] = useState<TestSeries | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (authChecked && user && testId) {
      fetchTestSeries();
    } else if (authChecked && !user) {
      setIsLoading(false);
    }
  }, [authChecked, user, testId]);

useEffect(() => {
  if (testSeries) {
    fetchQuestions();
  }
}, [testSeries]);

  const checkAuthentication = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);
    setAuthChecked(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  };

useEffect(() => {
  if (isStarted && timeLeft > 0 && !isTestCompleted && !isPaused) {
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  } else if (isStarted && timeLeft === 0 && !isTestCompleted) {
    handleTestSubmit();
  }
}, [isStarted, timeLeft, isTestCompleted, isPaused]);

  const fetchTestSeries = async () => {
    try {
      const { data, error } = await supabase
        .from('test_series')
        .select('*')
        .eq('id', testId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setTestSeries(data);
    } catch (error) {
      console.error('Error fetching test series:', error);
      toast.error('Failed to load test details');
      navigate(-1);
    }
  };

  const fetchQuestions = async () => {
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

  const handleQuestionNavigation = (questionIndex: number) => {
    if (selectedAnswer) {
      saveCurrentAnswer();
    }
    
    setCurrentQuestionIndex(questionIndex);
    
    const savedAnswer = userAnswers.find(answer => answer.questionId === questions[questionIndex]?.id);
    setSelectedAnswer(savedAnswer?.answer || "");
  };

  const saveCurrentAnswer = () => {
    if (!selectedAnswer) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;

    const filteredAnswers = userAnswers.filter(answer => answer.questionId !== currentQuestion.id);
    
    setUserAnswers([...filteredAnswers, {
      questionId: currentQuestion.id,
      answer: selectedAnswer,
      isCorrect,
      topic: currentQuestion.topic || 'General'
    }]);

    setAnsweredQuestions(prev => new Set([...prev, currentQuestionIndex]));
  };

  const handleSkipQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer("");
    }
  };

const handleStartTest = () => {
  const durationMins = (testSeries?.duration && testSeries.duration > 0)
    ? testSeries.duration
    : (testSeries?.test_type === 'chapter' ? 15 : 60);
  setTimeLeft(durationMins * 60);
  setIsStarted(true);
};

const handlePreviousQuestion = () => {
  if (currentQuestionIndex > 0) {
    if (selectedAnswer) {
      saveCurrentAnswer();
    }
    setCurrentQuestionIndex(currentQuestionIndex - 1);
    const savedAnswer = userAnswers.find(answer => answer.questionId === questions[currentQuestionIndex - 1]?.id);
    setSelectedAnswer(savedAnswer?.answer || "");
  }
};

const handleNextQuestion = () => {
  if (!selectedAnswer) {
    toast.error(t('test.selectAnswer'));
    return;
  }

  saveCurrentAnswer();
  setSelectedAnswer("");

  if (currentQuestionIndex < questions.length - 1) {
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  } else {
    handleTestSubmit();
  }
};
  const handleTestSubmit = async () => {
    if (selectedAnswer) {
      saveCurrentAnswer();
    }

    setIsTestCompleted(true);
    const finalAnswers = userAnswers;
    if (selectedAnswer) {
      const currentQuestion = questions[currentQuestionIndex];
      const isCorrect = selectedAnswer === currentQuestion.correct_answer;
      finalAnswers.push({
        questionId: currentQuestion.id,
        answer: selectedAnswer,
        isCorrect,
        topic: currentQuestion.topic || 'General'
      });
    }

    const score = finalAnswers.filter(answer => answer.isCorrect).length;
    const timeTaken = (testSeries?.duration || 0) * 60 - timeLeft;

    try {
      if (user && testSeries) {
        const { error } = await supabase
          .from('test_attempts')
          .insert({
            user_id: user.id,
            test_name: testSeries.title,
            score,
            total_questions: questions.length,
            answers: JSON.stringify(finalAnswers),
            time_taken: timeTaken
          });

        if (error) {
          console.error('Error saving test attempt:', error);
          toast.error('Failed to save test results');
        } else {
          toast.success('Test results saved successfully!');
        }
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
          <p className="text-muted-foreground">{t('loading.test')}</p>
        </div>
      </div>
    );
  }

  if (authChecked && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary font-bold text-lg">!</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('nav.signInRequired')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('nav.signInDesc')}
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link to="/auth">{t('nav.signIn')}</Link>
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('nav.goBack')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!testSeries || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('error.testNotAvailable')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('error.testNotAvailableDesc')}
            </p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('nav.goBack')}
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
          title={`Test Results - ${testSeries.title}`}
          description="View your test results and detailed explanations"
        />
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t('test.completed')}</CardTitle>
              <div className={`text-4xl font-bold ${getScoreColor(percentage)}`}>
                {percentage}%
              </div>
              <p className="text-muted-foreground">
                {t('test.score')} {userAnswers.filter(a => a.isCorrect).length} {t('test.outOf')} {questions.length} {t('test.questionsCorrectly')}
              </p>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            {questions.map((question, index) => {
              const userAnswer = userAnswers.find(answer => answer.questionId === question.id);
              return (
                <Card key={question.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium mb-3">{question.question_text}</h3>
                      
                      <div className="space-y-2 mb-4">
                        {Array.isArray(question.options) ? 
                          question.options.map((option: string, optionIndex: number) => (
                            <div 
                              key={optionIndex}
                              className={`p-3 rounded-lg border ${
                                option === question.correct_answer ? 'bg-green-50 border-green-200' :
                                option === userAnswer?.answer ? 'bg-red-50 border-red-200' :
                                'bg-background'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {option === question.correct_answer && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                                {option === userAnswer?.answer && option !== question.correct_answer && (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span>{option}</span>
                              </div>
                            </div>
                          )) :
                          Object.entries(question.options as Record<string, string>).map(([key, value]) => (
                            <div 
                              key={key}
                              className={`p-3 rounded-lg border ${
                                key === question.correct_answer ? 'bg-green-50 border-green-200' :
                                key === userAnswer?.answer ? 'bg-red-50 border-red-200' :
                                'bg-background'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {key === question.correct_answer && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                                {key === userAnswer?.answer && key !== question.correct_answer && (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span>{key}. {value}</span>
                              </div>
                            </div>
                          ))
                        }
                      </div>

                      {question.explanation && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>{t('test.explanation')}</strong> {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 flex justify-center">
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('test.backToTests')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background p-4 relative">
      <SEOHead 
        title={`${testSeries.title} - Test`}
        description={`Take the ${testSeries.title} test`}
      />
      
      {/* Pause Overlay */}
      {isPaused && isStarted && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <Pause className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('test.paused')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('test.pausedDesc')}
              </p>
              <Button 
                onClick={() => setIsPaused(false)}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                {t('test.resumeTest')}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to={-1 as any}>
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <CardTitle className="text-xl">{testSeries.title}</CardTitle>
                  <p className="text-muted-foreground">{testSeries.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <LanguageToggle />
                {/* Pause/Resume Button for Chapter Tests */}
                {isStarted && testSeries.test_type === 'chapter' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPaused(!isPaused)}
                    className="flex items-center gap-2"
                  >
                    {isPaused ? (
                      <>
                        <Play className="h-4 w-4" />
                        {t('test.resume')}
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4" />
                        {t('test.pause')}
                      </>
                    )}
                  </Button>
                )}
                
                {isStarted && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="font-mono">{formatTime(timeLeft)}</span>
                    {isPaused && (
                      <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                        PAUSED
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Question Navigation */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <QuestionNavigation
                totalQuestions={questions.length}
                currentQuestion={currentQuestionIndex}
                answeredQuestions={answeredQuestions}
                onQuestionSelect={handleQuestionNavigation}
                className="sticky top-20"
              />
            </div>

            {/* Main Question Area */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </CardTitle>
                    <Progress value={progress} className="w-full sm:w-32" />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <h2 className="text-base sm:text-lg leading-relaxed">{currentQuestion.question_text}</h2>
                
                  <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
                    {Array.isArray(currentQuestion.options) ? 
                      currentQuestion.options.map((option: string, index: number) => (
                        <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value={option} id={`option-${index}`} className="mt-1" />
                          <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-sm sm:text-base leading-relaxed">
                            {option}
                          </Label>
                        </div>
                      )) :
                      Object.entries(currentQuestion.options as Record<string, string>).map(([key, value]) => (
                        <div key={key} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value={key} id={`option-${key}`} className="mt-1" />
                          <Label htmlFor={`option-${key}`} className="flex-1 cursor-pointer text-sm sm:text-base leading-relaxed">
                            <span className="font-medium">{key}.</span> {value}
                          </Label>
                        </div>
                      ))
                    }
                  </RadioGroup>

                  <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
                    <div className="flex gap-2 order-2 sm:order-1">
                       <Button
                         variant="outline"
                         onClick={handlePreviousQuestion}
                         disabled={currentQuestionIndex === 0}
                         size="sm"
                         className="flex-1 sm:flex-none"
                       >
                         <SkipBack className="h-4 w-4 mr-2" />
                         <span className="hidden sm:inline">{t('test.previous')}</span>
                         <span className="sm:hidden">Prev</span>
                       </Button>
                       
                       <Button
                         variant="outline"
                         onClick={handleSkipQuestion}
                         disabled={currentQuestionIndex === questions.length - 1}
                         size="sm"
                         className="flex-1 sm:flex-none"
                       >
                         <span className="hidden sm:inline">{t('test.skip')}</span>
                         <span className="sm:hidden">Skip</span>
                         <SkipForward className="h-4 w-4 ml-2" />
                       </Button>
                    </div>

                     <div className="flex gap-2 order-1 sm:order-2">
                       {currentQuestionIndex === questions.length - 1 ? (
                         <Button onClick={handleTestSubmit} className="min-w-[100px] flex-1 sm:flex-none" size="sm">
                           {t('test.submit')}
                         </Button>
                       ) : (
                         <Button onClick={handleNextQuestion} className="min-w-[100px] flex-1 sm:flex-none" size="sm">
                           {t('test.next')}
                         </Button>
                       )}
                     </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSeriesTest;