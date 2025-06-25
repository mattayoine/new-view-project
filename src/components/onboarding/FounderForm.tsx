
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useFounderApplicationSubmission } from "@/hooks/useApplicationSubmission";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FounderFormProps {
  onBack: () => void;
}

const FounderForm = ({ onBack }: FounderFormProps) => {
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

  const [submitted, setSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const submitApplication = useFounderApplicationSubmission();

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) errors.push("Name is required");
    if (!formData.email.trim()) errors.push("Email is required");
    if (!formData.location.trim()) errors.push("Location is required");
    if (!formData.startup_name.trim()) errors.push("Startup name is required");
    if (!formData.sector.trim()) errors.push("Sector is required");
    if (!formData.stage.trim()) errors.push("Stage is required");
    if (!formData.challenge.trim()) errors.push("Current challenge is required");
    if (!formData.win_definition.trim()) errors.push("Win definition is required");
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push("Please enter a valid email address");
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started with data:', formData);
    
    // Clear previous validation errors
    setValidationErrors([]);
    
    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      console.error('Form validation failed:', errors);
      setValidationErrors(errors);
      return;
    }
    
    try {
      console.log('Attempting to submit application...');
      await submitApplication.mutateAsync({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        location: formData.location.trim(),
        startup_name: formData.startup_name.trim(),
        website: formData.website.trim() || undefined,
        sector: formData.sector.trim(),
        stage: formData.stage.trim(),
        challenge: formData.challenge.trim(),
        win_definition: formData.win_definition.trim(),
        video_link: formData.video_link.trim() || undefined,
        case_study_consent: formData.case_study_consent
      });
      
      console.log('Application submitted successfully');
      setSubmitted(true);
    } catch (error: any) {
      console.error('Form submission error:', error);
      setValidationErrors([error.message || 'An error occurred while submitting your application']);
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
            {validationErrors.length > 0 && (
              <Alert className="mb-6" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {validationErrors.map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

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
                disabled={submitApplication.isPending}
              >
                {submitApplication.isPending ? 'Submitting...' : 'Submit Founder Application'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FounderForm;
