
import { calculateMatchScore, rankAdvisorsByMatch, MatchCandidate } from '@/utils/matchingAlgorithm';
import { UnifiedProfileService, UnifiedProfile } from './unifiedProfileService';
import { supabase } from '@/integrations/supabase/client';
import { FounderProfileData, AdvisorProfileData } from '@/types/profile';

export interface StoredMatchResult {
  id: string;
  founder_id: string;
  advisor_id: string;
  overall_score: number;
  sector_score: number;
  timezone_score: number;
  stage_score: number;
  availability_score: number;
  experience_score: number;
  reasoning: string[];
  calculated_at: string;
  algorithm_version: string;
}

export class MatchingEngine {
  private static readonly ALGORITHM_VERSION = '2.0';
  private static readonly MATCH_THRESHOLD = 60; // Minimum score for viable match
  private static readonly CACHE_DURATION_HOURS = 24;

  // Calculate matches for a specific founder
  static async calculateFounderMatches(founderId: string, forceRecalculate = false): Promise<MatchCandidate[]> {
    try {
      // Get founder profile
      const founderProfile = await UnifiedProfileService.getUnifiedProfile(founderId);
      if (!founderProfile || !UnifiedProfileService.isProfileReadyForMatching(founderProfile)) {
        console.log('Founder profile not ready for matching:', founderId);
        return [];
      }

      // Check for cached results (unless forcing recalculation)
      if (!forceRecalculate) {
        const cachedResults = await this.getCachedMatches(founderId);
        if (cachedResults.length > 0) {
          console.log('Using cached match results for founder:', founderId);
          return this.convertStoredMatchesToCandidates(cachedResults);
        }
      }

      // Get all advisor profiles
      const advisorProfiles = await UnifiedProfileService.getAllProfilesByRole('advisor');
      console.log(`Calculating matches for founder ${founderId} against ${advisorProfiles.length} advisors`);

      // Use the existing sophisticated algorithm
      const founderData = founderProfile.profile_data as FounderProfileData;
      const advisorCandidates = advisorProfiles.map(advisor => ({
        id: advisor.id,
        user_profiles: [{
          profile_data: advisor.profile_data
        }],
        email: advisor.email
      }));

      const matchCandidates = rankAdvisorsByMatch(founderData, advisorCandidates);

      // Store results in database (simplified for now)
      console.log(`Generated ${matchCandidates.length} match candidates for founder ${founderId}`);
      return matchCandidates;

    } catch (error) {
      console.error('Error calculating founder matches:', error);
      return [];
    }
  }

  // Calculate matches for all founders (batch operation)
  static async calculateAllMatches(progressCallback?: (current: number, total: number) => void): Promise<void> {
    try {
      const founderProfiles = await UnifiedProfileService.getAllProfilesByRole('founder');
      console.log(`Starting batch match calculation for ${founderProfiles.length} founders`);

      for (let i = 0; i < founderProfiles.length; i++) {
        const founder = founderProfiles[i];
        
        if (UnifiedProfileService.isProfileReadyForMatching(founder)) {
          await this.calculateFounderMatches(founder.id, true);
        }

        if (progressCallback) {
          progressCallback(i + 1, founderProfiles.length);
        }

        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('Batch match calculation completed');
    } catch (error) {
      console.error('Error in batch match calculation:', error);
    }
  }

  // Get top matches for a founder
  static async getTopMatches(founderId: string, limit = 10): Promise<MatchCandidate[]> {
    const matches = await this.calculateFounderMatches(founderId);
    return matches
      .filter(match => match.matchScore.overall >= this.MATCH_THRESHOLD)
      .slice(0, limit);
  }

  // Get cached match results (simplified for now)
  private static async getCachedMatches(founderId: string): Promise<StoredMatchResult[]> {
    try {
      // For now, return empty array - this would be implemented with proper caching
      return [];
    } catch (error) {
      console.error('Error fetching cached matches:', error);
      return [];
    }
  }

  // Convert stored matches back to candidates
  private static convertStoredMatchesToCandidates(storedMatches: StoredMatchResult[]): MatchCandidate[] {
    return storedMatches.map(stored => ({
      advisorId: stored.advisor_id,
      advisor: {
        id: stored.advisor_id,
        email: '', // Would need to join with users table
        user_profiles: [{ profile_data: {} }] // Would need to fetch actual data
      },
      founderData: {} as FounderProfileData, // Would need to fetch
      matchScore: {
        overall: stored.overall_score,
        sectorMatch: stored.sector_score,
        timezoneMatch: stored.timezone_score,
        stageMatch: stored.stage_score,
        availabilityMatch: stored.availability_score,
        experienceMatch: stored.experience_score,
        breakdown: {
          sector: 'Cached result',
          timezone: 'Cached result',
          stage: 'Cached result',
          availability: 'Cached result',
          experience: 'Cached result'
        }
      }
    }));
  }

  // Real-time match updates when profiles change
  static async handleProfileUpdate(userId: string, profileType: 'founder' | 'advisor'): Promise<void> {
    console.log(`Profile updated for ${profileType}: ${userId}`);

    if (profileType === 'founder') {
      // Recalculate matches for this founder
      await this.calculateFounderMatches(userId, true);
    } else {
      // Recalculate matches for all founders (advisor affects all)
      // In production, we'd be smarter about this
      const founderProfiles = await UnifiedProfileService.getAllProfilesByRole('founder');
      
      for (const founder of founderProfiles.slice(0, 10)) { // Limit to avoid overwhelming
        await this.calculateFounderMatches(founder.id, true);
      }
    }
  }

  // Get match statistics
  static async getMatchingStats(): Promise<{
    totalFounders: number;
    foundersWithMatches: number;
    totalAdvisors: number;
    averageMatchScore: number;
    matchesAboveThreshold: number;
  }> {
    try {
      const [founders, advisors] = await Promise.all([
        UnifiedProfileService.getAllProfilesByRole('founder'),
        UnifiedProfileService.getAllProfilesByRole('advisor')
      ]);

      return {
        totalFounders: founders.length,
        foundersWithMatches: founders.filter(f => UnifiedProfileService.isProfileReadyForMatching(f)).length,
        totalAdvisors: advisors.length,
        averageMatchScore: 75, // Placeholder
        matchesAboveThreshold: founders.length * advisors.length // Placeholder
      };

    } catch (error) {
      console.error('Error getting matching stats:', error);
      return {
        totalFounders: 0,
        foundersWithMatches: 0,
        totalAdvisors: 0,
        averageMatchScore: 0,
        matchesAboveThreshold: 0
      };
    }
  }
}
