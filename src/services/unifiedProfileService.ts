
import { supabase } from '@/integrations/supabase/client';
import { FounderProfileData, AdvisorProfileData } from '@/types/profile';

export interface UnifiedProfile {
  id: string;
  auth_id: string;
  email: string;
  role: 'founder' | 'advisor';
  profile_data: FounderProfileData | AdvisorProfileData;
  profile_complete: boolean;
  last_updated: string;
}

export class UnifiedProfileService {
  
  // Get a unified profile for any user
  static async getUnifiedProfile(userId: string): Promise<UnifiedProfile | null> {
    try {
      // Get user basic info
      const { data: user } = await supabase
        .from('users')
        .select('id, auth_id, email, role, profile_completed')
        .eq('id', userId)
        .single();

      if (!user) return null;

      // Get profile data from user_profiles table (new unified approach)
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('profile_data, updated_at')
        .eq('id', userId)
        .single();

      // Fallback to legacy profile tables if user_profiles doesn't exist
      let profileData = userProfile?.profile_data as FounderProfileData | AdvisorProfileData;
      let isComplete = user.profile_completed || false;

      if (!profileData) {
        if (user.role === 'founder') {
          const { data: founderProfile } = await supabase
            .from('founder_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (founderProfile) {
            profileData = {
              name: user.email.split('@')[0], // fallback name
              location: 'Unknown',
              startup_name: founderProfile.startup_name,
              website: founderProfile.website,
              sector: founderProfile.sector,
              stage: founderProfile.stage,
              challenge: founderProfile.current_challenge,
              win_definition: founderProfile.win_definition,
              video_link: founderProfile.video_pitch_url
            } as FounderProfileData;
          }
        } else if (user.role === 'advisor') {
          const { data: advisorProfile } = await supabase
            .from('advisor_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (advisorProfile) {
            profileData = {
              name: user.email.split('@')[0], // fallback name
              location: 'Unknown',
              linkedin: advisorProfile.linkedin_url || '',
              expertise: advisorProfile.areas_of_expertise || [],
              experience_level: advisorProfile.experience_level || 'mid',
              timezone: advisorProfile.timezone_availability || 'UTC',
              challenge_preference: advisorProfile.challenge_preference
            } as AdvisorProfileData;
          }
        }
      }

      return {
        id: user.id,
        auth_id: user.auth_id,
        email: user.email,
        role: user.role as 'founder' | 'advisor',
        profile_data: profileData || {} as FounderProfileData | AdvisorProfileData,
        profile_complete: isComplete,
        last_updated: userProfile?.updated_at || new Date().toISOString()
      };

    } catch (error) {
      console.error('Error fetching unified profile:', error);
      return null;
    }
  }

  // Get all profiles for matching (founders or advisors)
  static async getAllProfilesByRole(role: 'founder' | 'advisor'): Promise<UnifiedProfile[]> {
    try {
      const { data: users } = await supabase
        .from('users')
        .select('id, auth_id, email, role, profile_completed')
        .eq('role', role)
        .eq('status', 'active')
        .is('deleted_at', null);

      if (!users) return [];

      const profiles: UnifiedProfile[] = [];
      
      for (const user of users) {
        const profile = await this.getUnifiedProfile(user.id);
        if (profile && profile.profile_complete) {
          profiles.push(profile);
        }
      }

      return profiles;

    } catch (error) {
      console.error(`Error fetching ${role} profiles:`, error);
      return [];
    }
  }

  // Batch get profiles by IDs
  static async getProfilesByIds(userIds: string[]): Promise<UnifiedProfile[]> {
    const profiles: UnifiedProfile[] = [];
    
    for (const userId of userIds) {
      const profile = await this.getUnifiedProfile(userId);
      if (profile) {
        profiles.push(profile);
      }
    }

    return profiles;
  }

  // Update or migrate legacy profile to unified structure
  static async migrateToUnifiedProfile(userId: string): Promise<boolean> {
    try {
      const profile = await this.getUnifiedProfile(userId);
      if (!profile || !profile.profile_data) return false;

      // Upsert to user_profiles table with proper Json casting
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          auth_id: profile.auth_id,
          profile_type: profile.role,
          profile_data: profile.profile_data as any, // Cast to Json type
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update main users table
      await supabase
        .from('users')
        .update({ profile_completed: profile.profile_complete })
        .eq('id', userId);

      return true;

    } catch (error) {
      console.error('Error migrating profile:', error);
      return false;
    }
  }

  // Check if a profile is complete for matching
  static isProfileReadyForMatching(profile: UnifiedProfile): boolean {
    if (!profile.profile_data) return false;

    if (profile.role === 'founder') {
      const data = profile.profile_data as FounderProfileData;
      return !!(data.name && data.startup_name && data.sector && data.stage && data.challenge);
    } else {
      const data = profile.profile_data as AdvisorProfileData;
      return !!(data.name && data.expertise?.length && data.experience_level && data.timezone);
    }
  }
}
