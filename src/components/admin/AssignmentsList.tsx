
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Users, Calendar, Award, MessageSquare, Edit3 } from 'lucide-react';
import { useAssignments, useUpdateAssignmentStatus } from '@/hooks/useAssignmentManagement';
import { format } from 'date-fns';

const AssignmentsList = () => {
  const { data: assignments = [], isLoading } = useAssignments();
  const updateStatus = useUpdateAssignmentStatus();
  
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState<string>('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score > 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const handleStatusUpdate = async () => {
    if (!selectedAssignment || !newStatus) return;

    try {
      await updateStatus.mutateAsync({
        assignmentId: selectedAssignment.id,
        status: newStatus,
        notes: statusNotes
      });
      
      setSelectedAssignment(null);
      setNewStatus('');
      setStatusNotes('');
    } catch (error) {
      console.error('Error updating assignment status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Assignment Management
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Total: {assignments.length}</span>
            <span>Pending: {assignments.filter(a => a.status === 'pending').length}</span>
            <span>Active: {assignments.filter(a => a.status === 'active').length}</span>
          </div>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No assignments created yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Founder</TableHead>
                  <TableHead>Advisor</TableHead>
                  <TableHead>Match Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => {
                  const founderProfile = assignment.founder?.founder_profiles?.[0]?.profile_data;
                  const advisorProfile = assignment.advisor?.advisor_profiles?.[0]?.profile_data;
                  
                  return (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {founderProfile?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {assignment.founder?.email}
                          </div>
                          {founderProfile?.startup_name && (
                            <div className="text-xs text-gray-500">
                              {founderProfile.startup_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {advisorProfile?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {assignment.advisor?.email}
                          </div>
                          {advisorProfile?.experience_level && (
                            <div className="text-xs text-gray-500">
                              {advisorProfile.experience_level}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${getScoreColor(assignment.match_score || 0)}`}>
                            {assignment.match_score || 0}%
                          </span>
                          {assignment.match_score === 0 && (
                            <Badge variant="outline" className="text-xs">
                              Manual
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>{assignment.total_sessions || 0}</span>
                          {assignment.completed_sessions > 0 && (
                            <span className="text-gray-500">
                              ({assignment.completed_sessions} done)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(assignment.created_at), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          by {assignment.assigned_by_user?.email || 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setNewStatus(assignment.status);
                                setStatusNotes(assignment.notes || '');
                              }}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Assignment Status</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium mb-2 block">Status</label>
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="accepted">Accepted</SelectItem>
                                    <SelectItem value="declined">Declined</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium mb-2 block">Notes</label>
                                <Textarea
                                  value={statusNotes}
                                  onChange={(e) => setStatusNotes(e.target.value)}
                                  placeholder="Add notes about this status change..."
                                  rows={3}
                                />
                              </div>
                              
                              <Button
                                onClick={handleStatusUpdate}
                                disabled={updateStatus.isPending}
                                className="w-full"
                              >
                                {updateStatus.isPending ? 'Updating...' : 'Update Status'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentsList;
