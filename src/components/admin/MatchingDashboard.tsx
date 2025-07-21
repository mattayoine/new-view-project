import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Target, 
  Users, 
  TrendingUp, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Activity
} from 'lucide-react';
import { useFounderMatches, useMatchingStats } from '@/hooks/useUnifiedMatching';
import { useAdminData } from '@/hooks/useAdminData';
import MatchingProgressDashboard from './MatchingProgressDashboard';
import MatchSuggestions from './MatchSuggestions';

const MatchingDashboard: React.FC = () => {
  const [selectedFounder, setSelectedFounder] = useState<string | null>(null);
  const { data: stats, isLoading: statsLoading } = useMatchingStats();
  const { data: adminData, isLoading: adminLoading } = useAdminData();
  const { data: founderMatches, isLoading: matchesLoading } = useFounderMatches(selectedFounder || undefined);

  const founders = adminData?.founders || [];
  const selectedFounderData = founders.find(f => f.id === selectedFounder);
  const selectedFounderProfile = selectedFounderData?.user_profiles?.[0]?.profile_data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Matching Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor and manage the AI-powered founder-advisor matching system
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Algorithm v2.0
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress & Jobs</TabsTrigger>
          <TabsTrigger value="matches">Match Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* System Health Alert */}
          {stats && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Matching system is operational. {stats.foundersWithMatches} of {stats.totalFounders} founders have calculated matches.
                {stats.lastCalculationTime && (
                  <span className="ml-2">
                    Last updated: {new Date(stats.lastCalculationTime).toLocaleString()}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Coverage</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : `${Math.round(((stats?.foundersWithMatches || 0) / Math.max(stats?.totalFounders || 1, 1)) * 100)}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Founders with matches
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Match Quality</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : `${stats?.averageMatchScore || 0}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average compatibility
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Pool</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : `${(stats?.totalFounders || 0) + (stats?.totalAdvisors || 0)}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalFounders || 0} founders, {stats?.totalAdvisors || 0} advisors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quality Matches</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : stats?.matchesAboveThreshold || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Above 60% threshold
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Founder Selection for Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select a founder to preview their matches:</label>
                  <select 
                    className="w-full mt-2 p-2 border rounded"
                    value={selectedFounder || ''}
                    onChange={(e) => setSelectedFounder(e.target.value || null)}
                  >
                    <option value="">Choose a founder...</option>
                    {founders.map((founder) => {
                      const profile = founder.user_profiles?.[0]?.profile_data;
                      return (
                        <option key={founder.id} value={founder.id}>
                          {profile?.name || founder.email} - {profile?.startup_name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedFounder && matchesLoading && (
                  <div className="text-center py-4">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Calculating matches...
                  </div>
                )}

                {selectedFounder && !matchesLoading && founderMatches && founderMatches.length === 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No matches found for this founder. Try running a batch recalculation.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <MatchingProgressDashboard />
        </TabsContent>

        <TabsContent value="matches">
          {selectedFounder && selectedFounderData && selectedFounderProfile && founderMatches ? (
            <MatchSuggestions
              founder={selectedFounderData}
              founderProfile={selectedFounderProfile}
              suggestions={founderMatches}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Founder</h3>
                <p className="text-muted-foreground text-center">
                  Choose a founder from the Overview tab to see their match suggestions here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MatchingDashboard;
