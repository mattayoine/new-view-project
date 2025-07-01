
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Calendar, TrendingUp, BookOpen, 
  MessageSquare, Wand2, FileText, Target 
} from 'lucide-react';
import { useAdvisorSessionHub } from '@/hooks/useAdvisorSessionHub';
import SessionPortfolioView from '@/components/advisor/SessionPortfolioView';
import SessionPlanningWizard from '@/components/advisor/SessionPlanningWizard';
import AdvisorPerformanceInsights from '@/components/advisor/AdvisorPerformanceInsights';
import ProfileSection from '@/components/dashboard/ProfileSection';

const AdvisorSessionHub = () => {
  const { data, isLoading, error } = useAdvisorSessionHub();
  const [selectedFounder, setSelectedFounder] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-red-600">Error loading session hub data</p>
        </div>
      </div>
    );
  }

  const { sessionPortfolio, upcomingPreparations, performanceMetrics, resourceLibrary } = data || {};

  const handleViewFounderDetails = (founderId: string) => {
    setSelectedFounder(founderId);
    // Navigate to founder details or open modal
  };

  const handleScheduleSession = (founderId: string) => {
    // Navigate to session scheduling
  };

  const handleSendMessage = (founderId: string) => {
    // Navigate to messaging
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advisor Session Hub</h1>
          <p className="text-muted-foreground">
            Manage your mentoring sessions and track founder progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SessionPlanningWizard />
          <Badge variant="outline" className="text-lg px-3 py-1">
            {sessionPortfolio?.length || 0} Active Founders
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Founders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics?.totalFounders || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently mentoring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics?.activeSessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics?.avgSessionRating.toFixed(1) || '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Session quality
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resources</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resourceLibrary?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Available resources
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="portfolio" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="preparation">Preparation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="communication">Messages</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio">
          <SessionPortfolioView
            portfolio={sessionPortfolio || []}
            onViewDetails={handleViewFounderDetails}
            onScheduleSession={handleScheduleSession}
            onSendMessage={handleSendMessage}
          />
        </TabsContent>

        <TabsContent value="preparation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Session Preparation Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingPreparations && upcomingPreparations.length > 0 ? (
                <div className="space-y-4">
                  {upcomingPreparations.map((prep) => (
                    <div key={prep.sessionId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{prep.title}</h3>
                        <Badge variant="outline">
                          {new Date(prep.scheduledAt).toLocaleDateString()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Founder:</strong> {prep.founderName}
                      </p>
                      <div className="space-y-2">
                        <div>
                          <strong className="text-sm">Suggested Agenda:</strong>
                          <ul className="text-sm text-muted-foreground ml-4">
                            {prep.suggestedAgenda.map((item, index) => (
                              <li key={index}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <strong className="text-sm">Relevant Goals:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {prep.relevantGoals.map((goal, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {goal}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No upcoming sessions to prepare for</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          {performanceMetrics && (
            <AdvisorPerformanceInsights metrics={performanceMetrics} />
          )}
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Resource Library
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resourceLibrary && resourceLibrary.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resourceLibrary.map((resource) => (
                    <div key={resource.id} className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">{resource.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {resource.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{resource.type}</Badge>
                        <Button size="sm" variant="outline">
                          <FileText className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No resources available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Communication Hub
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">Integrated messaging system coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <ProfileSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvisorSessionHub;
