
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useAdvisorApplicationSubmission } from "@/hooks/useApplicationSubmission";

const AdvisorApplication = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Base application fields
    name: "",
    email: "",
    location: "",
    
    // Advisor-specific fields
    linkedin: "",
    expertise: [] as string[],
    experience_level: "",
    timezone: "",
    challenge_preference: "",
    public_profile_consent: false
  });

  const [submitted, setSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const submitApplication = useAdvisorApplicationSubmission();

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

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) errors.push("Name is required");
    if (!formData.email.trim()) errors.push("Email is required");
    if (!formData.location.trim()) errors.push("Location is required");
    if (!formData.linkedin.trim()) errors.push("LinkedIn profile is required");
    if (formData.expertise.length === 0) errors.push("At least one area of expertise is required");
    if (!formData.experience_level.trim()) errors.push("Experience level is required");
    if (!formData.timezone.trim()) errors.push("Timezone is required");
    if (!formData.challenge_preference.trim()) errors.push("Challenge preference is required");
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push("Please enter a valid email address");
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationErrors([]);
    
    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    try {
      await submitApplication.mutateAsync({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        location: formData.location.trim(),
        linkedin: formData.linkedin.trim(),
        expertise: formData.expertise,
        experience_level: formData.experience_level.trim(),
        timezone: formData.timezone.trim(),
        challenge_preference: formData.challenge_preference.trim(),
        public_profile_consent: formData.public_profile_consent
      });
      
      setSubmitted(true);
    } catch (error: any) {
      setValidationErrors([error.message || 'An error occurred while submitting your application']);
    }
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
            <div className="space-y-3">
              <Button onClick={() => setSubmitted(false)} variant="outline" className="w-full">
                Submit Another Application
              </Button>
              <Button onClick={() => navigate('/')} className="w-full">
                Return to Home
              </Button>
            </div>
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
          <Link to="/">
            <Button variant="ghost" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Advisor Application</h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">Apply as a Diaspora Advisor</CardTitle>
            <p className="text-gray-600">Share your expertise and help African founders scale their ventures.</p>
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
              {/* Basic Information */}
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
                <div className="grid md:grid-cols-2 gap-4">
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
                  value={formData.experience_level}
                  onChange={(e) => setFormData({...formData, experience_level: e.target.value})}
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

              {/* Challenge Preference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What kind of founder challenge do you most enjoy solving? *
                </label>
                <Textarea
                  required
                  value={formData.challenge_preference}
                  onChange={(e) => setFormData({...formData, challenge_preference: e.target.value})}
                  placeholder="Describe the types of problems or challenges you're most passionate about helping founders solve"
                  rows={4}
                />
              </div>

              {/* Public Profile Consent */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.public_profile_consent}
                    onChange={(e) => setFormData({...formData, public_profile_consent: e.target.checked})}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="text-sm text-gray-700">
                    I'm comfortable being named in a final public pilot deck
                  </span>
                </label>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={submitApplication.isPending}
              >
                {submitApplication.isPending ? 'Submitting...' : 'Submit Advisor Application'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvisorApplication;
