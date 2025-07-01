
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get sessions that need reminders (24 hours before)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startOfTomorrow = new Date(tomorrow);
    startOfTomorrow.setHours(0, 0, 0, 0);
    
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        *,
        assignment:advisor_founder_assignments(
          advisor:users!advisor_id(id, email),
          founder:users!founder_id(id, email)
        )
      `)
      .eq('status', 'scheduled')
      .gte('scheduled_at', startOfTomorrow.toISOString())
      .lte('scheduled_at', endOfTomorrow.toISOString());

    if (error) throw error;

    console.log(`Found ${sessions?.length || 0} sessions needing reminders`);

    // Send reminders for each session
    const reminderPromises = sessions?.map(async (session) => {
      try {
        const { error: emailError } = await supabase.functions.invoke('session-email-workflows', {
          body: {
            sessionId: session.id,
            emailType: 'reminder',
            recipientType: 'both'
          }
        });

        if (emailError) {
          console.error(`Failed to send reminder for session ${session.id}:`, emailError);
          return { sessionId: session.id, success: false, error: emailError.message };
        }

        return { sessionId: session.id, success: true };
      } catch (error: any) {
        console.error(`Error processing reminder for session ${session.id}:`, error);
        return { sessionId: session.id, success: false, error: error.message };
      }
    }) || [];

    const results = await Promise.all(reminderPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Reminder job completed: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sessionsProcessed: sessions?.length || 0,
        remindersSent: successCount,
        failures: failureCount,
        results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Scheduled reminders error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
