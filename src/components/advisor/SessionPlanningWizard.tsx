
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Wand2, Plus, Trash2, Clock, Target, 
  FileText, Lightbulb, CheckCircle, Calendar 
} from 'lucide-react';
import { useSessionPlanningWizard } from '@/hooks/useAdvisorSessionHub';
import { toast } from 'sonner';

interface SessionPlanningWizardProps {
  founderId?: string;
  founderName?: string;
  onSessionCreated?: (sessionData: any) => void;
}

const SessionPlanningWizard: React.FC<SessionPlanningWizardProps> = ({
  founderId,
  founderName,
  onSessionCreated
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [sessionData, setSessionData] = useState({
    title: '',
    type: 'regular',
    duration: 60,
    objectives: [''],
    agenda: [''],
    preparationNotes: '',
    resources: [''],
    followUpActions: ['']
  });

  const { generateAgenda, getSessionTemplates } = useSessionPlanningWizard();

  const sessionTypes = [
    { value: 'onboarding', label: 'Onboarding Session' },
    { value: 'regular', label: 'Regular Check-in' },
    { value: 'goal_review', label: 'Goal Review' },
    { value: 'milestone', label: 'Milestone Review' },
    { value: 'problem_solving', label: 'Problem Solving' },
    { value: 'strategic', label: 'Strategic Planning' }
  ];

  const handleGenerateAgenda = async () => {
    try {
      const agenda = await generateAgenda(sessionData.type, sessionData.objectives, '');
      setSessionData(prev => ({ ...prev, agenda }));
      toast.success('Agenda generated successfully');
    } catch (error) {
      toast.error('Failed to generate agenda');
    }
  };

  const addArrayItem = (field: string) => {
    setSessionData(prev => ({
      ...prev,
      [field]: [...prev[field as keyof typeof prev] as string[], '']
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setSessionData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field: string, index: number, value: string) => {
    setSessionData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).map((item, i) => 
        i === index ? value : item
      )
    }));
  };

  const handleCreateSession = () => {
    onSessionCreated?.(sessionData);
    setIsOpen(false);
    setCurrentStep(1);
    setSessionData({
      title: '',
      type: 'regular',
      duration: 60,
      objectives: [''],
      agenda: [''],
      preparationNotes: '',
      resources: [''],
      followUpActions: ['']
    });
    toast.success('Session plan created successfully');
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Session Title</Label>
        <Input
          id="title"
          value={sessionData.title}
          onChange={(e) => setSessionData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter session title"
        />
      </div>

      <div>
        <Label htmlFor="type">Session Type</Label>
        <Select value={sessionData.type} onValueChange={(value) => setSessionData(prev => ({ ...prev, type: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sessionTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="duration">Duration (minutes)</Label>
        <Select 
          value={sessionData.duration.toString()} 
          onValueChange={(value) => setSessionData(prev => ({ ...prev, duration: parseInt(value) }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 minutes</SelectItem>
            <SelectItem value="45">45 minutes</SelectItem>
            <SelectItem value="60">60 minutes</SelectItem>
            <SelectItem value="90">90 minutes</SelectItem>
            <SelectItem value="120">120 minutes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {founderName && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Founder:</strong> {founderName}
          </p>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Session Objectives</Label>
          <Button size="sm" variant="outline" onClick={() => addArrayItem('objectives')}>
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {sessionData.objectives.map((objective, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={objective}
                onChange={(e) => updateArrayItem('objectives', index, e.target.value)}
                placeholder="Enter objective"
              />
              {sessionData.objectives.length > 1 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => removeArrayItem('objectives', index)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Session Agenda</Label>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleGenerateAgenda}>
              <Wand2 className="w-3 h-3 mr-1" />
              Generate
            </Button>
            <Button size="sm" variant="outline" onClick={() => addArrayItem('agenda')}>
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {sessionData.agenda.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => updateArrayItem('agenda', index, e.target.value)}
                placeholder="Enter agenda item"
              />
              {sessionData.agenda.length > 1 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => removeArrayItem('agenda', index)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="preparationNotes">Preparation Notes</Label>
        <Textarea
          id="preparationNotes"
          value={sessionData.preparationNotes}
          onChange={(e) => setSessionData(prev => ({ ...prev, preparationNotes: e.target.value }))}
          placeholder="Notes for session preparation..."
          rows={4}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Recommended Resources</Label>
          <Button size="sm" variant="outline" onClick={() => addArrayItem('resources')}>
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {sessionData.resources.map((resource, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={resource}
                onChange={(e) => updateArrayItem('resources', index, e.target.value)}
                placeholder="Resource title or URL"
              />
              {sessionData.resources.length > 1 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => removeArrayItem('resources', index)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Planned Follow-up Actions</Label>
          <Button size="sm" variant="outline" onClick={() => addArrayItem('followUpActions')}>
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {sessionData.followUpActions.map((action, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={action}
                onChange={(e) => updateArrayItem('followUpActions', index, e.target.value)}
                placeholder="Follow-up action"
              />
              {sessionData.followUpActions.length > 1 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => removeArrayItem('followUpActions', index)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const steps = [
    { title: 'Basic Info', icon: FileText },
    { title: 'Objectives & Agenda', icon: Target },
    { title: 'Resources & Follow-up', icon: Lightbulb }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Wand2 className="w-4 h-4" />
          Session Planning Wizard
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Session Planning Wizard
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === index + 1;
            const isCompleted = currentStep > index + 1;
            
            return (
              <div key={index} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  isCompleted ? 'bg-green-500 text-white' : 
                  isActive ? 'bg-blue-500 text-white' : 
                  'bg-gray-200 text-gray-500'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <StepIcon className="w-4 h-4" />
                  )}
                </div>
                <span className={`ml-2 text-sm ${isActive ? 'font-medium' : 'text-gray-500'}`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className="w-8 h-px bg-gray-300 mx-4" />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            {currentStep < 3 ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!sessionData.title || !sessionData.type}
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleCreateSession}>
                <Calendar className="w-4 h-4 mr-2" />
                Create Session Plan
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionPlanningWizard;
