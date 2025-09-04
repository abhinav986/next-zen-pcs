import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, XCircle, ArrowLeft, BookOpen, SkipForward, SkipBack, Pause, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";
import { QuestionNavigation } from "@/components/QuestionNavigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/context/LanguageContext";
import { User, Session } from "@supabase/supabase-js";

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
  topic: string;
}

const PolityTest = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chapterFilter = searchParams.get('chapter');
  const { t } = useLanguage();
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(chapterFilter ? 900 : 1800); // 15 mins for chapter, 30 for full test
  const [isLoading, setIsLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const getTestTitle = () => {
    if (chapterFilter) {
      return `${chapterFilter} - Practice Test`;
    }
    return "Indian Polity Advanced Test";
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (authChecked && user) {
      fetchQuestions();
    } else if (authChecked && !user) {
      setIsLoading(false);
    }
  }, [authChecked, user]);

  const checkAuthentication = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);
    setAuthChecked(true);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  };

  useEffect(() => {
    if (timeLeft > 0 && !isTestCompleted && !isPaused) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleTestSubmit();
    }
  }, [timeLeft, isTestCompleted, isPaused]);

  const fetchQuestions = async () => {
    try {
      let query = supabase
        .from('polity_questions')
        .select('*');
      
      // Add chapter filter if specified
      if (chapterFilter) {
        // Map chapter names to topic filters for database queries
        const chapterTopicMap: Record<string, string[]> = {
          "Chapter 1: Making of the Constitution": ["Constitution Making", "Constitutional History"],
          "Chapter 2: Salient Features of the Constitution": ["Constitutional Features", "Federalism"],
          "Chapter 3: The Preamble": ["Preamble"],
          "Chapter 4: Fundamental Rights": ["Fundamental Rights"],
          "Chapter 5: Fundamental Duties": ["Fundamental Duties"],
          "Chapter 6: Directive Principles of State Policy": ["Directive Principles"],
          "Chapter 7: Constitutional Amendments": ["Amendment Procedure"],
          "Chapter 8: Basic Structure of the Constitution": ["Basic Structure"],
        };
        
        const topics = chapterTopicMap[chapterFilter] || [chapterFilter];
        query = query.in('topic', topics);
      }
      
      const limit = chapterFilter ? 5 : 10; // Fewer questions for chapter-specific tests
      query = query.limit(limit);

      const { data, error } = await query;

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
    // Save current answer if one is selected
    if (selectedAnswer) {
      saveCurrentAnswer();
    }
    
    setCurrentQuestionIndex(questionIndex);
    
    // Load saved answer for the selected question
    const savedAnswer = userAnswers.find(answer => answer.questionId === questions[questionIndex]?.id);
    setSelectedAnswer(savedAnswer?.answer || "");
  };

  const saveCurrentAnswer = () => {
    if (!selectedAnswer) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;

    // Remove any existing answer for this question
    const filteredAnswers = userAnswers.filter(answer => answer.questionId !== currentQuestion.id);
    
    setUserAnswers([...filteredAnswers, {
      questionId: currentQuestion.id,
      answer: selectedAnswer,
      isCorrect,
      topic: currentQuestion.topic
    }]);

    setAnsweredQuestions(prev => new Set([...prev, currentQuestionIndex]));
  };

  const handleSkipQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer("");
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      // Save current answer if one is selected
      if (selectedAnswer) {
        saveCurrentAnswer();
      }
      
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      
      // Load saved answer for the previous question
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
    // Save current answer if one is selected
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
        topic: currentQuestion.topic
      });
    }

    const score = finalAnswers.filter(answer => answer.isCorrect).length;
    const timeTaken = (chapterFilter ? 900 : 1800) - timeLeft;

    try {
      if (user) {
        const { error } = await supabase
          .from('test_attempts')
          .insert({
            user_id: user.id,
            test_name: getTestTitle(),
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

  const getSectionWiseAnalysis = () => {
    const sectionStats: Record<string, { correct: number; total: number; percentage: number }> = {};
    
    userAnswers.forEach(answer => {
      if (!sectionStats[answer.topic]) {
        sectionStats[answer.topic] = { correct: 0, total: 0, percentage: 0 };
      }
      sectionStats[answer.topic].total++;
      if (answer.isCorrect) {
        sectionStats[answer.topic].correct++;
      }
    });

    // Calculate percentages
    Object.keys(sectionStats).forEach(topic => {
      sectionStats[topic].percentage = Math.round(
        (sectionStats[topic].correct / sectionStats[topic].total) * 100
      );
    });

    return sectionStats;
  };

  const getWeakSections = () => {
    const sectionStats = getSectionWiseAnalysis();
    return Object.entries(sectionStats)
      .filter(([_, stats]) => stats.percentage < 60)
      .sort((a, b) => a[1].percentage - b[1].percentage)
      .map(([topic, _]) => topic);
  };

  // Map topic names to chapter names for PolityBook navigation
  const getChapterForTopic = (topic: string) => {
    const topicToChapterMap: Record<string, string> = {
      "Constitution Making": "Chapter 1: Making of the Constitution",
      "Constitutional Features": "Chapter 2: Salient Features of the Constitution",
      "Preamble": "Chapter 3: The Preamble",
      "Fundamental Rights": "Chapter 4: Fundamental Rights",
      "Fundamental Duties": "Chapter 5: Fundamental Duties",
      "Directive Principles": "Chapter 6: Directive Principles of State Policy",
      "Amendment Procedure": "Chapter 7: Constitutional Amendments",
      "Basic Structure": "Chapter 8: Basic Structure of the Constitution",
      "Federal System": "Chapter 9: Federal Features",
      "Centre-State Relations": "Chapter 10: Centre-State Relations",
      "Inter-State Relations": "Chapter 11: Inter-State Relations",
      "Emergency Provisions": "Chapter 12: Emergency Provisions",
      "Local Government": "Chapter 13: Local Government",
      "Constitutional Bodies": "Chapter 14: Constitutional Bodies",
      "Elections": "Chapter 15: Elections and Electoral Processes",
      "Political Parties": "Chapter 16: Political Parties",
      "Pressure Groups": "Chapter 17: Pressure Groups and Movements"
    };
    
    return topicToChapterMap[topic] || "Chapter 1: Making of the Constitution";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading.questions')}</p>
        </div>
      </div>
    );
  }

  // Authentication check
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
              <Button variant="outline" onClick={() => navigate(chapterFilter ? `/study-materials/polity?chapter=${encodeURIComponent(chapterFilter)}` : '/test-series')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('nav.goBack')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('error.noQuestions')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('error.noQuestionsDesc')}
            </p>
            <Button onClick={() => navigate('/test-series')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('test.backToTests')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults) {
    const percentage = getScorePercentage();
    const sectionStats = getSectionWiseAnalysis();
    const weakSections = getWeakSections();
    
    return (
      <div className="min-h-screen bg-background p-4">
        <SEOHead 
          title={`Test Results - ${getTestTitle()}`}
          description="View your Indian Polity test results and detailed explanations"
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

          {/* Section-wise Analysis */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">Section-wise Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(sectionStats).map(([topic, stats]) => (
                  <div key={topic} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-sm">{topic}</h3>
                      <span className={`text-sm font-bold ${getScoreColor(stats.percentage)}`}>
                        {stats.percentage}%
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {stats.correct}/{stats.total} questions correct
                    </div>
                    <Progress value={stats.percentage} className="h-2" />
                  </div>
                ))}
              </div>
              
              {weakSections.length > 0 && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                    Areas for Improvement
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {weakSections.map((topic) => (
                      <span 
                        key={topic}
                        className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs rounded"
                      >
                        {topic} ({sectionStats[topic].percentage}%)
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-300 mb-3">
                    Focus on these topics for better performance
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {weakSections.map((topic) => (
                      <Link
                        key={topic}
                        to={`/study-materials/polity?chapter=${encodeURIComponent(getChapterForTopic(topic))}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        <BookOpen className="w-3 h-3" />
                        Study {topic}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {questions.map((question, index) => {
              const userAnswer = userAnswers.find(answer => answer.questionId === question.id);
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
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-secondary/10 text-secondary-foreground text-xs rounded">
                            {question.topic}
                          </span>
                        </div>
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
                            <span className="font-medium">{t('test.explanation')}</span> {question.explanation}
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
            {chapterFilter && (
              <Button onClick={() => navigate(`/study-materials/polity?chapter=${encodeURIComponent(chapterFilter)}`)} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Chapter
              </Button>
            )}
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
    <div className="min-h-screen bg-background p-4 relative">
      <SEOHead 
        title={`${getTestTitle()} - UPSC Preparation`}
        description={`Take the ${chapterFilter ? 'chapter-specific' : 'comprehensive'} Indian Polity test with MCQ and True/False questions for UPSC preparation`}
      />
      
      {/* Pause Overlay */}
      {isPaused && (
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
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="outline" 
            onClick={() => chapterFilter ? navigate(`/study-materials/polity?chapter=${encodeURIComponent(chapterFilter)}`) : navigate('/test-series')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {chapterFilter ? "Back to Chapter" : "Exit Test"}
          </Button>
          
          <div className="flex items-center gap-4">
            <LanguageToggle />
            {/* Pause/Resume Button for Chapter Tests */}
            {chapterFilter && (
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
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{formatTime(timeLeft)}</span>
              {isPaused && (
                <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                  PAUSED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {t('test.questions')} {currentQuestionIndex + 1} {t('test.outOf')} {questions.length}
            </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <QuestionNavigation
              totalQuestions={questions.length}
              currentQuestion={currentQuestionIndex}
              answeredQuestions={answeredQuestions}
              onQuestionSelect={handleQuestionNavigation}
              className="sticky top-4"
            />
          </div>

          {/* Question */}
          <div className="lg:col-span-3 order-1 lg:order-2">
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
                
                <div className="flex justify-between mt-6">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                    >
                      <SkipBack className="h-4 w-4 mr-1" />
                      {t('test.previous')}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleSkipQuestion}
                      disabled={currentQuestionIndex === questions.length - 1}
                    >
                      <SkipForward className="h-4 w-4 mr-1" />
                      {t('test.skip')}
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleNextQuestion} disabled={!selectedAnswer}>
                      {currentQuestionIndex === questions.length - 1 ? t('test.submit') : t('test.next')}
                    </Button>
                    {currentQuestionIndex === questions.length - 1 && (
                      <Button variant="destructive" onClick={handleTestSubmit}>
                        {t('test.submit')}
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

export default PolityTest;