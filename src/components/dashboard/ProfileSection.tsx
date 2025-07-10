
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Edit2, User } from 'lucide-react';

const ProfileSection = () => {
  const { userProfile, profileData, isLoading } = useUserProfile();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const profileInfo = profileData?.profile_data as any;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile
        </CardTitle>
        <Button variant="outline" size="sm">
          <Edit2 className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {userProfile && (
          <>
            <div>
              <h3 className="font-semibold">{profileInfo?.name || 'No name set'}</h3>
              <p className="text-sm text-muted-foreground">{userProfile.email}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={userProfile.role === 'admin' ? 'destructive' : 'default'}>
                {userProfile.role}
              </Badge>
              <Badge variant={userProfile.status === 'active' ? 'default' : 'secondary'}>
                {userProfile.status}
              </Badge>
            </div>

            {profileInfo?.location && (
              <div>
                <span className="text-sm font-medium">Location: </span>
                <span className="text-sm text-muted-foreground">{profileInfo.location}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Profile Complete: </span>
              <Badge variant={profileData?.is_profile_complete ? 'default' : 'secondary'}>
                {profileData?.is_profile_complete ? 'Yes' : 'No'}
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileSection;
