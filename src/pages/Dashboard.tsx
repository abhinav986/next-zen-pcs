import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Target, Trophy, Calendar, TrendingUp, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "UPSC Prep Academy Dashboard",
    "description": "Personal dashboard for UPSC Civil Services Examination preparation tracking",
    "educationalUse": "UPSC Preparation Tracking",
    "audience": {
      "@type": "EducationalAudience",
      "educationalRole": "Student"
    }
  };

  return (
    <>
      <SEOHead
        title="UPSC Preparation Dashboard - Track Your Progress"
        description="Monitor your UPSC preparation progress with personalized dashboard. Track test scores, study materials completion, and performance analytics for Civil Services Exam."
        keywords="UPSC dashboard, preparation tracking, test scores, study progress, performance analytics, civil services preparation"
        structuredData={structuredData}
      />
      
      <div className="min-h-screen bg-background pt-16">
        <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-2">Track your UPSC preparation progress</p>
              </div>
              <div className="flex gap-3">
                <Button asChild>
                  <Link to="/test-series">
                    <Target className="h-4 w-4 mr-2" />
                    Take Test
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/study-materials">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Study Materials
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Quick Stats */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tests Completed</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">+2 from last week</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78.5%</div>
                <p className="text-xs text-muted-foreground">+5.2% from last month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15 days</div>
                <p className="text-xs text-muted-foreground">Keep it up!</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time Studied</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45h 30m</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </section>

          {/* Progress Section */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Subject-wise Progress
                </CardTitle>
                <CardDescription>Your completion rate across different subjects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Indian Polity</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>History</span>
                    <span>72%</span>
                  </div>
                  <Progress value={72} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Geography</span>
                    <span>65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Economics</span>
                    <span>58%</span>
                  </div>
                  <Progress value={58} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest study sessions and test attempts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Completed Polity Mock Test</p>
                    <p className="text-xs text-muted-foreground">Score: 82% • 2 hours ago</p>
                  </div>
                  <Badge variant="secondary">New</Badge>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Studied Indian History Chapter 5</p>
                    <p className="text-xs text-muted-foreground">45 minutes • Yesterday</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center">
                    <Target className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Geography Quiz Attempt</p>
                    <p className="text-xs text-muted-foreground">Score: 75% • 2 days ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Quick Actions */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Continue your preparation journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button asChild className="h-auto p-6 flex-col gap-2">
                    <Link to="/test-series">
                      <Target className="h-8 w-8" />
                      <div className="text-center">
                        <div className="font-semibold">Take Mock Test</div>
                        <div className="text-xs opacity-90">Full-length practice tests</div>
                      </div>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-6 flex-col gap-2">
                    <Link to="/study-materials">
                      <BookOpen className="h-8 w-8" />
                      <div className="text-center">
                        <div className="font-semibold">Study Materials</div>
                        <div className="text-xs opacity-90">Comprehensive notes & PDFs</div>
                      </div>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-6 flex-col gap-2">
                    <TrendingUp className="h-8 w-8" />
                    <div className="text-center">
                      <div className="font-semibold">Performance Analysis</div>
                      <div className="text-xs opacity-90">Detailed insights & trends</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </>
  );
};

export default Dashboard;