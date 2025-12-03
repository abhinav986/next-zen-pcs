import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, BookOpen, Clock, Target, Award, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY_ID = "rzp_live_YOUR_KEY_ID"; // This will be replaced dynamically

const features = [
  "15 Full-Length GS Mock Tests",
  "8 Full-Length CSAT Mock Tests",
  "Detailed Performance Analysis",
  "Topic-wise Breakdown",
  "All India Rank Comparison",
  "Expert Mentorship Support",
  "Previous Year Questions Analysis",
  "24/7 Doubt Resolution",
];

interface PremiumTestSeriesCardProps {
  variant?: "compact" | "full";
}

export const PremiumTestSeriesCard = ({ variant = "full" }: PremiumTestSeriesCardProps) => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadRazorpayScript();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    
    if (session?.user) {
      checkPurchaseStatus(session.user.id);
    } else {
      setCheckingPurchase(false);
    }

    supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        checkPurchaseStatus(session.user.id);
      }
    });
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
    setCheckingPurchase(false);
  };

  const loadRazorpayScript = () => {
    if (document.getElementById('razorpay-script')) return;
    
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  };

  const handlePurchase = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to purchase the test series",
      });
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      // Create order via edge function
      const { data, error } = await supabase.functions.invoke('razorpay-payment', {
        body: {
          action: 'create-order',
          userId: user.id,
          amount: 1499,
          testSeriesType: 'upsc_2026_premium',
        },
      });

      if (error) throw error;

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'UPSC Prep Academy',
        description: 'UPSC 2026 Premium Mock Test Series',
        order_id: data.orderId,
        handler: async (response: any) => {
          // Verify payment
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke('razorpay-payment', {
            body: {
              action: 'verify-payment',
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user.id,
            },
          });

          if (verifyError || !verifyData?.success) {
            toast({
              title: "Payment Verification Failed",
              description: "Please contact support if amount was deducted",
              variant: "destructive",
            });
            return;
          }

          toast({
            title: "Payment Successful!",
            description: "Welcome to UPSC 2026 Premium Test Series",
          });
          
          setHasPurchased(true);
          navigate('/test-series/upsc-2026-premium');
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: '#6366f1',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingPurchase) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (hasPurchased) {
    return (
      <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2">
            <Award className="h-6 w-6 text-green-500" />
            <CardTitle className="text-xl">UPSC 2026 Premium</CardTitle>
          </div>
          <Badge className="w-fit mx-auto bg-green-500">Purchased</Badge>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => navigate('/test-series/upsc-2026-premium')} className="bg-green-600 hover:bg-green-700">
            Access Your Tests
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (variant === "compact") {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-lg">UPSC 2026 Premium</CardTitle>
            </div>
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">Premium</Badge>
          </div>
          <CardDescription>15 GS + 8 CSAT Full Tests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-primary">₹1,499</span>
              <span className="text-muted-foreground line-through ml-2">₹2,999</span>
            </div>
            <Button onClick={handlePurchase} disabled={loading} size="sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buy Now"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5 hover:shadow-xl transition-all duration-300 overflow-hidden relative">
      <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-500 to-orange-500 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
        50% OFF
      </div>
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Crown className="h-8 w-8 text-yellow-500" />
          <CardTitle className="text-2xl">UPSC 2026 Premium Mock Test Series</CardTitle>
        </div>
        <CardDescription className="text-base">
          Complete preparation package for UPSC CSE 2026 Prelims
        </CardDescription>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-1 text-sm">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>23 Tests</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span>2 Hours Each</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Target className="h-4 w-4 text-primary" />
            <span>100 Questions</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl font-bold text-primary">₹1,499</span>
            <span className="text-xl text-muted-foreground line-through">₹2,999</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">One-time payment • Lifetime access</p>
        </div>

        <Button 
          onClick={handlePurchase} 
          disabled={loading} 
          size="lg" 
          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Crown className="h-5 w-5 mr-2" />
              Purchase Now
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Secure payment powered by Razorpay • 100% Money-back guarantee
        </p>
      </CardContent>
    </Card>
  );
};
