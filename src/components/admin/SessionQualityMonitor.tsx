
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, TrendingDown, Search, Filter, 
  Clock, Star, MessageSquare, CheckCircle2 
} from 'lucide-react';
import { useSessionQualityScores, useSessionAnalytics } from '@/hooks/useSessionAnalytics';
import { LoadingState } from '@/components/ui/loading-spinner';
import { format } from 'date-fns';

const SessionQualityMonitor = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [qualityFilter, setQualityFilter] = useState<string>('');
  
  const { data: qualityScores, isLoading, refetch } = useSessionQualityScores();
  const { data: analyticsData } = useSessionAnalytics('30d');

  if (isLoading) {
    return <LoadingState message="Loading session quality data..." />;
  }

  const filteredSessions = qualityScores?.filter(session => {
    const matchesSearch = !searchTerm || session.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesQuality = !qualityFilter || 
      (qualityFilter === 'excellent' && session.qualityScore >= 80) ||
      (qualityFilter === 'good' && session.qualityScore >= 60 && session.qualityScore < 80) ||
      (qualityFilter === 'average' && session.qualityScore >= 40 && session.qualityScore < 60) ||
      (qualityFilter === 'poor' && session.qualityScore < 40);
    
    return matchesSearch && matchesQuality;
  }) || [];

  const lowQualitySessions = qualityScores?.filter(s => s.qualityScore < 60) || [];
  const averageQuality = qualityScores?.reduce((acc, s) => acc + s.qualityScore, 0) / (qualityScores?.length || 1);

  const getQualityBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    if (score >= 40) return 'outline';
    return 'destructive';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'Poor';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Session Quality Monitor</h2>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Refresh Data
        </Button>
      </div>

      {/* Quality Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Quality Score</p>
                <p className="text-xl font-bold">{Math.round(averageQuality)}/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">High Quality</p>
                <p className="text-xl font-bold">
                  {qualityScores?.filter(s => s.qualityScore >= 80).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Needs Attention</p>
                <p className="text-xl font-bold">{lowQualitySessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Critical Issues</p>
                <p className="text-xl font-bold">
                  {qualityScores?.filter(s => s.qualityScore < 40).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={qualityFilter} onValueChange={setQualityFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Quality Levels</SelectItem>
                <SelectItem value="excellent">Excellent (80-100)</SelectItem>
                <SelectItem value="good">Good (60-79)</SelectItem>
                <SelectItem value="average">Average (40-59)</SelectItem>
                <SelectItem value="poor">Poor (0-39)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Session Quality Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sessions match your criteria
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div 
                  key={session.sessionId} 
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{session.title}</h4>
                        <Badge variant={getQualityBadgeVariant(session.qualityScore)}>
                          {getQualityLabel(session.qualityScore)} • {session.qualityScore}/100
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {format(new Date(session.scheduledAt), 'MMM dd, yyyy • h:mm a')}
                      </p>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Duration Score</p>
                            <p className="font-medium">{session.durationScore}/100</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Rating Score</p>
                            <p className="font-medium">{session.ratingScore}/100</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Follow-up Score</p>
                            <p className="font-medium">{session.followupScore}/100</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {session.qualityScore < 60 && (
                      <div className="ml-4">
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Review Needed
                        </Badge>
                      </div>
                    )}
                  </div>

                  {session.qualityScore < 60 && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                      <h5 className="font-medium text-orange-800 mb-1">Quality Issues Detected:</h5>
                      <ul className="text-sm text-orange-700 space-y-1">
                        {session.durationScore < 50 && (
                          <li>• Session duration was below optimal (less than 30 minutes)</li>
                        )}
                        {session.ratingScore < 60 && (
                          <li>• Low participant ratings indicate dissatisfaction</li>
                        )}
                        {session.followupScore === 0 && (
                          <li>• Missing session notes or follow-up documentation</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionQualityMonitor;
