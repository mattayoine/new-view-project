
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertTriangle, X } from 'lucide-react';
import { useTerminateAssignment } from '@/hooks/useMatchingAlgorithm';

interface AssignmentTerminationProps {
  assignment: any;
}

const AssignmentTermination: React.FC<AssignmentTerminationProps> = ({ assignment }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  
  const terminateAssignment = useTerminateAssignment();

  const handleTermination = async () => {
    if (!terminationReason.trim()) return;

    terminateAssignment.mutate({
      assignmentId: assignment.id,
      terminationReason,
      effectiveDate: new Date(effectiveDate).toISOString()
    }, {
      onSuccess: () => {
        setIsOpen(false);
        setTerminationReason('');
        setEffectiveDate(new Date().toISOString().split('T')[0]);
      }
    });
  };

  if (assignment.status === 'terminated' || assignment.status === 'completed') {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
          <X className="w-4 h-4 mr-1" />
          Terminate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Terminate Assignment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">Assignment Details</h4>
            <div className="text-sm text-red-700 space-y-1">
              <p><strong>Founder:</strong> {assignment.founder?.founder_profiles?.[0]?.profile_data?.name}</p>
              <p><strong>Advisor:</strong> {assignment.advisor?.advisor_profiles?.[0]?.profile_data?.name}</p>
              <p><strong>Sessions:</strong> {assignment.completed_sessions || 0} of {assignment.total_sessions || 0} completed</p>
              <p><strong>Current Status:</strong> {assignment.status}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Termination Reason *</Label>
            <Textarea
              value={terminationReason}
              onChange={(e) => setTerminationReason(e.target.value)}
              placeholder="Please provide a reason for terminating this assignment..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Effective Date</Label>
            <Input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Warning</h4>
            <p className="text-sm text-yellow-700">
              Terminating this assignment will:
            </p>
            <ul className="text-sm text-yellow-700 list-disc list-inside mt-2 space-y-1">
              <li>Cancel all scheduled sessions</li>
              <li>Mark the assignment as terminated</li>
              <li>Send notifications to both parties</li>
              <li>This action cannot be undone</li>
            </ul>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleTermination}
              disabled={!terminationReason.trim() || terminateAssignment.isPending}
            >
              {terminateAssignment.isPending ? 'Terminating...' : 'Terminate Assignment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentTermination;
