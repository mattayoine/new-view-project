
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Users, Zap, CheckCircle } from 'lucide-react';
import { useCalculateMatches, useBulkAssignments } from '@/hooks/useMatchingAlgorithm';
import { useFoundersDirectory, useAdvisorsDirectory } from '@/hooks/useAdminData';

const BulkAssignmentTool = () => {
  const [selectedFounders, setSelectedFounders] = useState<string[]>([]);
  const [assignmentThreshold, setAssignmentThreshold] = useState(70);
  const [bulkNotes, setBulkNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: founders = [] } = useFoundersDirectory();
  const { data: advisors = [] } = useAdvisorsDirectory();
  const bulkAssignments = useBulkAssignments();

  const handleFounderSelection = (founderId: string, checked: boolean) => {
    if (checked) {
      setSelectedFounders(prev => [...prev, founderId]);
    } else {
      setSelectedFounders(prev => prev.filter(id => id !== founderId));
    }
  };

  const generateBulkAssignments = async () => {
    if (selectedFounders.length === 0) return;

    setIsProcessing(true);
    const assignments = [];

    for (const founderId of selectedFounders) {
      const founder = founders.find(f => f.id === founderId);
      const founderProfile = founder?.founder_profiles?.[0]?.profile_data;
      
      if (!founderProfile) continue;

      // Calculate matches for this founder
      const { calculateMatchScore } = await import('@/utils/matchingAlgorithm');
      
      let bestMatch = null;
      let bestScore = 0;

      for (const advisor of advisors) {
        const advisorProfile = advisor.advisor_profiles?.[0]?.profile_data;
        if (!advisorProfile) continue;

        const matchScore = calculateMatchScore(founderProfile, advisorProfile);
        if (matchScore.overall > bestScore && matchScore.overall >= assignmentThreshold) {
          bestMatch = advisor;
          bestScore = matchScore.overall;
        }
      }

      if (bestMatch) {
        assignments.push({
          founderId,
          advisorId: bestMatch.id,
          matchScore: bestScore,
          notes: bulkNotes || `Auto-assigned with ${bestScore}% match score`
        });
      }
    }

    if (assignments.length > 0) {
      bulkAssignments.mutate(assignments);
    }

    setIsProcessing(false);
    setSelectedFounders([]);
    setBulkNotes('');
  };

  const unassignedFounders = founders.filter(founder => {
    // Check if founder already has an active assignment
    return !founder.assignments?.some((assignment: any) => 
      assignment.status === 'active' || assignment.status === 'pending'
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Bulk Assignment Tool
        </CardTitle>
        <p className="text-sm text-gray-600">
          Automatically assign multiple founders to best-matched advisors
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>Match Threshold:</Label>
            <Badge variant="outline">{assignmentThreshold}%</Badge>
          </div>
          <div className="flex-1">
            <Progress value={assignmentThreshold} className="h-2" />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setAssignmentThreshold(60)}
            >
              60%
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setAssignmentThreshold(70)}
            >
              70%
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setAssignmentThreshold(80)}
            >
              80%
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Select Founders for Bulk Assignment:</Label>
          <div className="max-h-64 overflow-y-auto border rounded-lg p-4 space-y-3">
            {unassignedFounders.map((founder) => {
              const profile = founder.founder_profiles?.[0]?.profile_data;
              return (
                <div key={founder.id} className="flex items-center space-x-3">
                  <Checkbox
                    checked={selectedFounders.includes(founder.id)}
                    onCheckedChange={(checked) => 
                      handleFounderSelection(founder.id, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <div className="font-medium">{profile?.name}</div>
                    <div className="text-sm text-gray-600">{profile?.startup_name}</div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {profile?.sector}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {profile?.stage}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Bulk Assignment Notes (Optional):</Label>
          <Textarea
            value={bulkNotes}
            onChange={(e) => setBulkNotes(e.target.value)}
            placeholder="Add notes for all assignments..."
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedFounders.length} founders selected
          </div>
          <Button
            onClick={generateBulkAssignments}
            disabled={selectedFounders.length === 0 || isProcessing || bulkAssignments.isPending}
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {isProcessing || bulkAssignments.isPending ? 'Processing...' : 'Create Assignments'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkAssignmentTool;
