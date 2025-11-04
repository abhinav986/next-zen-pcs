import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationRequest {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  userIds?: string[]; // Optional: send to specific users, otherwise sends to all
}

const PRIVATE_VAPID_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const PUBLIC_VAPID_KEY = "BEl62iUYgUivxIkv-IXgWruiBzezocng7L7w9hvYW0h18dJVwx-6HaMQE0dC7r6jWqJmP9DfqdJpWRr7cNIHYKQ";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, body, url, tag, userIds }: PushNotificationRequest = await req.json();

    console.log(`Sending push notification: ${title}`);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get subscriptions
    let query = supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('is_enabled', true);

    if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds);
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active subscriptions found', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${subscriptions.length} active subscriptions`);

    // Prepare notification payload
    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
      tag: tag || 'upsc-notification',
    });

    let successCount = 0;
    let failureCount = 0;

    // Send to each subscription using Web Push Protocol
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        // Send push notification using web-push protocol
        await sendWebPush(pushSubscription, payload, PUBLIC_VAPID_KEY, PRIVATE_VAPID_KEY);
        successCount++;
      } catch (error: any) {
        console.error(`Failed to send to ${subscription.endpoint}:`, error.message);
        failureCount++;

        // If the subscription is invalid, remove it
        if (error.message.includes('410') || error.message.includes('404')) {
          await supabaseClient
            .from('push_subscriptions')
            .delete()
            .eq('id', subscription.id);
          console.log(`Removed invalid subscription: ${subscription.id}`);
        }
      }
    }

    console.log(`Sent ${successCount} notifications, ${failureCount} failures`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: failureCount,
        total: subscriptions.length
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-push-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

// Web Push implementation
async function sendWebPush(
  subscription: any,
  payload: string,
  publicKey: string,
  privateKey: string
) {
  const endpoint = subscription.endpoint;
  
  // For now, we'll use a simple fetch to the endpoint
  // In production, you'd use proper VAPID authentication
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'TTL': '86400',
    },
    body: payload,
  });

  if (!response.ok) {
    throw new Error(`Push failed with status: ${response.status}`);
  }

  return response;
}

serve(handler);
