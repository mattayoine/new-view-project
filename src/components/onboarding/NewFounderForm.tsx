
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { anonymousSupabase } from "@/integrations/supabase/anonymousClient";
import { toast } from "sonner";

interface NewFounderFormProps {
  onBack: () => void;
}

const NewFounderForm = ({ onBack }: NewFounderFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    location: "",
    startup_name: "",
    website: "",
    sector: "",
    stage: "",
    challenge: "",
    win_definition: "",
    video_link: "",
    case_study_consent: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Starting founder application submission...');

      // Step 1: Insert into base_applications table
      const { data: baseApplication, error: baseError } = await anonymousSupabase
        .from('base_applications')
        .insert({
          name: formData.name,
          email: formData.email,
          location: formData.location,
          type: 'founder',
          status: 'pending'
        })
        .select()
        .single();

      if (baseError) {
        console.error('Base application error:', baseError);
        throw new Error(`Failed to create application: ${baseError.message}`);
      }

      console.log('Base application created:', baseApplication);

      // Step 2: Insert into founder_application_details table
      const { error: detailsError } = await anonymousSupabase
        .from('founder_application_details')
        .insert({
          application_id: baseApplication.id,
          startup_name: formData.startup_name,
          website: formData.website || null,
          sector: formData.sector,
          stage: formData.stage,
          challenge: formData.challenge,
          win_definition: formData.win_definition,
          video_link: formData.video_link || null,
          case_study_consent: formData.case_study_consent
        });

      if (detailsError) {
        console.error('Founder details error:', detailsError);
        throw new Error(`Failed to save application details: ${detailsError.message}`);
      }

      console.log('Founder application submitted successfully');
      toast.success('Application submitted successfully! We\'ll review it and get back to you soon.');
      setSubmitted(true);

    } catch (error: any) {
      console.error('Application submission failed:', error);
      toast.error(`Failed to submit application: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your application. We'll review your submission and get back to you within 5-7 business days with next steps.
            </p>
            <Button onClick={onBack} variant="outline">
              Submit Another Application
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Founder Application</h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-blue-600">Apply as Founder</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <Input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <Input
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              {/* Startup Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Startup Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Startup Name *
                    </label>
                    <Input
                      required
                      value={formData.startup_name}
                      onChange={(e) => setFormData({...formData, startup_name: e.target.value})}
                      placeholder="Your startup name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <Input
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sector *
                    </label>
                    <Input
                      required
                      value={formData.sector}
                      onChange={(e) => setFormData({...formData, sector: e.target.value})}
                      placeholder="e.g., Fintech, Agtech, Healthcare"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stage *
                    </label>
                    <Input
                      required
                      value={formData.stage}
                      onChange={(e) => setFormData({...formData, stage: e.target.value})}
                      placeholder="e.g., MVP launched, Pre-revenue"
                    />
                  </div>
                </div>
              </div>

              {/* Challenge & Goals */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Challenge & Goals</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Challenge *
                  </label>
                  <Textarea
                    required
                    value={formData.challenge}
                    onChange={(e) => setFormData({...formData, challenge: e.target.value})}
                    placeholder="Describe your biggest challenge right now"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Win Definition *
                  </label>
                  <Textarea
                    required
                    value={formData.win_definition}
                    onChange={(e) => setFormData({...formData, win_definition: e.target.value})}
                    placeholder="What would success look like for you?"
                    rows={3}
                  />
                </div>
              </div>

              {/* Optional Video */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Pitch (Optional)
                </label>
                <Input
                  value={formData.video_link}
                  onChange={(e) => setFormData({...formData, video_link: e.target.value})}
                  placeholder="https://youtube.com/... or https://loom.com/..."
                />
              </div>

              {/* Consent */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.case_study_consent}
                    onChange={(e) => setFormData({...formData, case_study_consent: e.target.checked})}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    I consent to being featured in a public case study
                  </span>
                </label>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Founder Application'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewFounderForm;
