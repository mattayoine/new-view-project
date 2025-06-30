
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, Target, Clock, CheckSquare, 
  BookOpen, Lightbulb, AlertCircle, TrendingUp 
} from 'lucide-react';
import { format } from 'date-fns';

interface SessionPreparationHubProps {
  sessionId: string;
}

const SessionPreparationHub: React.FC<SessionPreparationHubProps> = ({ sessionId }) => {
  const [agendaItems, setAgendaItems] = useState([
    { id: 1, text: 'Review previous session outcomes', completed: false, priority: 'high' },
    { id: 2, text: 'Discuss current challenges', completed: false, priority: 'high' },
    { id: 3, text: 'Set goals for next milestone', completed: false, priority: 'medium' },
  ]);

  const [actionItems, setActionItems] = useState([
    { id: 1, text: 'Complete market research analysis', dueDate: '2024-01-15', status: 'pending' },
    { id: 2, text: 'Prepare investor pitch deck', dueDate: '2024-01-20', status: 'in_progress' },
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Session Preparation Hub
        </h2>
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Next session: Tomorrow 2:00 PM
        </Badge>
      </div>

      <Tabs defaultValue="agenda" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agenda">Smart Agenda</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="history">Session History</TabsTrigger>
          <TabsTrigger value="followup">Follow-up</TabsTrigger>
        </TabsList>

        <TabsContent value="agenda">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                AI-Generated Session Agenda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">AI Recommendation</h4>
                    <p className="text-blue-800 text-sm">
                      Based on the founder's recent goal progress and previous session notes, 
                      focus on strategic planning and obstacle resolution this session.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {agendaItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Checkbox 
                      checked={item.completed}
                      onCheckedChange={(checked) => {
                        setAgendaItems(items => 
                          items.map(i => i.id === item.id ? { ...i, completed: !!checked } : i)
                        );
                      }}
                    />
                    <div className="flex-1">
                      <p className={`${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {item.text}
                      </p>
                    </div>
                    <Badge className={getPriorityColor(item.priority)}>
                      {item.priority}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Session Notes & Talking Points</h4>
                <Textarea 
                  placeholder="Add any specific topics, questions, or concerns to discuss..."
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Recommended Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-600 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-medium">Market Analysis Template</h4>
                      <p className="text-sm text-muted-foreground">
                        Comprehensive framework for analyzing market opportunities
                      </p>
                      <Badge variant="outline" className="mt-2">PDF</Badge>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-green-600 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-medium">Growth Strategy Playbook</h4>
                      <p className="text-sm text-muted-foreground">
                        Step-by-step guide to scaling your startup
                      </p>
                      <Badge variant="outline" className="mt-2">Article</Badge>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-purple-600 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-medium">OKR Setting Workshop</h4>
                      <p className="text-sm text-muted-foreground">
                        Interactive tool for setting and tracking objectives
                      </p>
                      <Badge variant="outline" className="mt-2">Interactive</Badge>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-yellow-600 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-medium">Innovation Frameworks</h4>
                      <p className="text-sm text-muted-foreground">
                        Collection of proven innovation methodologies
                      </p>
                      <Badge variant="outline" className="mt-2">Guide</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Previous Session Notes & Outcomes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">Strategic Planning Session</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date('2024-01-08'), 'MMM dd, yyyy • h:mm a')}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Completed</Badge>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <p className="text-sm"><strong>Key Topics:</strong> Market positioning, competitive analysis, growth metrics</p>
                    <p className="text-sm"><strong>Outcomes:</strong> Defined Q1 goals, identified key partnerships</p>
                  </div>
                  
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm font-medium mb-1">Action Items from Last Session:</p>
                    <ul className="text-sm space-y-1">
                      <li>✅ Complete competitor analysis (Due: Jan 10)</li>
                      <li>⏳ Prepare partnership proposals (Due: Jan 15)</li>
                      <li>❌ Update financial projections (Overdue)</li>
                    </ul>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">Product Development Review</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date('2024-01-01'), 'MMM dd, yyyy • h:mm a')}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Completed</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Key Topics:</strong> Feature prioritization, technical roadmap</p>
                    <p className="text-sm"><strong>Outcomes:</strong> Roadmap approved, development timeline set</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followup">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Action Items & Follow-up Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">8</p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">3</p>
                        <p className="text-sm text-muted-foreground">In Progress</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">2</p>
                        <p className="text-sm text-muted-foreground">Overdue</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  {actionItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{item.text}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {format(new Date(item.dueDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(item.status)}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                          {item.status === 'overdue' && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <Button className="w-full">
                    Generate Post-Session Action Items
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SessionPreparationHub;
