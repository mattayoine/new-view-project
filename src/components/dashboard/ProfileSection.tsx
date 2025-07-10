
import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Building, Globe, Briefcase } from 'lucide-react';
import { FounderProfileData, AdvisorProfileData } from '@/types/profile';

interface ProfileSectionProps {
  userId?: string;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ userId }) => {
  const { data: userWithProfile, isLoading } = useUserProfile();

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

  if (!userWithProfile) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Profile information not available</p>
        </CardContent>
      </Card>
    );
  }

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
          <h3 className="text-lg font-semibold">{userWithProfile.email}</h3>
          <Badge variant="outline" className="capitalize">
            {userWithProfile.role}
          </Badge>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center text-gray-600">
            <User className="w-4 h-4 mr-2" />
            <span>Email: {userWithProfile.email}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <span className="text-sm">Status: </span>
            <Badge variant={userWithProfile.status === 'active' ? 'default' : 'secondary'} className="ml-2">
              {userWithProfile.status}
            </Badge>
          </div>
          
          <div className="flex items-center text-gray-600">
            <span className="text-sm">Profile Completed: </span>
            <Badge variant={userWithProfile.profile_completed ? 'default' : 'destructive'} className="ml-2">
              {userWithProfile.profile_completed ? 'Yes' : 'No'}
            </Badge>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Member since: {new Date(userWithProfile.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSection;
