
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Settings, Home, FileText, ArrowUp, ArrowDown } from "lucide-react";

const FlightControl = () => {
  const currentWeekTodos = [
    { task: "Review 3 new founder applications", priority: "high", due: "Today" },
    { task: "Schedule Q2 advisor onboarding", priority: "medium", due: "Wednesday" },
    { task: "Follow up on Session #47 outcomes", priority: "high", due: "Tomorrow" },
    { task: "Prepare monthly KPI report", priority: "low", due: "Friday" }
  ];

  const kpiSnapshot = [
    { metric: "Active Founders", value: "28", change: "+3", trend: "up" },
    { metric: "Active Advisors", value: "19", change: "+1", trend: "up" },
    { metric: "Sessions This Month", value: "45", change: "+12", trend: "up" },
    { metric: "Case Studies Ready", value: "8", change: "+2", trend: "up" }
  ];

  const timeline = [
    { month: "Month 1", phase: "Onboarding & Matching", status: "completed", founders: 15, advisors: 10 },
    { month: "Month 2", phase: "First Advisory Sessions", status: "active", founders: 28, advisors: 19 },
    { month: "Month 3", phase: "Masterclasses Begin", status: "upcoming", founders: 25, advisors: 18 },
    { month: "Month 4", phase: "Progress Reviews", status: "planned", founders: 20, advisors: 15 },
    { month: "Month 5", phase: "Case Study Collection", status: "planned", founders: 18, advisors: 12 },
    { month: "Month 6", phase: "Final Reports & Graduation", status: "planned", founders: 15, advisors: 10 }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpiSnapshot.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.metric}</CardTitle>
              {kpi.trend === "up" ? (
                <ArrowUp className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className={`text-xs ${kpi.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                {kpi.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* What's Live Now */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            What's Live Now
          </CardTitle>
          <CardDescription>Quick access to active processes and tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Active Forms</h4>
              <div className="space-y-1">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  📝 Post-Session Reflection
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  📋 Advisor Feedback Form
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Calendars</h4>
              <div className="space-y-1">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  📅 Master Session Calendar
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  🎓 Masterclass Schedule
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Tools</h4>
              <div className="space-y-1">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  📊 Airtable Database
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  💬 Zoom Admin Panel
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6-Month Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            6-Month Flight Timeline
          </CardTitle>
          <CardDescription>Track progress across the entire program lifecycle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeline.map((period, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <Badge 
                    variant={period.status === 'completed' ? 'default' : 
                           period.status === 'active' ? 'secondary' : 'outline'}
                  >
                    {period.status}
                  </Badge>
                  <div>
                    <h4 className="font-medium">{period.month}</h4>
                    <p className="text-sm text-gray-600">{period.phase}</p>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div>{period.founders} Founders</div>
                  <div>{period.advisors} Advisors</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* This Week's To-Dos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            This Week's To-Dos
          </CardTitle>
          <CardDescription>Critical tasks requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentWeekTodos.map((todo, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={todo.priority === 'high' ? 'destructive' : 
                           todo.priority === 'medium' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {todo.priority}
                  </Badge>
                  <span className="font-medium">{todo.task}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Due: {todo.due}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FlightControl;
