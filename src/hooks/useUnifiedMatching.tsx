
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MatchingEngine } from '@/services/matchingEngine';
import { UnifiedProfileService } from '@/services/unifiedProfileService';
import { toast } from 'sonner';
import { MatchCandidate } from '@/utils/matchingAlgorithm';

// Hook for getting founder matches
export const useFounderMatches = (founderId?: string) => {
  return useQuery({
    queryKey: ['founder-matches', founderId],
    queryFn: () => founderId ? MatchingEngine.getTopMatches(founderId) : Promise.resolve([]),
    enabled: !!founderId,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false
  });
};

// Hook for batch calculating all matches
export const useBatchMatching = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (onProgress?: (current: number, total: number) => void) => {
      await MatchingEngine.calculateAllMatches(onProgress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['founder-matches'] });
      queryClient.invalidateQueries({ queryKey: ['matching-stats'] });
      toast.success('Batch matching calculation completed!');
    },
    onError: (error: any) => {
      toast.error(`Batch matching failed: ${error.message}`);
    }
  });
};

// Hook for getting matching statistics
export const useMatchingStats = () => {
  return useQuery({
    queryKey: ['matching-stats'],
    queryFn: () => MatchingEngine.getMatchingStats(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchInterval: 1000 * 60 * 15 // 15 minutes
  });
};

// Hook for handling profile updates and triggering re-matching
export const useProfileUpdateMatching = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, profileType }: { userId: string; profileType: 'founder' | 'advisor' }) => {
      await MatchingEngine.handleProfileUpdate(userId, profileType);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['founder-matches'] });
      queryClient.invalidateQueries({ queryKey: ['matching-stats'] });
      
      if (variables.profileType === 'founder') {
        queryClient.invalidateQueries({ queryKey: ['founder-matches', variables.userId] });
      }
      
      toast.success('Matches updated based on profile changes');
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
    staleTime: 1000 * 60 * 10 // 10 minutes
  });
};
