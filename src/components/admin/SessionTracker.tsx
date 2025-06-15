
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

const SessionTracker = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Session Tracker
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-muted-foreground">
        Session tracking and scheduling tools will be implemented here.
      </div>
    </CardContent>
  </Card>
);

export default SessionTracker;
