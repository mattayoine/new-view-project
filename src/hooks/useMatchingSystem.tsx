import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MatchCriteria {
  sector: string[];
  experience_level: string[];
  challenge_preference: string[];
  timezone_compatibility: number; // hours difference tolerance
  availability_overlap: number; // minimum hours per week
}

export interface MatchScore {
  advisor_id: string;
  founder_id: string;
  overall_score: number;
  sector_match: number;
  experience_match: number;
  challenge_match: number;
  timezone_match: number;
  availability_match: number;
  reasoning: string[];
}

export const useMatchingSystem = () => {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<MatchScore[]>([]);
  const { toast } = useToast();

  const calculateMatchScore = async (founderId: string, advisorId?: string): Promise<MatchScore[]> => {
    setLoading(true);
    try {
      // Get founder profile and preferences
      const { data: founderProfile } = await supabase
        .from('founder_profiles')
        .select(`
          *,
          user_profiles!inner(*)
        `)
        .eq('user_profiles.user_id', founderId)
        .single();

      if (!founderProfile) {
        throw new Error('Founder profile not found');
      }

      // Get potential advisors (or specific advisor)
      let advisorQuery = supabase
        .from('advisor_profiles')
        .select(`
          *,
          user_profiles!inner(*)
        `);

      if (advisorId) {
        advisorQuery = advisorQuery.eq('user_profiles.user_id', advisorId);
      }

      const { data: advisorProfiles } = await advisorQuery;

      if (!advisorProfiles?.length) {
        return [];
      }

      const matchScores: MatchScore[] = [];

      for (const advisor of advisorProfiles) {
        const score = await calculateIndividualMatch(founderProfile, advisor);
        matchScores.push(score);
      }

      // Sort by overall score descending
      matchScores.sort((a, b) => b.overall_score - a.overall_score);
      setMatches(matchScores);

      return matchScores;

    } catch (error) {
      console.error('Error calculating match scores:', error);
      toast({
        title: 'Matching Error',
        description: 'Failed to calculate match scores',
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const calculateIndividualMatch = async (founder: any, advisor: any): Promise<MatchScore> => {
    const reasoning: string[] = [];
    
    // Sector Match (25% weight)
    const sectorScore = calculateSectorMatch(founder.sector, advisor.areas_of_expertise, reasoning);
    
    // Experience Match (25% weight)
    const experienceScore = calculateExperienceMatch(founder.stage, advisor.experience_level, reasoning);
    
    // Challenge Match (20% weight)
    const challengeScore = calculateChallengeMatch(founder.current_challenge, advisor.challenge_preference, reasoning);
    
    // Timezone Match (15% weight)
    const timezoneScore = calculateTimezoneMatch(
      founder.user_profiles?.profile_data?.timezone || 'UTC',
      advisor.timezone_availability || 'UTC',
      reasoning
    );
    
    // Availability Match (15% weight)
    const availabilityScore = await calculateAvailabilityMatch(advisor.user_profiles.user_id, reasoning);

    // Calculate weighted overall score
    const overallScore = Math.round(
      (sectorScore * 0.25) +
      (experienceScore * 0.25) +
      (challengeScore * 0.20) +
      (timezoneScore * 0.15) +
      (availabilityScore * 0.15)
    );

    return {
      advisor_id: advisor.user_profiles.user_id,
      founder_id: founder.user_profiles.user_id,
      overall_score: overallScore,
      sector_match: sectorScore,
      experience_match: experienceScore,
      challenge_match: challengeScore,
      timezone_match: timezoneScore,
      availability_match: availabilityScore,
      reasoning
    };
  };

  const calculateSectorMatch = (founderSector: string, advisorExpertise: string[], reasoning: string[]): number => {
    if (!founderSector || !advisorExpertise?.length) {
      reasoning.push('Missing sector or expertise information');
      return 0;
    }

    const sectorMatch = advisorExpertise.some(expertise => 
      expertise.toLowerCase().includes(founderSector.toLowerCase()) ||
      founderSector.toLowerCase().includes(expertise.toLowerCase())
    );

    if (sectorMatch) {
      reasoning.push(`Strong sector alignment: ${founderSector} matches advisor expertise`);
      return 90;
    }

    // Check for related sectors
    const relatedSectors = getRelatedSectors(founderSector);
    const hasRelatedMatch = advisorExpertise.some(expertise =>
      relatedSectors.some(related => 
        expertise.toLowerCase().includes(related.toLowerCase())
      )
    );

    if (hasRelatedMatch) {
      reasoning.push(`Related sector experience found`);
      return 65;
    }

    reasoning.push(`No direct sector alignment`);
    return 30;
  };

  const calculateExperienceMatch = (founderStage: string, advisorExperience: string, reasoning: string[]): number => {
    const stageExperienceMap: Record<string, string[]> = {
      'idea': ['junior', 'mid'],
      'prototype': ['junior', 'mid', 'senior'],
      'mvp': ['mid', 'senior'],
      'early_revenue': ['mid', 'senior', 'expert'],
      'growth': ['senior', 'expert'],
      'scale': ['expert']
    };

    const suitableExperience = stageExperienceMap[founderStage] || ['mid', 'senior'];
    
    if (suitableExperience.includes(advisorExperience)) {
      reasoning.push(`Perfect experience match for ${founderStage} stage`);
      return 95;
    }

    reasoning.push(`Experience level may not be optimal for current stage`);
    return 45;
  };

  const calculateChallengeMatch = (founderChallenge: string, advisorPreference: string, reasoning: string[]): number => {
    if (!founderChallenge || !advisorPreference) {
      reasoning.push('Missing challenge information');
      return 50;
    }

    const challengeKeywords = founderChallenge.toLowerCase().split(' ');
    const preferenceKeywords = advisorPreference.toLowerCase().split(' ');

    const matchingKeywords = challengeKeywords.filter(keyword =>
      preferenceKeywords.some(pref => pref.includes(keyword) || keyword.includes(pref))
    );

    const matchPercentage = (matchingKeywords.length / Math.max(challengeKeywords.length, 1)) * 100;

    if (matchPercentage > 50) {
      reasoning.push(`Strong challenge-preference alignment`);
      return Math.min(95, 60 + matchPercentage);
    }

    reasoning.push(`Limited challenge-preference overlap`);
    return Math.max(20, matchPercentage);
  };

  const calculateTimezoneMatch = (founderTz: string, advisorTz: string, reasoning: string[]): number => {
    // Simplified timezone calculation - in production, use proper timezone library
    const timezoneOffsets: Record<string, number> = {
      'UTC': 0,
      'EST': -5,
      'PST': -8,
      'GMT': 0,
      'CET': 1,
      'JST': 9,
      'AEST': 10
    };

    const founderOffset = timezoneOffsets[founderTz] || 0;
    const advisorOffset = timezoneOffsets[advisorTz] || 0;
    const hoursDifference = Math.abs(founderOffset - advisorOffset);

    if (hoursDifference <= 3) {
      reasoning.push(`Excellent timezone compatibility (${hoursDifference}h difference)`);
      return 95;
    } else if (hoursDifference <= 6) {
      reasoning.push(`Good timezone compatibility (${hoursDifference}h difference)`);
      return 75;
    } else if (hoursDifference <= 9) {
      reasoning.push(`Moderate timezone challenge (${hoursDifference}h difference)`);
      return 50;
    } else {
      reasoning.push(`Significant timezone challenge (${hoursDifference}h difference)`);
      return 25;
    }
  };

  const calculateAvailabilityMatch = async (advisorId: string, reasoning: string[]): Promise<number> => {
    try {
      const { data: availability } = await supabase
        .from('advisor_availability')
        .select('*')
        .eq('advisor_id', advisorId)
        .eq('is_active', true);

      if (!availability?.length) {
        reasoning.push('No availability schedule set');
        return 30;
      }

      const totalHours = availability.reduce((sum, slot) => {
        const start = new Date(`2000-01-01T${slot.start_time}`);
        const end = new Date(`2000-01-01T${slot.end_time}`);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0);

      if (totalHours >= 10) {
        reasoning.push(`Excellent availability (${totalHours}h/week)`);
        return 95;
      } else if (totalHours >= 5) {
        reasoning.push(`Good availability (${totalHours}h/week)`);
        return 75;
      } else {
        reasoning.push(`Limited availability (${totalHours}h/week)`);
        return 40;
      }

    } catch (error) {
      reasoning.push('Could not verify availability');
      return 50;
    }
  };

  const getRelatedSectors = (sector: string): string[] => {
    const sectorMap: Record<string, string[]> = {
      'fintech': ['finance', 'banking', 'payments', 'blockchain'],
      'healthtech': ['healthcare', 'medical', 'wellness', 'biotech'],
      'edtech': ['education', 'learning', 'training', 'academic'],
      'agtech': ['agriculture', 'farming', 'food', 'sustainability'],
      'retail': ['ecommerce', 'commerce', 'marketplace', 'consumer'],
      'saas': ['software', 'technology', 'enterprise', 'productivity']
    };

    return sectorMap[sector.toLowerCase()] || [];
  };

  const createAssignment = async (founderId: string, advisorId: string, matchScore: number): Promise<boolean> => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('advisor_founder_assignments')
        .insert({
          advisor_id: advisorId,
          founder_id: founderId,
          match_score: matchScore,
          status: 'active',
          assigned_by: null // Will be set by RLS/trigger
        })
        .select()
        .single();

      if (error) throw error;

      // Store detailed match criteria
      await supabase
        .from('matching_criteria_scores')
        .insert({
          assignment_id: data.id,
          overall_score: matchScore,
          algorithm_version: '1.0'
        });

      toast({
        title: 'Assignment Created',
        description: 'Advisor and founder have been successfully matched'
      });

      return true;

    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: 'Assignment Failed',
        description: 'Could not create the assignment',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    matches,
    calculateMatchScore,
    createAssignment
  };
};