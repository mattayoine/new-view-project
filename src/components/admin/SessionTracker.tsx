
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Calendar, CheckCircle, Clock } from "lucide-react";

const SessionTracker = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const sessions = [
    {
      id: "S001",
      founderName: "Amara Okafor",
      advisorName: "Sarah Johnson",
      sessionDate: "2025-01-15",
      sessionType: "1-on-1",
      status: "Completed",
      duration: "60 min",
      summary: "Discussed international expansion strategy for West African markets",
      actionableOutcome: true,
      quoteExtracted: true,
      followUpRequired: false
    },
    {
      id: "S002",
      founderName: "Kwame Asante",
      advisorName: "Jennifer Liu",
      sessionDate: "2025-01-18",
      sessionType: "1-on-1",
      status: "Scheduled",
      duration: "45 min",
      summary: "",
      actionableOutcome: false,
      quoteExtracted: false,
      followUpRequired: false
    },
    {
      id: "S003",
      founderName: "Fatima Hassan",
      advisorName: "David Rodriguez",
      sessionDate: "2025-01-12",
      sessionType: "Group",
      status: "Completed",
      duration: "90 min",
      summary: "Product-market fit workshop with regulatory compliance focus",
      actionableOutcome: true,
      quoteExtracted: false,
      followUpRequired: true
    },
    {
      id: "S004",
      founderName: "Thabo Molefe",
      advisorName: "Maria Santos",
      sessionDate: "2025-01-20",
      sessionType: "1-on-1",
      status: "Upcoming",
      duration: "60 min",
      summary: "",
      actionableOutcome: false,
      quoteExtracted: false,
      followUpRequired: false
    }
  ];

  const filteredSessions = sessions.filter(session =>
    session.founderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.advisorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.sessionType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800";
      case "Scheduled": return "bg-blue-100 text-blue-800";
      case "Upcoming": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSessionTypeColor = (type: string) => {
    return type === "Group" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Session Tracker
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Monitor all advisory sessions, outcomes, and follow-ups
              </p>
            </div>
            <Badge variant="outline" className="bg-blue-50">
              {sessions.length} Total Sessions
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              Schedule New Session
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session ID</TableHead>
                <TableHead>Founder</TableHead>
                <TableHead>Advisor</TableHead>
                <TableHead>Date & Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="font-mono text-sm">{session.id}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{session.founderName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{session.advisorName}</div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{session.sessionDate}</div>
                      <Badge className={getSessionTypeColor(session.sessionType)} size="sm">
                        {session.sessionType}
                      </Badge>
                      <div className="text-sm text-gray-500 mt-1">{session.duration}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-64">
                      <p className="text-sm text-gray-600">
                        {session.summary || "No summary yet"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        {session.actionableOutcome ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-xs">Outcome</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {session.quoteExtracted ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-xs">Quote</span>
                      </div>
                      {session.followUpRequired && (
                        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                          Follow-up
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      View Details
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

export default SessionTracker;
