
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FounderProfileData {
  name: string;
  location: string;
  startup_name: string;
  website?: string;
  sector: string;
  stage: string;
  challenge: string;
  win_definition?: string;
  video_link?: string;
}

interface AdvisorProfileData {
  name: string;
  location: string;
  linkedin: string;
  expertise: string[];
  experience_level: string;
  timezone: string;
  challenge_preference?: string;
}

interface MatchScore {
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

// Matching weights
const WEIGHTS = {
  sector: 0.3,
  timezone: 0.2,
  stage: 0.2,
  availability: 0.2,
  experience: 0.1
};

const calculateMatchScore = (
  founderData: FounderProfileData,
  advisorData: AdvisorProfileData
): MatchScore => {
  console.log('Calculating match score for:', { founderData: founderData.name, advisorData: advisorData.name });
  
  try {
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
  } catch (error) {
    console.error('Error calculating match score:', error);
    return {
      overall: 50,
      sectorMatch: 50,
      timezoneMatch: 50,
      stageMatch: 50,
      availabilityMatch: 50,
      experienceMatch: 50,
      breakdown: {
        sector: 'Unable to calculate sector match',
        timezone: 'Unable to calculate timezone match',
        stage: 'Unable to calculate stage match',
        availability: 'Unable to calculate availability match',
        experience: 'Unable to calculate experience match'
      }
    };
  }
};

const calculateSectorMatch = (founderSector: string, advisorExpertise: string[]): number => {
  if (!founderSector || !advisorExpertise?.length) return 0;
  
  try {
    const founderSectorLower = founderSector.toLowerCase();
    const expertiseMatch = advisorExpertise.some(exp => 
      exp.toLowerCase().includes(founderSectorLower) || 
      founderSectorLower.includes(exp.toLowerCase())
    );
    
    return expertiseMatch ? 1 : 0.3;
  } catch (error) {
    console.error('Error in calculateSectorMatch:', error);
    return 0.5;
  }
};

const calculateTimezoneMatch = (founderLocation: string, advisorTimezone: string): number => {
  if (!founderLocation || !advisorTimezone) return 0.5;
  
  try {
    const locationLower = founderLocation.toLowerCase();
    const timezoneLower = advisorTimezone.toLowerCase();
    
    if (locationLower.includes('us') && timezoneLower.includes('us')) return 1;
    if (locationLower.includes('uk') && timezoneLower.includes('gmt')) return 1;
    if (locationLower.includes('europe') && timezoneLower.includes('cet')) return 1;
    
    return 0.6;
  } catch (error) {
    console.error('Error in calculateTimezoneMatch:', error);
    return 0.5;
  }
};

const calculateStageMatch = (founderStage: string, advisorExperience: string): number => {
  if (!founderStage || !advisorExperience) return 0.5;
  
  try {
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
  } catch (error) {
    console.error('Error in calculateStageMatch:', error);
    return 0.5;
  }
};

const calculateAvailabilityMatch = (founderChallenge: string, advisorPreference: string): number => {
  if (!founderChallenge || !advisorPreference) return 0.7;
  
  try {
    const challengeLower = founderChallenge.toLowerCase();
    const preferenceLower = advisorPreference.toLowerCase();
    
    const commonKeywords = ['marketing', 'product', 'funding', 'growth', 'tech', 'strategy'];
    const challengeKeywords = commonKeywords.filter(kw => challengeLower.includes(kw));
    const preferenceKeywords = commonKeywords.filter(kw => preferenceLower.includes(kw));
    
    const overlap = challengeKeywords.filter(kw => preferenceKeywords.includes(kw)).length;
    const total = Math.max(challengeKeywords.length, preferenceKeywords.length, 1);
    
    return Math.max(overlap / total, 0.3);
  } catch (error) {
    console.error('Error in calculateAvailabilityMatch:', error);
    return 0.5;
  }
};

const calculateExperienceMatch = (
  founderSector: string, 
  advisorExpertise: string[],
  advisorExperience: string
): number => {
  if (!advisorExperience) return 0.5;
  
  try {
    const expLower = advisorExperience.toLowerCase();
    if (expLower.includes('senior') || expLower.includes('executive')) return 0.9;
    if (expLower.includes('mid')) return 0.7;
    return 0.5;
  } catch (error) {
    console.error('Error in calculateExperienceMatch:', error);
    return 0.5;
  }
};

// Explanation functions
const getSectorMatchExplanation = (founderSector: string, advisorExpertise: string[]): string => {
  if (!founderSector || !advisorExpertise?.length) return 'No sector information available';
  
  try {
    const matches = advisorExpertise.filter(exp => 
      exp.toLowerCase().includes(founderSector.toLowerCase()) || 
      founderSector.toLowerCase().includes(exp.toLowerCase())
    );
    
    if (matches.length > 0) {
      return `Strong match: ${matches.join(', ')} aligns with ${founderSector}`;
    }
    return `Partial match: ${founderSector} may benefit from ${advisorExpertise.join(', ')}`;
  } catch (error) {
    console.error('Error in getSectorMatchExplanation:', error);
    return 'Unable to determine sector match';
  }
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { founderId, advisorId, batchMode = false } = await req.json();

    if (batchMode) {
      // Batch calculation for all founders
      console.log('Starting batch match calculation...');
      
      const { data: founders } = await supabase
        .from('users')
        .select(`
          id, email, role,
          user_profiles!inner(profile_data)
        `)
        .eq('role', 'founder')
        .eq('status', 'active')
        .is('deleted_at', null);

      const { data: advisors } = await supabase
        .from('users')
        .select(`
          id, email, role,
          user_profiles!inner(profile_data)
        `)
        .eq('role', 'advisor')
        .eq('status', 'active')
        .is('deleted_at', null);

      if (!founders || !advisors) {
        throw new Error('Failed to fetch founders or advisors');
      }

      let processedCount = 0;
      const totalCalculations = founders.length * advisors.length;

      for (const founder of founders) {
        const founderProfile = founder.user_profiles[0]?.profile_data as FounderProfileData;
        if (!founderProfile) continue;

        const matches = [];
        
        for (const advisor of advisors) {
          const advisorProfile = advisor.user_profiles[0]?.profile_data as AdvisorProfileData;
          if (!advisorProfile) continue;

          const matchScore = calculateMatchScore(founderProfile, advisorProfile);
          
          matches.push({
            founder_id: founder.id,
            advisor_id: advisor.id,
            overall_score: matchScore.overall,
            sector_score: matchScore.sectorMatch,
            timezone_score: matchScore.timezoneMatch,
            stage_score: matchScore.stageMatch,
            availability_score: matchScore.availabilityMatch,
            experience_score: matchScore.experienceMatch,
            reasoning: Object.values(matchScore.breakdown),
            calculated_at: new Date().toISOString(),
            algorithm_version: '2.0'
          });

          processedCount++;
        }

        // Store matches for this founder
        if (matches.length > 0) {
          await supabase.from('matching_criteria_scores').upsert(matches, {
            onConflict: 'founder_id,advisor_id'
          });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        processedCalculations: processedCount,
        totalFounders: founders.length,
        totalAdvisors: advisors.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (founderId && advisorId) {
      // Single match calculation
      const { data: founder } = await supabase
        .from('users')
        .select(`
          id, email,
          user_profiles!inner(profile_data)
        `)
        .eq('id', founderId)
        .single();

      const { data: advisor } = await supabase
        .from('users')
        .select(`
          id, email,
          user_profiles!inner(profile_data)
        `)
        .eq('id', advisorId)
        .single();

      if (!founder || !advisor) {
        throw new Error('Founder or advisor not found');
      }

      const founderProfile = founder.user_profiles[0]?.profile_data as FounderProfileData;
      const advisorProfile = advisor.user_profiles[0]?.profile_data as AdvisorProfileData;

      if (!founderProfile || !advisorProfile) {
        throw new Error('Profile data not found');
      }

      const matchScore = calculateMatchScore(founderProfile, advisorProfile);

      // Store the match result
      await supabase.from('matching_criteria_scores').upsert({
        founder_id: founderId,
        advisor_id: advisorId,
        overall_score: matchScore.overall,
        sector_score: matchScore.sectorMatch,
        timezone_score: matchScore.timezoneMatch,
        stage_score: matchScore.stageMatch,
        availability_score: matchScore.availabilityMatch,
        experience_score: matchScore.experienceMatch,
        reasoning: Object.values(matchScore.breakdown),
        calculated_at: new Date().toISOString(),
        algorithm_version: '2.0'
      }, { onConflict: 'founder_id,advisor_id' });

      return new Response(JSON.stringify({
        success: true,
        matchScore,
        founder: { id: founder.id, name: founderProfile.name },
        advisor: { id: advisor.id, name: advisorProfile.name }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (founderId) {
      // Calculate matches for a specific founder
      const { data: founder } = await supabase
        .from('users')
        .select(`
          id, email,
          user_profiles!inner(profile_data)
        `)
        .eq('id', founderId)
        .single();

      const { data: advisors } = await supabase
        .from('users')
        .select(`
          id, email,
          user_profiles!inner(profile_data)
        `)
        .eq('role', 'advisor')
        .eq('status', 'active')
        .is('deleted_at', null);

      if (!founder || !advisors) {
        throw new Error('Founder or advisors not found');
      }

      const founderProfile = founder.user_profiles[0]?.profile_data as FounderProfileData;
      if (!founderProfile) {
        throw new Error('Founder profile data not found');
      }

      const matches = [];
      
      for (const advisor of advisors) {
        const advisorProfile = advisor.user_profiles[0]?.profile_data as AdvisorProfileData;
        if (!advisorProfile) continue;

        const matchScore = calculateMatchScore(founderProfile, advisorProfile);
        
        matches.push({
          founder_id: founderId,
          advisor_id: advisor.id,
          overall_score: matchScore.overall,
          sector_score: matchScore.sectorMatch,
          timezone_score: matchScore.timezoneMatch,
          stage_score: matchScore.stageMatch,
          availability_score: matchScore.availabilityMatch,
          experience_score: matchScore.experienceMatch,
          reasoning: Object.values(matchScore.breakdown),
          calculated_at: new Date().toISOString(),
          algorithm_version: '2.0',
          advisor,
          matchScore
        });
      }

      // Store matches in database
      const matchRecords = matches.map(m => ({
        founder_id: m.founder_id,
        advisor_id: m.advisor_id,
        overall_score: m.overall_score,
        sector_score: m.sector_score,
        timezone_score: m.timezone_score,
        stage_score: m.stage_score,
        availability_score: m.availability_score,
        experience_score: m.experience_score,
        reasoning: m.reasoning,
        calculated_at: m.calculated_at,
        algorithm_version: m.algorithm_version
      }));

      if (matchRecords.length > 0) {
        await supabase.from('matching_criteria_scores').upsert(matchRecords, {
          onConflict: 'founder_id,advisor_id'
        });
      }

      // Sort by match score and return top matches
      const sortedMatches = matches
        .sort((a, b) => b.overall_score - a.overall_score)
        .slice(0, 20);

      return new Response(JSON.stringify({
        success: true,
        matches: sortedMatches,
        totalCalculated: matches.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      error: 'Invalid request parameters'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in calculate-matches function:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
