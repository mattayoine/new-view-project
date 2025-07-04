
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Plus, Trash2 } from 'lucide-react';
import { useSubmitSessionFeedback } from '@/hooks/useEnhancedSessionFeedback';

interface SessionFeedbackFormProps {
  sessionId: string;
  onComplete?: () => void;
}

const SessionFeedbackForm: React.FC<SessionFeedbackFormProps> = ({ sessionId, onComplete }) => {
  const [formData, setFormData] = useState({
    overallRating: 0,
    preparationRating: 0,
    communicationRating: 0,
    valueRating: 0,
    whatWentWell: '',
    whatCouldImprove: '',
    actionItems: [''],
    additionalComments: '',
    wouldRecommend: false,
    isAnonymous: false
  });

  const submitFeedback = useSubmitSessionFeedback();

  const StarRating = ({ value, onChange, label }: { 
    value: number; 
    onChange: (rating: number) => void; 
    label: string; 
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1"
          >
            <Star
              className={`w-5 h-5 ${
                star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const addActionItem = () => {
    setFormData(prev => ({
      ...prev,
      actionItems: [...prev.actionItems, '']
    }));
  };

  const updateActionItem = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      actionItems: prev.actionItems.map((item, i) => i === index ? value : item)
    }));
  };

  const removeActionItem = (index: number) => {
    if (formData.actionItems.length > 1) {
      setFormData(prev => ({
        ...prev,
        actionItems: prev.actionItems.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.overallRating === 0) {
      return;
    }

    const validActionItems = formData.actionItems.filter(item => item.trim() !== '');

    await submitFeedback.mutateAsync({
      sessionId,
      ...formData,
      actionItems: validActionItems
    });

    onComplete?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StarRating
              value={formData.overallRating}
              onChange={(rating) => setFormData(prev => ({ ...prev, overallRating: rating }))}
              label="Overall Session Rating *"
            />
            <StarRating
              value={formData.preparationRating}
              onChange={(rating) => setFormData(prev => ({ ...prev, preparationRating: rating }))}
              label="Preparation Quality"
            />
            <StarRating
              value={formData.communicationRating}
              onChange={(rating) => setFormData(prev => ({ ...prev, communicationRating: rating }))}
              label="Communication Effectiveness"
            />
            <StarRating
              value={formData.valueRating}
              onChange={(rating) => setFormData(prev => ({ ...prev, valueRating: rating }))}
              label="Value Provided"
            />
          </div>

          <div>
            <Label htmlFor="what-went-well">What went well in this session?</Label>
            <Textarea
              id="what-went-well"
              value={formData.whatWentWell}
              onChange={(e) => setFormData(prev => ({ ...prev, whatWentWell: e.target.value }))}
              placeholder="Share what you found most valuable..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="what-could-improve">What could be improved?</Label>
            <Textarea
              id="what-could-improve"
              value={formData.whatCouldImprove}
              onChange={(e) => setFormData(prev => ({ ...prev, whatCouldImprove: e.target.value }))}
              placeholder="Suggestions for future sessions..."
              rows={3}
            />
          </div>

          <div>
            <Label>Action Items</Label>
            <div className="space-y-2">
              {formData.actionItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateActionItem(index, e.target.value)}
                    placeholder="Action item or next step..."
                    className="flex-1"
                  />
                  {formData.actionItems.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeActionItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addActionItem}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Action Item
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="additional-comments">Additional Comments</Label>
            <Textarea
              id="additional-comments"
              value={formData.additionalComments}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalComments: e.target.value }))}
              placeholder="Any other feedback or suggestions..."
              rows={2}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="would-recommend"
                checked={formData.wouldRecommend}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, wouldRecommend: checked as boolean }))
                }
              />
              <Label htmlFor="would-recommend">
                I would recommend this advisor to other founders
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-anonymous"
                checked={formData.isAnonymous}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, isAnonymous: checked as boolean }))
                }
              />
              <Label htmlFor="is-anonymous">
                Submit feedback anonymously
              </Label>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={submitFeedback.isPending || formData.overallRating === 0}
          >
            {submitFeedback.isPending ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SessionFeedbackForm;
