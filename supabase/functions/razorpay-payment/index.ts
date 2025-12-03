import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error('Missing Razorpay credentials');
      return new Response(
        JSON.stringify({ error: 'Razorpay credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, ...body } = await req.json();

    console.log(`Processing Razorpay action: ${action}`);

    if (action === 'create-order') {
      const { userId, amount, testSeriesType } = body;

      // Create Razorpay order
      const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
        },
        body: JSON.stringify({
          amount: amount * 100, // Razorpay expects amount in paise
          currency: 'INR',
          receipt: `upsc_${Date.now()}`,
          notes: {
            userId,
            testSeriesType,
          },
        }),
      });

      const orderData = await orderResponse.json();
      console.log('Razorpay order created:', orderData.id);

      if (orderData.error) {
        console.error('Razorpay order error:', orderData.error);
        return new Response(
          JSON.stringify({ error: orderData.error.description }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Store the order in database
      const { error: dbError } = await supabase
        .from('test_series_purchases')
        .insert({
          user_id: userId,
          test_series_type: testSeriesType,
          razorpay_order_id: orderData.id,
          amount: amount,
          status: 'pending',
        });

      if (dbError) {
        console.error('Database error:', dbError);
      }

      return new Response(
        JSON.stringify({
          orderId: orderData.id,
          amount: orderData.amount,
          currency: orderData.currency,
          keyId: RAZORPAY_KEY_ID,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify-payment') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = body;

      // Verify signature
      const generatedSignature = createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .toString();

      const isValid = generatedSignature === razorpay_signature;
      console.log('Payment verification result:', isValid);

      if (isValid) {
        // Update purchase status
        const { error: updateError } = await supabase
          .from('test_series_purchases')
          .update({
            razorpay_payment_id,
            razorpay_signature,
            status: 'completed',
            purchased_at: new Date().toISOString(),
          })
          .eq('razorpay_order_id', razorpay_order_id)
          .eq('user_id', userId);

        if (updateError) {
          console.error('Update error:', updateError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to update purchase' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid signature' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
