
import { supabase } from '@/integrations/supabase/client';
import { MatchCandidate } from '@/utils/matchingAlgorithm';
import { UnifiedProfileService } from './unifiedProfileService';
import { calculateMatchScore } from '@/utils/matchingAlgorithmCore';

export interface MatchingStats {
  totalFounders: number;
  foundersWithMatches: number;
  totalAdvisors: number;
  averageMatchScore: number;
  matchesAboveThreshold: number;
  lastCalculationTime: string | null;
}

export class MatchingEngineCore {
  private static readonly ALGORITHM_VERSION = '2.0';
  private static readonly MATCH_THRESHOLD = 60;

  // Calculate matches for a specific founder
  static async calculateFounderMatches(founderId: string): Promise<MatchCandidate[]> {
    try {
      console.log('Calculating matches for founder:', founderId);

      // Get founder profile
      const founderProfile = await UnifiedProfileService.getUnifiedProfile(founderId);
      if (!founderProfile || !founderProfile.profile_data) {
        console.error('Founder profile not found or incomplete');
        return [];
      }

      // Get all active advisors
      const advisorProfiles = await UnifiedProfileService.getAllProfiles('advisor');
      if (!advisorProfiles.length) {
        console.log('No advisor profiles found');
        return [];
      }

      const matches: MatchCandidate[] = [];

      for (const advisorProfile of advisorProfiles) {
        if (!advisorProfile.profile_data) continue;

        try {
          const matchScore = calculateMatchScore(
            founderProfile.profile_data,
            advisorProfile.profile_data
          );

          matches.push({
            advisorId: advisorProfile.id,
            advisor: {
              id: advisorProfile.id,
              email: advisorProfile.email,
              user_profiles: [{ profile_data: advisorProfile.profile_data }]
            },
            founderData: founderProfile.profile_data,
            matchScore
          });
        } catch (error) {
          console.error('Error calculating match for advisor:', advisorProfile.id, error);
        }
      }

      // Sort by match score
      const sortedMatches = matches.sort((a, b) => b.matchScore.overall - a.matchScore.overall);
      
      // Store results in database for caching
      await this.storeMatchResults(founderId, sortedMatches);

      console.log(`Generated ${sortedMatches.length} matches for founder ${founderId}`);
      return sortedMatches;

    } catch (error) {
      console.error('Error in calculateFounderMatches:', error);
      return [];
    }
  }

  // Store match results in database
  private static async storeMatchResults(founderId: string, matches: MatchCandidate[]): Promise<void> {
    try {
      // First, ensure assignments exist for top matches
      const topMatches = matches.slice(0, 10).filter(m => m.matchScore.overall >= this.MATCH_THRESHOLD);
      
      for (const match of topMatches) {
        // Check if assignment already exists
        const { data: existingAssignment } = await supabase
          .from('advisor_founder_assignments')
          .select('id')
          .eq('founder_id', founderId)
          .eq('advisor_id', match.advisorId)
          .single();

        let assignmentId = existingAssignment?.id;

        // Create assignment if it doesn't exist
        if (!assignmentId) {
          const { data: newAssignment, error } = await supabase
            .from('advisor_founder_assignments')
            .insert({
              founder_id: founderId,
              advisor_id: match.advisorId,
              match_score: match.matchScore.overall,
              status: 'pending',
              notes: `Auto-generated match (${match.matchScore.overall}% compatibility)`
            })
            .select('id')
            .single();

          if (error) {
            console.error('Error creating assignment:', error);
            continue;
          }
          assignmentId = newAssignment.id;
        }

        // Store detailed match scores
        if (assignmentId) {
          await supabase
            .from('matching_criteria_scores')
            .upsert({
              assignment_id: assignmentId,
              overall_score: match.matchScore.overall,
              sector_match_score: match.matchScore.sectorMatch,
              timezone_match_score: match.matchScore.timezoneMatch,
              challenge_match_score: match.matchScore.stageMatch,
              availability_match_score: match.matchScore.availabilityMatch,
              experience_match_score: match.matchScore.experienceMatch,
              algorithm_version: this.ALGORITHM_VERSION,
              calculated_at: new Date().toISOString()
            }, {
              onConflict: 'assignment_id'
            });
        }
      }
    } catch (error) {
      console.error('Error storing match results:', error);
    }
  }

  // Get matching statistics
  static async getMatchingStats(): Promise<MatchingStats> {
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

  // Get top matches for a founder
  static async getTopMatches(founderId: string, limit = 10): Promise<MatchCandidate[]> {
    try {
      // First try to get cached results
      const { data: assignments, error } = await supabase
        .from('advisor_founder_assignments')
        .select(`
          id,
          advisor_id,
          match_score,
          matching_criteria_scores (
            overall_score,
            sector_match_score,
            timezone_match_score,
            challenge_match_score,
            availability_match_score,
            experience_match_score,
            calculated_at
          )
        `)
        .eq('founder_id', founderId)
        .order('match_score', { ascending: false })
        .limit(limit);

      if (error || !assignments?.length) {
        console.log('No cached matches found, calculating fresh matches');
        return await this.calculateFounderMatches(founderId);
      }

      // Convert cached results to MatchCandidate format
      const candidates: MatchCandidate[] = [];
      
      for (const assignment of assignments) {
        const advisorProfile = await UnifiedProfileService.getUnifiedProfile(assignment.advisor_id);
        const founderProfile = await UnifiedProfileService.getUnifiedProfile(founderId);
        
        if (advisorProfile && founderProfile) {
          const scores = assignment.matching_criteria_scores?.[0];
          
          candidates.push({
            advisorId: assignment.advisor_id,
            advisor: {
              id: advisorProfile.id,
              email: advisorProfile.email,
              user_profiles: [{ profile_data: advisorProfile.profile_data }]
            },
            founderData: founderProfile.profile_data,
            matchScore: {
              overall: scores?.overall_score || assignment.match_score,
              sectorMatch: scores?.sector_match_score || 0,
              timezoneMatch: scores?.timezone_match_score || 0,
              stageMatch: scores?.challenge_match_score || 0,
              availabilityMatch: scores?.availability_match_score || 0,
              experienceMatch: scores?.experience_match_score || 0,
              breakdown: {
                sector: 'Cached result',
                timezone: 'Cached result',
                stage: 'Cached result',
                availability: 'Cached result',
                experience: 'Cached result'
              }
            }
          });
        }
      }

      return candidates.filter(c => c.matchScore.overall >= this.MATCH_THRESHOLD);

    } catch (error) {
      console.error('Error getting top matches:', error);
      return [];
    }
  }
}
