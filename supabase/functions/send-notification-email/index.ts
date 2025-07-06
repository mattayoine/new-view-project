
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationEmailRequest {
  notificationId?: string;
  userId: string;
  title: string;
  message: string;
  priority?: string;
  type?: string;
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
      notificationId,
      userId, 
      title, 
      message, 
      priority = 'normal',
      type = 'system'
    }: NotificationEmailRequest = await req.json();

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Check user notification preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('email_enabled')
      .eq('user_id', userId)
      .single();

    // Skip if user has disabled email notifications (except for urgent/escalation)
    if (preferences && !preferences.email_enabled && priority !== 'urgent' && type !== 'escalation') {
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'Email notifications disabled' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const priorityColor = priority === 'urgent' ? '#dc2626' : priority === 'high' ? '#ea580c' : '#2563eb';
    const priorityLabel = priority === 'urgent' ? 'URGENT' : priority === 'high' ? 'HIGH PRIORITY' : 'NOTIFICATION';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${priorityColor}; color: white; padding: 16px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 18px;">${priorityLabel}</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin: 0 0 16px 0;">${title}</h2>
          
          <div style="background: white; padding: 16px; border-radius: 8px; border-left: 4px solid ${priorityColor};">
            <p style="color: #374151; line-height: 1.6; margin: 0;">${message}</p>
          </div>
          
          <div style="text-align: center; margin: 24px 0;">
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('xbrjocsiqgoomlqkrbky.supabase.co', 'new-view-project.lovable.app')}/login" 
               style="background: ${priorityColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              View in Dashboard →
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
          <p>This notification was sent from the CoPilot platform.</p>
          <p>
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('xbrjocsiqgoomlqkrbky.supabase.co', 'new-view-project.lovable.app')}/settings" 
               style="color: #6b7280;">Manage notification preferences</a>
          </p>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'CoPilot Notifications <notifications@copilot.dev>',
      to: [user.email],
      subject: `${priorityLabel}: ${title}`,
      html: emailHtml,
    });

    if (error) throw error;

    // Log the notification delivery
    await supabase
      .from('notification_deliveries')
      .insert({
        notification_id: notificationId,
        channel: 'email',
        status: 'delivered',
        sent_at: new Date().toISOString(),
        provider: 'resend',
        provider_message_id: data?.id || null,
      });

    console.log('Notification email sent:', data);

    return new Response(
      JSON.stringify({ success: true, messageId: data?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Notification email error:', error);
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
