
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SessionPreparation {
  sessionId: string;
  founderId: string;
  founderName: string;
  scheduledAt: string;
  title: string;
  suggestedAgenda: string[];
  relevantGoals: string[];
  previousNotes: string;
  recommendedResources: string[];
  preparationStatus: 'not_started' | 'in_progress' | 'completed';
}

export const useSessionPreparation = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['session-preparation', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data: upcomingSessions, error: upcomingError } = await supabase
        .from('sessions')
        .select(`
          id, title, scheduled_at, description, preparation_notes,
          assignment:advisor_founder_assignments!assignment_id(
            founder:users!founder_id(id, email),
            goals:goals(title, description, status, progress_percentage)
          )
        `)
        .gte('scheduled_at', new Date().toISOString())
        .eq('status', 'scheduled')
        .is('deleted_at', null)
        .order('scheduled_at', { ascending: true })
        .limit(10);

      if (upcomingError) throw upcomingError;

      const upcomingPreparations: SessionPreparation[] = (upcomingSessions || []).map((session: any) => ({
        sessionId: session.id,
        founderId: session.assignment?.founder?.id || '',
        founderName: session.assignment?.founder?.email || 'Unknown',
        scheduledAt: session.scheduled_at,
        title: session.title,
        suggestedAgenda: [
          'Review previous action items',
          'Discuss current challenges',
          'Set next milestones'
        ],
        relevantGoals: session.assignment?.goals?.map((g: any) => g.title) || [],
        previousNotes: session.preparation_notes || '',
        recommendedResources: [],
        preparationStatus: 'not_started' as const
      }));

      return upcomingPreparations;
    },
    enabled: !!user,
    refetchInterval: 30000
  });
};
