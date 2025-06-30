
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Calendar, UserMinus, MessageSquare, Clock, 
  AlertTriangle, Settings, RefreshCw, Users 
} from 'lucide-react';
import { useSessionInterventions } from '@/hooks/useSessionMonitoring';
import { toast } from 'sonner';

interface InterventionToolsProps {
  selectedAlert?: any;
  onInterventionComplete?: () => void;
}

const InterventionTools: React.FC<InterventionToolsProps> = ({ 
  selectedAlert, 
  onInterventionComplete 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [interventionType, setInterventionType] = useState<string>('');
  const [rescheduleData, setRescheduleData] = useState({
    sessionId: '',
    newDateTime: '',
    reason: ''
  });
  const [reassignmentData, setReassignmentData] = useState({
    assignmentId: '',
    newAdvisorId: '',
    reason: ''
  });
  const [mediationData, setMediationData] = useState({
    assignmentId: '',
    notes: '',
    priority: 'medium'
  });

  const { rescheduleSession, reassignAdvisor, markForMediation } = useSessionInterventions();

  const handleReschedule = async () => {
    try {
      await rescheduleSession(rescheduleData.sessionId, rescheduleData.newDateTime);
      toast.success('Session rescheduled successfully');
      setIsOpen(false);
      onInterventionComplete?.();
    } catch (error) {
      toast.error('Failed to reschedule session');
      console.error(error);
    }
  };

  const handleReassignment = async () => {
    try {
      await reassignAdvisor(reassignmentData.assignmentId, reassignmentData.newAdvisorId);
      toast.success('Advisor reassigned successfully');
      setIsOpen(false);
      onInterventionComplete?.();
    } catch (error) {
      toast.error('Failed to reassign advisor');
      console.error(error);
    }
  };

  const handleMediation = async () => {
    try {
      const notes = `Priority: ${mediationData.priority}\n\nNotes: ${mediationData.notes}`;
      await markForMediation(mediationData.assignmentId, notes);
      toast.success('Assignment marked for mediation');
      setIsOpen(false);
      onInterventionComplete?.();
    } catch (error) {
      toast.error('Failed to mark for mediation');
      console.error(error);
    }
  };

  const interventionOptions = [
    {
      id: 'reschedule',
      title: 'Reschedule Session',
      description: 'Change session date and time',
      icon: Calendar,
      color: 'text-blue-600'
    },
    {
      id: 'reassign',
      title: 'Reassign Advisor',
      description: 'Change advisor for this assignment',
      icon: UserMinus,
      color: 'text-orange-600'
    },
    {
      id: 'mediation',
      title: 'Request Mediation',
      description: 'Flag for admin mediation and support',
      icon: MessageSquare,
      color: 'text-purple-600'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Intervention Tools
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Admin Intervention Tools
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alert Context */}
          {selectedAlert && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-1" />
                  <div>
                    <h4 className="font-medium">{selectedAlert.title}</h4>
                    <p className="text-sm text-muted-foreground">{selectedAlert.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{selectedAlert.type}</Badge>
                      <Badge className="bg-orange-100 text-orange-800">{selectedAlert.severity}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Intervention Type Selection */}
          {!interventionType && (
            <div className="space-y-4">
              <Label className="text-base font-medium">Select Intervention Type</Label>
              <div className="grid grid-cols-1 gap-3">
                {interventionOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.id}
                      variant="outline"
                      className="h-auto p-4 justify-start"
                      onClick={() => setInterventionType(option.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${option.color}`} />
                        <div className="text-left">
                          <p className="font-medium">{option.title}</p>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reschedule Form */}
          {interventionType === 'reschedule' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium">Reschedule Session</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="sessionId">Session ID</Label>
                  <Input
                    id="sessionId"
                    value={rescheduleData.sessionId}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, sessionId: e.target.value }))}
                    placeholder="Enter session ID"
                  />
                </div>
                
                <div>
                  <Label htmlFor="newDateTime">New Date & Time</Label>
                  <Input
                    id="newDateTime"
                    type="datetime-local"
                    value={rescheduleData.newDateTime}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, newDateTime: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="rescheduleReason">Reason for Rescheduling</Label>
                  <Textarea
                    id="rescheduleReason"
                    value={rescheduleData.reason}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Explain why this session needs to be rescheduled..."
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleReschedule} className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Reschedule Session
                </Button>
                <Button variant="outline" onClick={() => setInterventionType('')}>
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Reassignment Form */}
          {interventionType === 'reassign' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <UserMinus className="w-5 h-5 text-orange-600" />
                <h3 className="font-medium">Reassign Advisor</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="assignmentId">Assignment ID</Label>
                  <Input
                    id="assignmentId"
                    value={reassignmentData.assignmentId}
                    onChange={(e) => setReassignmentData(prev => ({ ...prev, assignmentId: e.target.value }))}
                    placeholder="Enter assignment ID"
                  />
                </div>
                
                <div>
                  <Label htmlFor="newAdvisorId">New Advisor ID</Label>
                  <Input
                    id="newAdvisorId"
                    value={reassignmentData.newAdvisorId}
                    onChange={(e) => setReassignmentData(prev => ({ ...prev, newAdvisorId: e.target.value }))}
                    placeholder="Enter new advisor ID"
                  />
                </div>
                
                <div>
                  <Label htmlFor="reassignReason">Reason for Reassignment</Label>
                  <Textarea
                    id="reassignReason"
                    value={reassignmentData.reason}
                    onChange={(e) => setReassignmentData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Explain why this advisor needs to be reassigned..."
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleReassignment} className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Reassign Advisor
                </Button>
                <Button variant="outline" onClick={() => setInterventionType('')}>
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Mediation Form */}
          {interventionType === 'mediation' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <h3 className="font-medium">Request Mediation</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="mediationAssignmentId">Assignment ID</Label>
                  <Input
                    id="mediationAssignmentId"
                    value={mediationData.assignmentId}
                    onChange={(e) => setMediationData(prev => ({ ...prev, assignmentId: e.target.value }))}
                    placeholder="Enter assignment ID"
                  />
                </div>
                
                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select 
                    value={mediationData.priority} 
                    onValueChange={(value) => setMediationData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="mediationNotes">Mediation Notes</Label>
                  <Textarea
                    id="mediationNotes"
                    value={mediationData.notes}
                    onChange={(e) => setMediationData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Describe the situation and what kind of intervention is needed..."
                    rows={4}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleMediation} className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Request Mediation
                </Button>
                <Button variant="outline" onClick={() => setInterventionType('')}>
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterventionTools;
