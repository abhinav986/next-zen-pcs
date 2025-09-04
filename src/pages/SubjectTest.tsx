import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Users, Target, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { SEOHead } from "@/components/SEOHead";
import { getSubjectById } from "@/data/upscSubjects";

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

interface WeakSection {
  topic: string;
  accuracy: number;
  questionsAttempted: number;
  averageTime: number;
  recommendation: string;
}

const SubjectTest = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const subject = subjectId ? getSubjectById(subjectId) : null;

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

  // Mock data for weak sections
  const weakSections: WeakSection[] = [
    {
      topic: 'Constitutional Amendments',
      accuracy: 45,
      questionsAttempted: 20,
      averageTime: 2.3,
      recommendation: 'Focus on recent amendments and their significance'
    },
    {
      topic: 'Judicial Review',
      accuracy: 52,
      questionsAttempted: 15,
      averageTime: 3.1,
      recommendation: 'Practice landmark case studies'
    },
    {
      topic: 'Emergency Provisions',
      accuracy: 38,
      questionsAttempted: 18,
      averageTime: 2.8,
      recommendation: 'Understand different types of emergencies and their implications'
    }
  ];

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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chapters">Chapter Tests</TabsTrigger>
              <TabsTrigger value="full">Full Test</TabsTrigger>
              <TabsTrigger value="weak">Weak Sections</TabsTrigger>
            </TabsList>

            {/* Chapter-wise Tests */}
            <TabsContent value="chapters">
              <div className="grid gap-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-foreground">Chapter-wise Tests</h2>
                  <Badge variant="secondary">
                    {chapterTests.filter(test => test.completed).length} / {chapterTests.length} Completed
                  </Badge>
                </div>
                
                <div className="grid gap-4">
                  {chapterTests.map((test) => (
                    <Card key={test.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{test.title}</h3>
                            <Badge className={getDifficultyColor(test.difficulty)}>
                              {test.difficulty}
                            </Badge>
                            {test.completed && (
                              <Badge variant="default">Completed</Badge>
                            )}
                          </div>
                          
                          <p className="text-muted-foreground mb-4">{test.description}</p>
                          
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              {test.questions} Questions
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {test.duration} min
                            </div>
                            {test.completed && test.score !== undefined && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">
                                  Score: {test.score}/{test.maxScore}
                                </span>
                                <Progress 
                                  value={(test.score / test.maxScore) * 100} 
                                  className="w-16 h-2"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {test.completed ? (
                            <>
                              <Button variant="outline">View Results</Button>
                              <Button>Retake</Button>
                            </>
                          ) : (
                            <Button>Start Test</Button>
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
                </div>
                
                {weakSections.length > 0 ? (
                  <div className="grid gap-4">
                    {weakSections.map((section, index) => (
                      <Card key={index} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-semibold text-foreground">{section.topic}</h3>
                          <Badge variant={section.accuracy < 50 ? "destructive" : "secondary"}>
                            {section.accuracy}% Accuracy
                          </Badge>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-4 mb-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Questions Attempted:</span>
                            <span className="ml-2 font-medium text-foreground">{section.questionsAttempted}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Avg. Time:</span>
                            <span className="ml-2 font-medium text-foreground">{section.averageTime} min</span>
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
                      Complete more tests to get personalized recommendations
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