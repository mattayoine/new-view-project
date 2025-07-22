
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useAdvisorsDirectory } from '@/hooks/useAdminData';
import { 
  Users, 
  Star, 
  Calendar, 
  Activity,
  Filter,
  Search,
  MoreVertical,
  Mail,
  Clock
} from 'lucide-react';

const AdvisorDirectory: React.FC = () => {
  const { data: advisors, isLoading, error } = useAdvisorsDirectory();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [experienceFilter, setExperienceFilter] = useState<string>('all');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error loading advisors: {error.message}
      </div>
    );
  }

  if (!advisors || advisors.length === 0) {
    return (
      <div className="text-center p-8">
        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Advisors Found</h3>
        <p className="text-gray-500">No advisor profiles are currently available.</p>
      </div>
    );
  }

  // Filter advisors based on search and filters
  const filteredAdvisors = advisors.filter(advisor => {
    const profile = advisor.user_profiles?.[0]?.profile_data as any;
    const matchesSearch = !searchTerm || 
      advisor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || advisor.status === statusFilter;
    const matchesExperience = experienceFilter === 'all' || 
      profile?.experience_level === experienceFilter;

    return matchesSearch && matchesStatus && matchesExperience;
  });

  // Calculate summary statistics
  const stats = {
    total: advisors.length,
    active: advisors.filter(a => a.status === 'active').length,
    withAssignments: advisors.filter(a => a.advisor_founder_assignments?.length > 0).length,
    avgRating: advisors.reduce((sum, a) => {
      const assignments = a.advisor_founder_assignments || [];
      const totalRating = assignments.reduce((acc, assignment) => acc + (assignment.avg_rating || 0), 0);
      return sum + (assignments.length > 0 ? totalRating / assignments.length : 0);
    }, 0) / Math.max(advisors.length, 1)
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Advisor Directory</h2>
          <p className="text-muted-foreground">
            Manage and monitor advisor performance and assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Users className="w-4 h-4 mr-2" />
            Add Advisor
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Advisors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Assignments</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withAssignments}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.withAssignments / Math.max(stats.total, 1)) * 100)}% utilization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Across all sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">
              Sessions conducted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  placeholder="Search advisors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={experienceFilter}
              onChange={(e) => setExperienceFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Experience</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
              <option value="executive">Executive</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Advisors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Advisors ({filteredAdvisors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Advisor</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Active Assignments</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdvisors.map((advisor) => {
                const profile = advisor.user_profiles?.[0]?.profile_data as any;
                const assignments = advisor.advisor_founder_assignments || [];
                const activeAssignments = assignments.filter(a => a.status === 'active');
                const totalSessions = assignments.reduce((sum, a) => sum + (a.total_sessions || 0), 0);
                const avgRating = assignments.length > 0 
                  ? assignments.reduce((sum, a) => sum + (a.avg_rating || 0), 0) / assignments.length 
                  : 0;

                return (
                  <TableRow key={advisor.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {profile?.name?.charAt(0) || advisor.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">
                            {profile?.name || 'Name not set'}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {advisor.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {profile?.experience_level || 'Not set'}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {profile?.expertise?.slice(0, 2).join(', ') || 'No expertise listed'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {activeAssignments.slice(0, 2).map((assignment, idx) => {
                          const founder = assignment.users;
                          const founderProfile = founder?.user_profiles?.[0]?.profile_data as any;
                          return (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {founderProfile?.name || founder?.email?.split('@')[0] || 'Unknown Founder'}
                            </Badge>
                          );
                        })}
                        {activeAssignments.length === 0 && (
                          <Badge variant="outline" className="text-xs text-gray-400">
                            No active assignments
                          </Badge>
                        )}
                        {activeAssignments.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{activeAssignments.length - 2} more
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{totalSessions}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {assignments.reduce((sum, a) => sum + (a.completed_sessions || 0), 0)} completed
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-medium">
                          {avgRating > 0 ? avgRating.toFixed(1) : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={advisor.status === 'active' ? 'default' : 'secondary'}
                      >
                        {advisor.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvisorDirectory;
