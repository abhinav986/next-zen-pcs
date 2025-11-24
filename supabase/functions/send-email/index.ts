// @ts-nocheck 
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
function isHtmlLike(s = "") {
  if (!s) return false;
  const t = String(s).trim().toLowerCase();
  return t.startsWith("<!doctype") || t.startsWith("<html") || t.startsWith("<div") || t.startsWith("<table") || t.includes("<body");
}
function wrapWithShell(htmlContent, opts = {}) {
  // If htmlContent is a full document, return as-is
  if (isHtmlLike(htmlContent)) return htmlContent;
  // else, inject into our outer wrapper
  const unsubscribe = opts.unsubscribe || "https://www.nextgenpsc.com/dashboard";
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      /* Minimal mobile-friendly styles for email clients */
      @media only screen and (max-width:620px) {
        .main-table { width:100% !important; max-width:100% !important; border-radius:8px !important; }
        .btn-inline { display:block !important; width:100% !important; box-sizing:border-box !important; margin-right:0 !important; }
      }
      a { outline:none; }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#f3f6f9;font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="padding:18px 12px; background:#f3f6f9;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="680" class="main-table" style="max-width:680px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid rgba(15,23,42,0.04);">
            <tr>
              <td style="background:linear-gradient(90deg,#4338ca,#2563eb);padding:14px 20px;">
                <div style="color:#ffffff;font-size:20px;font-weight:700;">NextGenPsc</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                ${htmlContent}
                <div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap;">
                  <a href="https://www.nextgenpsc.com/test-series" class="btn-inline" style="display:inline-block;padding:10px 14px;border-radius:8px;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;">Go to Practice Dashboard</a>
                  <a href="https://www.nextgenpsc.com/study-materials" class="btn-inline" style="display:inline-block;padding:10px 14px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;color:#2563eb;text-decoration:none;font-weight:700;">Browse Study Materials</a>
                </div>
                <p style="margin-top:18px;color:#6b7280;font-size:12px;">🎯 NextGenPsc — Keep pushing forward! 💪</p>
                <p style="font-size:12px;color:#9ca3af;margin-top:8px;">If you wish to unsubscribe, <a href="${unsubscribe}" style="color:#9ca3af;text-decoration:underline;">click here</a>.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
const handler = async (req)=>{
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const body = await req.json();
    // Expect either:
    // { email, subject, message }   -> message plain text OR html-like
    // or
    // { email, subject, html }      -> full html provided
    const { email, subject, message, html, type } = body;
    if (!email || !subject || !message && !html) {
      return new Response(JSON.stringify({
        error: "Missing required fields: email, subject, message|html"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    // Choose html source:
    let finalHtml;
    if (html) {
      // user provided full html — trust it (but still wrap if it's not a full doc)
      finalHtml = wrapWithShell(html, {
        unsubscribe: body.unsubscribe || "#"
      });
    } else {
      // message provided (could be plain text or small HTML). If it's HTML-like, use as-is.
      if (isHtmlLike(message)) {
        finalHtml = wrapWithShell(message, {
          unsubscribe: body.unsubscribe || "#"
        });
      } else {
        // Convert plain text to paragraphs (safe)
        const safe = String(message).split(/\n{2,}/).map((para)=>`<p style="margin:0 0 10px 0;color:#475569;font-size:14px;line-height:1.6;">${para.replace(/\n/g, "<br>")}</p>`).join("");
        finalHtml = wrapWithShell(safe, {
          unsubscribe: body.unsubscribe || "#"
        });
      }
    }
    // Send the email via Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "NextGenPsc <team@nextgenpsc.com>",
        to: [
          email
        ],
        subject: subject,
        html: finalHtml
      })
    });
    const emailResponse = await resendResponse.json();
    if (!resendResponse.ok) {
      console.error("Resend error:", emailResponse);
      return new Response(JSON.stringify({
        error: "Resend API error",
        details: emailResponse
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    return new Response(JSON.stringify({
      success: true,
      data: emailResponse
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (err) {
    console.error("send-email error:", err);
    return new Response(JSON.stringify({
      error: err.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
};
serve(handler);
