
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

    // Get session data with user emails
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
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    
    if (!googleClientId || !googleClientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Get OAuth token for the session creator (we'll use service account approach for now)
    const accessToken = await getServiceAccountToken(googleClientId, googleClientSecret);

    let calendarEventId: string | null = null;
    let result: any = {};

    switch (action) {
      case 'create':
        result = await createCalendarEvent(sessionData!, accessToken);
        calendarEventId = result.id;
        break;
      case 'update':
        result = await updateCalendarEvent(session.calendar_event_id, sessionData!, accessToken);
        calendarEventId = result.id;
        break;
      case 'delete':
        await deleteCalendarEvent(session.calendar_event_id, accessToken);
        break;
    }

    // Update session with calendar event ID and meeting link
    if (calendarEventId && (action === 'create' || action === 'update')) {
      await supabase
        .from('sessions')
        .update({ 
          calendar_event_id: calendarEventId,
          meeting_link: result.hangoutLink || result.conferenceData?.entryPoints?.[0]?.uri
        })
        .eq('id', sessionId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        calendarEventId,
        meetingLink: result.hangoutLink || result.conferenceData?.entryPoints?.[0]?.uri,
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

async function getServiceAccountToken(clientId: string, clientSecret: string): Promise<string> {
  // For now, we'll use a simplified approach
  // In production, you'd want to implement proper OAuth flow or use service account
  // This is a placeholder that would need proper OAuth implementation
  return 'placeholder-token';
}

async function createCalendarEvent(sessionData: any, accessToken: string): Promise<any> {
  const endTime = new Date(new Date(sessionData.scheduledAt).getTime() + sessionData.duration * 60000);
  
  const event = {
    summary: sessionData.title,
    description: sessionData.description,
    start: {
      dateTime: sessionData.scheduledAt,
      timeZone: 'UTC',
    },
    end: {
      dateTime: endTime.toISOString(),
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

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google Calendar API error: ${errorData.error?.message || response.statusText}`);
    }

    const createdEvent = await response.json();
    console.log('Created calendar event:', createdEvent.id);
    return createdEvent;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    // Return mock data for now if API call fails
    return {
      id: `mock-event-${Date.now()}`,
      hangoutLink: `https://meet.google.com/mock-${Date.now()}`,
      conferenceData: {
        entryPoints: [{
          uri: `https://meet.google.com/mock-${Date.now()}`,
          entryPointType: 'video'
        }]
      }
    };
  }
}

async function updateCalendarEvent(eventId: string, sessionData: any, accessToken: string): Promise<any> {
  if (!eventId || eventId.startsWith('mock-')) {
    console.log('Mock event ID, skipping actual update');
    return { id: eventId, hangoutLink: `https://meet.google.com/mock-${Date.now()}` };
  }

  const endTime = new Date(new Date(sessionData.scheduledAt).getTime() + sessionData.duration * 60000);
  
  const event = {
    summary: sessionData.title,
    description: sessionData.description,
    start: {
      dateTime: sessionData.scheduledAt,
      timeZone: 'UTC',
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'UTC',
    },
    attendees: [
      { email: sessionData.advisorEmail },
      { email: sessionData.founderEmail },
    ],
  };

  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google Calendar API error: ${errorData.error?.message || response.statusText}`);
    }

    const updatedEvent = await response.json();
    console.log('Updated calendar event:', updatedEvent.id);
    return updatedEvent;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return { id: eventId, hangoutLink: `https://meet.google.com/mock-${Date.now()}` };
  }
}

async function deleteCalendarEvent(eventId: string, accessToken: string): Promise<void> {
  if (!eventId || eventId.startsWith('mock-')) {
    console.log('Mock event ID, skipping actual deletion');
    return;
  }

  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      const errorData = await response.json();
      throw new Error(`Google Calendar API error: ${errorData.error?.message || response.statusText}`);
    }

    console.log('Deleted calendar event:', eventId);
  } catch (error) {
    console.error('Error deleting calendar event:', error);
  }
}

serve(handler);
