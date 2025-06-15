
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, Check, X } from "lucide-react";

const FounderDirectory = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const founders = [
    {
      name: "Amara Okafor",
      country: "Nigeria",
      sector: "FinTech",
      stage: "Series A",
      website: "payfast.ng",
      bottleneck: "International expansion strategy",
      advisors: ["Sarah Johnson", "Michael Chen"],
      bottleneckSolved: true,
      storyReady: true,
      testimonialsCollected: true
    },
    {
      name: "Kwame Asante",
      country: "Ghana",
      sector: "AgriTech",
      stage: "Seed",
      website: "farmconnect.gh",
      bottleneck: "Supply chain optimization",
      advisors: ["Jennifer Liu"],
      bottleneckSolved: false,
      storyReady: false,
      testimonialsCollected: true
    },
    {
      name: "Fatima Hassan",
      country: "Kenya",
      sector: "HealthTech",
      stage: "Pre-Seed",
      website: "meditrack.ke",
      bottleneck: "Product-market fit",
      advisors: ["David Rodriguez", "Angela Wright"],
      bottleneckSolved: true,
      storyReady: true,
      testimonialsCollected: false
    },
    {
      name: "Thabo Molefe",
      country: "South Africa",
      sector: "EdTech",
      stage: "Seed",
      website: "learnza.co.za",
      bottleneck: "User acquisition",
      advisors: ["Maria Santos"],
      bottleneckSolved: false,
      storyReady: false,
      testimonialsCollected: false
    }
  ];

  const filteredFounders = founders.filter(founder =>
    founder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    founder.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    founder.sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Pre-Seed": return "bg-yellow-100 text-yellow-800";
      case "Seed": return "bg-blue-100 text-blue-800";
      case "Series A": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
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
                Founder Directory
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Track all accepted founders and their journey progress
              </p>
            </div>
            <Badge variant="outline" className="bg-blue-50">
              {founders.length} Active Founders
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
                <TableHead>Location & Sector</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Top Bottleneck</TableHead>
                <TableHead>Assigned Advisors</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFounders.map((founder, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{founder.name}</div>
                      <div className="text-sm text-gray-500">{founder.website}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{founder.country}</div>
                      <div className="text-sm text-gray-500">{founder.sector}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStageColor(founder.stage)}>
                      {founder.stage}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-48">
                      <p className="text-sm">{founder.bottleneck}</p>
                      <Badge 
                        variant={founder.bottleneckSolved ? "default" : "secondary"}
                        className="mt-1 text-xs"
                      >
                        {founder.bottleneckSolved ? "Solved" : "In Progress"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {founder.advisors.map((advisor, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {advisor}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {founder.storyReady ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-xs">Story</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {founder.testimonialsCollected ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-xs">Testimonial</span>
                      </div>
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

export default FounderDirectory;
