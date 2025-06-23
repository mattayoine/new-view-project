
import React from 'react';
import { useUserWithProfile } from '@/hooks/useUserProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Building, Globe, Briefcase } from 'lucide-react';
import { FounderProfileData, AdvisorProfileData } from '@/types/profile';

interface ProfileSectionProps {
  userId?: string;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ userId }) => {
  const { data: userWithProfile, isLoading } = useUserWithProfile(userId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userWithProfile?.profile) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Profile information not available</p>
        </CardContent>
      </Card>
    );
  }

  const profile = userWithProfile.profile;
  // Fix the type casting by first converting to unknown, then to our expected type
  const profileData = profile.profile_data as unknown as FounderProfileData | AdvisorProfileData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{profileData.name}</h3>
          <Badge variant="outline" className="capitalize">
            {userWithProfile.role}
          </Badge>
        </div>
        
        <div className="flex items-center text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          {profileData.location}
        </div>

        {profile.profile_type === 'founder' && (
          <div className="space-y-3">
            <div className="flex items-center">
              <Building className="w-4 h-4 mr-2" />
              <span className="font-medium">{(profileData as FounderProfileData).startup_name}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Sector:</span> {(profileData as FounderProfileData).sector}
              </div>
              <div>
                <span className="font-medium">Stage:</span> {(profileData as FounderProfileData).stage}
              </div>
            </div>

            {(profileData as FounderProfileData).website && (
              <div className="flex items-center">
                <Globe className="w-4 h-4 mr-2" />
                <a 
                  href={(profileData as FounderProfileData).website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {(profileData as FounderProfileData).website}
                </a>
              </div>
            )}

            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium mb-1">Current Challenge:</p>
              <p className="text-sm text-gray-700">{(profileData as FounderProfileData).challenge}</p>
            </div>
          </div>
        )}

        {profile.profile_type === 'advisor' && (
          <div className="space-y-3">
            <div className="flex items-center">
              <Briefcase className="w-4 h-4 mr-2" />
              <span className="text-sm">{(profileData as AdvisorProfileData).experience_level}</span>
            </div>

            <div>
              <span className="font-medium text-sm">Expertise:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {(profileData as AdvisorProfileData).expertise?.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="text-sm">
              <span className="font-medium">Timezone:</span> {(profileData as AdvisorProfileData).timezone}
            </div>

            {(profileData as AdvisorProfileData).linkedin && (
              <div>
                <a 
                  href={(profileData as AdvisorProfileData).linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  View LinkedIn Profile
                </a>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileSection;
