
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import { useCreateSessionProposal } from '@/hooks/useSessionManagement';

interface SessionProposalFormProps {
  assignmentId: string;
  onSuccess?: () => void;
}

const SessionProposalForm: React.FC<SessionProposalFormProps> = ({ assignmentId, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [proposedTimes, setProposedTimes] = useState<string[]>(['']);
  
  const createProposal = useCreateSessionProposal();

  const addTimeSlot = () => {
    setProposedTimes([...proposedTimes, '']);
  };

  const removeTimeSlot = (index: number) => {
    const newTimes = proposedTimes.filter((_, i) => i !== index);
    setProposedTimes(newTimes);
  };

  const updateTimeSlot = (index: number, value: string) => {
    const newTimes = [...proposedTimes];
    newTimes[index] = value;
    setProposedTimes(newTimes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validTimes = proposedTimes.filter(time => time.trim() !== '');
    if (validTimes.length === 0) {
      return;
    }

    await createProposal.mutateAsync({
      assignment_id: assignmentId,
      title,
      description,
      proposed_times: validTimes.map(time => ({ datetime: time })),
      proposed_by: '' // Will be set by the API
    });

    setTitle('');
    setDescription('');
    setProposedTimes(['']);
    onSuccess?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Propose New Session
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Session Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Product Strategy Discussion"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What would you like to discuss in this session?"
              rows={3}
            />
          </div>

          <div>
            <Label>Proposed Times</Label>
            <div className="space-y-2">
              {proposedTimes.map((time, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="datetime-local"
                    value={time}
                    onChange={(e) => updateTimeSlot(index, e.target.value)}
                    className="flex-1"
                  />
                  {proposedTimes.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeTimeSlot(index)}
                    >
                      <Trash2 className="w-4 h-4" />
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
                <Plus className="w-4 h-4 mr-2" />
                Add Another Time Option
              </Button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={createProposal.isPending || !title.trim()}
          >
            <Clock className="w-4 h-4 mr-2" />
            {createProposal.isPending ? 'Creating...' : 'Create Proposal'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SessionProposalForm;
