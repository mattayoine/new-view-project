
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EscalationNotificationRequest {
  messageId: string;
  recipientId: string;
  senderId: string;
  content: string;
  severity?: string;
  priority?: string;
  assignmentId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      messageId, 
      recipientId, 
      senderId, 
      content, 
      severity = 'high',
      priority = 'high',
      assignmentId 
    }: EscalationNotificationRequest = await req.json();

    // Get recipient and sender details
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', recipientId)
      .single();

    if (recipientError) throw recipientError;

    const { data: sender, error: senderError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', senderId)
      .single();

    if (senderError) throw senderError;

    // Get assignment details if provided
    let assignmentInfo = '';
    if (assignmentId) {
      const { data: assignment } = await supabase
        .from('advisor_founder_assignments')
        .select(`
          *,
          advisor:users!advisor_id(email),
          founder:users!founder_id(email)
        `)
        .eq('id', assignmentId)
        .single();

      if (assignment) {
        assignmentInfo = `
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h4 style="margin: 0 0 8px 0; color: #1f2937;">Assignment Details</h4>
            <p style="margin: 4px 0; color: #4b5563;"><strong>Advisor:</strong> ${assignment.advisor.email}</p>
            <p style="margin: 4px 0; color: #4b5563;"><strong>Founder:</strong> ${assignment.founder.email}</p>
            <p style="margin: 4px 0; color: #4b5563;"><strong>Status:</strong> ${assignment.status}</p>
          </div>
        `;
      }
    }

    const urgencyColor = severity === 'critical' ? '#dc2626' : severity === 'high' ? '#ea580c' : '#d97706';
    const urgencyLabel = severity === 'critical' ? 'CRITICAL' : severity === 'high' ? 'HIGH PRIORITY' : 'ESCALATION';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${urgencyColor}; color: white; padding: 16px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">🚨 ${urgencyLabel} ISSUE ESCALATION</h1>
        </div>
        
        <div style="background: #fef7f0; border: 2px solid ${urgencyColor}; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
          <p style="color: #1f2937; font-size: 16px; margin: 0 0 16px 0;">
            <strong>From:</strong> ${sender.email}
          </p>
          
          ${assignmentInfo}
          
          <div style="background: white; padding: 16px; border-radius: 8px; border-left: 4px solid ${urgencyColor};">
            <h3 style="margin: 0 0 12px 0; color: #1f2937;">Issue Details:</h3>
            <p style="color: #374151; line-height: 1.6; margin: 0;">${content}</p>
          </div>
          
          <div style="margin: 20px 0; padding: 16px; background: #fffbeb; border-radius: 8px; border: 1px solid #fbbf24;">
            <h4 style="margin: 0 0 8px 0; color: #92400e;">⚠️ Immediate Action Required</h4>
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              This ${severity} priority issue requires your immediate attention. Please respond as soon as possible.
            </p>
          </div>
          
          <div style="text-align: center; margin: 24px 0;">
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('xbrjocsiqgoomlqkrbky.supabase.co', 'new-view-project.lovable.app')}/login" 
               style="background: ${urgencyColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              View Message & Respond →
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
          <p>This is an automated escalation notification from the CoPilot platform.</p>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'CoPilot Escalations <escalations@copilot.dev>',
      to: [recipient.email],
      subject: `🚨 ${urgencyLabel}: Immediate Action Required`,
      html: emailHtml,
    });

    if (error) throw error;

    // Log the notification delivery
    await supabase
      .from('notification_deliveries')
      .insert({
        notification_id: null,
        channel: 'email',
        status: 'delivered',
        sent_at: new Date().toISOString(),
        provider: 'resend',
        provider_message_id: data?.id || null,
      });

    console.log('Escalation notification sent:', data);

    return new Response(
      JSON.stringify({ success: true, messageId: data?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Escalation notification error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
