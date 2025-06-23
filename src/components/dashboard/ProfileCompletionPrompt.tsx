
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useUserProfile } from '@/hooks/useUserProfile';

const ProfileCompletionPrompt = () => {
  const { profileCompleted, updateProfileCompletion } = useProfileCompletion();
  const { data: profile } = useUserProfile();

  if (profileCompleted || !profile) {
    return null;
  }

  const handleMarkComplete = async () => {
    await updateProfileCompletion.mutateAsync(true);
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <AlertCircle className="w-5 h-5" />
          Complete Your Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-yellow-700">
          Your profile was created from your application, but you may want to review and update it.
        </p>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleMarkComplete}
            disabled={updateProfileCompletion.isPending}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark as Complete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionPrompt;
