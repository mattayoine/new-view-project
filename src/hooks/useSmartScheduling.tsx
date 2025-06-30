
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface TimeSlotSuggestion {
  datetime: string;
  confidenceScore: number;
  conflictRisk: 'low' | 'medium' | 'high';
  successProbability: number;
  reasons: string[];
}

export interface SchedulingPreferences {
  preferredDays: number[];
  preferredTimeRanges: { start: string; end: string }[];
  timezone: string;
  bufferMinutes: number;
}

export const useSmartScheduling = (assignmentId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['smart-scheduling', assignmentId],
    queryFn: async () => {
      // Get historical session data for this assignment
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('scheduled_at, status, founder_rating, advisor_rating, duration_minutes')
        .eq('assignment_id', assignmentId)
        .order('scheduled_at', { ascending: false });

      if (error) throw error;

      // Analyze historical success patterns
      const successRates = analyzeTimeSlotSuccess(sessions || []);
      
      // Generate optimal time suggestions
      const suggestions = generateTimeSlotSuggestions(successRates);
      
      return {
        suggestions,
        historicalData: sessions,
        successRates
      };
    },
    enabled: !!user && !!assignmentId
  });
};

function analyzeTimeSlotSuccess(sessions: any[]) {
  const timeSlotStats = new Map();
  
  sessions.forEach(session => {
    if (session.status === 'completed') {
      const hour = new Date(session.scheduled_at).getHours();
      const dayOfWeek = new Date(session.scheduled_at).getDay();
      const key = `${dayOfWeek}-${hour}`;
      
      const existing = timeSlotStats.get(key) || { total: 0, successful: 0, avgRating: 0 };
      const rating = ((session.founder_rating || 0) + (session.advisor_rating || 0)) / 2;
      
      existing.total++;
      if (rating >= 4) existing.successful++;
      existing.avgRating = (existing.avgRating + rating) / existing.total;
      
      timeSlotStats.set(key, existing);
    }
  });
  
  return timeSlotStats;
}

function generateTimeSlotSuggestions(successRates: Map<string, any>): TimeSlotSuggestion[] {
  const suggestions: TimeSlotSuggestion[] = [];
  const now = new Date();
  
  // Generate suggestions for the next 2 weeks
  for (let i = 1; i <= 14; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    
    // Check multiple time slots per day
    [9, 10, 11, 14, 15, 16].forEach(hour => {
      const suggestionTime = new Date(date);
      suggestionTime.setHours(hour, 0, 0, 0);
      
      const dayOfWeek = suggestionTime.getDay();
      const key = `${dayOfWeek}-${hour}`;
      const stats = successRates.get(key);
      
      const successProbability = stats ? (stats.successful / stats.total) * 100 : 50;
      const confidenceScore = stats ? Math.min(stats.total * 10, 100) : 25;
      
      suggestions.push({
        datetime: suggestionTime.toISOString(),
        confidenceScore,
        conflictRisk: 'low', // Would integrate with calendar API
        successProbability,
        reasons: generateReasons(stats, hour, dayOfWeek)
      });
    });
  }
  
  return suggestions
    .sort((a, b) => b.successProbability - a.successProbability)
    .slice(0, 10);
}

function generateReasons(stats: any, hour: number, dayOfWeek: number): string[] {
  const reasons = [];
  
  if (stats && stats.avgRating > 4) {
    reasons.push('High satisfaction rate at this time');
  }
  
  if (hour >= 10 && hour <= 15) {
    reasons.push('Optimal focus hours');
  }
  
  if (dayOfWeek >= 1 && dayOfWeek <= 4) {
    reasons.push('Mid-week shows better engagement');
  }
  
  return reasons;
}

export const useAutomatedReminders = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, reminderType, timing }: {
      sessionId: string;
      reminderType: 'email' | 'sms' | 'push';
      timing: number; // hours before session
    }) => {
      const { data, error } = await supabase.functions.invoke('schedule-reminder', {
        body: { sessionId, reminderType, timing }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-reminders'] });
      toast.success('Reminder scheduled successfully');
    }
  });
};
