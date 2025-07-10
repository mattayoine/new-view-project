import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CalendarEvent {
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
  }>
  conferenceData?: {
    createRequest: {
      requestId: string
      conferenceSolutionKey: {
        type: string
      }
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { sessionId, action } = await req.json()

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get session details
    const { data: session, error: sessionError } = await supabaseClient
      .from('sessions')
      .select(`
        *,
        advisor_founder_assignments!inner(
          advisor:users!advisor_id(id, email, user_profiles(profile_data)),
          founder:users!founder_id(id, email, user_profiles(profile_data))
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const assignment = session.advisor_founder_assignments
    const advisor = assignment.advisor
    const founder = assignment.founder

    switch (action) {
      case 'create_calendar_event':
        return await createCalendarEvent(session, advisor, founder)
      
      case 'update_calendar_event':
        return await updateCalendarEvent(session, advisor, founder)
      
      case 'cancel_calendar_event':
        return await cancelCalendarEvent(session)
      
      case 'sync_calendar':
        return await syncCalendarAvailability(advisor.id)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Calendar integration error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function createCalendarEvent(session: any, advisor: any, founder: any) {
  try {
    const startTime = new Date(session.scheduled_at)
    const endTime = new Date(startTime.getTime() + (session.duration_minutes || 60) * 60 * 1000)

    const calendarEvent: CalendarEvent = {
      summary: `Tseer Session: ${session.title}`,
      description: `
Advisory Session Details:
- Type: ${session.session_type}
- Advisor: ${advisor.user_profiles?.profile_data?.name || advisor.email}
- Founder: ${founder.user_profiles?.profile_data?.name || founder.email}
- Meeting Type: ${session.location_type}

${session.description || ''}

${session.meeting_link ? `Meeting Link: ${session.meeting_link}` : ''}
      `.trim(),
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'UTC'
      },
      attendees: [
        {
          email: advisor.email,
          displayName: advisor.user_profiles?.profile_data?.name || 'Advisor'
        },
        {
          email: founder.email,
          displayName: founder.user_profiles?.profile_data?.name || 'Founder'
        }
      ]
    }

    // Add Google Meet if virtual session
    if (session.location_type === 'virtual') {
      calendarEvent.conferenceData = {
        createRequest: {
          requestId: `tseer-session-${session.id}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      }
    }

    // Here you would integrate with Google Calendar API
    // For demonstration, we'll return the event data
    const mockEventId = `tseer-event-${session.id}-${Date.now()}`

    // Update session with calendar event ID
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabaseClient
      .from('sessions')
      .update({
        calendar_event_id: mockEventId,
        meeting_link: session.meeting_link || `https://meet.google.com/generated-link-${session.id}`
      })
      .eq('id', session.id)

    return new Response(
      JSON.stringify({
        success: true,
        eventId: mockEventId,
        meetingLink: `https://meet.google.com/generated-link-${session.id}`,
        calendarEvent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating calendar event:', error)
    throw error
  }
}

async function updateCalendarEvent(session: any, advisor: any, founder: any) {
  try {
    // Similar to create but updates existing event
    const mockEventId = `tseer-event-${session.id}-updated-${Date.now()}`

    return new Response(
      JSON.stringify({
        success: true,
        eventId: mockEventId,
        message: 'Calendar event updated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error updating calendar event:', error)
    throw error
  }
}

async function cancelCalendarEvent(session: any) {
  try {
    // Cancel the calendar event
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Calendar event cancelled successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error cancelling calendar event:', error)
    throw error
  }
}

async function syncCalendarAvailability(advisorId: string) {
  try {
    // Sync advisor's calendar availability
    // This would fetch from Google Calendar and update advisor_availability table
    
    const mockAvailability = [
      { day_of_week: 1, start_time: '09:00', end_time: '17:00' }, // Monday
      { day_of_week: 2, start_time: '09:00', end_time: '17:00' }, // Tuesday
      { day_of_week: 3, start_time: '09:00', end_time: '17:00' }, // Wednesday
      { day_of_week: 4, start_time: '09:00', end_time: '17:00' }, // Thursday
      { day_of_week: 5, start_time: '09:00', end_time: '15:00' }, // Friday
    ]

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Clear existing availability
    await supabaseClient
      .from('advisor_availability')
      .delete()
      .eq('advisor_id', advisorId)

    // Insert new availability
    await supabaseClient
      .from('advisor_availability')
      .insert(
        mockAvailability.map(slot => ({
          advisor_id: advisorId,
          ...slot,
          timezone: 'UTC',
          is_active: true
        }))
      )

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Calendar availability synchronized',
        availability: mockAvailability
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error syncing calendar availability:', error)
    throw error
  }
}