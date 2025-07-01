
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckSquare, Clock, AlertCircle, Target } from 'lucide-react';
import { useFounderSessions } from '@/hooks/useFounderData';

interface ActionItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  sessionTitle: string;
  sessionDate: string;
}

const ActionItemTracker = () => {
  const { data: sessions } = useFounderSessions();

  // Extract action items from session notes and AI summary
  const extractActionItems = (): ActionItem[] => {
    if (!sessions) return [];

    const items: ActionItem[] = [];
    
    sessions.forEach(session => {
      // Extract from session notes
      if (session.notes) {
        const noteLines = session.notes.split('\n').filter(line => 
          line.toLowerCase().includes('action') || 
          line.toLowerCase().includes('todo') ||
          line.toLowerCase().includes('follow up')
        );
        
        noteLines.forEach((line, index) => {
          if (line.trim()) {
            items.push({
              id: `${session.id}-notes-${index}`,
              title: line.trim(),
              priority: 'medium',
              status: 'pending',
              sessionTitle: session.title,
              sessionDate: session.scheduled_at
            });
          }
        });
      }

      // Extract from AI summary
      if (session.ai_summary) {
        const summaryLines = session.ai_summary.split('\n').filter(line => 
          line.toLowerCase().includes('action') || 
          line.toLowerCase().includes('next steps') ||
          line.toLowerCase().includes('follow up')
        );
        
        summaryLines.forEach((line, index) => {
          if (line.trim()) {
            items.push({
              id: `${session.id}-summary-${index}`,
              title: line.trim(),
              priority: 'medium',
              status: 'pending',
              sessionTitle: session.title,
              sessionDate: session.scheduled_at
            });
          }
        });
      }

      // Extract from feedback text
      if (session.founder_feedback_text || session.advisor_feedback_text) {
        const feedbackText = `${session.founder_feedback_text || ''} ${session.advisor_feedback_text || ''}`;
        const feedbackLines = feedbackText.split('\n').filter(line => 
          line.toLowerCase().includes('action') || 
          line.toLowerCase().includes('commit') ||
          line.toLowerCase().includes('will do')
        );
        
        feedbackLines.forEach((line, index) => {
          if (line.trim()) {
            items.push({
              id: `${session.id}-feedback-${index}`,
              title: line.trim(),
              priority: 'medium',
              status: 'pending',
              sessionTitle: session.title,
              sessionDate: session.scheduled_at
            });
          }
        });
      }
    });

    return items;
  };

  const actionItems = extractActionItems();
  
  const pendingItems = actionItems.filter(item => item.status === 'pending');
  const inProgressItems = actionItems.filter(item => item.status === 'in_progress');
  const completedItems = actionItems.filter(item => item.status === 'completed');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <CheckSquare className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const toggleItemStatus = (itemId: string) => {
    // In a real implementation, this would update the database
    console.log('Toggle status for item:', itemId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Action Item Tracker</h2>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-200 rounded-full"></div>
            {pendingItems.length} Pending
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-200 rounded-full"></div>
            {inProgressItems.length} In Progress
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-200 rounded-full"></div>
            {completedItems.length} Completed
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Action Items</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{actionItems.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {actionItems.length > 0 ? Math.round((completedItems.length / actionItems.length) * 100) : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {actionItems.filter(item => item.priority === 'high').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Action Items */}
      {pendingItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-4 border rounded-lg">
                  <Checkbox
                    checked={false}
                    onCheckedChange={() => toggleItemStatus(item.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{item.title}</h4>
                      <Badge className={getPriorityColor(item.priority)}>
                        <div className="flex items-center gap-1">
                          {getPriorityIcon(item.priority)}
                          {item.priority}
                        </div>
                      </Badge>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    )}
                    <div className="text-xs text-gray-500">
                      From session: {item.sessionTitle} • {new Date(item.sessionDate).toLocaleDateString()}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Mark as In Progress
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* In Progress Items */}
      {inProgressItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inProgressItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-4 border rounded-lg bg-yellow-50">
                  <Checkbox
                    checked={false}
                    onCheckedChange={() => toggleItemStatus(item.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{item.title}</h4>
                      <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      From session: {item.sessionTitle} • {new Date(item.sessionDate).toLocaleDateString()}
                    </div>
                  </div>
                  <Button size="sm">
                    Mark Complete
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {actionItems.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Action Items Yet</h3>
            <p className="text-gray-600">
              Action items from your sessions will appear here to help you track your commitments.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ActionItemTracker;
