// @ts-nocheck 
// supabase/functions/send-push/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
// Deno can import npm packages:
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VAPID_PUBLIC_KEY  = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;

webpush.setVapidDetails("mailto:admin@nextgenpsc.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, body, url, tag, userIds } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let q = supabase.from("push_subscriptions").select("*").eq("is_enabled", true);
    if (userIds?.length) q = q.in("user_id", userIds);
    const { data: subs, error } = await q;
    if (error) throw new Error(error.message);

    if (!subs?.length) {
      return new Response(JSON.stringify({ message: "No active subscriptions", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({
      title,
      body,
      url: url || "/",
      tag: tag || "upsc-notification",
    });

    let sent = 0, failed = 0;

    await Promise.all(
      subs.map(async (s: any) => {
        // If you stored keys as JSONB column "keys", use s.keys.p256dh / s.keys.auth
        const subscription = {
          endpoint: s.endpoint,
          keys: {
            p256dh: s.keys ? s.keys.p256dh : s.p256dh,
            auth:   s.keys ? s.keys.auth   : s.auth,
          },
        };

        try {
          await webpush.sendNotification(subscription, payload, { TTL: 86400 });
          sent++;
        } catch (err: any) {
          failed++;
          console.error(`Failed to send to ${s.id}:`, err?.statusCode, err?.body || err?.message);

          // Clean up dead subs (expired or gone)
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("id", s.id);
          }
        }
      })
    );

    return new Response(JSON.stringify({ success: true, sent, failed, total: subs.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
