
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
      subject = 'Welcome to CoPilot - Your Account is Ready! 🎉';
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #2563eb, #10b981); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="color: white; font-size: 24px; font-weight: bold;">C</span>
            </div>
            <h1 style="color: #16a34a; margin: 0;">Welcome to CoPilot!</h1>
          </div>
          
          <p style="font-size: 16px; color: #374151;">Dear ${application.name},</p>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Congratulations! Your application to join CoPilot as a <strong>${application.type}</strong> has been approved.
          </p>
          
          <div style="background-color: #f0fdf4; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #16a34a;">
            <h3 style="color: #16a34a; margin-top: 0; font-size: 18px;">🚀 Your Account is Ready!</h3>
            <ul style="color: #166534; margin: 12px 0; padding-left: 20px; line-height: 1.8;">
              <li><strong>User account created</strong> with secure login access</li>
              <li><strong>Profile activated</strong> and ready for connections</li>
              <li><strong>Dashboard access enabled</strong> - start exploring immediately</li>
              <li><strong>${application.type === 'founder' ? 'Advisor matching' : 'Founder matching'} system activated</strong></li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${supabaseUrl.replace('xbrjocsiqgoomlqkrbky.supabase.co', 'new-view-project.lovable.app')}/login" 
               style="background: linear-gradient(135deg, #2563eb, #10b981); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Access Your Dashboard →
            </a>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <h4 style="color: #1f2937; margin-top: 0;">Next Steps:</h4>
            <ol style="color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Log in using your email address: <strong>${application.email}</strong></li>
              <li>Complete any remaining profile details</li>
              <li>${application.type === 'founder' ? 'Connect with advisors and schedule sessions' : 'Start mentoring founders and sharing your expertise'}</li>
              <li>Explore the platform features and resources</li>
            </ol>
          </div>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            We're excited to have you join our community of entrepreneurs and advisors. Together, we're building the future of African entrepreneurship!
          </p>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 32px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Need help? Reply to this email or contact our support team.
            </p>
            <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0 0;">
              Best regards,<br><strong>The CoPilot Team</strong>
            </p>
          </div>
        </div>
      `;
    } else {
      subject = 'Update on Your CoPilot Application';
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background: #dc2626; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="color: white; font-size: 24px; font-weight: bold;">C</span>
            </div>
            <h1 style="color: #dc2626; margin: 0;">Application Update</h1>
          </div>
          
          <p style="font-size: 16px; color: #374151;">Dear ${application.name},</p>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Thank you for your interest in joining CoPilot as a <strong>${application.type}</strong>.
          </p>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            After careful review, we're unable to approve your application at this time.
          </p>
          
          ${rejectionReason ? `
            <div style="background-color: #fef2f2; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #dc2626;">
              <h3 style="color: #dc2626; margin-top: 0; font-size: 18px;">Feedback:</h3>
              <p style="color: #7f1d1d; line-height: 1.6; margin: 0;">${rejectionReason}</p>
            </div>
          ` : ''}
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            We encourage you to reapply in the future as your experience and qualifications develop. 
            Keep building, keep growing, and we hope to welcome you to the CoPilot community soon.
          </p>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 32px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0 0;">
              Best regards,<br><strong>The CoPilot Team</strong>
            </p>
          </div>
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
