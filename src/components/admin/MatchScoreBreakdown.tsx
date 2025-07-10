
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Clock, Award, Users, Lightbulb } from 'lucide-react';
import { MatchScore } from '@/utils/matchingAlgorithm';

interface MatchScoreBreakdownProps {
  founder: any;
  advisor: any;
  matchScore: MatchScore;
}

const MatchScoreBreakdown: React.FC<MatchScoreBreakdownProps> = ({
  founder,
  advisor,
  matchScore
}) => {
  // Use the new user_profiles structure
  const founderProfile = founder.user_profiles?.[0]?.profile_data;
  const advisorProfile = advisor.user_profiles?.[0]?.profile_data;

  const scoreItems = [
    {
      label: 'Sector Match',
      score: matchScore.sectorMatch,
      icon: Target,
      explanation: matchScore.breakdown.sector,
      weight: '30%'
    },
    {
      label: 'Timezone Compatibility',
      score: matchScore.timezoneMatch,
      icon: Clock,
      explanation: matchScore.breakdown.timezone,
      weight: '20%'
    },
    {
      label: 'Stage Alignment',
      score: matchScore.stageMatch,
      icon: Award,
      explanation: matchScore.breakdown.stage,
      weight: '20%'
    },
    {
      label: 'Availability Match',
      score: matchScore.availabilityMatch,
      icon: Users,
      explanation: matchScore.breakdown.availability,
      weight: '20%'
    },
    {
      label: 'Experience Match',
      score: matchScore.experienceMatch,
      icon: Lightbulb,
      explanation: matchScore.breakdown.experience,
      weight: '10%'
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Match Score</span>
            <Badge 
              variant="outline" 
              className={`text-lg px-3 py-1 ${
                matchScore.overall >= 80 ? 'border-green-500 text-green-600' :
                matchScore.overall >= 60 ? 'border-yellow-500 text-yellow-600' :
                'border-red-500 text-red-600'
              }`}
            >
              {matchScore.overall}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={matchScore.overall} className="h-3" />
        </CardContent>
      </Card>

      {/* Profile Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Founder Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>Name:</strong> {founderProfile?.name}</div>
            <div><strong>Startup:</strong> {founderProfile?.startup_name}</div>
            <div><strong>Sector:</strong> {founderProfile?.sector}</div>
            <div><strong>Stage:</strong> {founderProfile?.stage}</div>
            <div><strong>Location:</strong> {founderProfile?.location}</div>
            <div><strong>Challenge:</strong> {founderProfile?.challenge?.substring(0, 100)}...</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Advisor Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>Name:</strong> {advisorProfile?.name}</div>
            <div><strong>Experience:</strong> {advisorProfile?.experience_level}</div>
            <div><strong>Timezone:</strong> {advisorProfile?.timezone}</div>
            <div><strong>Location:</strong> {advisorProfile?.location}</div>
            <div><strong>Expertise:</strong> {advisorProfile?.expertise?.join(', ')}</div>
            <div><strong>Preference:</strong> {advisorProfile?.challenge_preference || 'Any'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scoreItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
                      <Badge variant="outline" className="text-xs">
                        Weight: {item.weight}
                      </Badge>
                    </div>
                    <span className={`font-bold ${getScoreColor(item.score)}`}>
                      {item.score}%
                    </span>
                  </div>
                  <Progress value={item.score} className="h-2" />
                  <p className="text-sm text-gray-600 ml-6">
                    {item.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchScoreBreakdown;
