import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, Users, Target, TrendingDown, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { SEOHead } from "@/components/SEOHead";
import { getSubjectById } from "@/data/upscSubjects";
import { calculateWeakSections, WeakSectionAnalysis } from "@/utils/weakSectionAnalyzer";
import { sendWeakSectionUpdate } from "@/utils/emailNotifications";
import { supabase } from "@/integrations/supabase/client";

interface ChapterTest {
  id: string;
  title: string;
  description: string;
  questions: number;
  duration: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  completed: boolean;
  score?: number;
  maxScore: number;
}

interface SubjectTestSeries {
  id: string;
  title: string;
  description: string;
  duration: number;
  total_questions: number;
  max_score: number;
  difficulty: string;
  test_type: string;
  chapter_name?: string;
  attempted?: boolean;
  score?: number;
}

const SubjectTest = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const subject = subjectId ? getSubjectById(subjectId) : null;
  const [weakSections, setWeakSections] = useState<WeakSectionAnalysis[]>([]);
  const [subjectTests, setSubjectTests] = useState<SubjectTestSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userAttempts, setUserAttempts] = useState<Record<string, any>>({});

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSubjectTests();
      fetchUserAttempts();
      fetchWeakSections();
    } else {
      fetchSubjectTests();
      fetchWeakSections();
    }
  }, [user, subjectId]);

  // Update completion flags when user attempts change
  useEffect(() => {
    if (!subjectTests.length) return;
    setSubjectTests(prev =>
      prev.map(test => {
        const attempt = userAttempts[test.title];
        return { ...test, attempted: !!attempt, score: attempt?.score };
      })
    );
  }, [userAttempts]);

  const fetchUserAttempts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('test_attempts')
        .select('test_name, score, total_questions, completed_at')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      // Group attempts by test name and get the best score
      const attemptsMap: Record<string, any> = {};
      (data || []).forEach(attempt => {
        if (!attemptsMap[attempt.test_name] || 
            attempt.score > attemptsMap[attempt.test_name].score) {
          attemptsMap[attempt.test_name] = attempt;
        }
      });

      setUserAttempts(attemptsMap);
    } catch (error) {
      console.error('Error fetching user attempts:', error);
    }
  };

  const fetchSubjectTests = async () => {
    if (!subjectId) return;

    try {
      const { data, error } = await supabase
        .from('test_series')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add completion status to tests
      const testsWithCompletion = (data || []).map(test => {
        const userAttempt = userAttempts[test.title];
        return {
          ...test,
          attempted: !!userAttempt,
          score: userAttempt ? userAttempt.score : undefined
        };
      });
      
      setSubjectTests(testsWithCompletion);
    } catch (error) {
      console.error('Error fetching subject tests:', error);
    }
  };

  const fetchWeakSections = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const analysis = await calculateWeakSections(user.id, subjectId);
      setWeakSections(analysis);
      
      // Send WhatsApp notification about weak sections
      await sendWeakSectionUpdate(user.id, analysis);
    } catch (error) {
      console.error('Error fetching weak sections:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!subject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Subject Not Found</h1>
          <Link to="/test-series">
            <Button>Back to Test Series</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Mock data for chapter tests
  const chapterTests: ChapterTest[] = [
    {
      id: '1',
      title: 'Constitutional Framework',
      description: 'Basic principles and structure of Indian Constitution',
      questions: 25,
      duration: 30,
      difficulty: 'Medium',
      completed: true,
      score: 18,
      maxScore: 25
    },
    {
      id: '2',
      title: 'Fundamental Rights',
      description: 'Rights guaranteed by the Constitution',
      questions: 20,
      duration: 25,
      difficulty: 'Easy',
      completed: true,
      score: 16,
      maxScore: 20
    },
    {
      id: '3',
      title: 'Directive Principles',
      description: 'State policy guidelines and principles',
      questions: 30,
      duration: 40,
      difficulty: 'Hard',
      completed: false,
      maxScore: 30
    },
    {
      id: '4',
      title: 'Union Government',
      description: 'Structure and functions of central government',
      questions: 35,
      duration: 45,
      difficulty: 'Medium',
      completed: false,
      maxScore: 35
    },
    {
      id: '5',
      title: 'State Government',
      description: 'State administration and governance',
      questions: 25,
      duration: 35,
      difficulty: 'Medium',
      completed: false,
      maxScore: 25
    }
  ];

  // Real weak sections are now loaded from state

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
      case 'Hard':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": `${subject.name} Mock Tests`,
    "description": `Comprehensive mock tests for ${subject.name} including chapter-wise tests and weak section analysis`,
    "provider": {
      "@type": "Organization",
      "name": "UPSC Prep Platform"
    }
  };

  return (
    <>
      <SEOHead
        title={`${subject.name} Mock Tests - Chapter-wise & Full Tests`}
        description={`Practice ${subject.name} with chapter-wise tests, full mock tests, and personalized weak section analysis for UPSC preparation.`}
        keywords={`${subject.name}, UPSC, mock test, chapter test, practice questions, ${subjectId}`}
        structuredData={structuredData}
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/test-series">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{subject.icon}</span>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{subject.name}</h1>
                <p className="text-muted-foreground">{subject.description}</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="chapters" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="chapters" className="text-xs sm:text-sm">Chapter Tests</TabsTrigger>
              <TabsTrigger value="full" className="text-xs sm:text-sm">Full Test</TabsTrigger>
              <TabsTrigger value="weak" className="text-xs sm:text-sm">Weak Sections</TabsTrigger>
            </TabsList>

            {/* Chapter-wise Tests */}
            <TabsContent value="chapters">
              <div className="grid gap-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-foreground">Chapter-wise Tests</h2>
                  <Badge variant="secondary">
                    {subjectTests.filter(test => test.test_type === 'chapter').length} Available
                  </Badge>
                </div>
                
                {/* Real subject tests from admin */}
                {subjectTests.filter(test => test.test_type === 'chapter').length > 0 && (
                  <div className="grid gap-4 mb-8">
                    <h3 className="text-lg font-medium text-foreground">Available Chapter Tests</h3>
                     {subjectTests.filter(test => test.test_type === 'chapter').map((test) => (
                       <Card key={test.id} className="p-4 sm:p-6">
                         <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                                  {test.attempted && <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />}
                                  {test.title}
                                </h3>
                                <div className="flex gap-2">
                                  <Badge className={getDifficultyColor(test.difficulty)}>
                                    {test.difficulty}
                                  </Badge>
                                  {test.attempted && (
                                    <Badge variant="default">Completed</Badge>
                                  )}
                                </div>
                              </div>
                             
                             <p className="text-muted-foreground mb-4 text-sm">{test.description}</p>
                             
                             <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
                               <div className="flex items-center gap-1">
                                 <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                                 {test.total_questions} Questions
                               </div>
                               <div className="flex items-center gap-1">
                                 <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                 {test.duration} min
                               </div>
                               {test.chapter_name && (
                                 <Badge variant="outline" className="text-xs">{test.chapter_name}</Badge>
                               )}
                             </div>
                           </div>
                           
                           <div className="flex gap-2">
                             <Link to={`/test/${test.id}`} className="flex-1 lg:flex-none">
                               <Button className="w-full" size="sm">Start Test</Button>
                             </Link>
                           </div>
                         </div>
                       </Card>
                     ))}
                   </div>
                 )}

                 {/* Mock chapter tests */}
                 <div className="grid gap-4">
                   <h3 className="text-lg font-medium text-foreground">Practice Chapter Tests</h3>
                   {chapterTests.map((test) => (
                     <Card key={test.id} className="p-4 sm:p-6">
                       <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                         <div className="flex-1">
                           <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                             <h3 className="text-base sm:text-lg font-semibold text-foreground">{test.title}</h3>
                             <div className="flex gap-2">
                               <Badge className={getDifficultyColor(test.difficulty)}>
                                 {test.difficulty}
                               </Badge>
                               {test.completed && (
                                 <Badge variant="default">Completed</Badge>
                               )}
                             </div>
                           </div>
                           
                           <p className="text-muted-foreground mb-4 text-sm">{test.description}</p>
                           
                           <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
                             <div className="flex items-center gap-1">
                               <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                               {test.questions} Questions
                             </div>
                             <div className="flex items-center gap-1">
                               <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                               {test.duration} min
                             </div>
                             {test.completed && test.score !== undefined && (
                               <div className="flex items-center gap-2">
                                 <span className="font-medium text-foreground text-xs">
                                   Score: {test.score}/{test.maxScore}
                                 </span>
                                 <Progress 
                                   value={(test.score / test.maxScore) * 100} 
                                   className="w-12 sm:w-16 h-2"
                                 />
                               </div>
                             )}
                           </div>
                         </div>
                         
                         <div className="flex flex-col sm:flex-row gap-2">
                           {test.completed ? (
                             <>
                               <Button variant="outline" size="sm" className="flex-1 sm:flex-none">View Results</Button>
                               <Button size="sm" className="flex-1 sm:flex-none">Retake</Button>
                             </>
                           ) : (
                             <Button size="sm" className="flex-1 sm:flex-none">Start Test</Button>
                           )}
                         </div>
                       </div>
                     </Card>
                   ))}
                </div>
              </div>
            </TabsContent>

            {/* Full Test */}
            <TabsContent value="full">
              <div className="grid gap-6">
                <h2 className="text-2xl font-semibold text-foreground">Full Subject Test</h2>
                
                {/* Real full tests from admin */}
                {subjectTests.filter(test => test.test_type === 'full').length > 0 && (
                  <div className="grid gap-4 mb-8">
                    <h3 className="text-lg font-medium text-foreground">Available Full Tests</h3>
                    {subjectTests.filter(test => test.test_type === 'full').map((test) => (
                      <Card key={test.id} className="p-8 text-center">
                        <div className="max-w-md mx-auto">
                          <div className="text-4xl mb-4">{subject?.icon}</div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">
                            {test.title}
                          </h3>
                          <p className="text-muted-foreground mb-6">
                            {test.description}
                          </p>
                          
                          <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                            <div className="text-center">
                              <div className="font-semibold text-foreground">{test.total_questions}</div>
                              <div className="text-muted-foreground">Questions</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-foreground">{test.duration}</div>
                              <div className="text-muted-foreground">Minutes</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-foreground">{test.max_score}</div>
                              <div className="text-muted-foreground">Max Score</div>
                            </div>
                          </div>
                          
                          <Link to={`/test/${test.id}`}>
                            <Button size="lg" className="w-full mb-4">
                              Start {test.title}
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Default full test */}
                <Card className="p-8 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="text-4xl mb-4">{subject.icon}</div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Complete {subject.name} Test
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Comprehensive test covering all topics in {subject.name}
                    </p>
                    
                    <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-foreground">150</div>
                        <div className="text-muted-foreground">Questions</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-foreground">180</div>
                        <div className="text-muted-foreground">Minutes</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-foreground">300</div>
                        <div className="text-muted-foreground">Max Score</div>
                      </div>
                    </div>
                    
                    <Button size="lg" className="w-full">
                      Start Full Test
                    </Button>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Weak Sections */}
            <TabsContent value="weak">
              <div className="grid gap-6">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-2xl font-semibold text-foreground">Areas for Improvement</h2>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                
                {loading ? (
                  <Card className="p-8 text-center">
                    <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
                    <p className="text-muted-foreground">Analyzing your test performance...</p>
                  </Card>
                ) : !user ? (
                  <Card className="p-8 text-center">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Login Required</h3>
                    <p className="text-muted-foreground mb-4">
                      Please login to view your personalized weak section analysis
                    </p>
                    <Button>Login</Button>
                  </Card>
                ) : weakSections.length > 0 ? (
                  <div className="grid gap-4">
                    {weakSections.map((section, index) => (
                      <Card key={index} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-semibold text-foreground">{section.topic}</h3>
                          <Badge variant={section.accuracy < 50 ? "destructive" : "secondary"}>
                            {section.accuracy}% Accuracy
                          </Badge>
                        </div>
                        
                        <div className="grid md:grid-cols-4 gap-4 mb-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Questions Attempted:</span>
                            <span className="ml-2 font-medium text-foreground">{section.questionsAttempted}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Correct:</span>
                            <span className="ml-2 font-medium text-emerald-600">{section.totalCorrect}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Incorrect:</span>
                            <span className="ml-2 font-medium text-red-600">{section.totalIncorrect}</span>
                          </div>
                          <div>
                            <Progress value={section.accuracy} className="w-full" />
                          </div>
                        </div>
                        
                        <div className="bg-muted/50 rounded-lg p-4 mb-4">
                          <h4 className="font-medium text-foreground mb-2">Recommendation:</h4>
                          <p className="text-sm text-muted-foreground">{section.recommendation}</p>
                        </div>
                        
                        <Button variant="outline" size="sm">
                          Practice {section.topic}
                        </Button>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Weak Sections Identified</h3>
                    <p className="text-muted-foreground">
                      {user ? 'Complete more tests to get personalized recommendations' : 'Login and complete tests to get personalized recommendations'}
                    </p>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default SubjectTest;