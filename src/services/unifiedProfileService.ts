
import { supabase } from '@/integrations/supabase/client';

export interface UnifiedProfile {
  id: string;
  auth_id: string;
  email: string;
  role: 'founder' | 'advisor';
  profile_data: any;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export class UnifiedProfileService {
  // Get a unified profile for a user
  static async getUnifiedProfile(userId: string): Promise<UnifiedProfile | null> {
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          auth_id,
          email,
          role,
          user_profiles (
            profile_data,
            is_profile_complete,
            created_at,
            updated_at
          )
        `)
        .eq('id', userId)
        .single();

      if (userError || !user) {
        console.error('Error fetching user:', userError);
        return null;
      }

      const profile = user.user_profiles?.[0];
      if (!profile) {
        console.error('No profile found for user:', userId);
        return null;
      }

      return {
        id: user.id,
        auth_id: user.auth_id,
        email: user.email,
        role: user.role,
        profile_data: profile.profile_data,
        is_complete: profile.is_profile_complete || false,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      };
    } catch (error) {
      console.error('Error in getUnifiedProfile:', error);
      return null;
    }
  }

  // Migrate legacy profiles to unified structure
  static async migrateToUnifiedProfile(userId: string): Promise<boolean> {
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        console.error('User not found for migration:', userError);
        return false;
      }

      // Check if unified profile already exists
      const existingProfile = await this.getUnifiedProfile(userId);
      if (existingProfile) {
        console.log('Profile already unified for user:', userId);
        return true;
      }

      let profileData = {};

      // Migrate founder profile
      if (user.role === 'founder') {
        const { data: founderProfile } = await supabase
          .from('founder_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (founderProfile) {
          profileData = {
            name: founderProfile.startup_name || 'Founder',
            startup_name: founderProfile.startup_name,
            website: founderProfile.website,
            sector: founderProfile.sector,
            stage: founderProfile.stage,
            challenge: founderProfile.current_challenge,
            win_definition: founderProfile.win_definition,
            video_link: founderProfile.video_pitch_url,
            location: 'Not specified'
          };
        }
      }

      // Migrate advisor profile
      if (user.role === 'advisor') {
        const { data: advisorProfile } = await supabase
          .from('advisor_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (advisorProfile) {
          profileData = {
            name: 'Advisor',
            linkedin: advisorProfile.linkedin_url,
            expertise: advisorProfile.areas_of_expertise || [],
            experience_level: advisorProfile.experience_level,
            timezone: advisorProfile.timezone_availability,
            challenge_preference: advisorProfile.challenge_preference,
            location: 'Not specified'
          };
        }
      }

      // Create unified profile
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          auth_id: user.auth_id,
          profile_type: user.role,
          profile_data: profileData,
          is_profile_complete: Object.keys(profileData).length > 0
        });

      if (insertError) {
        console.error('Error creating unified profile:', insertError);
        return false;
      }

      console.log('Successfully migrated profile for user:', userId);
      return true;
    } catch (error) {
      console.error('Error in migrateToUnifiedProfile:', error);
      return false;
    }
  }

  // Update unified profile
  static async updateUnifiedProfile(userId: string, profileData: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          profile_data: profileData,
          is_profile_complete: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating unified profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateUnifiedProfile:', error);
      return false;
    }
  }

  // Get all profiles for batch operations
  static async getAllProfiles(role?: 'founder' | 'advisor'): Promise<UnifiedProfile[]> {
    try {
      let query = supabase
        .from('users')
        .select(`
          id,
          auth_id,
          email,
          role,
          user_profiles (
            profile_data,
            is_profile_complete,
            created_at,
            updated_at
          )
        `)
        .eq('status', 'active')
        .is('deleted_at', null);

      if (role) {
        query = query.eq('role', role);
      }

      const { data: users, error } = await query;

      if (error) {
        console.error('Error fetching all profiles:', error);
        return [];
      }

      return users
        .filter(user => user.user_profiles?.[0])
        .map(user => {
          const profile = user.user_profiles[0];
          return {
            id: user.id,
            auth_id: user.auth_id,
            email: user.email,
            role: user.role,
            profile_data: profile.profile_data,
            is_complete: profile.is_profile_complete || false,
            created_at: profile.created_at,
            updated_at: profile.updated_at
          };
        });
    } catch (error) {
      console.error('Error in getAllProfiles:', error);
      return [];
    }
  }
}
