
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, Building2, Award, Star } from "lucide-react";
import { useAdvisorsDirectory } from "@/hooks/useAdminData";

const AdvisorDirectory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: advisors, isLoading } = useAdvisorsDirectory();

  const filteredAdvisors = advisors?.filter(advisor =>
    advisor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    advisor.user_profiles?.[0]?.profile_data?.expertise?.some((exp: string) => 
      exp.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const getStatusColor = (status: string) => {
    return status === "active" 
      ? "bg-blue-100 text-blue-800" 
      : "bg-green-100 text-green-800";
  };

  const getBadgeColor = (level: string) => {
    const colors = {
      bronze: "bg-amber-100 text-amber-800",
      silver: "bg-gray-100 text-gray-800", 
      gold: "bg-yellow-100 text-yellow-800",
      platinum: "bg-purple-100 text-purple-800",
      diamond: "bg-blue-100 text-blue-800"
    };
    return colors[level as keyof typeof colors] || colors.bronze;
  };

  const getBadgeIcon = (level: string) => {
    if (level === "diamond") return <Award className="w-3 h-3" />;
    if (level === "platinum" || level === "gold") return <Star className="w-3 h-3" />;
    return null;
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

  const totalSessions = advisors?.reduce((sum, a) => sum + (a.advisor_founder_assignments?.reduce((total, assignment) => total + (assignment.total_sessions || 0), 0) || 0), 0) || 0;
  const totalFounders = advisors?.reduce((sum, a) => sum + (a.advisor_founder_assignments?.length || 0), 0) || 0;
  const avgRating = advisors?.reduce((sum, a) => {
    const advisorAvg = a.advisor_founder_assignments?.reduce((total, assignment) => total + (assignment.avg_rating || 0), 0) || 0;
    return sum + (advisorAvg / (a.advisor_founder_assignments?.length || 1));
  }, 0) / (advisors?.length || 1) || 0;

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Advisor Directory
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Manage your pool of Diaspora experts and their assignments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-purple-50">
                {advisors?.length || 0} Active Advisors
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search advisors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              Add New Advisor
            </Button>
            <Button variant="outline" size="sm">
              <Building2 className="w-4 h-4 mr-2" />
              Manage Organizations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Advisors Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Advisor</TableHead>
                <TableHead>Expertise Areas</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Founders</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdvisors.map((advisor, index) => {
                const profile = advisor.user_profiles?.[0]?.profile_data;
                const totalAdvisorSessions = advisor.advisor_founder_assignments?.reduce((sum, assignment) => sum + (assignment.total_sessions || 0), 0) || 0;
                const advisorAvgRating = advisor.advisor_founder_assignments?.reduce((sum, assignment) => sum + (assignment.avg_rating || 0), 0) / (advisor.advisor_founder_assignments?.length || 1) || 0;
                const badgeLevel = totalAdvisorSessions > 50 ? "diamond" : totalAdvisorSessions > 25 ? "platinum" : totalAdvisorSessions > 10 ? "gold" : "silver";
                
                return (
                  <TableRow key={advisor.id}>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{advisor.email?.split('@')[0] || 'Advisor'}</span>
                          <Badge className={`${getBadgeColor(badgeLevel)} text-xs flex items-center gap-1`}>
                            {getBadgeIcon(badgeLevel)}
                            {badgeLevel}
                          </Badge>
                        </div>
                        <div className="text-sm text-blue-600 hover:underline cursor-pointer mt-1">
                          {advisor.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {profile?.expertise?.slice(0, 3).map((skill: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs mr-1">
                            {skill}
                          </Badge>
                        )) || (
                          <Badge variant="secondary" className="text-xs">
                            General Business
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="font-medium">{advisorAvgRating ? advisorAvgRating.toFixed(1) : '4.5'}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {totalAdvisorSessions} sessions
                        </div>
                        <div className="text-xs text-gray-600">
                          {advisor.advisor_founder_assignments?.length || 0} founders mentored
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(advisor.status || 'active')}>
                        {advisor.status === 'active' ? 'Active' : 'Ready to be matched'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {advisor.advisor_founder_assignments?.slice(0, 2).map((assignment, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            Founder {assignment.founder_id?.slice(0, 8) || 'Unknown'}
                          </Badge>
                        )) || (
                          <Badge variant="outline" className="text-xs text-gray-400">
                            No advisor_founder_assignments
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Button variant="outline" size="sm">
                          Edit Profile
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs">
                          View Analytics
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-sm text-gray-600">Total Sessions Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
            <p className="text-sm text-gray-600">Average Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalFounders}</div>
            <p className="text-sm text-gray-600">Total Founders Mentored</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {advisors?.filter(a => {
                const sessions = a.advisor_founder_assignments?.reduce((sum, assignment) => sum + (assignment.total_sessions || 0), 0) || 0;
                return sessions > 25;
              }).length || 0}
            </div>
            <p className="text-sm text-gray-600">Elite Advisors (25+ Sessions)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvisorDirectory;
