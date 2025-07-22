
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFoundersDirectory, useAdvisorsDirectory } from '@/hooks/useAdminData';
import { 
  Users, 
  UserPlus, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  Filter,
  Settings
} from 'lucide-react';

const BulkAssignmentTool: React.FC = () => {
  const { data: founders, isLoading: foundersLoading } = useFoundersDirectory();
  const { data: advisors, isLoading: advisorsLoading } = useAdvisorsDirectory();
  
  const [selectedFounders, setSelectedFounders] = useState<string[]>([]);
  const [selectedAdvisor, setSelectedAdvisor] = useState<string>('');
  const [assignmentReason, setAssignmentReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ success: string[], failed: string[] } | null>(null);

  if (foundersLoading || advisorsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Get unassigned founders (those without active assignments)
  const unassignedFounders = founders?.filter(founder => {
    const activeAssignments = founder.advisor_founder_assignments?.filter(a => a.status === 'active') || [];
    return activeAssignments.length === 0;
  }) || [];

  // Get available advisors (those with capacity)
  const availableAdvisors = advisors?.filter(advisor => {
    const activeAssignments = advisor.advisor_founder_assignments?.filter(a => a.status === 'active') || [];
    return activeAssignments.length < 5; // Assuming max 5 assignments per advisor
  }) || [];

  const handleFounderSelection = (founderId: string, checked: boolean) => {
    if (checked) {
      setSelectedFounders(prev => [...prev, founderId]);
    } else {
      setSelectedFounders(prev => prev.filter(id => id !== founderId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFounders(unassignedFounders.map(f => f.id));
    } else {
      setSelectedFounders([]);
    }
  };

  const handleBulkAssignment = async () => {
    if (!selectedAdvisor || selectedFounders.length === 0) return;

    setIsProcessing(true);
    const success: string[] = [];
    const failed: string[] = [];

    // Simulate assignment process (replace with actual API calls)
    for (const founderId of selectedFounders) {
      try {
        // TODO: Replace with actual assignment API call
        await new Promise(resolve => setTimeout(resolve, 500));
        success.push(founderId);
      } catch (error) {
        failed.push(founderId);
      }
    }

    setResults({ success, failed });
    setIsProcessing(false);
    
    // Reset selections after processing
    if (success.length > 0) {
      setSelectedFounders([]);
      setSelectedAdvisor('');
      setAssignmentReason('');
    }
  };

  const selectedAdvisorData = availableAdvisors.find(a => a.id === selectedAdvisor);
  const selectedAdvisorProfile = selectedAdvisorData?.user_profiles?.[0]?.profile_data as any;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bulk Assignment Tool</h2>
          <p className="text-muted-foreground">
            Assign multiple founders to advisors efficiently
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Assignment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned Founders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unassignedFounders.length}</div>
            <p className="text-xs text-muted-foreground">
              Need advisor assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Advisors</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableAdvisors.length}</div>
            <p className="text-xs text-muted-foreground">
              With capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedFounders.length}</div>
            <p className="text-xs text-muted-foreground">
              Ready for assignment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Results Display */}
      {results && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Assignment completed: {results.success.length} successful, {results.failed.length} failed
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Founder Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Select Founders</CardTitle>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="select-all"
                  checked={selectedFounders.length === unassignedFounders.length && unassignedFounders.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm">
                  Select All ({unassignedFounders.length})
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {unassignedFounders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  All founders are currently assigned to advisors
                </div>
              ) : (
                unassignedFounders.map((founder) => {
                  const profile = founder.user_profiles?.[0]?.profile_data as any;
                  const isSelected = selectedFounders.includes(founder.id);
                  
                  return (
                    <div key={founder.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox 
                        id={founder.id}
                        checked={isSelected}
                        onCheckedChange={(checked) => handleFounderSelection(founder.id, checked as boolean)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {profile?.name || 'Name not set'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {founder.email}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="text-xs">
                              {profile?.stage || 'No stage'}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-muted-foreground">
                            {profile?.startup_name || 'No startup name'} • {profile?.sector || 'No sector'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Advisor Selection & Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select Advisor
              </label>
              <Select value={selectedAdvisor} onValueChange={setSelectedAdvisor}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an advisor..." />
                </SelectTrigger>
                <SelectContent>
                  {availableAdvisors.map((advisor) => {
                    const profile = advisor.user_profiles?.[0]?.profile_data as any;
                    const activeAssignments = advisor.advisor_founder_assignments?.filter(a => a.status === 'active').length || 0;
                    
                    return (
                      <SelectItem key={advisor.id} value={advisor.id}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-medium">
                              {profile?.name || advisor.email.split('@')[0]}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {profile?.experience_level} • {activeAssignments}/5 assignments
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedAdvisorData && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Selected Advisor</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Name:</strong> {selectedAdvisorProfile?.name || 'Not set'}</p>
                  <p><strong>Experience:</strong> {selectedAdvisorProfile?.experience_level || 'Not set'}</p>
                  <p><strong>Expertise:</strong> {selectedAdvisorProfile?.expertise?.join(', ') || 'Not set'}</p>
                  <p><strong>Current Load:</strong> {selectedAdvisorData.advisor_founder_assignments?.filter(a => a.status === 'active').length || 0}/5 assignments</p>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">
                Assignment Reason (Optional)
              </label>
              <textarea
                placeholder="Why are you making these assignments..."
                value={assignmentReason}
                onChange={(e) => setAssignmentReason(e.target.value)}
                className="w-full p-2 border border-input rounded-md text-sm"
                rows={3}
              />
            </div>

            {selectedFounders.length > 0 && selectedAdvisor && (
              <Alert>
                <ArrowRight className="h-4 w-4" />
                <AlertDescription>
                  Ready to assign {selectedFounders.length} founder(s) to {selectedAdvisorProfile?.name || 'selected advisor'}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleBulkAssignment}
              disabled={!selectedAdvisor || selectedFounders.length === 0 || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign {selectedFounders.length} Founder(s)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BulkAssignmentTool;
