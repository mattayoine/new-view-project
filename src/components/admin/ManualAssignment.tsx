
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Plus } from 'lucide-react';
import { useCreateAssignment } from '@/hooks/useAssignmentManagement';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ManualAssignmentProps {
  founders: any[];
  advisors: any[];
}

const ManualAssignment: React.FC<ManualAssignmentProps> = ({ founders, advisors }) => {
  const { user } = useAuth();
  const createAssignment = useCreateAssignment();
  
  const [selectedFounder, setSelectedFounder] = useState<string>('');
  const [selectedAdvisor, setSelectedAdvisor] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [founderSearch, setFounderSearch] = useState<string>('');
  const [advisorSearch, setAdvisorSearch] = useState<string>('');

  const filteredFounders = founders.filter(founder => {
    // Use the new user_profiles structure
    const profile = founder.user_profiles?.[0]?.profile_data;
    if (!profile) return false;
    
    const searchLower = founderSearch.toLowerCase();
    return !founderSearch || 
      profile.name?.toLowerCase().includes(searchLower) ||
      profile.startup_name?.toLowerCase().includes(searchLower) ||
      founder.email?.toLowerCase().includes(searchLower);
  });

  const filteredAdvisors = advisors.filter(advisor => {
    // Use the new user_profiles structure
    const profile = advisor.user_profiles?.[0]?.profile_data;
    if (!profile) return false;
    
    const searchLower = advisorSearch.toLowerCase();
    return !advisorSearch || 
      profile.name?.toLowerCase().includes(searchLower) ||
      advisor.email?.toLowerCase().includes(searchLower) ||
      profile.expertise?.some((exp: string) => exp.toLowerCase().includes(searchLower));
  });

  const handleCreateAssignment = async () => {
    if (!selectedFounder || !selectedAdvisor) {
      toast.error('Please select both a founder and advisor');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to create assignments');
      return;
    }

    try {
      // Get the current user's ID from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        toast.error('Unable to identify current user');
        return;
      }

      await createAssignment.mutateAsync({
        founderId: selectedFounder,
        advisorId: selectedAdvisor,
        matchScore: 0, // Manual assignment, no calculated score
        assignedBy: userData.id,
        notes: notes || 'Manual assignment by admin'
      });

      // Reset form
      setSelectedFounder('');
      setSelectedAdvisor('');
      setNotes('');
      setFounderSearch('');
      setAdvisorSearch('');
    } catch (error) {
      console.error('Error creating assignment:', error);
    }
  };

  const selectedFounderData = founders.find(f => f.id === selectedFounder);
  const selectedAdvisorData = advisors.find(a => a.id === selectedAdvisor);
  
  // Use the new user_profiles structure
  const selectedFounderProfile = selectedFounderData?.user_profiles?.[0]?.profile_data;
  const selectedAdvisorProfile = selectedAdvisorData?.user_profiles?.[0]?.profile_data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Manual Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Founder Selection */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Founder</label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Search founders..."
                    value={founderSearch}
                    onChange={(e) => setFounderSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedFounder} onValueChange={setSelectedFounder}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a founder" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredFounders.map((founder) => {
                      const profile = founder.user_profiles?.[0]?.profile_data;
                      if (!profile) return null;
                      
                      return (
                        <SelectItem key={founder.id} value={founder.id}>
                          <div className="flex flex-col">
                            <span>{profile.name}</span>
                            <span className="text-sm text-gray-500">
                              {profile.startup_name} • {profile.sector}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedFounderProfile && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">{selectedFounderProfile.name}</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Startup:</strong> {selectedFounderProfile.startup_name}</div>
                      <div><strong>Email:</strong> {selectedFounderData.email}</div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{selectedFounderProfile.sector}</Badge>
                        <Badge variant="outline">{selectedFounderProfile.stage}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Advisor Selection */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Advisor</label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Search advisors..."
                    value={advisorSearch}
                    onChange={(e) => setAdvisorSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedAdvisor} onValueChange={setSelectedAdvisor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an advisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAdvisors.map((advisor) => {
                      const profile = advisor.user_profiles?.[0]?.profile_data;
                      if (!profile) return null;
                      
                      return (
                        <SelectItem key={advisor.id} value={advisor.id}>
                          <div className="flex flex-col">
                            <span>{profile.name}</span>
                            <span className="text-sm text-gray-500">
                              {profile.experience_level} • {profile.expertise?.slice(0, 2).join(', ')}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedAdvisorProfile && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">{selectedAdvisorProfile.name}</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Email:</strong> {selectedAdvisorData.email}</div>
                      <div><strong>Experience:</strong> {selectedAdvisorProfile.experience_level}</div>
                      <div><strong>Timezone:</strong> {selectedAdvisorProfile.timezone}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedAdvisorProfile.expertise?.map((exp: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {exp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Assignment Notes</label>
              <Textarea
                placeholder="Add any notes about this assignment (optional)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={handleCreateAssignment}
              disabled={!selectedFounder || !selectedAdvisor || createAssignment.isPending}
              className="w-full"
            >
              {createAssignment.isPending ? 'Creating Assignment...' : 'Create Assignment'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManualAssignment;
