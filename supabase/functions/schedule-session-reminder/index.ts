
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReminderRequest {
  sessionId: string;
  reminderTime: '24h' | '1h' | '15m';
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

    const { sessionId, reminderTime }: ReminderRequest = await req.json();

    // Get session details
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

    // Calculate reminder time
    const sessionTime = new Date(session.scheduled_at);
    const reminderMinutes = {
      '24h': 24 * 60,
      '1h': 60,
      '15m': 15
    }[reminderTime];

    const reminderTime_Date = new Date(sessionTime.getTime() - reminderMinutes * 60 * 1000);

    // Schedule the reminder (in a real implementation, you'd use a job queue)
    // For now, we'll create a notification record that can be processed by a cron job
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: session.assignment.advisor.id,
          type: 'session_reminder',
          title: `Session Reminder: ${session.title}`,
          message: `Your session "${session.title}" is scheduled in ${reminderTime === '24h' ? '24 hours' : reminderTime === '1h' ? '1 hour' : '15 minutes'}`,
          priority: 'high',
          metadata: {
            session_id: sessionId,
            reminder_type: reminderTime,
            scheduled_for: reminderTime_Date.toISOString()
          }
        },
        {
          user_id: session.assignment.founder.id,
          type: 'session_reminder',
          title: `Session Reminder: ${session.title}`,
          message: `Your session "${session.title}" is scheduled in ${reminderTime === '24h' ? '24 hours' : reminderTime === '1h' ? '1 hour' : '15 minutes'}`,
          priority: 'high',
          metadata: {
            session_id: sessionId,
            reminder_type: reminderTime,
            scheduled_for: reminderTime_Date.toISOString()
          }
        }
      ]);

    if (notificationError) throw notificationError;

    console.log(`Reminder scheduled for ${reminderTime} before session ${sessionId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Reminder scheduled successfully',
        reminderTime: reminderTime_Date.toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Schedule reminder error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
