
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Bell, Mail, MessageSquare, Smartphone, 
  Clock, Settings, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { useAutomatedReminders } from '@/hooks/useSmartScheduling';

const AutomatedReminderSystem = () => {
  const [reminderSettings, setReminderSettings] = useState({
    email: { enabled: true, timing: [24, 2] }, // hours before session
    sms: { enabled: false, timing: [1] },
    push: { enabled: true, timing: [24, 1] }
  });

  const [customTiming, setCustomTiming] = useState('');
  const scheduleReminder = useAutomatedReminders();

  const reminderChannels = [
    {
      id: 'email',
      name: 'Email Reminders',
      icon: Mail,
      description: 'Send email notifications to participants',
      color: 'text-blue-600',
      enabled: reminderSettings.email.enabled
    },
    {
      id: 'sms',
      name: 'SMS Reminders',
      icon: MessageSquare,
      description: 'Send text message reminders',
      color: 'text-green-600',
      enabled: reminderSettings.sms.enabled
    },
    {
      id: 'push',
      name: 'Push Notifications',
      icon: Smartphone,
      description: 'In-app push notifications',
      color: 'text-purple-600',
      enabled: reminderSettings.push.enabled
    }
  ];

  const upcomingSessions = [
    {
      id: '1',
      title: 'Strategic Planning Session',
      participant: 'John Doe',
      date: '2024-01-15T14:00:00Z',
      reminders: [
        { type: 'email', scheduled: '2024-01-14T14:00:00Z', status: 'scheduled' },
        { type: 'push', scheduled: '2024-01-15T13:00:00Z', status: 'scheduled' }
      ]
    },
    {
      id: '2',
      title: 'Product Review Meeting',
      participant: 'Jane Smith',
      date: '2024-01-16T10:00:00Z',
      reminders: [
        { type: 'email', scheduled: '2024-01-15T10:00:00Z', status: 'sent' },
        { type: 'sms', scheduled: '2024-01-16T09:00:00Z', status: 'scheduled' }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return CheckCircle;
      case 'scheduled': return Clock;
      case 'failed': return AlertTriangle;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Automated Reminder System
        </h2>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Global Settings
        </Button>
      </div>

      {/* Reminder Channel Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Reminder Channels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {reminderChannels.map((channel) => {
              const Icon = channel.icon;
              return (
                <div key={channel.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <Icon className={`w-5 h-5 ${channel.color} mt-1`} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{channel.name}</h4>
                        <p className="text-sm text-muted-foreground">{channel.description}</p>
                      </div>
                      <Switch 
                        checked={channel.enabled}
                        onCheckedChange={(checked) => {
                          setReminderSettings(prev => ({
                            ...prev,
                            [channel.id]: { ...prev[channel.id as keyof typeof prev], enabled: checked }
                          }));
                        }}
                      />
                    </div>
                    
                    {channel.enabled && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <Label className="text-sm">Reminder Timing (hours before session)</Label>
                          <div className="flex gap-2 mt-1">
                            {reminderSettings[channel.id as keyof typeof reminderSettings].timing.map((time, index) => (
                              <Badge key={index} variant="outline">
                                {time}h before
                              </Badge>
                            ))}
                            <Input 
                              placeholder="Add custom timing"
                              className="w-32 h-6 text-xs"
                              value={customTiming}
                              onChange={(e) => setCustomTiming(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Sessions & Reminders */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Sessions & Reminder Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{session.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      with {session.participant} • {new Date(session.date).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Scheduled Reminders:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {session.reminders.map((reminder, index) => {
                      const StatusIcon = getStatusIcon(reminder.status);
                      return (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <StatusIcon className="w-4 h-4" />
                          <span className="capitalize">{reminder.type}</span>
                          <Badge className={getStatusColor(reminder.status)}>
                            {reminder.status}
                          </Badge>
                          <span className="text-muted-foreground">
                            {new Date(reminder.scheduled).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reminder Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Delivered Today</p>
                <p className="text-xl font-bold">24</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-xl font-bold">2</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-xl font-bold">94%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AutomatedReminderSystem;
