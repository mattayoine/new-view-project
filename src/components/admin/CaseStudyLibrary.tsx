
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

const CaseStudyLibrary = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Case Study Library
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-muted-foreground">
        Case study resources and management will appear here.
      </div>
    </CardContent>
  </Card>
);

export default CaseStudyLibrary;
