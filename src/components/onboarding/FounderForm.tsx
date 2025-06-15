
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle } from "lucide-react";

interface FounderFormProps {
  onBack: () => void;
}

const FounderForm = ({ onBack }: FounderFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    startupName: "",
    website: "",
    stage: "",
    challenge: "",
    winDefinition: "",
    caseStudy: false,
    availability: "",
    videoLink: ""
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Founder application submitted:", formData);
    setSubmitted(true);
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
            <CardTitle className="text-2xl text-blue-600">Apply as African Founder</CardTitle>
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
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Startup Name *
                    </label>
                    <Input
                      required
                      value={formData.startupName}
                      onChange={(e) => setFormData({...formData, startupName: e.target.value})}
                      placeholder="Your startup name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website or Pitch Deck
                    </label>
                    <Input
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              {/* Startup Stage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Startup Stage *
                </label>
                <Textarea
                  required
                  value={formData.stage}
                  onChange={(e) => setFormData({...formData, stage: e.target.value})}
                  placeholder="Describe your current stage (e.g., MVP launched, first customers, generating revenue, etc.)"
                  rows={3}
                />
              </div>

              {/* Challenge */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's your biggest challenge right now? *
                </label>
                <Textarea
                  required
                  value={formData.challenge}
                  onChange={(e) => setFormData({...formData, challenge: e.target.value})}
                  placeholder="Describe the specific challenge you need help with"
                  rows={4}
                />
              </div>

              {/* Win Definition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What would a "win" from this look like? *
                </label>
                <Textarea
                  required
                  value={formData.winDefinition}
                  onChange={(e) => setFormData({...formData, winDefinition: e.target.value})}
                  placeholder="What specific outcomes are you hoping to achieve?"
                  rows={4}
                />
              </div>

              {/* Case Study */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.caseStudy}
                    onChange={(e) => setFormData({...formData, caseStudy: e.target.checked})}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    I'm open to being featured in a case study
                  </span>
                </label>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Are you available for 3 sessions over 6 weeks? *
                </label>
                <select
                  required
                  value={formData.availability}
                  onChange={(e) => setFormData({...formData, availability: e.target.value})}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select availability</option>
                  <option value="yes">Yes, I can commit to 3 sessions</option>
                  <option value="no">No, I cannot commit to this schedule</option>
                </select>
              </div>

              {/* Video Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intro Video (Optional)
                </label>
                <Input
                  value={formData.videoLink}
                  onChange={(e) => setFormData({...formData, videoLink: e.target.value})}
                  placeholder="Loom/Drive link to a brief intro video"
                />
                <p className="text-xs text-gray-500 mt-1">
                  A short video introducing yourself and your startup (recommended but not required)
                </p>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Submit Founder Application
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FounderForm;
