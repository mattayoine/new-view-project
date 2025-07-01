
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailWorkflowRequest {
  sessionId: string;
  emailType: 'scheduled' | 'reminder' | 'completed' | 'cancelled' | 'rescheduled';
  recipientType: 'advisor' | 'founder' | 'both';
  customData?: Record<string, any>;
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

    const { sessionId, emailType, recipientType, customData }: EmailWorkflowRequest = await req.json();

    // Get session details with user information
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        assignment:advisor_founder_assignments(
          advisor:users!advisor_id(id, email),
          founder:users!founder_id(id, email)
        )
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    const advisor = session.assignment.advisor;
    const founder = session.assignment.founder;

    // Determine recipients
    const recipients = [];
    if (recipientType === 'advisor' || recipientType === 'both') {
      recipients.push({ email: advisor.email, role: 'advisor' });
    }
    if (recipientType === 'founder' || recipientType === 'both') {
      recipients.push({ email: founder.email, role: 'founder' });
    }

    // Send emails to all recipients
    const emailResults = await Promise.all(
      recipients.map(recipient => 
        sendSessionEmail(session, emailType, recipient, customData)
      )
    );

    // Log email activity
    await supabase
      .from('notification_deliveries')
      .insert(
        emailResults.map(result => ({
          notification_id: null,
          channel: 'email',
          status: result.success ? 'delivered' : 'failed',
          sent_at: new Date().toISOString(),
          error_message: result.error || null,
          provider: 'resend',
          provider_message_id: result.messageId || null,
        }))
      );

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: emailResults.filter(r => r.success).length,
        results: emailResults 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Email workflow error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

async function sendSessionEmail(
  session: any, 
  emailType: string, 
  recipient: { email: string; role: string },
  customData?: Record<string, any>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  try {
    const emailData = await generateEmailContent(session, emailType, recipient.role, customData);
    
    const { data, error } = await resend.emails.send({
      from: 'CoPilot Sessions <sessions@copilot.dev>',
      to: [recipient.email],
      subject: emailData.subject,
      html: emailData.html,
    });

    if (error) throw error;

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}

async function generateEmailContent(
  session: any, 
  emailType: string, 
  role: string,
  customData?: Record<string, any>
): Promise<{ subject: string; html: string }> {
  
  const advisor = session.assignment.advisor;
  const founder = session.assignment.founder;
  const recipientName = role === 'advisor' ? 'Advisor' : founder.email.split('@')[0];
  const otherParty = role === 'advisor' ? founder.email.split('@')[0] : 'your advisor';
  
  const sessionDate = new Date(session.scheduled_at).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const sessionTime = new Date(session.scheduled_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  let subject = '';
  let html = '';

  switch (emailType) {
    case 'scheduled':
      subject = `Session Confirmed: ${session.title}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Session Confirmed</h2>
          <p>Hi ${recipientName},</p>
          <p>Your session has been scheduled and confirmed:</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">${session.title}</h3>
            <p><strong>Date:</strong> ${sessionDate}</p>
            <p><strong>Time:</strong> ${sessionTime}</p>
            <p><strong>Duration:</strong> ${session.duration_minutes} minutes</p>
            <p><strong>With:</strong> ${otherParty}</p>
            ${session.meeting_link ? `<p><strong>Meeting Link:</strong> <a href="${session.meeting_link}">${session.meeting_link}</a></p>` : ''}
          </div>
          ${session.description ? `<p><strong>Session Description:</strong><br>${session.description}</p>` : ''}
          ${session.preparation_notes ? `<p><strong>Preparation Notes:</strong><br>${session.preparation_notes}</p>` : ''}
          <p>This event has been added to your calendar automatically.</p>
          <p>Best regards,<br>The CoPilot Team</p>
        </div>
      `;
      break;

    case 'reminder':
      subject = `Reminder: Your session with ${otherParty} is tomorrow`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Session Reminder</h2>
          <p>Hi ${recipientName},</p>
          <p>This is a friendly reminder that you have a session scheduled for tomorrow:</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">${session.title}</h3>
            <p><strong>Date:</strong> ${sessionDate}</p>
            <p><strong>Time:</strong> ${sessionTime}</p>
            <p><strong>Duration:</strong> ${session.duration_minutes} minutes</p>
            ${session.meeting_link ? `<p><strong>Meeting Link:</strong> <a href="${session.meeting_link}" style="color: #2563eb;">Join Meeting</a></p>` : ''}
          </div>
          ${session.preparation_notes ? `<p><strong>Preparation Notes:</strong><br>${session.preparation_notes}</p>` : ''}
          <p>We look forward to a productive session!</p>
          <p>Best regards,<br>The CoPilot Team</p>
        </div>
      `;
      break;

    case 'completed':
      subject = `Session Complete: ${session.title}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Session Completed</h2>
          <p>Hi ${recipientName},</p>
          <p>Thank you for completing your session:</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">${session.title}</h3>
            <p><strong>Date:</strong> ${sessionDate}</p>
            <p><strong>Duration:</strong> ${session.duration_minutes} minutes</p>
            <p><strong>With:</strong> ${otherParty}</p>
          </div>
          <p>We hope you found the session valuable. Please take a moment to provide feedback when you have a chance.</p>
          <p>Your session summary and action items will be available in your dashboard shortly.</p>
          <p>Best regards,<br>The CoPilot Team</p>
        </div>
      `;
      break;

    case 'cancelled':
      subject = `Session Cancelled: ${session.title}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Session Cancelled</h2>
          <p>Hi ${recipientName},</p>
          <p>We wanted to inform you that the following session has been cancelled:</p>
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">${session.title}</h3>
            <p><strong>Original Date:</strong> ${sessionDate}</p>
            <p><strong>Original Time:</strong> ${sessionTime}</p>
            <p><strong>With:</strong> ${otherParty}</p>
          </div>
          ${customData?.reason ? `<p><strong>Reason:</strong> ${customData.reason}</p>` : ''}
          <p>The calendar event has been removed automatically. Please reach out if you'd like to reschedule.</p>
          <p>Best regards,<br>The CoPilot Team</p>
        </div>
      `;
      break;

    case 'rescheduled':
      subject = `Session Rescheduled: ${session.title}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Session Rescheduled</h2>
          <p>Hi ${recipientName},</p>
          <p>Your session has been rescheduled to a new time:</p>
          <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">${session.title}</h3>
            <p><strong>New Date:</strong> ${sessionDate}</p>
            <p><strong>New Time:</strong> ${sessionTime}</p>
            <p><strong>Duration:</strong> ${session.duration_minutes} minutes</p>
            <p><strong>With:</strong> ${otherParty}</p>
            ${session.meeting_link ? `<p><strong>Meeting Link:</strong> <a href="${session.meeting_link}">${session.meeting_link}</a></p>` : ''}
          </div>
          <p>Your calendar has been updated automatically with the new time.</p>
          <p>Best regards,<br>The CoPilot Team</p>
        </div>
      `;
      break;
  }

  return { subject, html };
}

serve(handler);
