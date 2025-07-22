
import { supabase } from '@/integrations/supabase/client';
import { MatchCandidate } from '@/utils/matchingAlgorithm';
import { UnifiedProfileService, UnifiedProfile } from './unifiedProfileService';

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
  private static readonly ALGORITHM_VERSION = '2.0';
  private static readonly MATCH_THRESHOLD = 60;
  private static readonly CACHE_DURATION_HOURS = 24;

  // Calculate matches for a specific founder using edge function
  static async calculateFounderMatches(founderId: string, forceRecalculate = false): Promise<MatchCandidate[]> {
    try {
      console.log(`Calculating matches for founder ${founderId}, force: ${forceRecalculate}`);

      // Check for cached results first (unless forcing recalculation)
      if (!forceRecalculate) {
        const cachedResults = await this.getCachedMatches(founderId);
        if (cachedResults.length > 0) {
          console.log('Using cached match results for founder:', founderId);
          return await this.convertStoredMatchesToCandidates(cachedResults);
        }
      }

      // Call edge function to calculate matches
      const { data, error } = await supabase.functions.invoke('calculate-matches', {
        body: { founderId }
      });

      if (error) {
        console.error('Error calling calculate-matches function:', error);
        return [];
      }

      if (!data.success) {
        console.error('Calculate-matches function returned error:', data.error);
        return [];
      }

      console.log(`Generated ${data.matches?.length || 0} matches for founder ${founderId}`);
      
      // Convert to MatchCandidate format
      return data.matches?.map((match: any) => ({
        advisorId: match.advisor_id,
        advisor: match.advisor,
        founderData: {}, // This would be populated from the founder's profile
        matchScore: match.matchScore
      })) || [];

    } catch (error) {
      console.error('Error calculating founder matches:', error);
      return [];
    }
  }

  // Batch calculate all matches using edge function
  static async calculateAllMatches(progressCallback?: (current: number, total: number) => void): Promise<void> {
    try {
      console.log('Starting batch match calculation...');

      const { data, error } = await supabase.functions.invoke('calculate-matches', {
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
    try {
      // First try to get from cache
      const cachedMatches = await this.getCachedMatches(founderId);
      
      if (cachedMatches.length > 0) {
        const candidates = await this.convertStoredMatchesToCandidates(cachedMatches);
        return candidates
          .filter(match => match.matchScore.overall >= this.MATCH_THRESHOLD)
          .slice(0, limit);
      }

      // If no cache, calculate fresh matches
      const matches = await this.calculateFounderMatches(founderId);
      return matches
        .filter(match => match.matchScore.overall >= this.MATCH_THRESHOLD)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting top matches:', error);
      return [];
    }
  }

  // Get cached match results from database - Updated to use assignment_id instead of founder_id/advisor_id
  private static async getCachedMatches(founderId: string): Promise<StoredMatchResult[]> {
    try {
      const cacheExpiry = new Date();
      cacheExpiry.setHours(cacheExpiry.getHours() - this.CACHE_DURATION_HOURS);

      // Get assignments for this founder first
      const { data: assignments, error: assignmentsError } = await supabase
        .from('advisor_founder_assignments')
        .select('id')
        .eq('founder_id', founderId);

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        return [];
      }

      if (!assignments || assignments.length === 0) {
        return [];
      }

      const assignmentIds = assignments.map(a => a.id);

      const { data, error } = await supabase
        .from('matching_criteria_scores')
        .select('*')
        .in('assignment_id', assignmentIds)
        .eq('algorithm_version', this.ALGORITHM_VERSION)
        .gte('calculated_at', cacheExpiry.toISOString())
        .order('overall_score', { ascending: false });

      if (error) {
        console.error('Error fetching cached matches:', error);
        return [];
      }

      return data?.map(match => ({
        id: match.id,
        assignment_id: match.assignment_id,
        overall_score: match.overall_score,
        sector_match_score: match.sector_match_score,
        timezone_match_score: match.timezone_match_score,
        stage_match_score: match.challenge_match_score, // Map to stage
        availability_match_score: match.availability_match_score,
        experience_match_score: match.experience_match_score,
        reasoning: ['Cached result'],
        calculated_at: match.calculated_at,
        algorithm_version: match.algorithm_version
      })) || [];

    } catch (error) {
      console.error('Error fetching cached matches:', error);
      return [];
    }
  }

  // Convert stored matches back to candidates
  private static async convertStoredMatchesToCandidates(storedMatches: StoredMatchResult[]): Promise<MatchCandidate[]> {
    const candidates: MatchCandidate[] = [];

    for (const stored of storedMatches) {
      try {
        // Get the assignment details to find advisor and founder
        const { data: assignment, error } = await supabase
          .from('advisor_founder_assignments')
          .select(`
            advisor_id,
            founder_id,
            users!advisor_founder_assignments_advisor_id_fkey (
              id,
              email,
              user_profiles (profile_data)
            )
          `)
          .eq('id', stored.assignment_id)
          .single();

        if (error || !assignment) continue;

        const advisorProfile = await UnifiedProfileService.getUnifiedProfile(assignment.advisor_id);
        const founderProfile = await UnifiedProfileService.getUnifiedProfile(assignment.founder_id);

        if (!advisorProfile || !founderProfile) continue;

        candidates.push({
          advisorId: assignment.advisor_id,
          advisor: {
            id: assignment.advisor_id,
            email: advisorProfile.email,
            user_profiles: [{ profile_data: advisorProfile.profile_data }]
          },
          founderData: founderProfile.profile_data as any,
          matchScore: {
            overall: stored.overall_score,
            sectorMatch: stored.sector_match_score,
            timezoneMatch: stored.timezone_match_score,
            stageMatch: stored.stage_match_score,
            availabilityMatch: stored.availability_match_score,
            experienceMatch: stored.experience_match_score,
            breakdown: {
              sector: stored.reasoning[0] || 'Cached result',
              timezone: stored.reasoning[1] || 'Cached result',
              stage: stored.reasoning[2] || 'Cached result',
              availability: stored.reasoning[3] || 'Cached result',
              experience: stored.reasoning[4] || 'Cached result'
            }
          }
        });
      } catch (error) {
        console.error('Error converting stored match to candidate:', error);
      }
    }

    return candidates;
  }

  // Handle profile updates and trigger re-matching
  static async handleProfileUpdate(userId: string, profileType: 'founder' | 'advisor'): Promise<void> {
    console.log(`Profile updated for ${profileType}: ${userId}`);

    try {
      if (profileType === 'founder') {
        // Clear cache for this founder and recalculate
        await this.clearMatchCache(userId);
        await this.calculateFounderMatches(userId, true);
      } else {
        // For advisor updates, we need to recalculate all founder matches
        // In a production system, we'd be smarter about this and only recalculate affected matches
        console.log('Advisor profile updated, triggering selective re-matching...');
        
        // Clear all cached matches since advisor data affects all calculations
        await this.clearAllMatchCache();
        
        // Optionally trigger a background job for full recalculation
        // For now, we'll let matches be recalculated on-demand
      }
    } catch (error) {
      console.error('Error handling profile update:', error);
    }
  }

  // Clear match cache for a specific founder
  private static async clearMatchCache(founderId: string): Promise<void> {
    try {
      // Get assignments for this founder
      const { data: assignments } = await supabase
        .from('advisor_founder_assignments')
        .select('id')
        .eq('founder_id', founderId);

      if (assignments && assignments.length > 0) {
        const assignmentIds = assignments.map(a => a.id);
        
        const { error } = await supabase
          .from('matching_criteria_scores')
          .delete()
          .in('assignment_id', assignmentIds);

        if (error) {
          console.error('Error clearing match cache:', error);
        }
      }
    } catch (error) {
      console.error('Error clearing match cache:', error);
    }
  }

  // Clear all match cache
  private static async clearAllMatchCache(): Promise<void> {
    try {
      const { error } = await supabase
        .from('matching_criteria_scores')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) {
        console.error('Error clearing all match cache:', error);
      }
    } catch (error) {
      console.error('Error clearing all match cache:', error);
    }
  }

  // Get matching statistics
  static async getMatchingStats(): Promise<{
    totalFounders: number;
    foundersWithMatches: number;
    totalAdvisors: number;
    averageMatchScore: number;
    matchesAboveThreshold: number;
    lastCalculationTime: string | null;
  }> {
    try {
      const [foundersData, advisorsData, matchStatsData] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }).eq('role', 'founder').eq('status', 'active'),
        supabase.from('users').select('id', { count: 'exact' }).eq('role', 'advisor').eq('status', 'active'),
        supabase.from('matching_criteria_scores').select('overall_score, calculated_at, assignment_id').eq('algorithm_version', this.ALGORITHM_VERSION)
      ]);

      const totalFounders = foundersData.count || 0;
      const totalAdvisors = advisorsData.count || 0;
      const matches = matchStatsData.data || [];

      // Get unique assignments to count founders with matches
      const uniqueAssignments = new Set(matches.map(m => m.assignment_id)).size;
      const foundersWithMatches = uniqueAssignments;
      
      const averageMatchScore = matches.length > 0 
        ? matches.reduce((sum, m) => sum + m.overall_score, 0) / matches.length 
        : 0;
      const matchesAboveThreshold = matches.filter(m => m.overall_score >= this.MATCH_THRESHOLD).length;
      
      const lastCalculationTime = matches.length > 0 
        ? Math.max(...matches.map(m => new Date(m.calculated_at).getTime()))
        : null;

      return {
        totalFounders,
        foundersWithMatches,
        totalAdvisors,
        averageMatchScore: Math.round(averageMatchScore),
        matchesAboveThreshold,
        lastCalculationTime: lastCalculationTime ? new Date(lastCalculationTime).toISOString() : null
      };

    } catch (error) {
      console.error('Error getting matching stats:', error);
      return {
        totalFounders: 0,
        foundersWithMatches: 0,
        totalAdvisors: 0,
        averageMatchScore: 0,
        matchesAboveThreshold: 0,
        lastCalculationTime: null
      };
    }
  }

  // Force recalculation of a specific match
  static async recalculateMatch(founderId: string, advisorId: string): Promise<MatchCandidate | null> {
    try {
      const { data, error } = await supabase.functions.invoke('calculate-matches', {
        body: { founderId, advisorId }
      });

      if (error || !data.success) {
        console.error('Error recalculating match:', error || data.error);
        return null;
      }

      return {
        advisorId,
        advisor: data.advisor,
        founderData: data.founder,
        matchScore: data.matchScore
      };

    } catch (error) {
      console.error('Error recalculating match:', error);
      return null;
    }
  }
}
