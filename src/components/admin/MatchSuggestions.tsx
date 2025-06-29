
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Award, Clock, MapPin, Target, Users, CheckCircle } from 'lucide-react';
import { MatchCandidate } from '@/utils/matchingAlgorithm';
import { useCreateAssignment } from '@/hooks/useAssignmentManagement';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import MatchScoreBreakdown from './MatchScoreBreakdown';

interface MatchSuggestionsProps {
  founder: any;
  founderProfile: any;
  suggestions: MatchCandidate[];
}

const MatchSuggestions: React.FC<MatchSuggestionsProps> = ({
  founder,
  founderProfile,
  suggestions
}) => {
  const { user } = useAuth();
  const createAssignment = useCreateAssignment();

  const handleCreateAssignment = async (suggestion: MatchCandidate) => {
    if (!user) return;

    // Get the current user's ID from the users table
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      toast.error('Unable to identify current user');
      return;
    }

    createAssignment.mutate({
      founderId: founder.id,
      advisorId: suggestion.advisorId,
      matchScore: suggestion.matchScore.overall,
      assignedBy: userData.id,
      notes: `Auto-matched with ${suggestion.matchScore.overall}% compatibility`
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          Match Suggestions for {founderProfile.name}
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            {founderProfile.startup_name}
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {founderProfile.location}
          </div>
          <Badge variant="outline">{founderProfile.sector}</Badge>
          <Badge variant="outline">{founderProfile.stage}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No advisors found for matching</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => {
              const advisorProfile = suggestion.advisor.advisor_profiles?.[0]?.profile_data;
              if (!advisorProfile) return null;

              return (
                <div
                  key={suggestion.advisorId}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                        #{index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">{advisorProfile.name}</h4>
                        <p className="text-sm text-gray-600">{suggestion.advisor.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getScoreBadgeColor(suggestion.matchScore.overall)}>
                        {suggestion.matchScore.overall}% Match
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Experience</div>
                      <div className="text-sm font-medium">{advisorProfile.experience_level}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Timezone</div>
                      <div className="text-sm font-medium">{advisorProfile.timezone}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Expertise</div>
                      <div className="text-sm font-medium">
                        {advisorProfile.expertise?.slice(0, 2).join(', ')}
                        {advisorProfile.expertise?.length > 2 && '...'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Preference</div>
                      <div className="text-sm font-medium">
                        {advisorProfile.challenge_preference || 'Any'}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Match Score</span>
                      <span className={`text-sm font-bold ${getScoreColor(suggestion.matchScore.overall)}`}>
                        {suggestion.matchScore.overall}%
                      </span>
                    </div>
                    <Progress value={suggestion.matchScore.overall} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Match Score Breakdown</DialogTitle>
                        </DialogHeader>
                        <MatchScoreBreakdown
                          founder={founder}
                          advisor={suggestion.advisor}
                          matchScore={suggestion.matchScore}
                        />
                      </DialogContent>
                    </Dialog>

                    <Button
                      onClick={() => handleCreateAssignment(suggestion)}
                      disabled={createAssignment.isPending}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {createAssignment.isPending ? 'Assigning...' : 'Create Assignment'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MatchSuggestions;
