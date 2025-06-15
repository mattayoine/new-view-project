
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users } from "lucide-react";

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
      notes: "Excellent at international expansion strategies, has scaled 3 startups in Africa"
    },
    {
      name: "Michael Chen",
      location: "San Francisco, USA",
      linkedin: "linkedin.com/in/michaelchen",
      expertise: ["FinTech", "Fundraising"],
      matchingStatus: "Ready to be matched",
      foundersAssigned: ["Amara Okafor"],
      timezone: "PST",
      notes: "Former VP at Stripe, deep FinTech expertise, African market experience"
    },
    {
      name: "Jennifer Liu",
      location: "Toronto, Canada",
      linkedin: "linkedin.com/in/jenniferliu",
      expertise: ["Supply Chain", "Operations"],
      matchingStatus: "Already matched",
      foundersAssigned: ["Kwame Asante"],
      timezone: "EST",
      notes: "Supply chain optimization expert, worked with 10+ AgriTech companies"
    },
    {
      name: "David Rodriguez",
      location: "Barcelona, Spain",
      linkedin: "linkedin.com/in/davidrodriguez",
      expertise: ["HealthTech", "Regulatory"],
      matchingStatus: "Already matched",
      foundersAssigned: ["Fatima Hassan"],
      timezone: "CET",
      notes: "Former McKinsey partner, specialized in healthcare innovation"
    }
  ];

  const filteredAdvisors = advisors.filter(advisor =>
    advisor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    advisor.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    advisor.expertise.some(exp => exp.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    return status === "Ready to be matched" 
      ? "bg-green-100 text-green-800" 
      : "bg-blue-100 text-blue-800";
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
            <Badge variant="outline" className="bg-purple-50">
              {advisors.length} Active Advisors
            </Badge>
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
          </div>
        </CardContent>
      </Card>

      {/* Advisors Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Advisor</TableHead>
                <TableHead>Location & Timezone</TableHead>
                <TableHead>Expertise Areas</TableHead>
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
                      <div className="font-medium">{advisor.name}</div>
                      <div className="text-sm text-blue-600 hover:underline cursor-pointer">
                        {advisor.linkedin}
                      </div>
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
                    <Button variant="outline" size="sm">
                      Edit Profile
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvisorDirectory;
