
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

      // Store results in database
      await this.storeMatchResults(founderId, matchCandidates);

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

  // Get cached match results
  private static async getCachedMatches(founderId: string): Promise<StoredMatchResult[]> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - this.CACHE_DURATION_HOURS);

      const { data, error } = await supabase
        .from('matching_criteria_scores')
        .select(`
          *,
          assignment:advisor_founder_assignments!assignment_id(advisor_id)
        `)
        .eq('assignment.founder_id', founderId)
        .gte('calculated_at', cutoffTime.toISOString())
        .eq('algorithm_version', this.ALGORITHM_VERSION)
        .order('overall_score', { ascending: false });

      if (error) throw error;

      return data?.map(result => ({
        id: result.id,
        founder_id: founderId,
        advisor_id: result.assignment?.advisor_id || '',
        overall_score: result.overall_score || 0,
        sector_score: result.sector_match_score || 0,
        timezone_score: result.timezone_match_score || 0,
        stage_score: result.experience_match_score || 0,
        availability_score: result.availability_match_score || 0,
        experience_score: result.experience_match_score || 0,
        reasoning: [],
        calculated_at: result.calculated_at || '',
        algorithm_version: result.algorithm_version || ''
      })) || [];

    } catch (error) {
      console.error('Error fetching cached matches:', error);
      return [];
    }
  }

  // Store match results in database
  private static async storeMatchResults(founderId: string, matches: MatchCandidate[]): Promise<void> {
    try {
      // Create temporary assignments for scoring storage
      const scoringData = matches.map(match => ({
        founder_id: founderId,
        advisor_id: match.advisorId,
        overall_score: match.matchScore.overall,
        sector_match_score: match.matchScore.sectorMatch,
        timezone_match_score: match.matchScore.timezoneMatch,
        experience_match_score: match.matchScore.experienceMatch,
        availability_match_score: match.matchScore.availabilityMatch,
        challenge_match_score: 0, // Not in current algorithm
        algorithm_version: this.ALGORITHM_VERSION,
        calculated_at: new Date().toISOString()
      }));

      // Store in matching_criteria_scores table
      // Note: This requires temporary assignment records, which is a design limitation
      // In production, we'd want a separate match_scores table

      for (const score of scoringData) {
        // Check if a score already exists for this pair
        const { data: existing } = await supabase
          .from('matching_criteria_scores')
          .select('id, assignment_id')
          .eq('assignment_id', `${founderId}-${score.advisor_id}`) // This is a hack - need proper table
          .single();

        if (!existing) {
          // Insert new score record
          await supabase
            .from('matching_criteria_scores')
            .insert({
              assignment_id: `${founderId}-${score.advisor_id}`, // Hack for now
              ...score
            });
        } else {
          // Update existing score
          await supabase
            .from('matching_criteria_scores')
            .update(score)
            .eq('id', existing.id);
        }
      }

      console.log(`Stored ${scoringData.length} match scores for founder ${founderId}`);

    } catch (error) {
      console.error('Error storing match results:', error);
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

      // Get recent match scores
      const { data: scores } = await supabase
        .from('matching_criteria_scores')
        .select('overall_score')
        .gte('calculated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const averageScore = scores?.length ? 
        scores.reduce((sum, s) => sum + (s.overall_score || 0), 0) / scores.length : 0;

      const aboveThreshold = scores?.filter(s => (s.overall_score || 0) >= this.MATCH_THRESHOLD).length || 0;

      return {
        totalFounders: founders.length,
        foundersWithMatches: founders.filter(f => UnifiedProfileService.isProfileReadyForMatching(f)).length,
        totalAdvisors: advisors.length,
        averageMatchScore: Math.round(averageScore),
        matchesAboveThreshold: aboveThreshold
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
