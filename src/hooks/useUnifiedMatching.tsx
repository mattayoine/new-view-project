
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MatchingEngine } from '@/services/matchingEngine';
import { BackgroundMatchingService } from '@/services/backgroundMatchingService';
import { UnifiedProfileService } from '@/services/unifiedProfileService';
import { toast } from 'sonner';
import { MatchCandidate } from '@/utils/matchingAlgorithm';

// Hook for getting founder matches with improved caching
export const useFounderMatches = (founderId?: string) => {
  return useQuery({
    queryKey: ['founder-matches', founderId],
    queryFn: () => founderId ? MatchingEngine.getTopMatches(founderId) : Promise.resolve([]),
    enabled: !!founderId,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
    retry: 2
  });
};

// Hook for batch calculating all matches with job tracking
export const useBatchMatching = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const jobId = await BackgroundMatchingService.startFullRecalculation();
      
      // Poll for job completion
      return new Promise((resolve, reject) => {
        const pollInterval = setInterval(() => {
          const job = BackgroundMatchingService.getJobStatus(jobId);
          
          if (!job) {
            clearInterval(pollInterval);
            reject(new Error('Job not found'));
            return;
          }

          if (job.status === 'completed') {
            clearInterval(pollInterval);
            resolve(job);
          } else if (job.status === 'failed') {
            clearInterval(pollInterval);
            reject(new Error(job.error || 'Job failed'));
          }
        }, 2000); // Poll every 2 seconds

        // Timeout after 10 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          reject(new Error('Job timeout'));
        }, 10 * 60 * 1000);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['founder-matches'] });
      queryClient.invalidateQueries({ queryKey: ['matching-stats'] });
      toast.success('Batch matching calculation completed successfully!');
    },
    onError: (error: any) => {
      toast.error(`Batch matching failed: ${error.message}`);
    }
  });
};

// Hook for getting matching statistics with real data
export const useMatchingStats = () => {
  return useQuery({
    queryKey: ['matching-stats'],
    queryFn: () => MatchingEngine.getMatchingStats(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchInterval: 1000 * 60 * 15, // 15 minutes
    retry: 2
  });
};

// Hook for handling profile updates with smart re-matching
export const useProfileUpdateMatching = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, profileType }: { userId: string; profileType: 'founder' | 'advisor' }) => {
      if (profileType === 'founder') {
        // For founder updates, start a background job
        const jobId = await BackgroundMatchingService.startFounderRecalculation(userId);
        return { jobId, type: 'founder' };
      } else {
        // For advisor updates, trigger profile update handling
        await MatchingEngine.handleProfileUpdate(userId, profileType);
        return { type: 'advisor' };
      }
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['founder-matches'] });
      queryClient.invalidateQueries({ queryKey: ['matching-stats'] });
      
      if (variables.profileType === 'founder') {
        queryClient.invalidateQueries({ queryKey: ['founder-matches', variables.userId] });
        toast.success('Founder matches are being recalculated in the background');
      } else {
        toast.success('Advisor profile updated - matches will be refreshed');
      }
    },
    onError: (error: any) => {
      toast.error(`Failed to update matches: ${error.message}`);
    }
  });
};

// Hook for migrating legacy profiles to unified structure
export const useProfileMigration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userIds: string[]) => {
      const results = await Promise.all(
        userIds.map(id => UnifiedProfileService.migrateToUnifiedProfile(id))
      );
      return results.filter(Boolean).length;
    },
    onSuccess: (migratedCount) => {
      queryClient.invalidateQueries({ queryKey: ['founder-matches'] });
      queryClient.invalidateQueries({ queryKey: ['matching-stats'] });
      toast.success(`Successfully migrated ${migratedCount} profiles to unified structure`);
    },
    onError: (error: any) => {
      toast.error(`Profile migration failed: ${error.message}`);
    }
  });
};

// Hook for getting unified profile data
export const useUnifiedProfile = (userId?: string) => {
  return useQuery({
    queryKey: ['unified-profile', userId],
    queryFn: () => userId ? UnifiedProfileService.getUnifiedProfile(userId) : Promise.resolve(null),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2
  });
};

// Hook for getting background job status
export const useMatchingJobStatus = (jobId?: string) => {
  return useQuery({
    queryKey: ['matching-job-status', jobId],
    queryFn: () => jobId ? BackgroundMatchingService.getJobStatus(jobId) : null,
    enabled: !!jobId,
    refetchInterval: 2000, // Poll every 2 seconds
    staleTime: 0 // Always fetch fresh data
  });
};

// Hook for getting all background jobs
export const useAllMatchingJobs = () => {
  return useQuery({
    queryKey: ['matching-jobs'],
    queryFn: () => BackgroundMatchingService.getAllJobs(),
    refetchInterval: 5000, // Poll every 5 seconds
    staleTime: 0
  });
};

// Hook for forcing a single match recalculation
export const useRecalculateMatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ founderId, advisorId }: { founderId: string; advisorId: string }) => {
      return MatchingEngine.recalculateMatch(founderId, advisorId);
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['founder-matches', variables.founderId] });
      queryClient.invalidateQueries({ queryKey: ['matching-stats'] });
      
      if (result) {
        toast.success(`Match recalculated: ${result.matchScore.overall}% compatibility`);
      } else {
        toast.error('Failed to recalculate match');
      }
    },
    onError: (error: any) => {
      toast.error(`Failed to recalculate match: ${error.message}`);
    }
  });
};
