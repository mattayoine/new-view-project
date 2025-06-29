
import { FounderProfileData, AdvisorProfileData } from '@/types/profile';

export interface MatchScore {
  overall: number;
  sectorMatch: number;
  timezoneMatch: number;
  stageMatch: number;
  availabilityMatch: number;
  experienceMatch: number;
  breakdown: {
    sector: string;
    timezone: string;
    stage: string;
    availability: string;
    experience: string;
  };
}

export interface MatchCandidate {
  advisorId: string;
  advisor: any;
  founderData: FounderProfileData;
  matchScore: MatchScore;
}

// Matching weights (can be customized later)
const WEIGHTS = {
  sector: 0.3,
  timezone: 0.2,
  stage: 0.2,
  availability: 0.2,
  experience: 0.1
};

export const calculateMatchScore = (
  founderData: FounderProfileData,
  advisorData: AdvisorProfileData
): MatchScore => {
  const sectorMatch = calculateSectorMatch(founderData.sector, advisorData.expertise);
  const timezoneMatch = calculateTimezoneMatch(founderData.location, advisorData.timezone);
  const stageMatch = calculateStageMatch(founderData.stage, advisorData.experience_level);
  const availabilityMatch = calculateAvailabilityMatch(
    founderData.challenge, 
    advisorData.challenge_preference || ''
  );
  const experienceMatch = calculateExperienceMatch(
    founderData.sector,
    advisorData.expertise,
    advisorData.experience_level
  );

  const overall = Math.round(
    (sectorMatch * WEIGHTS.sector +
     timezoneMatch * WEIGHTS.timezone +
     stageMatch * WEIGHTS.stage +
     availabilityMatch * WEIGHTS.availability +
     experienceMatch * WEIGHTS.experience) * 100
  );

  return {
    overall,
    sectorMatch: Math.round(sectorMatch * 100),
    timezoneMatch: Math.round(timezoneMatch * 100),
    stageMatch: Math.round(stageMatch * 100),
    availabilityMatch: Math.round(availabilityMatch * 100),
    experienceMatch: Math.round(experienceMatch * 100),
    breakdown: {
      sector: getSectorMatchExplanation(founderData.sector, advisorData.expertise),
      timezone: getTimezoneMatchExplanation(founderData.location, advisorData.timezone),
      stage: getStageMatchExplanation(founderData.stage, advisorData.experience_level),
      availability: getAvailabilityMatchExplanation(founderData.challenge, advisorData.challenge_preference || ''),
      experience: getExperienceMatchExplanation(advisorData.experience_level)
    }
  };
};

const calculateSectorMatch = (founderSector: string, advisorExpertise: string[]): number => {
  if (!founderSector || !advisorExpertise?.length) return 0;
  
  const founderSectorLower = founderSector.toLowerCase();
  const expertiseMatch = advisorExpertise.some(exp => 
    exp.toLowerCase().includes(founderSectorLower) || 
    founderSectorLower.includes(exp.toLowerCase())
  );
  
  return expertiseMatch ? 1 : 0.3;
};

const calculateTimezoneMatch = (founderLocation: string, advisorTimezone: string): number => {
  // Simplified timezone matching - can be enhanced with actual timezone libraries
  if (!founderLocation || !advisorTimezone) return 0.5;
  
  const locationLower = founderLocation.toLowerCase();
  const timezoneLower = advisorTimezone.toLowerCase();
  
  // Basic geographic matching
  if (locationLower.includes('us') && timezoneLower.includes('us')) return 1;
  if (locationLower.includes('uk') && timezoneLower.includes('gmt')) return 1;
  if (locationLower.includes('europe') && timezoneLower.includes('cet')) return 1;
  
  return 0.6; // Default moderate match
};

const calculateStageMatch = (founderStage: string, advisorExperience: string): number => {
  if (!founderStage || !advisorExperience) return 0.5;
  
  const stageMap: { [key: string]: string[] } = {
    'idea': ['junior', 'mid'],
    'mvp': ['mid', 'senior'],
    'early_stage': ['mid', 'senior'],
    'growth': ['senior', 'executive'],
    'scale': ['senior', 'executive']
  };
  
  const stageLower = founderStage.toLowerCase();
  const expLower = advisorExperience.toLowerCase();
  
  const matchingLevels = stageMap[stageLower] || ['mid'];
  return matchingLevels.some(level => expLower.includes(level)) ? 1 : 0.4;
};

const calculateAvailabilityMatch = (founderChallenge: string, advisorPreference: string): number => {
  if (!founderChallenge || !advisorPreference) return 0.7;
  
  const challengeLower = founderChallenge.toLowerCase();
  const preferenceLower = advisorPreference.toLowerCase();
  
  // Simple keyword matching - can be enhanced with NLP
  const commonKeywords = ['marketing', 'product', 'funding', 'growth', 'tech', 'strategy'];
  const challengeKeywords = commonKeywords.filter(kw => challengeLower.includes(kw));
  const preferenceKeywords = commonKeywords.filter(kw => preferenceLower.includes(kw));
  
  const overlap = challengeKeywords.filter(kw => preferenceKeywords.includes(kw)).length;
  const total = Math.max(challengeKeywords.length, preferenceKeywords.length, 1);
  
  return Math.max(overlap / total, 0.3);
};

const calculateExperienceMatch = (
  founderSector: string, 
  advisorExpertise: string[],
  advisorExperience: string
): number => {
  if (!advisorExperience) return 0.5;
  
  const expLower = advisorExperience.toLowerCase();
  if (expLower.includes('senior') || expLower.includes('executive')) return 0.9;
  if (expLower.includes('mid')) return 0.7;
  return 0.5;
};

// Explanation functions
const getSectorMatchExplanation = (founderSector: string, advisorExpertise: string[]): string => {
  if (!founderSector || !advisorExpertise?.length) return 'No sector information available';
  
  const matches = advisorExpertise.filter(exp => 
    exp.toLowerCase().includes(founderSector.toLowerCase()) || 
    founderSector.toLowerCase().includes(exp.toLowerCase())
  );
  
  if (matches.length > 0) {
    return `Strong match: ${matches.join(', ')} aligns with ${founderSector}`;
  }
  return `Partial match: ${founderSector} may benefit from ${advisorExpertise.join(', ')}`;
};

const getTimezoneMatchExplanation = (founderLocation: string, advisorTimezone: string): string => {
  return `${founderLocation || 'Unknown location'} ↔ ${advisorTimezone || 'Unknown timezone'}`;
};

const getStageMatchExplanation = (founderStage: string, advisorExperience: string): string => {
  return `${founderStage || 'Unknown stage'} founder with ${advisorExperience || 'Unknown experience'} advisor`;
};

const getAvailabilityMatchExplanation = (founderChallenge: string, advisorPreference: string): string => {
  return `Challenge: "${founderChallenge || 'Not specified'}" ↔ Preference: "${advisorPreference || 'Not specified'}"`;
};

const getExperienceMatchExplanation = (advisorExperience: string): string => {
  return `Advisor experience level: ${advisorExperience || 'Not specified'}`;
};

export const rankAdvisorsByMatch = (
  founderData: FounderProfileData,
  advisors: any[]
): MatchCandidate[] => {
  const candidates = advisors.map(advisor => {
    const advisorProfile = advisor.advisor_profiles?.[0]?.profile_data;
    if (!advisorProfile) return null;
    
    const matchScore = calculateMatchScore(founderData, advisorProfile);
    
    return {
      advisorId: advisor.id,
      advisor,
      founderData,
      matchScore
    };
  }).filter(Boolean) as MatchCandidate[];
  
  return candidates.sort((a, b) => b.matchScore.overall - a.matchScore.overall);
};
