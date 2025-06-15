
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Search, Edit, Eye, Share2 } from "lucide-react";

const CaseStudyLibrary = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const caseStudies = [
    {
      id: "CS001",
      founderName: "Amara Okafor",
      startupName: "PayFast",
      sector: "FinTech",
      country: "Nigeria",
      initialBottleneck: "International expansion strategy",
      status: "Published",
      completionDate: "2025-01-10",
      heroQuote: "The diaspora insight on compliance frameworks saved us 6 months of trial and error.",
      keyOutcomes: ["Entered 3 new markets", "50% revenue increase", "Regulatory compliance achieved"],
      testimonialCollected: true,
      mediaReady: true,
      publicUrl: "copilot.com/case-studies/payfast"
    },
    {
      id: "CS002",
      founderName: "Kwame Asante",
      startupName: "FarmConnect",
      sector: "AgriTech",
      country: "Ghana",
      initialBottleneck: "Supply chain optimization",
      status: "In Review",
      completionDate: "",
      heroQuote: "",
      keyOutcomes: ["Supply chain costs reduced by 30%", "Farmer network expanded"],
      testimonialCollected: true,
      mediaReady: false,
      publicUrl: ""
    },
    {
      id: "CS003",
      founderName: "Fatima Hassan",
      startupName: "MediTrack",
      sector: "HealthTech",
      country: "Kenya",
      initialBottleneck: "Product-market fit",
      status: "Draft",
      completionDate: "",
      heroQuote: "Having an advisor who understood both tech and healthcare regulations was game-changing.",
      keyOutcomes: ["PMF achieved", "Pilot with 5 hospitals", "Series A prep"],
      testimonialCollected: false,
      mediaReady: false,
      publicUrl: ""
    },
    {
      id: "CS004",
      founderName: "Thabo Molefe",
      startupName: "LearnZA",
      sector: "EdTech",
      country: "South Africa",
      initialBottleneck: "User acquisition",
      status: "Planning",
      completionDate: "",
      heroQuote: "",
      keyOutcomes: [],
      testimonialCollected: false,
      mediaReady: false,
      publicUrl: ""
    }
  ];

  const filteredCaseStudies = caseStudies.filter(study =>
    study.founderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    study.startupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    study.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
    study.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published": return "bg-green-100 text-green-800";
      case "In Review": return "bg-blue-100 text-blue-800";
      case "Draft": return "bg-yellow-100 text-yellow-800";
      case "Planning": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSectorColor = (sector: string) => {
    const colors = {
      "FinTech": "bg-purple-100 text-purple-800",
      "AgriTech": "bg-green-100 text-green-800",
      "HealthTech": "bg-red-100 text-red-800",
      "EdTech": "bg-blue-100 text-blue-800"
    };
    return colors[sector] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Case Study Library
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Collect, draft, and publish founder transformation stories
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">
                {caseStudies.filter(cs => cs.status === "Published").length} Published
              </Badge>
              <Badge variant="outline" className="bg-blue-50">
                {caseStudies.length} Total Studies
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search case studies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              Create New Study
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Case Studies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCaseStudies.map((study) => (
          <Card key={study.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getStatusColor(study.status)}>
                      {study.status}
                    </Badge>
                    <Badge className={getSectorColor(study.sector)}>
                      {study.sector}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{study.startupName}</CardTitle>
                  <p className="text-sm text-gray-600">{study.founderName} • {study.country}</p>
                </div>
                <div className="text-xs text-gray-500">
                  {study.id}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">Initial Bottleneck</h4>
                  <p className="text-sm text-gray-600">{study.initialBottleneck}</p>
                </div>

                {study.heroQuote && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Hero Quote</h4>
                    <p className="text-sm italic text-gray-700">"{study.heroQuote}"</p>
                  </div>
                )}

                {study.keyOutcomes.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Key Outcomes</h4>
                    <div className="space-y-1">
                      {study.keyOutcomes.map((outcome, idx) => (
                        <div key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                          <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                          {outcome}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-3 text-xs">
                    <div className={`flex items-center gap-1 ${study.testimonialCollected ? 'text-green-600' : 'text-gray-400'}`}>
                      {study.testimonialCollected ? '✓' : '○'} Testimonial
                    </div>
                    <div className={`flex items-center gap-1 ${study.mediaReady ? 'text-green-600' : 'text-gray-400'}`}>
                      {study.mediaReady ? '✓' : '○'} Media Ready
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    {study.publicUrl && (
                      <Button variant="ghost" size="sm">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CaseStudyLibrary;
