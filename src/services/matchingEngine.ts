
import { MatchingEngineCore, MatchingStats } from './matchingEngineCore';
import { MatchCandidate } from '@/utils/matchingAlgorithm';
import { UnifiedProfileService } from './unifiedProfileService';

export interface StoredMatchResult {
  id: string;
  assignment_id: string;
  overall_score: number;
  sector_match_score: number;
  timezone_match_score: number;
  stage_match_score: number;
  availability_match_score: number;
  experience_match_score: number;
  reasoning: string[];
  calculated_at: string;
  algorithm_version: string;
}

export class MatchingEngine {
  // Calculate matches for a specific founder using core engine
  static async calculateFounderMatches(founderId: string, forceRecalculate = false): Promise<MatchCandidate[]> {
    try {
      console.log(`Calculating matches for founder ${founderId}, force: ${forceRecalculate}`);

      if (!forceRecalculate) {
        // Try to get cached results first
        const cachedResults = await MatchingEngineCore.getTopMatches(founderId);
        if (cachedResults.length > 0) {
          console.log('Using cached match results for founder:', founderId);
          return cachedResults;
        }
      }

      // Calculate fresh matches using core engine
      return await MatchingEngineCore.calculateFounderMatches(founderId);

    } catch (error) {
      console.error('Error calculating founder matches:', error);
      return [];
    }
  }

  // Batch calculate all matches using edge function
  static async calculateAllMatches(progressCallback?: (current: number, total: number) => void): Promise<void> {
    try {
      console.log('Starting batch match calculation...');

      const { data, error } = await MatchingEngineCore.supabase.functions.invoke('calculate-matches', {
        body: { batchMode: true }
      });

      if (error) {
        console.error('Error in batch calculation:', error);
        throw new Error(`Batch calculation failed: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(`Batch calculation failed: ${data.error}`);
      }

      console.log('Batch match calculation completed:', data);
      
      // Call progress callback with final results
      if (progressCallback) {
        progressCallback(data.totalFounders, data.totalFounders);
      }

    } catch (error) {
      console.error('Error in batch match calculation:', error);
      throw error;
    }
  }

  // Get top matches for a founder with caching
  static async getTopMatches(founderId: string, limit = 10): Promise<MatchCandidate[]> {
    return await MatchingEngineCore.getTopMatches(founderId, limit);
  }

  // Handle profile updates and trigger re-matching
  static async handleProfileUpdate(userId: string, profileType: 'founder' | 'advisor'): Promise<void> {
    console.log(`Profile updated for ${profileType}: ${userId}`);

    try {
      if (profileType === 'founder') {
        // For founder updates, recalculate their matches
        await this.calculateFounderMatches(userId, true);
      } else {
        // For advisor updates, we might need to recalculate affected founder matches
        // For now, we'll just log it - in production this could trigger selective updates
        console.log('Advisor profile updated, matches may need refresh');
      }
    } catch (error) {
      console.error('Error handling profile update:', error);
    }
  }

  // Get matching statistics
  static async getMatchingStats(): Promise<MatchingStats> {
    return await MatchingEngineCore.getMatchingStats();
  }

  // Force recalculation of a specific match
  static async recalculateMatch(founderId: string, advisorId: string): Promise<MatchCandidate | null> {
    try {
      const founderProfile = await UnifiedProfileService.getUnifiedProfile(founderId);
      const advisorProfile = await UnifiedProfileService.getUnifiedProfile(advisorId);

      if (!founderProfile || !advisorProfile) {
        console.error('Profile not found for recalculation');
        return null;
      }

      // Calculate the match using the core algorithm
      const { calculateMatchScore } = await import('@/utils/matchingAlgorithmCore');
      const matchScore = calculateMatchScore(founderProfile.profile_data, advisorProfile.profile_data);

      return {
        advisorId,
        advisor: {
          id: advisorProfile.id,
          email: advisorProfile.email,
          user_profiles: [{ profile_data: advisorProfile.profile_data }]
        },
        founderData: founderProfile.profile_data,
        matchScore
      };

    } catch (error) {
      console.error('Error recalculating match:', error);
      return null;
    }
  }
}
