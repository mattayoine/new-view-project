import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar as CalendarIcon, Video, MapPin, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SessionSchedulerProps {
  assignmentId: string;
  advisorId?: string;
  founderId?: string;
  onSessionCreated?: (sessionId: string) => void;
}

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  day_of_week: number;
  available: boolean;
}

export const SessionScheduler: React.FC<SessionSchedulerProps> = ({
  assignmentId,
  advisorId,
  founderId,
  onSessionCreated
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(60);
  const [sessionType, setSessionType] = useState<string>('strategy');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [meetingType, setMeetingType] = useState<'virtual' | 'in_person'>('virtual');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (selectedDate && advisorId) {
      fetchAvailableSlots();
    }
  }, [selectedDate, advisorId]);

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !advisorId) return;

    try {
      const dayOfWeek = selectedDate.getDay();
      
      // Get advisor availability for the selected day
      const { data: availability } = await supabase
        .from('advisor_availability')
        .select('*')
        .eq('advisor_id', advisorId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true);

      if (!availability?.length) {
        setAvailableSlots([]);
        return;
      }

      // Check for existing sessions on the selected date
      const { data: existingSessions } = await supabase
        .from('sessions')
        .select('scheduled_at, duration_minutes')
        .eq('assignment_id', assignmentId)
        .gte('scheduled_at', selectedDate.toISOString().split('T')[0])
        .lt('scheduled_at', new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .neq('status', 'cancelled');

      // Generate available time slots
      const slots: TimeSlot[] = [];
      
      availability.forEach((avail) => {
        const startHour = parseInt(avail.start_time.split(':')[0]);
        const endHour = parseInt(avail.end_time.split(':')[0]);
        
        for (let hour = startHour; hour < endHour; hour++) {
          const slotTime = `${hour.toString().padStart(2, '0')}:00`;
          const slotDateTime = new Date(selectedDate);
          slotDateTime.setHours(hour, 0, 0, 0);
          
          // Check if slot conflicts with existing sessions
          const hasConflict = existingSessions?.some(session => {
            const sessionStart = new Date(session.scheduled_at);
            const sessionEnd = new Date(sessionStart.getTime() + (session.duration_minutes || 60) * 60 * 1000);
            
            return slotDateTime >= sessionStart && slotDateTime < sessionEnd;
          });

          slots.push({
            id: `${hour}`,
            start_time: slotTime,
            end_time: `${(hour + 1).toString().padStart(2, '0')}:00`,
            day_of_week: dayOfWeek,
            available: !hasConflict
          });
        }
      });

      setAvailableSlots(slots);

    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast({
        title: 'Error',
        description: 'Could not load available time slots',
        variant: 'destructive'
      });
    }
  };

  const handleScheduleSession = async () => {
    if (!selectedDate || !selectedTime || !title.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please select a date, time, and provide a session title',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      // Create the scheduled datetime
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(hours, minutes, 0, 0);

      // Create the session
      const { data: session, error } = await supabase
        .from('sessions')
        .insert({
          assignment_id: assignmentId,
          title: title.trim(),
          description: description.trim() || null,
          session_type: sessionType,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: duration,
          location_type: meetingType,
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) throw error;

      // Generate meeting link for virtual sessions
      if (meetingType === 'virtual') {
        // Call edge function to generate meeting link
        const { data: meetingData, error: meetingError } = await supabase.functions.invoke('generate-meeting-link', {
          body: { sessionId: session.id }
        });

        if (!meetingError && meetingData?.meetingLink) {
          await supabase
            .from('sessions')
            .update({ meeting_link: meetingData.meetingLink })
            .eq('id', session.id);
        }
      }

      // Create session reminders
      await createSessionReminders(session.id, scheduledAt);

      // Send notifications
      await sendSessionNotifications(session.id, advisorId, founderId);

      toast({
        title: 'Session Scheduled',
        description: `Session "${title}" has been scheduled successfully`
      });

      // Reset form
      setSelectedDate(undefined);
      setSelectedTime('');
      setTitle('');
      setDescription('');

      onSessionCreated?.(session.id);

    } catch (error) {
      console.error('Error scheduling session:', error);
      toast({
        title: 'Scheduling Failed',
        description: 'Could not schedule the session. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createSessionReminders = async (sessionId: string, scheduledAt: Date) => {
    const reminders = [
      { type: '24h', offset: 24 * 60 * 60 * 1000 }, // 24 hours before
      { type: '1h', offset: 60 * 60 * 1000 },       // 1 hour before
      { type: '15m', offset: 15 * 60 * 1000 }       // 15 minutes before
    ];

    for (const reminder of reminders) {
      const reminderTime = new Date(scheduledAt.getTime() - reminder.offset);
      
      // Create reminders for both advisor and founder
      if (advisorId) {
        await supabase.from('session_reminders').insert({
          session_id: sessionId,
          user_id: advisorId,
          reminder_type: reminder.type,
          scheduled_at: reminderTime.toISOString()
        });
      }
      
      if (founderId) {
        await supabase.from('session_reminders').insert({
          session_id: sessionId,
          user_id: founderId,
          reminder_type: reminder.type,
          scheduled_at: reminderTime.toISOString()
        });
      }
    }
  };

  const sendSessionNotifications = async (sessionId: string, advisorId?: string, founderId?: string) => {
    const notificationData = {
      type: 'session_scheduled',
      title: 'New Session Scheduled',
      message: `A new session "${title}" has been scheduled`,
      action_url: `/sessions/${sessionId}`,
      priority: 'high'
    };

    // Send to advisor
    if (advisorId) {
      await supabase.from('notifications').insert({
        ...notificationData,
        user_id: advisorId
      });
    }

    // Send to founder
    if (founderId) {
      await supabase.from('notifications').insert({
        ...notificationData,
        user_id: founderId
      });
    }
  };

  const isDateAvailable = (date: Date) => {
    const dayOfWeek = date.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return date >= today && dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2" />
            Schedule New Session
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Session Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Session Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Product Strategy Review"
              />
            </div>
            
            <div>
              <Label htmlFor="type">Session Type</Label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strategy">Strategy Session</SelectItem>
                  <SelectItem value="product">Product Review</SelectItem>
                  <SelectItem value="marketing">Marketing Discussion</SelectItem>
                  <SelectItem value="operations">Operations Planning</SelectItem>
                  <SelectItem value="fundraising">Fundraising Prep</SelectItem>
                  <SelectItem value="general">General Advisory</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="meeting-type">Meeting Type</Label>
              <Select value={meetingType} onValueChange={(v: 'virtual' | 'in_person') => setMeetingType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virtual">
                    <div className="flex items-center">
                      <Video className="w-4 h-4 mr-2" />
                      Virtual Meeting
                    </div>
                  </SelectItem>
                  <SelectItem value="in_person">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      In Person
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any specific topics or agenda items..."
              rows={3}
            />
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label>Select Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => !isDateAvailable(date)}
                className="rounded-md border"
              />
            </div>

            {/* Time Selection */}
            <div>
              <Label>Available Time Slots</Label>
              {selectedDate ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableSlots.length > 0 ? (
                    availableSlots.map((slot) => (
                      <Button
                        key={slot.id}
                        variant={selectedTime === slot.start_time ? "default" : "outline"}
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.start_time)}
                        className="w-full justify-between"
                      >
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          {slot.start_time} - {slot.end_time}
                        </div>
                        {!slot.available && (
                          <Badge variant="secondary">Unavailable</Badge>
                        )}
                      </Button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No available slots for this date</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Please select a date first</p>
                </div>
              )}
            </div>
          </div>

          <Button 
            onClick={handleScheduleSession}
            disabled={loading || !selectedDate || !selectedTime || !title.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? 'Scheduling...' : 'Schedule Session'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};