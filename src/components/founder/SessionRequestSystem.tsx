
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Target, MessageSquare } from 'lucide-react';
import { useCreateSessionProposal } from '@/hooks/useSessionManagement';
import { useFounderData } from '@/hooks/useFounderData';

const SessionRequestSystem = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [preferredTimes, setPreferredTimes] = useState<string[]>(['']);
  
  const { data: founderData } = useFounderData();
  const createProposal = useCreateSessionProposal();
  
  const activeAssignment = founderData?.assignments?.[0];

  const sessionTypes = [
    { value: 'strategy', label: 'Strategic Planning', icon: Target },
    { value: 'product', label: 'Product Development', icon: Target },
    { value: 'marketing', label: 'Marketing & Growth', icon: Target },
    { value: 'fundraising', label: 'Fundraising Prep', icon: Target },
    { value: 'operations', label: 'Operations & Scaling', icon: Target },
    { value: 'mentorship', label: 'General Mentorship', icon: MessageSquare },
    { value: 'emergency', label: 'Urgent Issue', icon: Clock }
  ];

  const addTimeSlot = () => {
    setPreferredTimes([...preferredTimes, '']);
  };

  const updateTimeSlot = (index: number, value: string) => {
    const newTimes = [...preferredTimes];
    newTimes[index] = value;
    setPreferredTimes(newTimes);
  };

  const removeTimeSlot = (index: number) => {
    if (preferredTimes.length > 1) {
      const newTimes = preferredTimes.filter((_, i) => i !== index);
      setPreferredTimes(newTimes);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeAssignment || !title.trim()) {
      return;
    }

    const validTimes = preferredTimes.filter(time => time.trim() !== '');
    
    await createProposal.mutateAsync({
      assignment_id: activeAssignment.id,
      title,
      description,
      proposed_times: validTimes.map(time => ({ datetime: time })),
      proposed_by: activeAssignment.founder_id
    });

    // Reset form
    setTitle('');
    setDescription('');
    setSessionType('');
    setUrgency('normal');
    setPreferredTimes(['']);
  };

  if (!activeAssignment) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Active Assignment</h3>
          <p className="text-gray-600">
            You need to be matched with an advisor before you can request sessions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Request a Session
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="session-type">Session Type</Label>
            <Select value={sessionType} onValueChange={setSessionType}>
              <SelectTrigger>
                <SelectValue placeholder="Select session type" />
              </SelectTrigger>
              <SelectContent>
                {sessionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Session Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Product Strategy Review"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">What would you like to focus on?</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the specific challenges or topics you'd like to discuss..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="urgency">Urgency Level</Label>
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Within 2 weeks</SelectItem>
                <SelectItem value="normal">Normal - Within 1 week</SelectItem>
                <SelectItem value="high">High - Within 3 days</SelectItem>
                <SelectItem value="urgent">Urgent - ASAP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Preferred Times</Label>
            <div className="space-y-2">
              {preferredTimes.map((time, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="datetime-local"
                    value={time}
                    onChange={(e) => updateTimeSlot(index, e.target.value)}
                    className="flex-1"
                  />
                  {preferredTimes.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeTimeSlot(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addTimeSlot}
                className="w-full"
              >
                Add Another Time Option
              </Button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={createProposal.isPending || !title.trim()}
          >
            {createProposal.isPending ? 'Submitting...' : 'Request Session'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SessionRequestSystem;
