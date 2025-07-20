
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, MessageSquare, Star, User } from 'lucide-react';
import { useOptimizedDashboardData } from '@/hooks/useOptimizedDashboardData';

export const FounderAdvisorCards: React.FC = () => {
  const { data, isLoading } = useOptimizedDashboardData();
  const assignments = data?.assignments || [];

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const handleScheduleSession = (assignment: any) => {
    console.log('Schedule session with advisor:', assignment);
    // TODO: Implement session scheduling
  };

  const handleSendMessage = (assignment: any) => {
    console.log('Send message to advisor:', assignment);
    // TODO: Implement messaging
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {assignments.map((assignment: any) => (
        <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-lg">
                  {assignment.advisor?.email || 'Advisor'}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {assignment.status || 'Active'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>3 Sessions</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>5 Messages</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4" />
                <span>4.8 Rating</span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => handleScheduleSession(assignment)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={() => handleSendMessage(assignment)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Message
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {assignments.length === 0 && (
        <Card className="col-span-full">
          <CardContent className="text-center py-8">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Advisors Assigned</h3>
            <p className="text-muted-foreground">
              Your advisors will appear here once assignments are made.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
