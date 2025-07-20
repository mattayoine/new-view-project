
import React from 'react';
import { EnhancedJourneyStatusCard } from './EnhancedJourneyStatusCard';
import { RealTimeDashboard } from '@/components/realtime/RealTimeDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Settings, Bell } from 'lucide-react';

export const ComprehensiveJourneyDashboard: React.FC = () => {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please log in to view your journey.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Journey Dashboard</h1>
          <p className="text-muted-foreground">Track your progress and manage your advisory experience</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-1">
            <UserCheck className="w-3 h-3" />
            {userProfile.role}
          </Badge>
          
          {userProfile.profile_completed && (
            <Badge className="bg-green-100 text-green-800">
              Profile Complete
            </Badge>
          )}
        </div>
      </div>

      {/* Journey Status */}
      <EnhancedJourneyStatusCard />

      {/* Real-time Dashboard */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Dashboard Metrics</h2>
        <RealTimeDashboard />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <h4 className="font-medium mb-2">Update Profile</h4>
              <p className="text-sm text-muted-foreground">Keep your information current</p>
            </div>
            
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <h4 className="font-medium mb-2">Schedule Session</h4>
              <p className="text-sm text-muted-foreground">Book your next advisory meeting</p>
            </div>
            
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </h4>
              <p className="text-sm text-muted-foreground">Manage your preferences</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
