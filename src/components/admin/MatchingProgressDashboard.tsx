
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  Target, 
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { 
  useMatchingStats, 
  useBatchMatching, 
  useAllMatchingJobs 
} from '@/hooks/useUnifiedMatching';
import { formatDistance } from 'date-fns';

const MatchingProgressDashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useMatchingStats();
  const { data: jobs, isLoading: jobsLoading } = useAllMatchingJobs();
  const batchMatching = useBatchMatching();

  const handleStartBatchMatching = () => {
    batchMatching.mutate();
  };

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const activeJobs = jobs?.filter(job => job.status === 'running' || job.status === 'pending') || [];
  const recentJobs = jobs?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Founders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.totalFounders || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.foundersWithMatches || 0} with matches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Advisors</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.totalAdvisors || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for matching
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Match Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : `${stats?.averageMatchScore || 0}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all matches
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

      {/* Batch Matching Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Batch Matching Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Full System Recalculation</h4>
                <p className="text-sm text-muted-foreground">
                  Recalculate all founder-advisor matches using the latest algorithm
                </p>
                {stats?.lastCalculationTime && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last run: {formatDistance(new Date(stats.lastCalculationTime), new Date(), { addSuffix: true })}
                  </p>
                )}
              </div>
              <Button
                onClick={handleStartBatchMatching}
                disabled={batchMatching.isPending || activeJobs.length > 0}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {batchMatching.isPending ? 'Starting...' : 'Start Batch Matching'}
              </Button>
            </div>

            {activeJobs.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium text-sm">Active Jobs</h5>
                {activeJobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getJobStatusIcon(job.status)}
                        <span className="font-medium capitalize">
                          {job.type.replace('_', ' ')}
                        </span>
                        <Badge className={getJobStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {job.progress}/{job.total}
                      </span>
                    </div>
                    {job.total > 0 && (
                      <Progress 
                        value={(job.progress / job.total) * 100} 
                        className="h-2"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Matching Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="text-center py-4">Loading jobs...</div>
          ) : recentJobs.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No matching jobs found
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    {getJobStatusIcon(job.status)}
                    <div>
                      <div className="font-medium capitalize">
                        {job.type.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Started {formatDistance(new Date(job.startedAt), new Date(), { addSuffix: true })}
                        {job.completedAt && ` • Completed ${formatDistance(new Date(job.completedAt), new Date(), { addSuffix: true })}`}
                      </div>
                      {job.error && (
                        <div className="text-sm text-red-600 mt-1">
                          Error: {job.error}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getJobStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                    {job.status === 'completed' && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {job.progress}/{job.total} processed
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => refetchStats()}
              disabled={statsLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
              Refresh Stats
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchingProgressDashboard;
