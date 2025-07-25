import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Activity, 
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  FileText,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  profile_completed: boolean;
  created_at: string;
  last_active_at?: string;
  auth_id: string;
}

interface UserAction {
  type: 'approve' | 'suspend' | 'activate' | 'delete' | 'promote' | 'demote';
  reason?: string;
}

interface SessionWithAssignment {
  id: string;
  title: string;
  status: string;
  scheduled_at: string;
  assignment_id: string;
  advisor_rating?: number;
  founder_rating?: number;
  duration_minutes?: number;
  created_at: string;
  updated_at: string;
}

interface AssignmentWithUsers {
  id: string;
  status: string;
  match_score?: number;
  created_at: string;
  total_sessions?: number;
  avg_rating?: number;
  advisor_id: string;
  founder_id: string;
}

export const ComprehensiveAdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<SessionWithAssignment[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sessionStatusFilter, setSessionStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<UserAction['type'] | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [activeTab, setActiveTab] = useState('users');

  const { toast } = useToast();
  const { metrics, refreshMetrics } = useDashboardMetrics();

  useEffect(() => {
    fetchUsers();
    refreshMetrics();
  }, []);

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    } else if (activeTab === 'assignments') {
      fetchAssignments();
    }
  }, [activeTab]);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('scheduled_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sessions',
        variant: 'destructive'
      });
    } finally {
      setSessionsLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      setAssignmentsLoading(true);
      const { data, error } = await supabase
        .from('advisor_founder_assignments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assignments',
        variant: 'destructive'
      });
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(search) ||
        user.id.toLowerCase().includes(search)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const executeUserAction = async (user: User, action: UserAction) => {
    try {
      setLoading(true);
      let updateData: Partial<User> = {};

      switch (action.type) {
        case 'approve':
          updateData = { status: 'active' };
          break;
        case 'suspend':
          updateData = { status: 'suspended' };
          break;
        case 'activate':
          updateData = { status: 'active' };
          break;
        case 'delete':
          updateData = { deleted_at: new Date().toISOString() } as any;
          break;
        case 'promote':
          updateData = { role: user.role === 'founder' ? 'advisor' : 'admin' };
          break;
        case 'demote':
          updateData = { role: user.role === 'admin' ? 'advisor' : 'founder' };
          break;
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Log admin action
      await supabase.functions.invoke('log-admin-action', {
        body: {
          action_type: action.type,
          target_type: 'user',
          target_id: user.id,
          description: `${action.type} user ${user.email}`,
          reason: action.reason,
          old_values: { status: user.status, role: user.role },
          new_values: updateData
        }
      });

      toast({
        title: 'Action Completed',
        description: `User ${action.type} successfully`
      });

      fetchUsers();
      setSelectedUser(null);
      setActionType(null);
      setActionReason('');

    } catch (error) {
      console.error('Error executing user action:', error);
      toast({
        title: 'Action Failed',
        description: `Failed to ${action.type} user`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending_activation': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'advisor': return 'bg-blue-100 text-blue-800';
      case 'founder': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInDays = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return time.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{metrics.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold">{metrics.activeSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Applications</p>
                <p className="text-2xl font-bold">{metrics.pendingApplications}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                <p className="text-2xl font-bold">{metrics.totalAssignments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Calendar className="w-4 h-4 mr-2" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <FileText className="w-4 h-4 mr-2" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  User Management
                </div>
                <Button onClick={fetchUsers} variant="outline" size="sm">
                  <Activity className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by email or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="advisor">Advisor</SelectItem>
                    <SelectItem value="founder">Founder</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending_activation">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Users Table */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Active
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.email}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {user.id.slice(0, 8)}...
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={getRoleColor(user.role)}>
                                {user.role}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={getStatusColor(user.status)}>
                                {user.status.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.last_active_at ? getTimeAgo(user.last_active_at) : 'Never'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                {user.status === 'pending_activation' && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setActionType('approve');
                                    }}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <UserCheck className="w-4 h-4 mr-1" />
                                    Approve
                                  </Button>
                                )}
                                
                                {user.status === 'active' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setActionType('suspend');
                                    }}
                                  >
                                    <UserX className="w-4 h-4 mr-1" />
                                    Suspend
                                  </Button>
                                )}
                                
                                {user.status === 'suspended' && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setActionType('activate');
                                    }}
                                  >
                                    <UserCheck className="w-4 h-4 mr-1" />
                                    Activate
                                  </Button>
                                )}

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>User Actions</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Choose an action for {user.email}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="grid grid-cols-2 gap-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedUser(user);
                                          setActionType('promote');
                                        }}
                                      >
                                        Promote Role
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedUser(user);
                                          setActionType('demote');
                                        }}
                                      >
                                        Demote Role
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() => {
                                          setSelectedUser(user);
                                          setActionType('delete');
                                        }}
                                      >
                                        Delete User
                                      </Button>
                                    </div>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Session Monitoring
                </div>
                <Button onClick={fetchSessions} variant="outline" size="sm">
                  <Activity className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Session Status Filter */}
              <div className="flex flex-col lg:flex-row gap-4">
                <Select value={sessionStatusFilter} onValueChange={setSessionStatusFilter}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sessions</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sessions Table */}
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Session
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Scheduled At
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ratings
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sessions
                          .filter(session => sessionStatusFilter === 'all' || session.status === sessionStatusFilter)
                          .map((session) => (
                          <tr key={session.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {session.title || 'Untitled Session'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {session.id.slice(0, 8)}...
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={getStatusColor(session.status)}>
                                {session.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(session.scheduled_at).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {session.duration_minutes ? `${session.duration_minutes} min` : 'TBD'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                {session.advisor_rating && (
                                  <div className="flex items-center">
                                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                                    <span className="text-sm text-gray-600">A: {session.advisor_rating}/5</span>
                                  </div>
                                )}
                                {session.founder_rating && (
                                  <div className="flex items-center">
                                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                                    <span className="text-sm text-gray-600">F: {session.founder_rating}/5</span>
                                  </div>
                                )}
                                {!session.advisor_rating && !session.founder_rating && (
                                  <span className="text-sm text-gray-400">No ratings</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Assignment Management
                </div>
                <Button onClick={fetchAssignments} variant="outline" size="sm">
                  <Activity className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Assignments Table */}
              {assignmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Assignment
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Match Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sessions
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Avg Rating
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {assignments.map((assignment) => (
                          <tr key={assignment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  Assignment #{assignment.id.slice(0, 8)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Advisor: {assignment.advisor_id.slice(0, 8)}... | Founder: {assignment.founder_id.slice(0, 8)}...
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={getStatusColor(assignment.status)}>
                                {assignment.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {assignment.match_score ? `${assignment.match_score}%` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {assignment.total_sessions || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {assignment.avg_rating ? (
                                <div className="flex items-center">
                                  <Star className="w-4 h-4 text-yellow-400 mr-1" />
                                  <span className="text-sm text-gray-600">{assignment.avg_rating.toFixed(1)}/5</span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">No rating</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {getTimeAgo(assignment.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Analytics Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-500">Analytics component will be integrated here</p>
                <p className="text-sm text-gray-400 mt-2">Displaying charts, reports, and detailed metrics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Confirmation Dialog */}
      {selectedUser && actionType && (
        <AlertDialog open={true} onOpenChange={() => {
          setSelectedUser(null);
          setActionType(null);
          setActionReason('');
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Confirm {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to {actionType} user "{selectedUser.email}"?
                {actionType === 'delete' && ' This action cannot be undone.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Reason (optional)</label>
                <Input
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason for this action..."
                />
              </div>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => executeUserAction(selectedUser, { type: actionType, reason: actionReason })}
                className={actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {actionType === 'delete' ? 'Delete' : 'Confirm'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};
