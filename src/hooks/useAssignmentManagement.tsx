import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AssignmentRequest {
  founderId: string;
  advisorId: string;
  matchScore: number;
  assignedBy: string;
  notes?: string;
}

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (assignment: AssignmentRequest) => {
      const { data, error } = await supabase
        .from('advisor_founder_assignments')
        .insert({
          founder_id: assignment.founderId,
          advisor_id: assignment.advisorId,
          match_score: assignment.matchScore,
          assigned_by: assignment.assignedBy,
          notes: assignment.notes,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['founders-directory'] });
      queryClient.invalidateQueries({ queryKey: ['advisors-directory'] });
      toast.success('Assignment created successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to create assignment: ${error.message}`);
    }
  });
};

export const useAssignments = () => {
  return useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advisor_founder_assignments')
        .select(`
          *,
          founder:users!founder_id(
            id, 
            email, 
            auth_id,
            founder_profiles!inner(profile_data)
          ),
          advisor:users!advisor_id(
            id, 
            email, 
            auth_id,
            advisor_profiles!inner(profile_data)
          ),
          assigned_by_user:users!assigned_by(id, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assignments:', error);
        throw error;
      }
      
      // Transform the data to match expected structure
      const transformedData = data?.map(assignment => ({
        ...assignment,
        founder: assignment.founder ? {
          ...assignment.founder,
          // Keep the founder_profiles structure since that's what the UI expects
          founder_profiles: assignment.founder.founder_profiles || []
        } : null,
        advisor: assignment.advisor ? {
          ...assignment.advisor,
          // Keep the advisor_profiles structure since that's what the UI expects
          advisor_profiles: assignment.advisor.advisor_profiles || []
        } : null
      })) || [];

      return transformedData;
    }
  });
};

export const useUpdateAssignmentStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      assignmentId, 
      status, 
      notes 
    }: { 
      assignmentId: string; 
      status: string; 
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('advisor_founder_assignments')
        .update({ 
          status,
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Assignment status updated successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to update assignment: ${error.message}`);
    }
  });
};

export const useSendAssignmentNotification = () => {
  return useMutation({
    mutationFn: async ({ 
      assignmentId, 
      type 
    }: { 
      assignmentId: string; 
      type: 'created' | 'accepted' | 'declined';
    }) => {
      const { data, error } = await supabase.functions.invoke('send-assignment-notification', {
        body: { assignmentId, type }
      });

      if (error) throw error;
      return data;
    }
  });
};
