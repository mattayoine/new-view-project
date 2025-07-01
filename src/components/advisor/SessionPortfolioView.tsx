
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Calendar, MessageSquare, TrendingUp, Clock, 
  AlertCircle, CheckCircle, Users, Star 
} from 'lucide-react';
import { SessionPortfolioItem } from '@/hooks/useAdvisorSessionHub';

interface SessionPortfolioViewProps {
  portfolio: SessionPortfolioItem[];
  onViewDetails: (founderId: string) => void;
  onScheduleSession: (founderId: string) => void;
  onSendMessage: (founderId: string) => void;
}

const SessionPortfolioView: React.FC<SessionPortfolioViewProps> = ({
  portfolio,
  onViewDetails,
  onScheduleSession,
  onSendMessage
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyLevel = (urgentActions: string[]) => {
    if (urgentActions.length === 0) return 'none';
    if (urgentActions.length <= 2) return 'low';
    if (urgentActions.length <= 4) return 'medium';
    return 'high';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Session Portfolio</h2>
          <p className="text-muted-foreground">
            Manage your {portfolio.length} assigned founders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {portfolio.filter(p => p.status === 'active').length} Active
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolio.map((founder) => (
          <Card key={founder.assignmentId} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {founder.founderName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-sm">{founder.founderName}</h3>
                    <p className="text-xs text-muted-foreground">{founder.founderEmail}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(founder.status)}>
                  {founder.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Urgent Actions Alert */}
              {founder.urgentActions.length > 0 && (
                <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-xs text-orange-700">
                    {founder.urgentActions.length} urgent action{founder.urgentActions.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Progress Overview */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{founder.overallProgress}%</span>
                </div>
                <Progress value={founder.overallProgress} className="h-2" />
              </div>

              {/* Session Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="font-medium">{founder.completedSessions}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-600" />
                  <div>
                    <p className="font-medium">{founder.avgRating.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Avg Rating</p>
                  </div>
                </div>
              </div>

              {/* Next Session */}
              {founder.nextSessionDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Next: {new Date(founder.nextSessionDate).toLocaleDateString()}</span>
                </div>
              )}

              {/* Last Activity */}
              {founder.lastSessionDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Last: {new Date(founder.lastSessionDate).toLocaleDateString()}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => onViewDetails(founder.founderId)}
                  className="flex-1"
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Details
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onScheduleSession(founder.founderId)}
                >
                  <Calendar className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSendMessage(founder.founderId)}
                >
                  <MessageSquare className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {portfolio.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Assigned Founders</h3>
            <p className="text-gray-600">
              You haven't been assigned any founders yet. New assignments will appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SessionPortfolioView;
