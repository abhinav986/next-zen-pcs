import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { record } = await req.json();
    
    console.log("New comment received:", record);

    // Get the message owner's details
    const { data: message, error: messageError } = await supabase
      .from("chat_messages")
      .select(`
        user_id,
        profiles!inner(email, display_name)
      `)
      .eq("id", record.message_id)
      .single();

    if (messageError || !message) {
      console.error("Error fetching message:", messageError);
      return new Response(JSON.stringify({ error: "Message not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get commenter's details
    const { data: commenter, error: commenterError } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", record.user_id)
      .single();

    if (commenterError) {
      console.error("Error fetching commenter:", commenterError);
    }

    const commenterName = commenter?.display_name || "Someone";
    const messageOwnerEmail = message.profiles?.email;
    const messageOwnerName = message.profiles?.display_name || "User";

    // Don't send email if the commenter is the message owner
    if (record.user_id === message.user_id) {
      console.log("Commenter is message owner, skipping notification");
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!messageOwnerEmail) {
      console.log("Message owner has no email");
      return new Response(JSON.stringify({ error: "No email found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check email preferences
    const { data: preferences } = await supabase
      .from("email_preferences")
      .select("*")
      .eq("user_id", message.user_id)
      .eq("is_enabled", true)
      .single();

    if (!preferences) {
      console.log("User has disabled email notifications");
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send email notification
    const emailData = {
      email: messageOwnerEmail,
      subject: `💬 New Comment on Your Message`,
      message: `Hi ${messageOwnerName},

${commenterName} commented on your message in the chat:

"${record.content}"

Check it out on UPSC Prep Academy!

🎯 UPSC Prep Academy`,
      type: "test",
    };

    const { error: emailError } = await supabase.functions.invoke("send-email", {
      body: emailData,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    console.log("Comment notification sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in notify-comment function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});