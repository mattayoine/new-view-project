
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Target, CheckSquare, Users, MessageSquare } from 'lucide-react';
import FounderSessionCenter from '@/components/founder/FounderSessionCenter';
import SessionRequestSystem from '@/components/founder/SessionRequestSystem';
import ActionItemTracker from '@/components/founder/ActionItemTracker';
import AdvisorRelationshipManager from '@/components/founder/AdvisorRelationshipManager';
import { Button } from '@/components/ui/button';

const FounderSessionHub = () => {
  const [activeTab, setActiveTab] = useState('sessions');

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Session Hub</h1>
          <p className="text-gray-600 mt-1">Manage your mentoring journey</p>
        </div>
        <Button className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Contact Support
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            My Sessions
          </TabsTrigger>
          <TabsTrigger value="request" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Request Session
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Action Items
          </TabsTrigger>
          <TabsTrigger value="relationship" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Advisor Relationship
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-6">
          <FounderSessionCenter />
        </TabsContent>

        <TabsContent value="request" className="space-y-6">
          <SessionRequestSystem />
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <ActionItemTracker />
        </TabsContent>

        <TabsContent value="relationship" className="space-y-6">
          <AdvisorRelationshipManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FounderSessionHub;
