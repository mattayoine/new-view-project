
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
import { useFoundersDirectory } from '@/hooks/useAdminData';
import { 
  Users, 
  Target, 
  Calendar, 
  Activity,
  Filter,
  Search,
  MoreVertical,
  Mail,
  Building
} from 'lucide-react';

const FounderDirectory: React.FC = () => {
  const { data: founders, isLoading, error } = useFoundersDirectory();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');

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
        Error loading founders: {error.message}
      </div>
    );
  }

  if (!founders || founders.length === 0) {
    return (
      <div className="text-center p-8">
        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Founders Found</h3>
        <p className="text-gray-500">No founder profiles are currently available.</p>
      </div>
    );
  }

  // Filter founders based on search and filters
  const filteredFounders = founders.filter(founder => {
    const profile = founder.user_profiles?.[0]?.profile_data as any;
    const matchesSearch = !searchTerm || 
      founder.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile?.startup_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || founder.status === statusFilter;
    const matchesStage = stageFilter === 'all' || profile?.stage === stageFilter;

    return matchesSearch && matchesStatus && matchesStage;
  });

  // Calculate summary statistics
  const stats = {
    total: founders.length,
    active: founders.filter(f => f.status === 'active').length,
    withAssignments: founders.filter(f => f.advisor_founder_assignments?.length > 0).length,
    withGoals: founders.filter(f => f.goals?.length > 0).length
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Founder Directory</h2>
          <p className="text-muted-foreground">
            Manage and monitor founder progress and assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Users className="w-4 h-4 mr-2" />
            Add Founder
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Founders</CardTitle>
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
            <CardTitle className="text-sm font-medium">With Advisors</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withAssignments}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.withAssignments / Math.max(stats.total, 1)) * 100)}% matched
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withGoals}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.withGoals / Math.max(stats.total, 1)) * 100)}% goal-oriented
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">
              Sessions booked
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
                  placeholder="Search founders..."
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
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Stages</option>
              <option value="idea">Idea</option>
              <option value="mvp">MVP</option>
              <option value="early_stage">Early Stage</option>
              <option value="growth">Growth</option>
              <option value="scale">Scale</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Founders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Founders ({filteredFounders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Founder</TableHead>
                <TableHead>Startup</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Assigned Advisor</TableHead>
                <TableHead>Goals</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFounders.map((founder) => {
                const profile = founder.user_profiles?.[0]?.profile_data as any;
                const assignments = founder.advisor_founder_assignments || [];
                const activeAssignments = assignments.filter(a => a.status === 'active');
                const goals = founder.goals || [];
                const activeGoals = goals.filter(g => g.status === 'active');

                return (
                  <TableRow key={founder.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {profile?.name?.charAt(0) || founder.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">
                            {profile?.name || 'Name not set'}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {founder.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {profile?.startup_name || 'Not set'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {profile?.sector || 'No sector'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {profile?.stage || 'Not set'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {activeAssignments.filter(a => a.status === 'active').map((assignment, idx) => {
                          const advisor = assignment.users;
                          const advisorProfile = advisor?.user_profiles?.[0]?.profile_data as any;
                          return (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {advisorProfile?.name || advisor?.email?.split('@')[0] || 'Unknown Advisor'}
                            </Badge>
                          );
                        })}
                        {activeAssignments.length === 0 && (
                          <Badge variant="outline" className="text-xs text-gray-400">
                            No advisor assigned
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{activeGoals.length}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {goals.length} total
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={founder.status === 'active' ? 'default' : 'secondary'}
                      >
                        {founder.status}
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

export default FounderDirectory;
