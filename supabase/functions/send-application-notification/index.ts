
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  applicationId: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId, status, rejectionReason }: NotificationRequest = await req.json();

    // Get application details
    const { data: application, error: appError } = await supabase
      .from('base_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      throw new Error('Application not found');
    }

    let emailHtml = '';
    let subject = '';

    if (status === 'approved') {
      subject = 'Your CoPilot Application Has Been Approved! 🎉';
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a;">Welcome to CoPilot!</h1>
          <p>Dear ${application.name},</p>
          
          <p>We're excited to inform you that your application to join CoPilot as a <strong>${application.type}</strong> has been approved!</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #16a34a; margin-top: 0;">What's Next?</h3>
            <ul>
              <li>Your user account has been automatically created</li>
              <li>You can now log in to the platform</li>
              <li>Complete your profile setup</li>
              <li>Start connecting with ${application.type === 'founder' ? 'advisors' : 'founders'}</li>
            </ul>
          </div>
          
          <p>We're thrilled to have you join our community of entrepreneurs and advisors!</p>
          
          <p>Best regards,<br>The CoPilot Team</p>
        </div>
      `;
    } else {
      subject = 'Update on Your CoPilot Application';
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">Application Update</h1>
          <p>Dear ${application.name},</p>
          
          <p>Thank you for your interest in joining CoPilot as a <strong>${application.type}</strong>.</p>
          
          <p>After careful review, we're unable to approve your application at this time.</p>
          
          ${rejectionReason ? `
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #dc2626; margin-top: 0;">Feedback:</h3>
              <p>${rejectionReason}</p>
            </div>
          ` : ''}
          
          <p>We encourage you to reapply in the future as your experience and qualifications develop.</p>
          
          <p>Best regards,<br>The CoPilot Team</p>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "CoPilot <noreply@copilot.com>",
      to: [application.email],
      subject: subject,
      html: emailHtml,
    });

    console.log("Application notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending application notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
