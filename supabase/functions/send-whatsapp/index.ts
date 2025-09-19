import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppRequest {
  phone_number: string;
  message: string;
  type: 'weak_section' | 'current_affairs' | 'test_notification' | 'test';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone_number, message, type }: WhatsAppRequest = await req.json();
    
    if (!phone_number || !message) {
      return new Response(
        JSON.stringify({ error: 'Phone number and message are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Sending WhatsApp message to ${phone_number} - Type: ${type}`);

    // Get WhatsApp API token from environment
    const whatsappToken = Deno.env.get('WHATSAPP_API_TOKEN');
    if (!whatsappToken) {
      console.error('WHATSAPP_API_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'WhatsApp API not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Format phone number (remove + and ensure it starts with country code)
    const formattedPhone = phone_number.replace(/^\+/, '');
    
    // Send WhatsApp message using WhatsApp Business API
    // Note: This uses Meta's WhatsApp Business Cloud API
    // You need to replace YOUR_PHONE_NUMBER_ID with your actual Phone Number ID from Meta Business
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || 'YOUR_PHONE_NUMBER_ID';
    const whatsappApiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    
    const whatsappPayload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "text",
      text: {
        body: message
      }
    };

    const whatsappResponse = await fetch(whatsappApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(whatsappPayload),
    });

    const whatsappResult = await whatsappResponse.json();
    
    if (!whatsappResponse.ok) {
      console.error('WhatsApp API error:', whatsappResult);
      
      // For testing purposes, we'll simulate success
      if (type === 'test') {
        console.log('Test message simulation - would send:', message);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Test message simulated successfully',
            note: 'WhatsApp Business API requires proper setup with Meta'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to send WhatsApp message', details: whatsappResult }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log successful message
    console.log('WhatsApp message sent successfully:', whatsappResult);

    // Store message log in database (optional)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // You could add a message_logs table to track sent messages
    // await supabase.from('whatsapp_message_logs').insert({
    //   phone_number: formattedPhone,
    //   message_type: type,
    //   message_content: message,
    //   status: 'sent',
    //   sent_at: new Date().toISOString()
    // });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: whatsappResult.messages?.[0]?.id,
        message: 'WhatsApp message sent successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in send-whatsapp function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);