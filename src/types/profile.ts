
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

export interface UserProfile {
  id: string;
  user_id: string;
  profile_type: 'founder' | 'advisor';
  profile_data: ProfileData;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}
