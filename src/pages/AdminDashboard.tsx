import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FlightControl from '@/components/admin/FlightControl';
import SessionTracker from '@/components/admin/SessionTracker';
import SessionAnalyticsDashboard from '@/components/admin/SessionAnalyticsDashboard';
import SessionQualityMonitor from '@/components/admin/SessionQualityMonitor';
import SmartSchedulingDashboard from '@/components/admin/SmartSchedulingDashboard';
import SessionPreparationHub from '@/components/admin/SessionPreparationHub';
import AutomatedReminderSystem from '@/components/admin/AutomatedReminderSystem';
import AdvisorDirectory from '@/components/admin/AdvisorDirectory';
import FounderDirectory from '@/components/admin/FounderDirectory';
import CaseStudyLibrary from '@/components/admin/CaseStudyLibrary';
import EnhancedApplicationReview from '@/components/admin/EnhancedApplicationReview';
import MatchingDashboard from '@/components/admin/MatchingDashboard';
import SessionOverviewDashboard from '@/components/admin/SessionOverviewDashboard';
import InterventionTools from '@/components/admin/InterventionTools';
import { usePendingApplicationsCount } from '@/hooks/useAdminApplications';
import { Badge } from '@/components/ui/badge';

const AdminDashboard = () => {
  const { data: pendingCount = 0 } = usePendingApplicationsCount();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        {pendingCount > 0 && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            {pendingCount} Applications Pending Review
          </Badge>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications" className="relative">
            Applications
            {pendingCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="matching">Matching</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="advisors">Advisors</TabsTrigger>
          <TabsTrigger value="founders">Founders</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <FlightControl />
        </TabsContent>

        <TabsContent value="applications">
          <EnhancedApplicationReview />
        </TabsContent>

        <TabsContent value="matching">
          <MatchingDashboard />
        </TabsContent>

        <TabsContent value="sessions">
          <div className="space-y-6">
            <Tabs defaultValue="tracker" className="space-y-4">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="tracker">Tracker</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="quality">Quality</TabsTrigger>
                <TabsTrigger value="scheduling">Smart Scheduling</TabsTrigger>
                <TabsTrigger value="preparation">Preparation</TabsTrigger>
                <TabsTrigger value="reminders">Reminders</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tracker">
                <SessionTracker />
              </TabsContent>
              
              <TabsContent value="analytics">
                <SessionAnalyticsDashboard />
              </TabsContent>
              
              <TabsContent value="quality">
                <SessionQualityMonitor />
              </TabsContent>

              <TabsContent value="scheduling">
                <SmartSchedulingDashboard />
              </TabsContent>

              <TabsContent value="preparation">
                <SessionPreparationHub sessionId="sample-session-id" />
              </TabsContent>

              <TabsContent value="reminders">
                <AutomatedReminderSystem />
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="monitor">
          <SessionOverviewDashboard />
        </TabsContent>

        <TabsContent value="analytics">
          <SessionAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="advisors">
          <AdvisorDirectory />
        </TabsContent>

        <TabsContent value="founders">
          <FounderDirectory />
        </TabsContent>

        <TabsContent value="resources">
          <CaseStudyLibrary />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
