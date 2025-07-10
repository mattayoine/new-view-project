
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const ProfileCompletionPrompt = () => {
  const { profileData, isLoading } = useUserProfile();
  const navigate = useNavigate();

  if (isLoading) return null;
  
  if (profileData?.is_profile_complete) return null;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <AlertCircle className="h-5 w-5" />
          Complete Your Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-orange-600 mb-4">
          Please complete your profile to access all features and get matched with the right advisors or founders.
        </p>
        <Button 
          onClick={() => navigate('/onboarding')}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Complete Profile
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionPrompt;
