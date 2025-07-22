
import { FounderProfileData, AdvisorProfileData } from '@/types/profile';
import { calculateMatchScore, MatchScore } from './matchingAlgorithmCore';

export interface MatchCandidate {
  advisorId: string;
  advisor: any;
  founderData: FounderProfileData;
  matchScore: MatchScore;
}

export { MatchScore };

export const rankAdvisorsByMatch = (
  founderData: FounderProfileData,
  advisors: any[]
): MatchCandidate[] => {
  console.log('Ranking advisors by match:', { founderData: founderData.name, advisorsCount: advisors.length });
  
  if (!founderData || !advisors?.length) {
    console.log('Missing founder data or advisors');
    return [];
  }

  try {
    const candidates = advisors.map(advisor => {
      // Handle both old structure (advisor_profiles) and new structure (user_profiles)
      const advisorProfile = advisor.advisor_profiles?.[0]?.profile_data || 
                            advisor.user_profiles?.[0]?.profile_data;
      
      if (!advisorProfile) {
        console.log('No advisor profile found for:', advisor.id);
        return null;
      }
      
      const matchScore = calculateMatchScore(founderData, advisorProfile);
      
      return {
        advisorId: advisor.id,
        advisor,
        founderData,
        matchScore
      };
    }).filter(Boolean) as MatchCandidate[];
    
    const sortedCandidates = candidates.sort((a, b) => b.matchScore.overall - a.matchScore.overall);
    console.log('Generated match candidates:', sortedCandidates.length);
    
    return sortedCandidates;
  } catch (error) {
    console.error('Error in rankAdvisorsByMatch:', error);
    return [];
  }
};

// Re-export the core calculation function
export { calculateMatchScore };
