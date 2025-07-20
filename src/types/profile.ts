
export interface FounderProfileData {
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

export interface AdvisorProfileData {
  name: string;
  location: string;
  linkedin: string;
  expertise: string[];
  experience_level: string;
  timezone: string;
  challenge_preference?: string;
}

export type ProfileData = FounderProfileData | AdvisorProfileData;

// Enhanced UserProfile interface that matches the actual database structure
export interface UserProfile {
  id: string;
  auth_id: string;
  email: string;
  role: string;
  status: string;
  profile_completed: boolean; // This is the correct property name from the database
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  last_active_at?: string;
  organization_id?: string;
}

// Extended interface for user profiles with additional data
export interface ExtendedUserProfile extends UserProfile {
  user_profiles?: {
    id: string;
    user_id: string;
    profile_type: 'founder' | 'advisor';
    profile_data: ProfileData;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
    is_profile_complete?: boolean;
  }[];
}

// Interface for user profile data from the user_profiles table
export interface UserProfileData {
  id: string;
  user_id: string;
  auth_id: string;
  profile_type: 'founder' | 'advisor';
  profile_data: ProfileData;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  is_profile_complete?: boolean;
}
