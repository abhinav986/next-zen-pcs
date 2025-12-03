import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { 
  BookOpen, Clock, Target, Award, ArrowLeft, Lock, 
  FileText, BarChart3, Users, Loader2 
} from "lucide-react";

interface TestCard {
  id: string;
  title: string;
  description: string;
  type: 'gs' | 'csat';
  duration: number;
  questions: number;
  isLocked: boolean;
}

const gsTests: TestCard[] = Array.from({ length: 15 }, (_, i) => ({
  id: `gs-${i + 1}`,
  title: `GS Full Mock Test ${i + 1}`,
  description: `Full-length General Studies paper covering all subjects`,
  type: 'gs',
  duration: 120,
  questions: 100,
  isLocked: false,
}));

const csatTests: TestCard[] = Array.from({ length: 8 }, (_, i) => ({
  id: `csat-${i + 1}`,
  title: `CSAT Mock Test ${i + 1}`,
  description: `Comprehensive CSAT paper with reasoning & comprehension`,
  type: 'csat',
  duration: 120,
  questions: 80,
  isLocked: false,
}));

const PremiumTestSeries = () => {
  const [user, setUser] = useState<any>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'gs' | 'csat'>('gs');
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    
    if (session?.user) {
      await checkPurchaseStatus(session.user.id);
    } else {
      setLoading(false);
      navigate('/auth');
    }
  };

  const checkPurchaseStatus = async (userId: string) => {
    const { data } = await supabase
      .from('test_series_purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('test_series_type', 'upsc_2026_premium')
      .eq('status', 'completed')
      .maybeSingle();

    setHasPurchased(!!data);
    setLoading(false);

    if (!data) {
      toast({
        title: "Access Denied",
        description: "Please purchase the test series to access tests",
        variant: "destructive",
      });
      navigate('/test-series');
    }
  };

  const handleStartTest = (testId: string) => {
    // For now, show a toast - you can link to actual test pages later
    toast({
      title: "Test Starting",
      description: `Loading ${testId}...`,
    });
    // navigate(`/test/${testId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasPurchased) {
    return null;
  }

  const currentTests = activeTab === 'gs' ? gsTests : csatTests;

  return (
    <>
      <SEOHead 
        title="UPSC 2026 Premium Test Series | UPSC Prep Academy"
        description="Access your premium UPSC 2026 mock tests including GS and CSAT full-length papers."
      />
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate('/test-series')} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Test Series
            </Button>
            
            <div className="flex items-center gap-3 mb-2">
              <Award className="h-8 w-8 text-yellow-500" />
              <h1 className="text-3xl font-bold">UPSC 2026 Premium Test Series</h1>
              <Badge className="bg-green-500">Purchased</Badge>
            </div>
            <p className="text-muted-foreground">
              Welcome! You have access to all 23 full-length mock tests.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">23</p>
                  <p className="text-sm text-muted-foreground">Total Tests</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">15</p>
                  <p className="text-sm text-muted-foreground">GS Papers</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Target className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-sm text-muted-foreground">CSAT Papers</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <Button 
              variant={activeTab === 'gs' ? 'default' : 'outline'}
              onClick={() => setActiveTab('gs')}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              General Studies ({gsTests.length})
            </Button>
            <Button 
              variant={activeTab === 'csat' ? 'default' : 'outline'}
              onClick={() => setActiveTab('csat')}
            >
              <Target className="h-4 w-4 mr-2" />
              CSAT ({csatTests.length})
            </Button>
          </div>

          {/* Test Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentTests.map((test) => (
              <Card key={test.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={test.type === 'gs' ? 'default' : 'secondary'}>
                      {test.type.toUpperCase()}
                    </Badge>
                    {test.isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <CardTitle className="text-lg">{test.title}</CardTitle>
                  <CardDescription>{test.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {test.duration} mins
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {test.questions} Qs
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => handleStartTest(test.id)}
                    disabled={test.isLocked}
                  >
                    Start Test
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default PremiumTestSeries;
