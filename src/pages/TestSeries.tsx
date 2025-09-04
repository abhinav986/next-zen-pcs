import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Timer, Users, Trophy, BookOpen, Target, Clock, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { upscSubjects } from "@/data/upscSubjects";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface TestSeries {
  id: string;
  title: string;
  description: string;
  duration: number;
  questions: number;
  participants: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  subject: string;
  maxScore: number;
  attempted: boolean;
  score?: number;
  // Supabase fields
  total_questions?: number;
  max_score?: number;
  subject_id?: string;
  test_type?: string;
  chapter_name?: string;
  is_active?: boolean;
}

const TestSeries = () => {
  const [filter, setFilter] = useState<'all' | 'attempted' | 'pending'>('all');
  const [realTestSeries, setRealTestSeries] = useState<TestSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userAttempts, setUserAttempts] = useState<Record<string, any>>({});

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTestSeries();
      fetchUserAttempts();
    } else {
      fetchTestSeries();
    }
  }, [user]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  };

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

  const fetchTestSeries = async () => {
    try {
      const { data, error } = await supabase
        .from('test_series')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform Supabase data to match our interface
      const transformedData: TestSeries[] = (data || []).map(test => {
        const validDifficulty = ['Easy', 'Medium', 'Hard'].includes(test.difficulty) 
          ? test.difficulty as 'Easy' | 'Medium' | 'Hard'
          : 'Medium' as 'Easy' | 'Medium' | 'Hard';
        
        const userAttempt = userAttempts[test.title];
        const attempted = !!userAttempt;
        const score = userAttempt ? userAttempt.score : undefined;
        
        return {
          id: test.id,
          title: test.title,
          description: test.description || '',
          duration: test.duration,
          questions: test.total_questions,
          participants: Math.floor(Math.random() * 1000) + 100, // Mock participants for now
          difficulty: validDifficulty,
          subject: test.subject_id ? upscSubjects.find(s => s.id === test.subject_id)?.name || 'General Studies' : 'General Studies',
          maxScore: test.max_score,
          attempted,
          score,
        };
      });

      setRealTestSeries(transformedData);
    } catch (error) {
      console.error('Error fetching test series:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data as fallback - update with user attempts if available
  const mockTestSeries: TestSeries[] = [
    {
      id: 'prelims-1',
      title: 'UPSC Prelims Mock Test 1',
      description: 'Comprehensive test covering Indian Polity, History, and Geography',
      duration: 120,
      questions: 100,
      participants: 1250,
      difficulty: 'Medium',
      subject: 'General Studies',
      maxScore: 200,
      attempted: !!userAttempts['UPSC Prelims Mock Test 1'],
      score: userAttempts['UPSC Prelims Mock Test 1']?.score || (Math.random() > 0.5 ? 164 : undefined)
    },
    {
      id: 'polity-advanced',
      title: 'Indian Polity Advanced Test',
      description: 'Deep dive into Constitutional provisions and Governance',
      duration: 90,
      questions: 75,
      participants: 850,
      difficulty: 'Hard',
      subject: 'Indian Polity',
      maxScore: 150,
      attempted: !!userAttempts['Indian Polity Advanced Test'],
      score: userAttempts['Indian Polity Advanced Test']?.score
    },
    {
      id: 'history-modern',
      title: 'Modern Indian History Test',
      description: 'Freedom struggle, Independence and Post-independence events',
      duration: 60,
      questions: 50,
      participants: 950,
      difficulty: 'Medium',
      subject: 'History',
      maxScore: 100,
      attempted: !!userAttempts['Modern Indian History Test'],
      score: userAttempts['Modern Indian History Test']?.score
    },
    {
      id: 'geography-physical',
      title: 'Physical Geography Test',
      description: 'Geomorphology, Climatology, and Natural vegetation',
      duration: 75,
      questions: 60,
      participants: 720,
      difficulty: 'Easy',
      subject: 'Geography',
      maxScore: 120,
      attempted: !!userAttempts['Physical Geography Test'],
      score: userAttempts['Physical Geography Test']?.score
    },
    {
      id: 'current-affairs',
      title: 'Current Affairs Monthly Test',
      description: 'Latest developments in national and international affairs',
      duration: 45,
      questions: 40,
      participants: 1100,
      difficulty: 'Medium',
      subject: 'Current Affairs',
      maxScore: 80,
      attempted: !!userAttempts['Current Affairs Monthly Test'],
      score: userAttempts['Current Affairs Monthly Test']?.score
    },
    {
      id: 'polity-advanced-new',
      title: 'Indian Polity Advanced Test',
      description: 'Comprehensive test on Indian Constitution, Articles, and Governance',
      duration: 30,
      questions: 10,
      participants: 850,
      difficulty: 'Hard',
      subject: 'Polity',
      maxScore: 20,
      attempted: !!userAttempts['Indian Polity Advanced Test'],
      score: userAttempts['Indian Polity Advanced Test']?.score
    }
  ];

  // Combine real and mock data
  const allTestSeries = [...realTestSeries, ...mockTestSeries];

  const filteredTests = allTestSeries.filter(test => {
    if (filter === 'attempted') return test.attempted;
    if (filter === 'pending') return !test.attempted;
    return true;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Hard': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "UPSC Test Series",
    "description": "Mock tests and practice exams for UPSC Civil Services Examination",
    "educationalUse": "UPSC Test Practice",
    "learningResourceType": "Mock Tests",
    "audience": {
      "@type": "EducationalAudience",
      "educationalRole": "Student"
    }
  };

  return (
    <>
      <SEOHead
        title="UPSC Test Series - Mock Tests & Practice Exams"
        description="Take UPSC mock tests and practice exams for Civil Services preparation. Full-length prelims tests, subject-wise quizzes, and performance analysis for IAS exam."
        keywords="UPSC mock tests, prelims test series, civil services mock test, IAS practice exams, UPSC test series online, mock test for UPSC"
        structuredData={structuredData}
      />
      
      <div className="min-h-screen bg-background pt-16">
        <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Test Series</h1>
                <p className="text-muted-foreground mt-2">Practice mock tests and track your performance</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={filter === 'all' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All Tests
                </Button>
                <Button 
                  variant={filter === 'pending' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('pending')}
                >
                  Pending
                </Button>
                <Button 
                  variant={filter === 'attempted' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('attempted')}
                >
                  Completed
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Test List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Subject-wise Tests */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Subject-wise Tests</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upscSubjects.map((subject) => (
                    <Link key={subject.id} to={`/test-series/${subject.id}`}>
                      <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{subject.icon}</span>
                            <div>
                              <CardTitle className="text-lg">{subject.name}</CardTitle>
                              <CardDescription className="text-sm">
                                {subject.totalTopics} topics • {subject.difficulty}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground mb-3">{subject.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className={subject.color}>
                              {subject.difficulty}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              View Tests →
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>

              {/* General Mock Tests */}
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-4">General Mock Tests</h2>
                {filteredTests.map((test) => (
                <Card key={test.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                          {test.attempted && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />}
                          <span className="break-words">{test.title}</span>
                        </CardTitle>
                        <CardDescription className="mt-2 text-sm">
                          {test.description}
                        </CardDescription>
                      </div>
                      <Badge className={`${getDifficultyColor(test.difficulty)} flex-shrink-0`}>
                        {test.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 mb-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <Timer className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{test.duration} mins</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{test.questions} questions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{test.participants.toLocaleString()} taken</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{test.maxScore} marks</span>
                      </div>
                    </div>

                    {test.attempted && test.score && (
                      <div className="mb-4 p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Score: {test.score}/{test.maxScore}</span>
                          <span className="text-sm font-bold">
                            ({Math.round((test.score / test.maxScore) * 100)}%)
                          </span>
                        </div>
                        <Progress value={(test.score / test.maxScore) * 100} className="h-2" />
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2">
                      {test.attempted ? (
                        <>
                          <Button 
                            variant="outline" 
                            className="flex-1" 
                            size="sm"
                            asChild
                          >
                            <Link to={test.id === 'polity-advanced-new' ? '/polity-test' : `/test-series-test/${test.id}`}>
                              <Target className="h-4 w-4 mr-2" />
                              Retake Test
                            </Link>
                          </Button>
                          <Button 
                            className="flex-1" 
                            size="sm"
                            asChild
                          >
                            <Link to={test.id === 'polity-advanced-new' ? '/polity-test' : `/test-series-test/${test.id}`}>
                              View Results
                            </Link>
                          </Button>
                        </>
                       ) : (
                        <Button 
                          className="flex-1"
                          size="sm"
                          asChild
                        >
                          <Link to={test.id === 'polity-advanced-new' ? '/polity-test' : `/test-series-test/${test.id}`}>
                            <Target className="h-4 w-4 mr-2" />
                            Start Test
                          </Link>
                        </Button>
                       )}
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tests Completed</span>
                    <span className="font-semibold">2/5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average Score</span>
                    <span className="font-semibold">81%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Best Score</span>
                    <span className="font-semibold">164/200</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Time Spent</span>
                    <span className="font-semibold">3h 30m</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Tests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Economics Test</p>
                      <p className="text-xs text-muted-foreground">Available tomorrow</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Full Mock Test 2</p>
                      <p className="text-xs text-muted-foreground">Available in 3 days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default TestSeries;