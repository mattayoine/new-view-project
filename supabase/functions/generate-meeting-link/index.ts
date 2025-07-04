
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MeetingLinkRequest {
  sessionId: string;
  platform: 'google-meet' | 'zoom' | 'teams';
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

    const { sessionId, platform }: MeetingLinkRequest = await req.json();

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    let meetingLink = '';
    
    // For now, we'll generate simple meeting room links
    // In a full implementation, you'd integrate with actual platforms
    switch (platform) {
      case 'google-meet':
        // Generate a Google Meet link (in reality, you'd use Google Calendar API)
        meetingLink = `https://meet.google.com/new`;
        break;
      case 'zoom':
        // Generate a Zoom link (in reality, you'd use Zoom API)
        meetingLink = `https://zoom.us/j/${Math.random().toString(36).substring(2, 15)}`;
        break;
      case 'teams':
        // Generate a Teams link (in reality, you'd use Microsoft Graph API)
        meetingLink = `https://teams.microsoft.com/l/meetup-join/meeting_id`;
        break;
      default:
        meetingLink = `https://meet.google.com/new`;
    }

    // Update session with meeting link
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ 
        meeting_link: meetingLink,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    console.log(`Generated ${platform} meeting link for session ${sessionId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        meetingLink,
        platform,
        message: 'Meeting link generated successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Generate meeting link error:', error);
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
