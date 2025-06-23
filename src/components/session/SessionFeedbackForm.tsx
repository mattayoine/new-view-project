
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Send } from 'lucide-react';
import { useSubmitSessionFeedback } from '@/hooks/useSessionFeedback';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';

interface SessionFeedbackFormProps {
  sessionId: string;
  onSuccess?: () => void;
}

const SessionFeedbackForm: React.FC<SessionFeedbackFormProps> = ({ sessionId, onSuccess }) => {
  const [ratings, setRatings] = useState({
    overall: 0,
    preparation: 0,
    communication: 0,
    value: 0
  });
  const [feedback, setFeedback] = useState({
    wentWell: '',
    couldImprove: '',
    additionalComments: '',
    wouldRecommend: false,
    isAnonymous: false
  });
  const [actionItems, setActionItems] = useState<string[]>(['']);

  const submitFeedback = useSubmitSessionFeedback();

  const setRating = (category: keyof typeof ratings, rating: number) => {
    setRatings(prev => ({ ...prev, [category]: rating }));
  };

  const addActionItem = () => {
    setActionItems(prev => [...prev, '']);
  };

  const updateActionItem = (index: number, value: string) => {
    setActionItems(prev => prev.map((item, i) => i === index ? value : item));
  };

  const removeActionItem = (index: number) => {
    setActionItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (ratings.overall === 0) {
      toast.error('Please provide an overall rating');
      return;
    }

    try {
      await submitFeedback.mutateAsync({
        session_id: sessionId,
        feedback_by: '', // Will be set by the API
        overall_rating: ratings.overall,
        preparation_rating: ratings.preparation,
        communication_rating: ratings.communication,
        value_rating: ratings.value,
        what_went_well: feedback.wentWell || undefined,
        what_could_improve: feedback.couldImprove || undefined,
        additional_comments: feedback.additionalComments || undefined,
        action_items: actionItems.filter(item => item.trim() !== ''),
        would_recommend: feedback.wouldRecommend,
        is_anonymous: feedback.isAnonymous
      });

      onSuccess?.();
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  const RatingStars = ({ 
    category, 
    value, 
    onChange 
  }: { 
    category: string; 
    value: number; 
    onChange: (rating: number) => void; 
  }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="hover:scale-110 transition-transform"
        >
          <Star
            className={`w-5 h-5 ${
              star <= value 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-muted-foreground">
        {value > 0 ? `${value}/5` : 'Not rated'}
      </span>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Session Feedback
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ratings */}
          <div className="space-y-4">
            <h3 className="font-medium">Rate this session</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="overall">Overall Experience *</Label>
                <RatingStars
                  category="overall"
                  value={ratings.overall}
                  onChange={(rating) => setRating('overall', rating)}
                />
              </div>

              <div>
                <Label htmlFor="preparation">Preparation</Label>
                <RatingStars
                  category="preparation"
                  value={ratings.preparation}
                  onChange={(rating) => setRating('preparation', rating)}
                />
              </div>

              <div>
                <Label htmlFor="communication">Communication</Label>
                <RatingStars
                  category="communication"
                  value={ratings.communication}
                  onChange={(rating) => setRating('communication', rating)}
                />
              </div>

              <div>
                <Label htmlFor="value">Value Provided</Label>
                <RatingStars
                  category="value"
                  value={ratings.value}
                  onChange={(rating) => setRating('value', rating)}
                />
              </div>
            </div>
          </div>

          {/* Feedback Text */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="wentWell">What went well?</Label>
              <Textarea
                id="wentWell"
                value={feedback.wentWell}
                onChange={(e) => setFeedback(prev => ({ ...prev, wentWell: e.target.value }))}
                placeholder="Share what you found valuable about this session..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="couldImprove">What could be improved?</Label>
              <Textarea
                id="couldImprove"
                value={feedback.couldImprove}
                onChange={(e) => setFeedback(prev => ({ ...prev, couldImprove: e.target.value }))}
                placeholder="Share suggestions for improvement..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="additionalComments">Additional Comments</Label>
              <Textarea
                id="additionalComments"
                value={feedback.additionalComments}
                onChange={(e) => setFeedback(prev => ({ ...prev, additionalComments: e.target.value }))}
                placeholder="Any other feedback you'd like to share..."
                rows={3}
              />
            </div>
          </div>

          {/* Action Items */}
          <div className="space-y-4">
            <Label>Action Items (Optional)</Label>
            {actionItems.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateActionItem(index, e.target.value)}
                  placeholder="Enter an action item..."
                  className="flex-1"
                />
                {actionItems.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeActionItem(index)}
                    size="sm"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addActionItem}
              size="sm"
            >
              Add Action Item
            </Button>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recommend"
                checked={feedback.wouldRecommend}
                onCheckedChange={(checked) => 
                  setFeedback(prev => ({ ...prev, wouldRecommend: !!checked }))
                }
              />
              <Label htmlFor="recommend">I would recommend this advisor to others</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous"
                checked={feedback.isAnonymous}
                onCheckedChange={(checked) => 
                  setFeedback(prev => ({ ...prev, isAnonymous: !!checked }))
                }
              />
              <Label htmlFor="anonymous">Submit feedback anonymously</Label>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={submitFeedback.isPending || ratings.overall === 0}
          >
            {submitFeedback.isPending ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {submitFeedback.isPending ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SessionFeedbackForm;
