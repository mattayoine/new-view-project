
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

    // Get Google OAuth token for the session creator or admin
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_oauth_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('provider', 'google')
      .eq('user_id', session.assignment.advisor.id)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('Google Calendar integration not set up for this advisor');
    }

    // Check if token needs refresh
    let accessToken = tokenData.access_token;
    if (tokenData.expires_at && Date.now() > tokenData.expires_at) {
      const refreshResult = await refreshGoogleToken(tokenData.refresh_token);
      if (refreshResult.success) {
        accessToken = refreshResult.access_token;
        
        // Update stored token
        await supabase
          .from('user_oauth_tokens')
          .update({
            access_token: refreshResult.access_token,
            expires_at: refreshResult.expires_at
          })
          .eq('provider', 'google')
          .eq('user_id', session.assignment.advisor.id);
      } else {
        throw new Error('Failed to refresh Google access token');
      }
    }

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

async function refreshGoogleToken(refreshToken: string): Promise<any> {
  const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: googleClientId!,
        client_secret: googleClientSecret!,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const tokens = await response.json();
    return {
      success: true,
      access_token: tokens.access_token,
      expires_at: Date.now() + (tokens.expires_in * 1000)
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
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
}

async function updateCalendarEvent(eventId: string, sessionData: any, accessToken: string): Promise<any> {
  if (!eventId) {
    throw new Error('No calendar event ID provided for update');
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
}

async function deleteCalendarEvent(eventId: string, accessToken: string): Promise<void> {
  if (!eventId) {
    console.log('No calendar event ID provided for deletion');
    return;
  }

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
}

serve(handler);
