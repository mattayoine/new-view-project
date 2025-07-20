
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StepTransition } from '@/components/ui/enhanced-transitions';
import { useFounderData } from '@/hooks/useFounderData';
import { useFounderSessions } from '@/hooks/useFounderData';
import { User, Calendar, Star, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export const FounderAdvisorCards: React.FC = () => {
  const { data: founderData } = useFounderData();
  const { data: sessions } = useFounderSessions();

  const upcomingSessions = sessions?.filter(
    session => session.status === 'scheduled' && new Date(session.scheduled_at) > new Date()
  ) || [];

  const completedSessions = sessions?.filter(session => session.status === 'completed') || [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Your Advisory Team</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {founderData?.assignments?.map((assignment, index) => {
          const advisorSessions = sessions?.filter(s => 
            s.assignment?.advisor_id === assignment.advisor_id
          ) || [];
          
          const advisorCompletedSessions = advisorSessions.filter(s => s.status === 'completed');
          const nextSession = upcomingSessions.find(s => 
            s.assignment?.advisor_id === assignment.advisor_id
          );
          
          const avgRating = advisorCompletedSessions.length > 0 
            ? advisorCompletedSessions.reduce((sum, s) => sum + (s.advisor_rating || 0), 0) / advisorCompletedSessions.length 
            : 0;

          return (
            <StepTransition key={assignment.id} isActive={false} isCompleted={false} delay={index * 200}>
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {assignment.advisor?.email?.split('@')[0] || 'Advisor'}
                        </h3>
                        <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1 mt-1">
                          Expert Advisor
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>
                            {advisorCompletedSessions.length} sessions completed
                          </span>
                        </div>
                        
                        {avgRating > 0 && (
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span>{avgRating.toFixed(1)}/5 rating</span>
                          </div>
                        )}
                        
                        {nextSession && (
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-green-500" />
                            <span>
                              Next: {format(new Date(nextSession.scheduled_at), 'MMM dd, h:mm a')}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                        size="sm"
                      >
                        {nextSession ? 'View Next Session' : 'Schedule Session'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StepTransition>
          );
        })}
        
        {(!founderData?.assignments || founderData.assignments.length === 0) && (
          <Card className="col-span-full shadow-sm">
            <CardContent className="p-8 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Advisors Assigned</h3>
              <p className="text-gray-500 mb-4">
                Your advisor will be assigned shortly. You'll be notified once the match is complete.
              </p>
              <Button variant="outline">Learn About Our Matching Process</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
