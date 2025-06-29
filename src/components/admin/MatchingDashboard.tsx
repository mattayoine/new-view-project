
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, Target, Clock, Award } from 'lucide-react';
import { useFoundersDirectory, useAdvisorsDirectory } from '@/hooks/useAdminData';
import { calculateMatchScore, rankAdvisorsByMatch } from '@/utils/matchingAlgorithm';
import MatchSuggestions from './MatchSuggestions';
import ManualAssignment from './ManualAssignment';
import AssignmentsList from './AssignmentsList';

const MatchingDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFounder, setSelectedFounder] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    sector: '',
    stage: '',
    location: ''
  });

  const { data: founders = [], isLoading: foundersLoading } = useFoundersDirectory();
  const { data: advisors = [], isLoading: advisorsLoading } = useAdvisorsDirectory();

  console.log('MatchingDashboard data:', { founders, advisors });

  const filteredFounders = founders.filter(founder => {
    // Access the founder_profiles directly since that's what the data structure provides
    const profile = founder.founder_profiles?.[0]?.profile_data;
    
    if (!profile) {
      console.log('No founder profile found for:', founder.id);
      return false;
    }

    const matchesSearch = !searchTerm || 
      profile.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      founder.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.startup_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSector = !filters.sector || profile.sector === filters.sector;
    const matchesStage = !filters.stage || profile.stage === filters.stage;
    const matchesLocation = !filters.location || 
      profile.location?.toLowerCase().includes(filters.location.toLowerCase());

    return matchesSearch && matchesSector && matchesStage && matchesLocation;
  });

  const selectedFounderData = selectedFounder ? 
    founders.find(f => f.id === selectedFounder) : null;

  // Access the founder_profiles directly
  const selectedFounderProfile = selectedFounderData?.founder_profiles?.[0]?.profile_data;

  // Get match suggestions for selected founder
  const matchSuggestions = selectedFounderProfile ? 
    rankAdvisorsByMatch(selectedFounderProfile, advisors).slice(0, 10) : [];

  console.log('Match suggestions generated:', matchSuggestions.length);

  if (foundersLoading || advisorsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading matching data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Matching & Assignment Dashboard</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{founders.length} Founders • {advisors.length} Advisors</span>
        </div>
      </div>

      <Tabs defaultValue="suggestions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="suggestions">Match Suggestions</TabsTrigger>
          <TabsTrigger value="manual">Manual Assignment</TabsTrigger>
          <TabsTrigger value="assignments">Active Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Founder Selection Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Select Founder
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Search founders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Select onValueChange={(value) => setFilters({ ...filters, sector: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by sector" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Sectors</SelectItem>
                      <SelectItem value="tech">Tech</SelectItem>
                      <SelectItem value="fintech">Fintech</SelectItem>
                      <SelectItem value="healthtech">Healthtech</SelectItem>
                      <SelectItem value="saas">SaaS</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select onValueChange={(value) => setFilters({ ...filters, stage: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Stages</SelectItem>
                      <SelectItem value="idea">Idea</SelectItem>
                      <SelectItem value="mvp">MVP</SelectItem>
                      <SelectItem value="early_stage">Early Stage</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredFounders.map((founder) => {
                    // Access the founder_profiles directly
                    const profile = founder.founder_profiles?.[0]?.profile_data;
                    if (!profile) return null;

                    return (
                      <div
                        key={founder.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedFounder === founder.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedFounder(founder.id)}
                      >
                        <div className="font-medium">{profile.name}</div>
                        <div className="text-sm text-gray-600">{profile.startup_name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {profile.sector}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {profile.stage}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Match Suggestions */}
            <div className="lg:col-span-2">
              {selectedFounderData && selectedFounderProfile ? (
                <MatchSuggestions
                  founder={selectedFounderData}
                  founderProfile={selectedFounderProfile}
                  suggestions={matchSuggestions}
                />
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center text-gray-500">
                      <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Select a founder to see match suggestions</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="manual">
          <ManualAssignment founders={founders} advisors={advisors} />
        </TabsContent>

        <TabsContent value="assignments">
          <AssignmentsList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MatchingDashboard;
