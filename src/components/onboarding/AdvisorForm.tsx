
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle } from "lucide-react";

interface AdvisorFormProps {
  onBack: () => void;
}

const AdvisorForm = ({ onBack }: AdvisorFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    linkedin: "",
    email: "",
    expertise: [],
    experience: "",
    timezone: "",
    challengeType: "",
    availability: "",
    publicProfile: ""
  });

  const [submitted, setSubmitted] = useState(false);

  const expertiseOptions = [
    "Marketing", "Product", "Pricing", "Growth", "Operations", 
    "Finance", "Strategy", "Fundraising", "Sales", "Technology"
  ];

  const handleExpertiseChange = (expertise: string) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.includes(expertise)
        ? prev.expertise.filter(e => e !== expertise)
        : [...prev.expertise, expertise]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Advisor application submitted:", formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center px-4">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Advisor Application</h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">Apply as Diaspora Advisor</CardTitle>
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
                      LinkedIn Profile *
                    </label>
                    <Input
                      required
                      value={formData.linkedin}
                      onChange={(e) => setFormData({...formData, linkedin: e.target.value})}
                      placeholder="https://linkedin.com/in/..."
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
              </div>

              {/* Expertise */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area(s) of Expertise * (Select all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {expertiseOptions.map((option) => (
                    <label key={option} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.expertise.includes(option)}
                        onChange={() => handleExpertiseChange(option)}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level *
                </label>
                <Textarea
                  required
                  value={formData.experience}
                  onChange={(e) => setFormData({...formData, experience: e.target.value})}
                  placeholder="Describe your years of experience, role types, and types of founders you've helped"
                  rows={4}
                />
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone + Availability Window *
                </label>
                <Input
                  required
                  value={formData.timezone}
                  onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                  placeholder="e.g., EST, prefer weekday evenings"
                />
              </div>

              {/* Challenge Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What kind of founder challenge do you most enjoy solving? *
                </label>
                <Textarea
                  required
                  value={formData.challengeType}
                  onChange={(e) => setFormData({...formData, challengeType: e.target.value})}
                  placeholder="Describe the types of problems or challenges you're most passionate about helping founders solve"
                  rows={4}
                />
              </div>

              {/* Matching Availability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Are you open to being matched for 1–2 advisory sessions? *
                </label>
                <select
                  required
                  value={formData.availability}
                  onChange={(e) => setFormData({...formData, availability: e.target.value})}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select availability</option>
                  <option value="yes">Yes, I can commit to 1-2 sessions</option>
                  <option value="no">No, I cannot commit at this time</option>
                </select>
              </div>

              {/* Public Profile */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Are you okay being named in a final public pilot deck? *
                </label>
                <select
                  required
                  value={formData.publicProfile}
                  onChange={(e) => setFormData({...formData, publicProfile: e.target.value})}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select preference</option>
                  <option value="yes">Yes, I'm comfortable being featured publicly</option>
                  <option value="no">No, I prefer to remain anonymous</option>
                </select>
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                Submit Advisor Application
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvisorForm;
