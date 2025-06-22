
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, Building2, Award, Star } from "lucide-react";

const AdvisorDirectory = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const advisors = [
    {
      name: "Sarah Johnson",
      location: "London, UK",
      linkedin: "linkedin.com/in/sarahjohnson",
      expertise: ["Product Management", "Go-to-Market"],
      matchingStatus: "Already matched",
      foundersAssigned: ["Amara Okafor"],
      timezone: "GMT",
      notes: "Excellent at international expansion strategies, has scaled 3 startups in Africa",
      organization: "TechStars London",
      orgType: "accelerator",
      badgeLevel: "gold",
      totalSessions: 32,
      avgRating: 4.6,
      foundersCount: 8
    },
    {
      name: "Michael Chen",
      location: "San Francisco, USA",
      linkedin: "linkedin.com/in/michaelchen",
      expertise: ["FinTech", "Fundraising"],
      matchingStatus: "Ready to be matched",
      foundersAssigned: ["Amara Okafor"],
      timezone: "PST",
      notes: "Former VP at Stripe, deep FinTech expertise, African market experience",
      organization: "Y Combinator",
      orgType: "accelerator",
      badgeLevel: "platinum",
      totalSessions: 67,
      avgRating: 4.8,
      foundersCount: 15
    },
    {
      name: "Jennifer Liu",
      location: "Toronto, Canada",
      linkedin: "linkedin.com/in/jenniferliu",
      expertise: ["Supply Chain", "Operations"],
      matchingStatus: "Already matched",
      foundersAssigned: ["Kwame Asante"],
      timezone: "EST",
      notes: "Supply chain optimization expert, worked with 10+ AgriTech companies",
      organization: "MaRS Discovery District",
      orgType: "incubator",
      badgeLevel: "silver",
      totalSessions: 18,
      avgRating: 4.3,
      foundersCount: 4
    },
    {
      name: "David Rodriguez",
      location: "Barcelona, Spain",
      linkedin: "linkedin.com/in/davidrodriguez",
      expertise: ["HealthTech", "Regulatory"],
      matchingStatus: "Already matched",
      foundersAssigned: ["Fatima Hassan"],
      timezone: "CET",
      notes: "Former McKinsey partner, specialized in healthcare innovation",
      organization: "Barcelona Health Hub",
      orgType: "corporate",
      badgeLevel: "diamond",
      totalSessions: 124,
      avgRating: 4.9,
      foundersCount: 25
    }
  ];

  const filteredAdvisors = advisors.filter(advisor =>
    advisor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    advisor.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    advisor.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    advisor.expertise.some(exp => exp.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    return status === "Ready to be matched" 
      ? "bg-green-100 text-green-800" 
      : "bg-blue-100 text-blue-800";
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

  const getOrgTypeColor = (type: string) => {
    const colors = {
      accelerator: "bg-green-50 text-green-700",
      incubator: "bg-blue-50 text-blue-700",
      corporate: "bg-purple-50 text-purple-700",
      university: "bg-orange-50 text-orange-700",
      venture_studio: "bg-pink-50 text-pink-700"
    };
    return colors[type as keyof typeof colors] || colors.accelerator;
  };

  const getBadgeIcon = (level: string) => {
    if (level === "diamond") return <Award className="w-3 h-3" />;
    if (level === "platinum" || level === "gold") return <Star className="w-3 h-3" />;
    return null;
  };

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
                {advisors.length} Active Advisors
              </Badge>
              <Badge variant="outline" className="bg-blue-50">
                {new Set(advisors.map(a => a.organization)).size} Organizations
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search advisors, organizations..."
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
                <TableHead>Advisor & Badge</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Location & Timezone</TableHead>
                <TableHead>Expertise Areas</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Founders</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdvisors.map((advisor, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{advisor.name}</span>
                        <Badge className={`${getBadgeColor(advisor.badgeLevel)} text-xs flex items-center gap-1`}>
                          {getBadgeIcon(advisor.badgeLevel)}
                          {advisor.badgeLevel}
                        </Badge>
                      </div>
                      <div className="text-sm text-blue-600 hover:underline cursor-pointer mt-1">
                        {advisor.linkedin}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {advisor.organization}
                      </div>
                      <Badge variant="outline" className={`${getOrgTypeColor(advisor.orgType)} text-xs mt-1`}>
                        {advisor.orgType.replace('_', ' ')}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{advisor.location}</div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {advisor.timezone}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {advisor.expertise.map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs mr-1">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="font-medium">{advisor.avgRating}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {advisor.totalSessions} sessions
                      </div>
                      <div className="text-xs text-gray-600">
                        {advisor.foundersCount} founders mentored
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(advisor.matchingStatus)}>
                      {advisor.matchingStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {advisor.foundersAssigned.map((founder, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {founder}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-48">
                      <p className="text-sm text-gray-600">{advisor.notes}</p>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {advisors.reduce((sum, a) => sum + a.totalSessions, 0)}
            </div>
            <p className="text-sm text-gray-600">Total Sessions Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {(advisors.reduce((sum, a) => sum + a.avgRating, 0) / advisors.length).toFixed(1)}
            </div>
            <p className="text-sm text-gray-600">Average Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {advisors.reduce((sum, a) => sum + a.foundersCount, 0)}
            </div>
            <p className="text-sm text-gray-600">Unique Founders Mentored</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {advisors.filter(a => a.badgeLevel === 'diamond' || a.badgeLevel === 'platinum').length}
            </div>
            <p className="text-sm text-gray-600">Elite Advisors (Platinum+)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvisorDirectory;
