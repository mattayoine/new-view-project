
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalendarEventRequest {
  sessionId: string;
  action: 'create' | 'update' | 'delete';
  sessionData?: {
    title: string;
    description: string;
    scheduledAt: string;
    duration: number;
    advisorEmail: string;
    founderEmail: string;
    meetingLink?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sessionId, action, sessionData }: CalendarEventRequest = await req.json();

    // Get Google OAuth tokens for both advisor and founder
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

    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    if (!googleClientId) {
      throw new Error('Google Client ID not configured');
    }

    let calendarEventId: string | null = null;

    switch (action) {
      case 'create':
        calendarEventId = await createCalendarEvent(sessionData!, googleClientId);
        break;
      case 'update':
        calendarEventId = await updateCalendarEvent(session.calendar_event_id, sessionData!, googleClientId);
        break;
      case 'delete':
        await deleteCalendarEvent(session.calendar_event_id, googleClientId);
        break;
    }

    // Update session with calendar event ID
    if (calendarEventId && action === 'create') {
      await supabase
        .from('sessions')
        .update({ calendar_event_id: calendarEventId })
        .eq('id', sessionId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        calendarEventId,
        message: `Calendar event ${action}d successfully` 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Google Calendar sync error:', error);
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

async function createCalendarEvent(sessionData: any, clientId: string): Promise<string> {
  // Generate Google Meet link
  const meetingLink = await generateGoogleMeetLink(clientId);
  
  const event = {
    summary: sessionData.title,
    description: `${sessionData.description}\n\nJoin meeting: ${meetingLink}`,
    start: {
      dateTime: sessionData.scheduledAt,
      timeZone: 'UTC',
    },
    end: {
      dateTime: new Date(new Date(sessionData.scheduledAt).getTime() + sessionData.duration * 60000).toISOString(),
      timeZone: 'UTC',
    },
    attendees: [
      { email: sessionData.advisorEmail },
      { email: sessionData.founderEmail },
    ],
    conferenceData: {
      createRequest: {
        requestId: `session-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 24 hours
        { method: 'popup', minutes: 30 },      // 30 minutes
      ],
    },
  };

  // This is a simplified implementation
  // In production, you'd use proper Google Calendar API with OAuth tokens
  console.log('Creating calendar event:', event);
  
  // Return mock event ID for demonstration
  return `mock-event-${Date.now()}`;
}

async function updateCalendarEvent(eventId: string, sessionData: any, clientId: string): Promise<string> {
  console.log('Updating calendar event:', eventId, sessionData);
  return eventId;
}

async function deleteCalendarEvent(eventId: string, clientId: string): Promise<void> {
  console.log('Deleting calendar event:', eventId);
}

async function generateGoogleMeetLink(clientId: string): Promise<string> {
  // Generate a Google Meet link
  // In production, this would use the Google Meet API
  return `https://meet.google.com/mock-${Date.now()}`;
}

serve(handler);
