import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Timer, Users, Trophy, BookOpen, Target, Clock, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { upscSubjects } from "@/data/upscSubjects";
import { Link } from "react-router-dom";

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
}

const TestSeries = () => {
  const [filter, setFilter] = useState<'all' | 'attempted' | 'pending'>('all');

  const testSeries: TestSeries[] = [
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
      attempted: true,
      score: 164
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
      attempted: false
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
      attempted: true,
      score: 78
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
      attempted: false
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
      attempted: false
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
      attempted: false
    }
  ];

  const filteredTests = testSeries.filter(test => {
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
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {test.attempted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                          {test.title}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {test.description}
                        </CardDescription>
                      </div>
                      <Badge className={getDifficultyColor(test.difficulty)}>
                        {test.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <span>{test.duration} mins</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span>{test.questions} questions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{test.participants.toLocaleString()} taken</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                        <span>{test.maxScore} marks</span>
                      </div>
                    </div>

                    {test.attempted && test.score && (
                      <div className="mb-4 p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Your Score</span>
                          <span className="text-sm font-bold">
                            {test.score}/{test.maxScore} ({Math.round((test.score / test.maxScore) * 100)}%)
                          </span>
                        </div>
                        <Progress value={(test.score / test.maxScore) * 100} className="h-2" />
                      </div>
                    )}

                    <div className="flex gap-3">
                      {test.attempted ? (
                        <>
                          <Button variant="outline" className="flex-1">
                            <Target className="h-4 w-4 mr-2" />
                            Retake Test
                          </Button>
                          <Button className="flex-1">
                            View Results
                          </Button>
                        </>
                       ) : (
                        <Button 
                          className="flex-1"
                          onClick={() => {
                            if (test.id === 'polity-advanced-new') {
                              window.location.href = '/polity-test';
                            }
                          }}
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Start Test
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