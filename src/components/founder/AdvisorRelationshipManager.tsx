
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Heart, TrendingUp, Calendar, Star, Send } from 'lucide-react';
import { useFounderData } from '@/hooks/useFounderData';
import { useState } from 'react';

const AdvisorRelationshipManager = () => {
  const { data: founderData } = useFounderData();
  const [messageText, setMessageText] = useState('');
  
  const activeAssignment = founderData?.assignments?.[0];

  const getRelationshipHealth = () => {
    if (!activeAssignment) return { score: 0, label: 'No Data', color: 'bg-gray-100 text-gray-800' };
    
    const sessions = activeAssignment.sessions || [];
    const completedSessions = sessions.filter((s: any) => s.status === 'completed');
    const avgRating = activeAssignment.avg_rating || 0;
    
    let score = 0;
    
    // Session frequency (max 40 points)
    if (completedSessions.length >= 5) score += 40;
    else if (completedSessions.length >= 3) score += 30;
    else if (completedSessions.length >= 1) score += 20;
    
    // Rating quality (max 40 points)
    if (avgRating >= 4.5) score += 40;
    else if (avgRating >= 4.0) score += 30;
    else if (avgRating >= 3.5) score += 20;
    else if (avgRating >= 3.0) score += 10;
    
    // Match score (max 20 points)
    const matchScore = activeAssignment.match_score || 0;
    score += Math.round((matchScore / 100) * 20);
    
    if (score >= 80) return { score, label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 60) return { score, label: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (score >= 40) return { score, label: 'Fair', color: 'bg-yellow-100 text-yellow-800' };
    return { score, label: 'Needs Attention', color: 'bg-red-100 text-red-800' };
  };

  const sendMessage = () => {
    if (!messageText.trim() || !activeAssignment) return;
    
    // In a real implementation, this would send a message
    console.log('Sending message:', messageText);
    setMessageText('');
  };

  const relationshipHealth = getRelationshipHealth();

  if (!activeAssignment) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Active Assignment</h3>
          <p className="text-gray-600">
            You need to be matched with an advisor to manage your relationship.
          </p>
        </CardContent>
      </Card>
    );
  }

  const advisor = activeAssignment.advisor;
  const sessions = activeAssignment.sessions || [];
  const completedSessions = sessions.filter((s: any) => s.status === 'completed');
  const upcomingSessions = sessions.filter((s: any) => s.status === 'scheduled' && new Date(s.scheduled_at) > new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Advisor Relationship</h2>
        <Badge className={relationshipHealth.color}>
          <Heart className="w-4 h-4 mr-1" />
          {relationshipHealth.label} ({relationshipHealth.score}/100)
        </Badge>
      </div>

      {/* Advisor Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback>{advisor?.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            Your Advisor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">{advisor?.email}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Match Score:</span>
                  <span className="font-medium">{activeAssignment.match_score}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Sessions:</span>
                  <span className="font-medium">{completedSessions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Rating:</span>
                  <span className="font-medium flex items-center gap-1">
                    <Star className="w-4 h-4 fill-current text-yellow-400" />
                    {activeAssignment.avg_rating?.toFixed(1) || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Relationship Health Factors</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Session Frequency:</span>
                  <span className={completedSessions.length >= 3 ? 'text-green-600' : 'text-yellow-600'}>
                    {completedSessions.length >= 3 ? 'Good' : 'Could Improve'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Communication:</span>
                  <span className={relationshipHealth.score >= 60 ? 'text-green-600' : 'text-yellow-600'}>
                    {relationshipHealth.score >= 60 ? 'Active' : 'Needs Work'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Goal Alignment:</span>
                  <span className={activeAssignment.match_score >= 70 ? 'text-green-600' : 'text-yellow-600'}>
                    {activeAssignment.match_score >= 70 ? 'Well Aligned' : 'Fair'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter((s: any) => {
                const sessionDate = new Date(s.scheduled_at);
                const now = new Date();
                return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingSessions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Since Last Session</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedSessions.length > 0 
                ? Math.floor((Date.now() - new Date(completedSessions[0].scheduled_at).getTime()) / (1000 * 60 * 60 * 24))
                : 'N/A'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Communication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Quick Message to Advisor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Send a quick message to your advisor..."
              rows={3}
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Messages are a great way to maintain regular communication
              </span>
              <Button 
                onClick={sendMessage}
                disabled={!messageText.trim()}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Message
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relationship Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Relationship Health Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">Keep Doing</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Regular session attendance</li>
                <li>• Active participation in discussions</li>
                <li>• Following through on action items</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">Consider Improving</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• More frequent check-ins between sessions</li>
                <li>• Sharing progress updates regularly</li>
                <li>• Being more specific about challenges</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvisorRelationshipManager;
