
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, Check, X } from "lucide-react";
import { useFoundersDirectory } from "@/hooks/useAdminData";

const FounderDirectory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: founders, isLoading } = useFoundersDirectory();

  const filteredFounders = founders?.filter(founder =>
    founder.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    founder.user_profiles?.[0]?.profile_data?.startup_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    founder.user_profiles?.[0]?.profile_data?.sector?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Pre-Seed": return "bg-yellow-100 text-yellow-800";
      case "Seed": return "bg-blue-100 text-blue-800";
      case "Series A": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Founder Directory
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Track all accepted founders and their journey progress
              </p>
            </div>
            <Badge variant="outline" className="bg-blue-50">
              {founders?.length || 0} Active Founders
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search founders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Founders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Founder</TableHead>
                <TableHead>Startup & Sector</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Challenge</TableHead>
                <TableHead>Assigned Advisors</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFounders.map((founder, index) => {
                const profile = founder.user_profiles?.[0]?.profile_data;
                const activeGoals = founder.goals?.filter(g => g.status === 'active').length || 0;
                const completedGoals = founder.goals?.filter(g => g.status === 'completed').length || 0;
                
                return (
                  <TableRow key={founder.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{founder.email?.split('@')[0] || 'Founder'}</div>
                        <div className="text-sm text-gray-500">{profile?.website || profile?.startup_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{profile?.startup_name || 'Startup'}</div>
                        <div className="text-sm text-gray-500">{profile?.sector || 'General'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStageColor(profile?.stage || 'Seed')}>
                        {profile?.stage || 'Seed'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-48">
                        <p className="text-sm">{profile?.challenge || 'Growth strategy and scaling operations'}</p>
                        <Badge 
                          variant={activeGoals > 0 ? "default" : "secondary"}
                          className="mt-1 text-xs"
                        >
                          {activeGoals > 0 ? "In Progress" : "Planning"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {founder.advisor_founder_assignments?.filter(a => a.status === 'active').map((assignment, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            Advisor {assignment.advisor_id?.slice(0, 8) || 'Unknown'}
                          </Badge>
                        )) || (
                          <Badge variant="outline" className="text-xs text-gray-400">
                            No advisors assigned
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {completedGoals > 0 ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-xs">Goals</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {founder.advisor_founder_assignments?.some(a => a.total_sessions > 0) ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-xs">Sessions</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FounderDirectory;
