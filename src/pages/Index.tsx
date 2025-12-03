import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, BookOpen, Trophy, Users, ArrowRight, MessageCircle, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";
import { PremiumTestSeriesCard } from "@/components/PremiumTestSeriesCard";

const Index = () => {
  return (
    <>
      <div className="min-h-screen bg-background pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Master the <span className="text-primary">UPSC</span> Civil Services Exam
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
                Comprehensive preparation platform with test series, study materials, and performance analytics 
                to help you crack the Civil Services Examination.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-6" asChild>
                  <Link to="/dashboard">
                    <Target className="h-5 w-5 mr-2" />
                    Start Preparation
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
                  <Link to="/test-series">
                    Take Mock Test
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Everything You Need for UPSC Success
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Structured preparation, comprehensive materials, and detailed analytics to maximize your chances of success.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Mock Test Series</CardTitle>
                  <CardDescription>
                    Full-length mock tests simulating actual UPSC Prelims and Mains examination pattern
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>✓ 100+ Mock Tests</li>
                    <li>✓ Detailed Solutions</li>
                    <li>✓ Performance Analytics</li>
                    <li>✓ All India Ranking</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto h-16 w-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                    <BookOpen className="h-8 w-8 text-secondary-foreground" />
                  </div>
                  <CardTitle className="text-xl">Study Materials</CardTitle>
                  <CardDescription>
                    Comprehensive notes and resources covering entire UPSC syllabus with regular updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>✓ Subject-wise Notes</li>
                    <li>✓ Current Affairs</li>
                    <li>✓ Previous Years Papers</li>
                    <li>✓ Monthly Magazines</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto h-16 w-16 bg-accent/50 rounded-full flex items-center justify-center mb-4">
                    <Trophy className="h-8 w-8 text-accent-foreground" />
                  </div>
                  <CardTitle className="text-xl">Performance Tracking</CardTitle>
                  <CardDescription>
                    Advanced analytics to track your progress and identify areas for improvement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>✓ Score Analysis</li>
                    <li>✓ Time Management</li>
                    <li>✓ Weakness Identification</li>
                    <li>✓ Progress Reports</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">AI Chat Support</CardTitle>
                  <CardDescription>
                    Get instant help and guidance from our AI assistant for your preparation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>✓ 24/7 Availability</li>
                    <li>✓ Subject Guidance</li>
                    <li>✓ Doubt Resolution</li>
                    <li>✓ Study Planning</li>
                  </ul>
                  <Button asChild className="mt-4 w-full">
                    <Link to="/chat">
                      Start Chat
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto h-16 w-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                    <Newspaper className="h-8 w-8 text-secondary-foreground" />
                  </div>
                  <CardTitle className="text-xl">Current Affairs</CardTitle>
                  <CardDescription>
                    Stay updated with latest current affairs and their UPSC relevance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>✓ Daily Updates</li>
                    <li>✓ UPSC Analysis</li>
                    <li>✓ Monthly Compilation</li>
                    <li>✓ Subject-wise Coverage</li>
                  </ul>
                  <Button asChild variant="outline" className="mt-4 w-full">
                    <Link to="/current-affairs">
                      Explore Articles
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Premium Test Series */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                UPSC 2026 Premium Test Series
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get complete access to full-length mock tests with detailed analysis
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <PremiumTestSeriesCard variant="full" />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">10,000+</div>
                <p className="text-muted-foreground">Active Students</p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">500+</div>
                <p className="text-muted-foreground">Mock Tests</p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">95%</div>
                <p className="text-muted-foreground">Success Rate</p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">24/7</div>
                <p className="text-muted-foreground">Study Support</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Ready to Start Your UPSC Journey?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of successful candidates who trusted our platform for their UPSC preparation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-6" asChild>
                  <Link to="/dashboard">
                    <Users className="h-5 w-5 mr-2" />
                    Get Started Now
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
                  <Link to="/study-materials">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Explore Materials
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Index;
