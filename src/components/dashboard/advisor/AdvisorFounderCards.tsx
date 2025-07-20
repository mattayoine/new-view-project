
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StepTransition } from '@/components/ui/enhanced-transitions';
import { useAdvisorData } from '@/hooks/useAdvisorData';
import { User, Calendar, Building, MapPin, Star } from 'lucide-react';

export const AdvisorFounderCards: React.FC = () => {
  const { data } = useAdvisorData();
  const { assignments } = data || {};

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Your Founder Portfolio</h2>
      
      <div className="space-y-6">
        {assignments?.map((assignment, index) => {
          const founderSessions = assignment.sessions || [];
          const completedSessions = founderSessions.filter(s => s.status === 'completed');
          const upcomingSessions = founderSessions.filter(s => 
            s.status === 'scheduled' && new Date(s.scheduled_at) > new Date()
          );
          
          const avgRating = completedSessions.length > 0 
            ? completedSessions.reduce((sum, s) => sum + (s.founder_rating || 0), 0) / completedSessions.length 
            : 0;

          return (
            <StepTransition key={assignment.id} isActive={false} isCompleted={false} delay={index * 200}>
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-blue-600" />
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="font-semibold text-xl">
                            {assignment.founder?.email?.split('@')[0] || 'Founder'}
                          </h3>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className="bg-green-100 text-green-800">
                              Active Assignment
                            </Badge>
                            {avgRating > 0 && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span>{avgRating.toFixed(1)}/5</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <Building className="w-4 h-4" />
                              Startup Focus
                            </h4>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              Technology startup focused on emerging markets. 
                              {assignment.notes && ` ${assignment.notes.substring(0, 100)}...`}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Session Progress
                            </h4>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p>Completed: {completedSessions.length} sessions</p>
                              <p>Upcoming: {upcomingSessions.length} scheduled</p>
                              <p>Total Sessions: {founderSessions.length}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-4 pt-2">
                          <Button variant="outline" size="sm">
                            View Full Profile
                          </Button>
                          <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white">
                            Schedule Session
                          </Button>
                          {upcomingSessions.length > 0 && (
                            <Button variant="outline" size="sm">
                              Join Next Session
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StepTransition>
          );
        })}
        
        {(!assignments || assignments.length === 0) && (
          <Card className="shadow-sm">
            <CardContent className="p-8 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Active Assignments</h3>
              <p className="text-gray-500 mb-4">
                New founder assignments will appear here once they're made.
              </p>
              <Button variant="outline">View Assignment History</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
