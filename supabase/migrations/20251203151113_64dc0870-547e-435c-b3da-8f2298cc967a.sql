-- Create purchases table for test series purchases
CREATE TABLE public.test_series_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  test_series_type TEXT NOT NULL DEFAULT 'upsc_2026_premium',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending',
  purchased_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.test_series_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases"
ON public.test_series_purchases
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own purchases
CREATE POLICY "Users can create their own purchases"
ON public.test_series_purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending purchases
CREATE POLICY "Users can update their own purchases"
ON public.test_series_purchases
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_test_series_purchases_updated_at
BEFORE UPDATE ON public.test_series_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();